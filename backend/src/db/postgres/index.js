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
    dialectOptions: {
      keepAlive: true,
      connectionTimeoutMillis: 25000,
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 30000 }
  }
);

/**
 * Safely drop a constraint OR index by name before alter:true sync.
 * Sequelize's alter:true fails when it tries to re-add a UNIQUE that already
 * exists as a named constraint — dropping the constraint first lets it recreate cleanly.
 */
const safeDropConstraint = async (table, name) => {
  // Try DROP CONSTRAINT first (covers unique constraints created by Sequelize)
  await sequelize.query(
    `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}";`
  ).catch(() => {});
  // Also try DROP INDEX in case it was created as a plain index (not constraint-backed)
  await sequelize.query(
    `DROP INDEX IF EXISTS "${name}";`
  ).catch(() => {});
};

/**
 * Safe column-add helper — adds a column only if it doesn't exist yet.
 * Avoids the UNIQUE constraint crash entirely for simple column additions.
 */
const addColumnIfMissing = async (table, column, definition) => {
  await sequelize.query(
    `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS ${column} ${definition};`
  ).catch(() => {});
};

const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');

    // Import all models (order matters for FK constraints)
    const Contest          = (await import('../../models/postgres/Contest.models.js')).default;
    const User             = (await import('../../models/postgres/User.models.js')).default;
    const ContestParticipant = (await import('../../models/postgres/ContestParticipant.models.js')).default;
    const ContestSubmission  = (await import('../../models/postgres/ContestSubmission.models.js')).default;
    const ContestRatingHistory = (await import('../../models/postgres/ContestRatingHistory.models.js')).default;
    const ContestRejudge      = (await import('../../models/postgres/ContestRejudge.models.js')).default;
    const Group            = (await import('../../models/postgres/Group.models.js')).default;
    const GroupMember      = (await import('../../models/postgres/GroupMember.models.js')).default;

    await defineAssociations();

    // ── User (Postgres sync-cache table) ────────────────────────────────────
    // Was imported here but never synced — the table never actually existed,
    // which is why any write to it failed with "relation users does not exist".
    await safeDropConstraint('users', 'users_mongo_id_key');
    await User.sync({ alter: true });
    console.log('✅ User table synced');

    // ── Group & GroupMember ────────────────────────────────────────────────
    // Drop slug unique constraint before alter — Sequelize generates invalid
    // 'ADD UNIQUE' syntax on Neon/PostgreSQL; dropping first lets it recreate cleanly
    await safeDropConstraint('groups', 'groups_slug_key');
    await safeDropConstraint('groups', 'groups_slug_unique');
    await Group.sync({ alter: true });
    await GroupMember.sync({ alter: true });
    console.log('✅ Group & GroupMember tables synced');

    // ── Contest ────────────────────────────────────────────────────────────
    await Contest.sync({ alter: true });
    console.log('✅ Contest table synced (missing columns added)');

    // ── ContestParticipant ─────────────────────────────────────────────────
    // Drop the unique CONSTRAINT (not just the index) so alter:true can recreate it.
    // Sequelize names the constraint the same as the index: 'unique_contest_participant'
    await safeDropConstraint('contest_participants', 'unique_contest_participant');
    await ContestParticipant.sync({ alter: true });
    console.log('✅ ContestParticipant table synced (problem_stats, rating fields ensured)');

    // ── ContestSubmission ──────────────────────────────────────────────────
    // Has a unique index on submission_id — drop both possible names Sequelize uses
    await safeDropConstraint('contest_submissions', 'idx_contest_submissions_submission_id');
    await safeDropConstraint('contest_submissions', 'contest_submissions_submission_id_key');
    await ContestSubmission.sync({ alter: true });
    console.log('✅ ContestSubmission table synced (time_from_start column ensured)');

    // ── ContestRatingHistory & ContestRejudge (L6/L7) ──────────────────────
    // Brand-new tables — no existing-constraint dance needed like the older
    // tables above (that workaround is only for constraints Sequelize's
    // alter:true tries to re-add on a table that already has them).
    await ContestRatingHistory.sync({ alter: true });
    await ContestRejudge.sync({ alter: true });
    console.log('✅ ContestRatingHistory & ContestRejudge tables synced');

    // ── group_id column on contests ────────────────────────────────────────
    await addColumnIfMissing(
      'contests',
      'group_id',
      'INTEGER REFERENCES groups(id) ON DELETE SET NULL'
    );
    console.log('✅ contests.group_id column ensured');

    console.log('ℹ️  Using manual SQL migrations for all other tables');

    return sequelize;
  } catch (error) {
    const detail = error.message
      || error.original?.message
      || error.parent?.code
      || (error.errors && error.errors.map((e) => e.message || e.code).join(', '))
      || error.name;
    console.error(`❌ PostgreSQL Connection Failed: ${detail}`);
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