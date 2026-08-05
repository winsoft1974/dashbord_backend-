import { Router, Response } from 'express';
import { z } from 'zod';
import NewsletterSubscriber from '../models/NewsletterSubscriber';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { newsletterLimiter } from '../middleware/rateLimiter';
import { success, error } from '../utils/apiResponse';
import { sendEmail } from '../utils/sendEmail';

const router = Router();

// Zod Schema for Newsletter Subscription
const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  language: z.string().default('en'),
  source: z.string().default('blog_page'),
});

// @route   POST /api/newsletter/subscribe
// @desc    Subscribe an email address
// @access  Public (Rate limited)
router.post('/subscribe', newsletterLimiter, async (req: any, res: Response) => {
  try {
    const parseResult = subscribeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation error', 400, parseResult.error.flatten());
    }

    const { email, language, source } = parseResult.data;
    const lowerEmail = email.toLowerCase().trim();

    // Check if subscriber already exists
    let subscriber = await NewsletterSubscriber.findOne({ email: lowerEmail });

    if (subscriber) {
      if (subscriber.status === 'active') {
        return error(res, 'Email is already subscribed', 400);
      } else {
        // Reactivate subscription
        subscriber.status = 'active';
        subscriber.source = source;
        subscriber.language = language;
        await subscriber.save();
      }
    } else {
      // Create new subscription
      subscriber = new NewsletterSubscriber({
        email: lowerEmail,
        language,
        source,
      });
      await subscriber.save();
    }

    // Send Welcome Email
    const welcomeSubject = language === 'mr' 
      ? 'विन्सॉफ्ट (Winsoft) - ब्लॉग सदस्यतेमध्ये आपले स्वागत आहे'
      : 'Winsoft - Welcome to Our Newsletter';
      
    const welcomeHtml = language === 'mr'
      ? `
        <p>नमस्कार,</p>
        <p>विन्सॉफ्ट ब्लॉग न्यूजलेटरची सदस्यता घेतल्याबद्दल धन्यवाद. आता तुम्हाला आमचे नवीनतम ब्लॉग आणि माहिती थेट तुमच्या इनबॉक्समध्ये मिळेल.</p>
        <p>जर तुम्हाला कधीही ही सदस्यता रद्द करायची असेल, तर तुम्ही <a href="http://localhost:5000/api/newsletter/unsubscribe?email=${encodeURIComponent(lowerEmail)}">येथे क्लिक करून</a> रद्द करू शकता.</p>
        <br />
        <p>आपला नम्र,<br /><strong>विन्सॉफ्ट ब्लॉगिंग टीम</strong></p>
      `
      : `
        <p>Hello,</p>
        <p>Thank you for subscribing to the Winsoft Blog Newsletter. You will now receive our latest tech posts and industry strategies directly in your inbox.</p>
        <p>If you wish to stop receiving these updates, you can unsubscribe at any time by <a href="http://localhost:5000/api/newsletter/unsubscribe?email=${encodeURIComponent(lowerEmail)}">clicking here</a>.</p>
        <br />
        <p>Best Regards,<br /><strong>Winsoft Editorial Team</strong></p>
      `;

    sendEmail({ to: lowerEmail, subject: welcomeSubject, html: welcomeHtml }).catch(err =>
      console.error('Failed to send welcome newsletter email:', err)
    );

    return success(res, subscriber, 'Subscribed successfully', 201);
  } catch (err: any) {
    console.error('Newsletter subscribe error:', err);
    return error(res, 'Server error during subscription', 500);
  }
});

// @route   GET /api/newsletter/unsubscribe
// @desc    Unsubscribe email (public link)
// @access  Public
router.get('/unsubscribe', async (req: any, res: Response) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send('<h1>Error</h1><p>Email parameter is missing.</p>');
    }

    const lowerEmail = (email as string).toLowerCase().trim();
    const subscriber = await NewsletterSubscriber.findOne({ email: lowerEmail });

    if (!subscriber) {
      return res.status(404).send('<h1>Not Found</h1><p>Email address was not found in our list.</p>');
    }

    if (subscriber.status === 'unsubscribed') {
      return res.status(200).send('<h1>Already Unsubscribed</h1><p>You have already unsubscribed from our newsletter.</p>');
    }

    subscriber.status = 'unsubscribed';
    await subscriber.save();

    return res.status(200).send('<h1>Success</h1><p>You have been successfully unsubscribed from the Winsoft Newsletter.</p>');
  } catch (err: any) {
    console.error('Newsletter unsubscribe error:', err);
    return res.status(500).send('<h1>Server Error</h1><p>An error occurred. Please try again later.</p>');
  }
});

// @route   GET /api/newsletter
// @desc    List all newsletter subscribers
// @access  Protected
router.get('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '100');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
      query.email = new RegExp(req.query.search as string, 'i');
    }

    const subscribers = await NewsletterSubscriber.find(query)
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await NewsletterSubscriber.countDocuments(query);

    return success(res, {
      subscribers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('Fetch newsletter subscribers error:', err);
    return error(res, 'Server error fetching subscribers', 500);
  }
});

// @route   DELETE /api/newsletter/:id
// @desc    Delete subscriber completely
// @access  Protected
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscriber = await NewsletterSubscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) {
      return error(res, 'Subscriber not found', 404);
    }
    return success(res, null, 'Subscriber deleted from list');
  } catch (err: any) {
    console.error('Delete subscriber error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
