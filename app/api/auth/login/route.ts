import { NextResponse } from 'next/server';
import { HfDbError } from '@minhvhdev/hf-db-sdk';

import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';
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

type AuthBody = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    await ensureDbReady();
    const db = getDb();

    const body = (await request.json()) as AuthBody;
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

    const user =
      username === ADMIN_USERNAME
        ? await ensureAdminAccount(db)
        : await findUserByUsername(db, username);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 },
      );
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 },
      );
    }

    const token = await createSessionToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });
    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof HfDbError) {
      return NextResponse.json(
        { error: error.detail || 'Database request failed.' },
        { status: error.status || 500 },
      );
    }

    return NextResponse.json(
      { error: 'Unexpected error while signing in.' },
      { status: 500 },
    );
  }
}
