import { Router, Response } from 'express';
import { z } from 'zod';
import DemoRequest from '../models/DemoRequest';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { leadLimiter } from '../middleware/rateLimiter';
import { success, error } from '../utils/apiResponse';
import { sendEmail } from '../utils/sendEmail';

const router = Router();

// Zod Schema for Demo Request Submission
const demoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  company: z.string().nullable().optional(),
  industry: z.enum(['dairy', 'gold', 'sugar', 'other']),
  currentChallenges: z.string().default(''),
  preferredDate: z.string().min(1, 'Date is required'),
  preferredTime: z.string().min(1, 'Time is required'),
});

// @route   POST /api/demo-requests
// @desc    Submit public demo request
// @access  Public (Rate limited)
router.post('/', leadLimiter, async (req: any, res: Response) => {
  try {
    const parseResult = demoSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation error', 400, parseResult.error.flatten());
    }

    const newDemo = new DemoRequest(parseResult.data);
    await newDemo.save();

    // Trigger Notification Email to Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'info@winsoft.in';
    const emailSubject = `📅 Demo Requested: ${newDemo.name} (${newDemo.industry})`;
    const emailHtml = `
      <h2>Demo Request details</h2>
      <p><strong>Name:</strong> ${newDemo.name}</p>
      <p><strong>Email:</strong> ${newDemo.email}</p>
      <p><strong>Phone:</strong> ${newDemo.phone}</p>
      <p><strong>Company:</strong> ${newDemo.company || 'N/A'}</p>
      <p><strong>Industry:</strong> ${newDemo.industry}</p>
      <p><strong>Preferred Date:</strong> ${newDemo.preferredDate}</p>
      <p><strong>Preferred Time:</strong> ${newDemo.preferredTime}</p>
      <p><strong>Current Challenges:</strong> ${newDemo.currentChallenges || 'None listed'}</p>
      <hr />
      <p>Please contact the client to confirm the scheduled time.</p>
    `;

    sendEmail({ to: adminEmail, subject: emailSubject, html: emailHtml }).catch(err => 
      console.error('Failed to send admin demo request email:', err)
    );

    // Confirmation Email to Client
    const clientSubject = 'Winsoft - Demo Session Booking Received';
    const clientHtml = `
      <p>Hello ${newDemo.name},</p>
      <p>Thank you for booking a product demonstration with Winsoft.</p>
      <p>We have received your booking details for:</p>
      <ul>
        <li><strong>Product/Industry:</strong> ${newDemo.industry.toUpperCase()} Software</li>
        <li><strong>Preferred Date:</strong> ${newDemo.preferredDate}</li>
        <li><strong>Preferred Time:</strong> ${newDemo.preferredTime}</li>
      </ul>
      <p>Our sales representative will connect with you shortly to confirm the session link.</p>
      <br />
      <p>Best Regards,<br /><strong>Team Winsoft</strong></p>
    `;

    sendEmail({ to: newDemo.email, subject: clientSubject, html: clientHtml }).catch(err =>
      console.error('Failed to send client demo booking email:', err)
    );

    return success(res, newDemo, 'Demo booked successfully', 201);
  } catch (err: any) {
    console.error('Demo booking error:', err);
    return error(res, 'Server error during submission', 500);
  }
});

// @route   GET /api/demo-requests
// @desc    List all demo requests
// @access  Protected
router.get('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '100');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.industry) query.industry = req.query.industry;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex }
      ];
    }

    const demos = await DemoRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DemoRequest.countDocuments(query);

    return success(res, {
      demos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('Fetch demos error:', err);
    return error(res, 'Server error fetching demo requests', 500);
  }
});

// @route   GET /api/demo-requests/:id
// @desc    Get single demo request detail
// @access  Protected
router.get('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const demo = await DemoRequest.findById(req.params.id);
    if (!demo) {
      return error(res, 'Demo request record not found', 404);
    }
    return success(res, demo);
  } catch (err: any) {
    console.error('Fetch single demo error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   PUT /api/demo-requests/:id
// @desc    Update status/notes of demo request
// @access  Protected
router.put('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, notes } = req.body;
    
    const demo = await DemoRequest.findById(req.params.id);
    if (!demo) {
      return error(res, 'Demo request record not found', 404);
    }

    if (status) demo.status = status;
    if (notes !== undefined) demo.notes = notes;

    await demo.save();
    return success(res, demo, 'Demo request record updated successfully');
  } catch (err: any) {
    console.error('Update demo error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/demo-requests/:id
// @desc    Delete demo request record
// @access  Protected
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const demo = await DemoRequest.findByIdAndDelete(req.params.id);
    if (!demo) {
      return error(res, 'Demo request record not found', 404);
    }
    return success(res, null, 'Demo request record deleted successfully');
  } catch (err: any) {
    console.error('Delete demo error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
