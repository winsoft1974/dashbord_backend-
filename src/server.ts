import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before importing app/db
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import app from './app';
import connectDB from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Connect to Database
  await connectDB();

  // 2. Start Express Listener
  app.listen(PORT, () => {
    console.log(`🚀 Winsoft Unified API running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('❌ Failed to start API Server:', err);
  process.exit(1);
});
