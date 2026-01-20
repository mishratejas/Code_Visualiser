import { Sequelize } from 'sequelize';
import pg from 'pg';

// Create sequelize instance
const sequelize = new Sequelize(
  process.env.POSTGRES_URI || 
  `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'coding_judge'}`,
  {
    logging: false, // ← DISABLE ALL SQL LOGGING
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
    
    // Only sync in development, and be careful with alter
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ PostgreSQL models synchronized');
    } else {
      // In production, don't auto-alter tables
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