import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import contactRoutes from './routes/contacts';
import demoRoutes from './routes/demo';
import careerRoutes from './routes/careers';
import dealerRoutes from './routes/dealers';
import newsletterRoutes from './routes/newsletter';
import blogRoutes from './routes/blog';
import testimonialRoutes from './routes/testimonial';
import faqRoutes from './routes/faq';
import teamRoutes from './routes/team';
import clientRoutes from './routes/client';
import statRoutes from './routes/stats';
import analyticsRoutes from './routes/analytics';

const app: Express = express();

// 1. Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows browser to fetch local static files (like PDF resumes)
}));

// CORS Configuration
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3001').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serve Static Uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/demorequests', demoRoutes); // For .NET compatibility
app.use('/api/demo-requests', demoRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/analytics', analyticsRoutes);

// 4. Base Status Route
app.get('/status', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 5. Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 Server Error:', err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
