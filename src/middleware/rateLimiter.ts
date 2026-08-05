import rateLimit from 'express-rate-limit';

// Rate limiter for public contact, demo, and dealer forms (10 submissions per 15 minutes per IP)
export const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many submissions from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for newsletter subscription form (5 subscriptions per 1 hour per IP)
export const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Too many newsletter subscription attempts. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
