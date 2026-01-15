import mongoose from 'mongoose';
import { DB_CONNECTION_TIMEOUT } from '../../constants.js';

// Attach listeners ONCE
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected — waiting for reconnection');
});

const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: DB_CONNECTION_TIMEOUT,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      heartbeatFrequencyMS: 10000
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);

    if (process.env.NODE_ENV === 'production') {
      console.log('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectMongoDB, 5000);
    } else {
      console.log('MongoDB unavailable — continuing without DB');
    }
    return null;
  }
};

export default connectMongoDB;