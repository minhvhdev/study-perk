import { NextRequest, NextResponse } from 'next/server';
import { HfDbError } from '@minhvhdev/hf-db-sdk';

import { hashPassword } from '@/lib/auth/password';
import { getSessionFromRequest } from '@/lib/auth/session';
import { ensureDbReady, getDb } from '@/lib/hf-db';
import {
  ADMIN_USERNAME,
  ensureAdminAccount,
  findUserByUsername,
  normalizeUsername,
  validatePassword,
  validateUsername,
} from '@/lib/auth/users';

export const runtime = 'nodejs';

type CreateUserBody = {
  username?: string;
  password?: string;
};

function parseListUserRow(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    username: String(row.username),
    role: String(row.role),
    createdAt: String(row.created_at),
  };
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || session.role !== 'admin') {
    return unauthorized();
  }

  try {
    await ensureDbReady();
    const db = getDb();
    await ensureAdminAccount(db);

    const users = await db.typedQuery(
      parseListUserRow,
      `SELECT id, username, role, created_at
       FROM users
       ORDER BY
         CASE WHEN role = 'admin' THEN 0 ELSE 1 END,
         username ASC`,
    );

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof HfDbError) {
      return NextResponse.json(
        { error: error.detail || 'Failed to load users.' },
        { status: error.status || 500 },
      );
    }

    return NextResponse.json(
      { error: 'Unexpected error while loading users.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || session.role !== 'admin') {
    return unauthorized();
  }

  try {
    await ensureDbReady();
    const db = getDb();

    const body = (await request.json()) as CreateUserBody;
    const username = normalizeUsername(body.username ?? '');
    const password = body.password ?? '';
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (usernameError || passwordError) {
      return NextResponse.json(
        { error: usernameError ?? passwordError },
        { status: 400 },
      );
    }

    if (username === ADMIN_USERNAME) {
      return NextResponse.json(
        { error: 'The admin username is reserved.' },
        { status: 400 },
      );
    }

    const existingUser = await findUserByUsername(db, username);

    if (existingUser) {
      return NextResponse.json(
        { error: 'This username already exists.' },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const insertedUsers = await db.typedQuery(
      parseListUserRow,
      `INSERT INTO users (email, username, role, password_hash)
       VALUES (:email, :username, 'user', :passwordHash)
       RETURNING id, username, role, created_at`,
      {
        email: username,
        username,
        passwordHash,
      },
    );

    return NextResponse.json({ ok: true, user: insertedUsers[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof HfDbError) {
      return NextResponse.json(
        { error: error.detail || 'Failed to create user.' },
        { status: error.status || 500 },
      );
    }

    return NextResponse.json(
      { error: 'Unexpected error while creating user.' },
      { status: 500 },
    );
  }
}
