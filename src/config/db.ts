import mongoose from 'mongoose';
import dns from 'dns';

// Force Node.js DNS resolver to use Google public DNS to bypass local ISP SRV lookup blocks
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  // Ignore fallback if permissions restrict DNS setting
}

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/winsoft_db';
    console.log(`Connecting to MongoDB at: ${mongoURI}`);
    
    // Fail fast in development if MongoDB server is offline
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('✅ MongoDB Connected successfully.');
  } catch (error) {
    console.error('❌ MongoDB Connection Error details:', error);
    console.warn('\n⚠️  MongoDB connection failed! Falling back to Local File-Based Mock Database.');
    console.warn('⚠️  Data will be persisted in "winsoft-api/data/*.json" files.\n');
    process.env.USE_MOCK_DB = 'true';
  }
};

export default connectDB;
