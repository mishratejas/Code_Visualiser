// src/db/index.js - FIXED VERSION
import connectMongoDB from './mongo/index.js';

class DatabaseManager {
  constructor() {
    this.mongoConnection = null;
    this.postgresConnection = null;
    this.sequelize = null;
  }

  async connectAll() {
    console.log('🔄 Connecting to databases...');
    
    try {
      // Connect to MongoDB
      this.mongoConnection = await connectMongoDB();
      console.log('✅ MongoDB connected');
      
      // Connect to PostgreSQL if available
      if (process.env.POSTGRES_URI || process.env.POSTGRES_HOST) {
        try {
          // Import the PostgreSQL module
          const { sequelize, connectPostgreSQL } = await import('./postgres/index.js');
          
          // Connect to PostgreSQL
          await connectPostgreSQL();
          this.postgresConnection = sequelize;
          this.sequelize = sequelize;
          
          console.log('✅ PostgreSQL connected successfully');
        } catch (pgError) {
          console.error('⚠️ PostgreSQL connection failed:', pgError.message);
          console.log('⚠️ Continuing without PostgreSQL');
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

  async connectPostgreSQL() {
    if (!process.env.POSTGRES_URI && !process.env.POSTGRES_HOST) {
      console.log('⚠️ PostgreSQL config not found, skipping...');
      return null;
    }
    
    try {
      const { sequelize, connectPostgreSQL: connectPG } = await import('./postgres/index.js');
      await connectPG();
      this.postgresConnection = sequelize;
      this.sequelize = sequelize;
      console.log('✅ PostgreSQL connected successfully');
      return sequelize;
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      throw error;
    }
  }

  async disconnectAll() {
    console.log('🔌 Disconnecting from databases...');
    
    if (this.mongoConnection) {
      await mongoose.disconnect();
      console.log('✅ MongoDB disconnected');
    }
    
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('✅ PostgreSQL disconnected');
    }
    
    console.log('✅ All databases disconnected');
  }
}

const dbManager = new DatabaseManager();
export default dbManager;