import { Router, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import CareerApplication from '../models/CareerApplication';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { leadLimiter } from '../middleware/rateLimiter';
import { upload } from '../middleware/upload';
import { success, error } from '../utils/apiResponse';
import { sendEmail } from '../utils/sendEmail';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';

const router = Router();

// Zod Schema for validation (text fields parsed from multipart)
const careerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  position: z.string().min(1, 'Position is required'),
  message: z.string().default(''),
});

// Helper function to upload file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer: Buffer, fileName: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'winsoft_resumes',
        resource_type: 'raw', // Support non-image formats like PDF/Doc
        public_id: `${Date.now()}-${path.parse(fileName).name}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Helper function to save file locally
const saveFileLocally = async (fileBuffer: Buffer, fileName: string): Promise<{ url: string; publicId: string }> => {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(uploadDir, safeName);
  await fs.promises.writeFile(filePath, fileBuffer);

  const port = process.env.PORT || 5000;
  const fileUrl = `http://localhost:${port}/uploads/${safeName}`;

  return {
    url: fileUrl,
    publicId: safeName,
  };
};

// @route   POST /api/careers
// @desc    Submit job application with resume upload
// @access  Public (Rate limited)
router.post('/', leadLimiter, upload.single('resume'), async (req: any, res: Response) => {
  try {
    // 1. Check if file is uploaded
    if (!req.file) {
      return error(res, 'Resume file is required', 400);
    }

    // 2. Validate text body
    const parseResult = careerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation error', 400, parseResult.error.flatten());
    }

    let resumeUrl = '';
    let resumePublicId = '';
    const resumeOriginalName = req.file.originalname;

    // 3. Process upload (Cloudinary or local storage fallback)
    if (isCloudinaryConfigured()) {
      try {
        const cloudResult = await uploadToCloudinary(req.file.buffer, resumeOriginalName);
        resumeUrl = cloudResult.secure_url;
        resumePublicId = cloudResult.public_id;
      } catch (uploadErr) {
        console.error('Cloudinary upload failed, trying local fallback:', uploadErr);
        const localResult = await saveFileLocally(req.file.buffer, resumeOriginalName);
        resumeUrl = localResult.url;
        resumePublicId = localResult.publicId;
      }
    } else {
      // Local storage path
      const localResult = await saveFileLocally(req.file.buffer, resumeOriginalName);
      resumeUrl = localResult.url;
      resumePublicId = localResult.publicId;
    }

    // 4. Save record to DB
    const newApplication = new CareerApplication({
      ...parseResult.data,
      resumeUrl,
      resumePublicId,
      resumeOriginalName,
    });

    await newApplication.save();

    // 5. Send Admin Notification Email
    const adminEmail = process.env.ADMIN_EMAIL || 'info@winsoft.in';
    const emailSubject = `💼 New Career Application: ${newApplication.name} - ${newApplication.position}`;
    const emailHtml = `
      <h2>Job Application Details</h2>
      <p><strong>Name:</strong> ${newApplication.name}</p>
      <p><strong>Email:</strong> ${newApplication.email}</p>
      <p><strong>Phone:</strong> ${newApplication.phone}</p>
      <p><strong>Applied Position:</strong> ${newApplication.position}</p>
      <p><strong>Cover Message:</strong> ${newApplication.message || 'None'}</p>
      <p><strong>Resume File:</strong> <a href="${newApplication.resumeUrl}" target="_blank">${newApplication.resumeOriginalName}</a></p>
      <hr />
      <p>Review the application in the Winsoft Admin Panel.</p>
    `;

    sendEmail({ to: adminEmail, subject: emailSubject, html: emailHtml }).catch(err =>
      console.error('Failed to send admin career email:', err)
    );

    // 6. Send Applicant Acknowledgement Email
    const clientSubject = 'Winsoft - Job Application Received';
    const clientHtml = `
      <p>Hello ${newApplication.name},</p>
      <p>Thank you for applying for the <strong>${newApplication.position}</strong> position at Winsoft.</p>
      <p>We have successfully received your application and resume. Our hiring team will review your qualifications and contact you if your profile aligns with our requirements.</p>
      <br />
      <p>Best Regards,<br /><strong>Hiring Team | Winsoft</strong></p>
    `;

    sendEmail({ to: newApplication.email, subject: clientSubject, html: clientHtml }).catch(err =>
      console.error('Failed to send applicant ack email:', err)
    );

    return success(res, newApplication, 'Application submitted successfully', 201);
  } catch (err: any) {
    console.error('Career application error:', err);
    return error(res, 'Server error processing application', 500);
  }
});

// @route   GET /api/careers
// @desc    List all job applications
// @access  Protected
router.get('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '100');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.position) {
      query.position = new RegExp(req.query.position as string, 'i');
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { position: searchRegex }
      ];
    }

    const applications = await CareerApplication.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CareerApplication.countDocuments(query);

    return success(res, {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('Fetch applications error:', err);
    return error(res, 'Server error fetching applications', 500);
  }
});

// @route   GET /api/careers/:id
// @desc    Get single job application detail
// @access  Protected
router.get('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const application = await CareerApplication.findById(req.params.id);
    if (!application) {
      return error(res, 'Application record not found', 404);
    }
    return success(res, application);
  } catch (err: any) {
    console.error('Fetch single application error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   PUT /api/careers/:id
// @desc    Update status/notes of application
// @access  Protected
router.put('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, notes } = req.body;
    
    const application = await CareerApplication.findById(req.params.id);
    if (!application) {
      return error(res, 'Application record not found', 404);
    }

    if (status) application.status = status;
    if (notes !== undefined) application.notes = notes;

    await application.save();
    return success(res, application, 'Application record updated successfully');
  } catch (err: any) {
    console.error('Update application error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/careers/:id
// @desc    Delete job application record
// @access  Protected
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const application = await CareerApplication.findById(req.params.id);
    if (!application) {
      return error(res, 'Application record not found', 404);
    }

    // Try deleting from Cloudinary if configured and it was stored there
    if (isCloudinaryConfigured() && application.resumePublicId && !application.resumeUrl.includes('localhost')) {
      try {
        await cloudinary.uploader.destroy(application.resumePublicId, { resource_type: 'raw' });
        console.log(`🗑️ Deleted Cloudinary asset: ${application.resumePublicId}`);
      } catch (cloudDelErr) {
        console.error('Failed to delete asset from Cloudinary:', cloudDelErr);
      }
    } else if (application.resumeUrl.includes('localhost')) {
      // Local file delete
      const filePath = path.join(process.cwd(), 'public', 'uploads', application.resumePublicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted local file: ${filePath}`);
      }
    }

    await CareerApplication.findByIdAndDelete(req.params.id);
    return success(res, null, 'Application record deleted successfully');
  } catch (err: any) {
    console.error('Delete application error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
