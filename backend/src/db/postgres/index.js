import { Sequelize } from 'sequelize';
import pg from 'pg';
import { defineAssociations } from '../../models/postgres/associations.js';

// Create sequelize instance
const sequelize = new Sequelize(
  process.env.POSTGRES_URI || 
  `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'coding_judge'}`,
  {
    logging: false,
    dialect: 'postgres',
    dialectModule: pg,
    define: {
      underscored: true,
      timestamps: true,
      freezeTableName: true  // ✅ Prevent table name pluralization
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Connect function
const connectPostgreSQL = async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    
    // Import models AFTER connection (to ensure sequelize is ready)
    const Contest = (await import('../../models/postgres/Contest.models.js')).default;
    const User = (await import('../../models/postgres/User.models.js')).default;
    const ContestParticipant = (await import('../../models/postgres/ContestParticipant.models.js')).default;
    const ContestSubmission = (await import('../../models/postgres/ContestSubmission.models.js')).default;
    
    // Define associations
    await defineAssociations();
    
    // ✅ REMOVED: await sequelize.sync({ alter: true });
    // We manage schema manually with SQL migrations
    console.log('ℹ️  Using manual SQL migrations (sync disabled)');
    
    return sequelize;
  } catch (error) {
    console.error('❌ PostgreSQL Connection Failed:', error.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Continuing without PostgreSQL');
      return null;
    }
    throw error;
  }
};

// Close connection
const disconnectPostgreSQL = async () => {
  try {
    await sequelize.close();
    console.log('✅ PostgreSQL connection closed');
  } catch (error) {
    console.error('❌ Error closing PostgreSQL:', error.message);
  }
};

// Export
export { sequelize, connectPostgreSQL, disconnectPostgreSQL };
export default sequelize;