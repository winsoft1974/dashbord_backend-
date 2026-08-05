import { Router, Response } from 'express';
import { z } from 'zod';
import Contact from '../models/Contact';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { leadLimiter } from '../middleware/rateLimiter';
import { success, error } from '../utils/apiResponse';
import { sendEmail } from '../utils/sendEmail';

const router = Router();

// Zod Schema for Contact Form Submission
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  company: z.string().nullable().optional(),
  inquiryType: z.enum(['demo', 'dairy', 'sugar', 'gold', 'dealer', 'support', 'general', 'popup']),
  message: z.string().default(''),
  source: z.enum(['contact_page', 'popup', 'dealer_inquiry']).default('contact_page'),
  product: z.string().nullable().optional(),
  language: z.string().default('en'),
});

// @route   POST /api/contacts
// @desc    Submit public contact form
// @access  Public (Rate limited)
router.post('/', leadLimiter, async (req: any, res: Response) => {
  try {
    const parseResult = contactSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation error', 400, parseResult.error.flatten());
    }

    const newContact = new Contact(parseResult.data);
    await newContact.save();

    // Trigger Notification Email
    const adminEmail = process.env.ADMIN_EMAIL || 'info@winsoft.in';
    const emailSubject = `🚀 New Lead Captured (${newContact.inquiryType}): ${newContact.name}`;
    const emailHtml = `
      <h2>New Lead details</h2>
      <p><strong>Name:</strong> ${newContact.name}</p>
      <p><strong>Email:</strong> ${newContact.email}</p>
      <p><strong>Phone:</strong> ${newContact.phone}</p>
      <p><strong>Company:</strong> ${newContact.company || 'N/A'}</p>
      <p><strong>Inquiry Type:</strong> ${newContact.inquiryType}</p>
      <p><strong>Source:</strong> ${newContact.source}</p>
      ${newContact.product ? `<p><strong>Product:</strong> ${newContact.product}</p>` : ''}
      <p><strong>Message:</strong> ${newContact.message}</p>
      <p><strong>Language:</strong> ${newContact.language}</p>
      <hr />
      <p>This inquiry has been logged in the Winsoft Admin Panel.</p>
    `;

    // Fire & Forget email (don't block response)
    sendEmail({ to: adminEmail, subject: emailSubject, html: emailHtml }).catch(err => 
      console.error('Failed to send admin notification email:', err)
    );

    // Auto-reply confirmation to client
    const clientSubject = newContact.language === 'mr' 
      ? 'विन्सॉफ्ट (Winsoft) - तुमची चौकशी प्राप्त झाली' 
      : 'Winsoft - We have received your inquiry';
    const clientHtml = newContact.language === 'mr'
      ? `
        <p>नमस्कार ${newContact.name},</p>
        <p>विन्सॉफ्ट ला संपर्क केल्याबद्दल धन्यवाद. आम्हाला तुमची चौकशी प्राप्त झाली आहे.</p>
        <p>आमची टीम लवकरच तुमच्याशी ${newContact.phone} वर संपर्क साधेल.</p>
        <br />
        <p>आपला नम्र,<br /><strong>विन्सॉफ्ट टीम</strong></p>
      `
      : `
        <p>Hello ${newContact.name},</p>
        <p>Thank you for contacting Winsoft. We have received your inquiry regarding our services.</p>
        <p>Our team will get in touch with you shortly at ${newContact.phone}.</p>
        <br />
        <p>Best Regards,<br /><strong>Team Winsoft</strong></p>
      `;

    sendEmail({ to: newContact.email, subject: clientSubject, html: clientHtml }).catch(err =>
      console.error('Failed to send client auto-reply email:', err)
    );

    return success(res, newContact, 'Inquiry submitted successfully', 21);
  } catch (err: any) {
    console.error('Contact submission error:', err);
    return error(res, 'Server error during submission', 500);
  }
});

// @route   GET /api/contacts/export/csv
// @desc    Export leads to CSV
// @access  Protected
router.get('/export/csv', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leads = await Contact.find().sort({ createdAt: -1 });
    
    let csv = 'ID,Name,Email,Phone,Company,Inquiry Type,Source,Status,Notes,Created At\n';
    
    leads.forEach((lead: any) => {
      const id = lead._id.toString();
      const name = `"${lead.name.replace(/"/g, '""')}"`;
      const email = `"${lead.email.replace(/"/g, '""')}"`;
      const phone = `"${lead.phone.replace(/"/g, '""')}"`;
      const company = lead.company ? `"${lead.company.replace(/"/g, '""')}"` : '""';
      const inquiryType = `"${lead.inquiryType}"`;
      const source = `"${lead.source}"`;
      const status = `"${lead.status}"`;
      const notes = lead.notes ? `"${lead.notes.replace(/"/g, '""').replace(/\n/g, ' ')}"` : '""';
      const createdAt = `"${lead.createdAt.toISOString()}"`;
      
      csv += `${id},${name},${email},${phone},${company},${inquiryType},${source},${status},${notes},${createdAt}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=winsoft_leads.csv');
    return res.status(200).send(csv);
  } catch (err: any) {
    console.error('Export CSV error:', err);
    return error(res, 'Server error during export', 500);
  }
});

// @route   GET /api/contacts
// @desc    List all contact submissions
// @access  Protected
router.get('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '100'); // large limit default for dashboard
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.inquiryType) query.inquiryType = req.query.inquiryType;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex }
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments(query);

    return success(res, {
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('Fetch contacts error:', err);
    return error(res, 'Server error fetching contacts', 500);
  }
});

// @route   GET /api/contacts/:id
// @desc    Get single contact detail
// @access  Protected
router.get('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return error(res, 'Contact record not found', 404);
    }
    return success(res, contact);
  } catch (err: any) {
    console.error('Fetch single contact error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   PUT /api/contacts/:id
// @desc    Update status/notes of contact
// @access  Protected
router.put('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, notes } = req.body;
    
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return error(res, 'Contact record not found', 404);
    }

    if (status) contact.status = status;
    if (notes !== undefined) contact.notes = notes;

    await contact.save();
    return success(res, contact, 'Contact record updated successfully');
  } catch (err: any) {
    console.error('Update contact error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/contacts/:id
// @desc    Delete contact record
// @access  Protected
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return error(res, 'Contact record not found', 404);
    }
    return success(res, null, 'Contact record deleted successfully');
  } catch (err: any) {
    console.error('Delete contact error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
