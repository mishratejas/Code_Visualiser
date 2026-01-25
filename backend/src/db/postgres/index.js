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
      timestamps: true
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
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    
    // Import models AFTER connection
    const Contest = (await import('../../models/postgres/Contest.models.js')).default;
    const User = (await import('../../models/postgres/User.models.js')).default;
    const ContestParticipant = (await import('../../models/postgres/ContestParticipant.models.js')).default;
    
    // Define associations
    defineAssociations();
    
    if (process.env.NODE_ENV === 'development') {
      try {
        // Fix the column typo and null values
        await sequelize.query(`
          UPDATE contests 
          SET created_at = COALESCE(created_at, NOW())
          WHERE created_at IS NULL;
        `);
        console.log('✅ Fixed NULL values in contests table');
      } catch (fixError) {
        console.log('⚠️ Could not fix NULL values:', fixError.message);
      }
      
      // Sync models
      await sequelize.sync({ alter: true });
      console.log('✅ PostgreSQL models synchronized');
    } else {
      await sequelize.sync({ alter: false });
    }
    
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

// Export
export { sequelize, connectPostgreSQL };
export default sequelize;