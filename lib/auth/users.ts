import { HfDbClient } from '@minhvhdev/hf-db-sdk';

import { hashPassword, verifyPassword } from './password';
import { UserRole } from './session';

export const ADMIN_USERNAME = 'admin';

export type DbUser = {
  id: number;
  username: string;
  role: UserRole;
  passwordHash: string;
};

function parseUserRow(row: Record<string, unknown>): DbUser {
  return {
    id: Number(row.id),
    username: String(row.username),
    role: String(row.role) === 'admin' ? 'admin' : 'user',
    passwordHash: String(row.password_hash),
  };
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string) {
  if (!username) {
    return 'Username is required.';
  }

  if (!/^[a-z0-9._@-]{3,64}$/i.test(username)) {
    return 'Username must be 3-64 characters and use only letters, numbers, dot, underscore, dash, or @.';
  }

  return null;
}

export function validatePassword(password: string) {
  if (!password) {
    return 'Password is required.';
  }

  return null;
}

export async function findUserByUsername(db: HfDbClient, username: string) {
  const users = await db.typedQuery(
    parseUserRow,
    `SELECT id, username, role, password_hash
     FROM users
     WHERE username = :username
     LIMIT 1`,
    { username },
  );

  return users[0] ?? null;
}

export async function findUserById(db: HfDbClient, id: number) {
  const users = await db.typedQuery(
    parseUserRow,
    `SELECT id, username, role, password_hash
     FROM users
     WHERE id = :id
     LIMIT 1`,
    { id },
  );

  return users[0] ?? null;
}

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error('Missing ADMIN_PASSWORD environment variable.');
  }

  return password;
}

export async function ensureAdminAccount(db: HfDbClient) {
  const username = ADMIN_USERNAME;
  const adminPassword = getAdminPassword();
  const existingAdmin = await findUserByUsername(db, username);

  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    const insertedUsers = await db.typedQuery(
      parseUserRow,
      `INSERT INTO users (email, username, role, password_hash)
       VALUES (:email, :username, 'admin', :passwordHash)
       RETURNING id, username, role, password_hash`,
      {
        email: username,
        username,
        passwordHash,
      },
    );

    return insertedUsers[0] ?? null;
  }

  const passwordMatches = await verifyPassword(
    adminPassword,
    existingAdmin.passwordHash,
  );

  if (existingAdmin.role !== 'admin' || !passwordMatches) {
    const nextPasswordHash = passwordMatches
      ? existingAdmin.passwordHash
      : await hashPassword(adminPassword);

    const updatedUsers = await db.typedQuery(
      parseUserRow,
      `UPDATE users
       SET email = :email,
           role = 'admin',
           password_hash = :passwordHash
       WHERE id = :id
       RETURNING id, username, role, password_hash`,
      {
        id: existingAdmin.id,
        email: username,
        passwordHash: nextPasswordHash,
      },
    );

    return updatedUsers[0] ?? existingAdmin;
  }

  return existingAdmin;
}
