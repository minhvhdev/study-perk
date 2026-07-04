import 'server-only';

import { createDbClient, defineMigration, HfDbClient } from '@minhvhdev/hf-db-sdk';

const DATABASE_NAME_PATTERN = /^[a-z0-9_]{1,63}$/;
const DEFAULT_DATABASE = 'study_perk';

function getDatabaseName() {
  const database =
    process.env.HF_DB_DATABASE?.trim().toLowerCase() || DEFAULT_DATABASE;

  if (!DATABASE_NAME_PATTERN.test(database)) {
    throw new Error(
      `Invalid HF_DB_DATABASE "${database}". Expected ^[a-z0-9_]{1,63}$`,
    );
  }

  return database;
}

function getBaseUrl() {
  const baseUrl = process.env.HF_DB_BASE_URL?.trim();

  if (!baseUrl) {
    throw new Error('Missing HF_DB_BASE_URL environment variable.');
  }

  return baseUrl;
}

function getHeaders() {
  return process.env.HF_TOKEN
    ? {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
      }
    : undefined;
}

let cachedDb: HfDbClient | null = null;

export function getDb() {
  if (!cachedDb) {
    cachedDb = createDbClient({
      baseUrl: getBaseUrl(),
      database: getDatabaseName(),
      headers: getHeaders(),
      timeoutMs: 30_000,
    });
  }

  return cachedDb;
}

const migrations = [
  defineMigration({
    version: '001_create_users_and_state',
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id bigserial PRIMARY KEY,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE IF NOT EXISTS user_state (
        id bigserial PRIMARY KEY,
        user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        state_key text NOT NULL,
        value_text text NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (user_id, state_key)
      )`,
      'CREATE INDEX IF NOT EXISTS idx_user_state_user_id ON user_state (user_id)',
    ],
  }),
  defineMigration({
    version: '002_add_username_and_role_to_users',
    statements: [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS username text',
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'",
      'UPDATE users SET username = email WHERE username IS NULL',
      'ALTER TABLE users ALTER COLUMN username SET NOT NULL',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users (username)',
    ],
  }),
];

let migrationPromise: Promise<void> | null = null;

export async function ensureDbReady() {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const db = getDb();
      await db.health();
      await db.migrate(migrations);
    })().catch((error) => {
      migrationPromise = null;
      throw error;
    });
  }

  await migrationPromise;
}

export function getHfDatabaseName() {
  return getDatabaseName();
}
