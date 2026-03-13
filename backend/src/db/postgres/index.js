import { Sequelize } from 'sequelize';
import pg from 'pg';
import { defineAssociations } from '../../models/postgres/associations.js';

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
      freezeTableName: true
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  }
);

const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');

    // Import all models (order matters for FK constraints)
    const Contest = (await import('../../models/postgres/Contest.models.js')).default;
    const User = (await import('../../models/postgres/User.models.js')).default;
    const ContestParticipant = (await import('../../models/postgres/ContestParticipant.models.js')).default;
    const ContestSubmission = (await import('../../models/postgres/ContestSubmission.models.js')).default;
    const Group = (await import('../../models/postgres/Group.models.js')).default;
    const GroupMember = (await import('../../models/postgres/GroupMember.models.js')).default;

    await defineAssociations();

    // Auto-create new tables only (alter:false = safe for production)
    // groups and group_members are new — sync them with alter so columns are added
    await Group.sync({ alter: true });
    await GroupMember.sync({ alter: true });

    // Sync Contest with alter:true to add any missing columns (e.g. is_rated)
    await Contest.sync({ alter: true });
    console.log('✅ Contest table synced (missing columns added)');

    // Sync ContestParticipant to add missing penalty column
    await ContestParticipant.sync({ alter: true });
    console.log('✅ ContestParticipant table synced (problem_stats, rating fields ensured)');

    // Sync ContestSubmission to add missing time_from_start column
    await ContestSubmission.sync({ alter: true });
    console.log('✅ ContestSubmission table synced (time_from_start column ensured)');

    // Also ensure the group_id column exists on contests
    try {
      await sequelize.query(`
        ALTER TABLE contests ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL;
      `);
      console.log('✅ contests.group_id column ensured');
    } catch (e) {
      // Column may already exist — that's fine
      if (!e.message.includes('already exists')) console.warn('group_id migration note:', e.message);
    }

    console.log('✅ Group & GroupMember tables synced');
    console.log('ℹ️  Using manual SQL migrations for all other tables');

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

const disconnectPostgreSQL = async () => {
  try {
    await sequelize.close();
    console.log('✅ PostgreSQL connection closed');
  } catch (error) {
    console.error('❌ Error closing PostgreSQL:', error.message);
  }
};

export { sequelize, connectPostgreSQL, disconnectPostgreSQL };
export default sequelize;