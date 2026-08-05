import { Router, Response } from 'express';
import { z } from 'zod';
import DealerInquiry from '../models/DealerInquiry';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { leadLimiter } from '../middleware/rateLimiter';
import { success, error } from '../utils/apiResponse';
import { sendEmail } from '../utils/sendEmail';

const router = Router();

// Zod Schema for Dealer Inquiry Submission
const dealerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  businessName: z.string().nullable().optional(),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(1, 'Address is required'),
});

// @route   POST /api/dealers
// @desc    Submit public dealer inquiry
// @access  Public (Rate limited)
router.post('/', leadLimiter, async (req: any, res: Response) => {
  try {
    const parseResult = dealerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation error', 400, parseResult.error.flatten());
    }

    const newDealerInquiry = new DealerInquiry(parseResult.data);
    await newDealerInquiry.save();

    // Trigger Admin Notification Email
    const adminEmail = process.env.ADMIN_EMAIL || 'info@winsoft.in';
    const emailSubject = `🤝 New Dealer Inquiry: ${newDealerInquiry.name} (${newDealerInquiry.businessName || 'No business name'})`;
    const emailHtml = `
      <h2>Dealer Inquiry Details</h2>
      <p><strong>Contact Person:</strong> ${newDealerInquiry.name}</p>
      <p><strong>Business Name:</strong> ${newDealerInquiry.businessName || 'N/A'}</p>
      <p><strong>Phone:</strong> ${newDealerInquiry.phone}</p>
      <p><strong>Email:</strong> ${newDealerInquiry.email}</p>
      <p><strong>Address/Location:</strong> ${newDealerInquiry.address}</p>
      <hr />
      <p>Please review and approve the partnership application in the Winsoft Admin Panel.</p>
    `;

    sendEmail({ to: adminEmail, subject: emailSubject, html: emailHtml }).catch(err =>
      console.error('Failed to send admin dealer inquiry email:', err)
    );

    // Confirmation Email to Partner
    const clientSubject = 'Winsoft - Dealer Partnership Application Received';
    const clientHtml = `
      <p>Hello ${newDealerInquiry.name},</p>
      <p>Thank you for expressing interest in becoming an authorized dealer partner with Winsoft.</p>
      <p>Our sales channel team will review your business information and reach out to schedule an introductory call within 3 business days.</p>
      <br />
      <p>Best Regards,<br /><strong>Channel Sales Division | Winsoft</strong></p>
    `;

    sendEmail({ to: newDealerInquiry.email, subject: clientSubject, html: clientHtml }).catch(err =>
      console.error('Failed to send partner confirmation email:', err)
    );

    return success(res, newDealerInquiry, 'Dealer inquiry submitted successfully', 201);
  } catch (err: any) {
    console.error('Dealer inquiry error:', err);
    return error(res, 'Server error during submission', 500);
  }
});

// @route   GET /api/dealers
// @desc    List all dealer inquiries
// @access  Protected
router.get('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '100');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { businessName: searchRegex },
        { address: searchRegex }
      ];
    }

    const inquiries = await DealerInquiry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DealerInquiry.countDocuments(query);

    return success(res, {
      inquiries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('Fetch dealer inquiries error:', err);
    return error(res, 'Server error fetching inquiries', 500);
  }
});

// @route   GET /api/dealers/:id
// @desc    Get single dealer inquiry detail
// @access  Protected
router.get('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const inquiry = await DealerInquiry.findById(req.params.id);
    if (!inquiry) {
      return error(res, 'Dealer inquiry record not found', 404);
    }
    return success(res, inquiry);
  } catch (err: any) {
    console.error('Fetch single dealer inquiry error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   PUT /api/dealers/:id
// @desc    Update status/notes of dealer inquiry
// @access  Protected
router.put('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, notes } = req.body;
    
    const inquiry = await DealerInquiry.findById(req.params.id);
    if (!inquiry) {
      return error(res, 'Dealer inquiry record not found', 404);
    }

    if (status) inquiry.status = status;
    if (notes !== undefined) inquiry.notes = notes;

    await inquiry.save();
    return success(res, inquiry, 'Dealer inquiry record updated successfully');
  } catch (err: any) {
    console.error('Update dealer inquiry error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/dealers/:id
// @desc    Delete dealer inquiry record
// @access  Protected
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const inquiry = await DealerInquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return error(res, 'Dealer inquiry record not found', 404);
    }
    return success(res, null, 'Dealer inquiry record deleted successfully');
  } catch (err: any) {
    console.error('Delete dealer inquiry error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
