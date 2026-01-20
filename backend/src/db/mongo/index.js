import mongoose from 'mongoose';
import logger from '../../config/logger.js';

const connectMongoDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    
    // For MongoDB Atlas SRV connection, use simpler options
    const conn = await mongoose.connect(uri, {
      // Remove deprecated options for newer mongoose versions
      serverSelectionTimeoutMS: 10000, // 10 seconds
    });
    
    // Check if models are registered
    const modelNames = mongoose.modelNames();
    
    return conn;
  } catch (error) {
    logger.error('❌ MongoDB Connection Failed:', error.message);
    
    if (process.env.NODE_ENV === 'development') {
      logger.warn('⚠️ Running in development mode without MongoDB');
      return null;
    }
    
    throw error;
  }
};

// Connection events
mongoose.connection.on('connected', () => {
  
  // Log all registered models when connected
  const modelNames = mongoose.modelNames();
});

mongoose.connection.on('error', (err) => {
  logger.error(`Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB Atlas');
});

export default connectMongoDB;