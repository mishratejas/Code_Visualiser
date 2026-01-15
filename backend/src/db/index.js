// src/db/index.js - WORKING VERSION
import connectMongoDB from './mongo/index.js';

// Conditionally import PostgreSQL
let connectPostgreSQL = null;
if (process.env.POSTGRES_URI || process.env.POSTGRES_HOST) {
  try {
    const pgModule = await import('./postgres/index.js');
    connectPostgreSQL = pgModule.default;
  } catch (error) {
    console.log('⚠️ PostgreSQL module not available, skipping...');
  }
}

class DatabaseManager {
  constructor() {
    this.mongoConnection = null;
    this.postgresConnection = null;
  }

  async connectAll() {
    console.log('🔄 Connecting to databases...');
    
    try {
      // Connect to MongoDB
      this.mongoConnection = await connectMongoDB();
      console.log('✅ MongoDB connected');
      
      // Connect to PostgreSQL if available
      if (connectPostgreSQL) {
        try {
          this.postgresConnection = await connectPostgreSQL();
        } catch (pgError) {
          console.error('⚠️ PostgreSQL connection failed:', pgError.message);
        }
      }
      
      console.log('🎉 All database connections established');
      return {
        mongo: this.mongoConnection,
        postgres: this.postgresConnection
      };
    } catch (error) {
      console.error('❌ Database connection error:', error.message);
      throw error;
    }
  }

  async disconnectAll() {
    console.log('🔌 Disconnecting from databases...');
    
    if (this.mongoConnection) {
      await this.mongoConnection.disconnect?.();
    }
    
    if (this.postgresConnection) {
      await this.postgresConnection.close?.();
    }
    
    console.log('✅ All databases disconnected');
  }
}

const dbManager = new DatabaseManager();
export default dbManager;