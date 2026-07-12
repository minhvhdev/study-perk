import { NextRequest, NextResponse } from 'next/server';
import { HfDbError } from '@minhvhdev/hf-db-sdk';

import { getSessionFromRequest } from '@/lib/auth/session';
import { ensureDbReady, getDb } from '@/lib/hf-db';
import { ADMIN_USERNAME, findUserById } from '@/lib/auth/users';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

async function getParams(context: { params: Promise<{ id: string }> }) {
  return context.params;
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromRequest(request);

  if (!session || session.role !== 'admin') {
    return unauthorized();
  }

  try {
    const { id } = await getParams(context);
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 });
    }

    await ensureDbReady();
    const db = getDb();
    const user = await findUserById(db, userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (user.role === 'admin' || user.username === ADMIN_USERNAME) {
      return NextResponse.json(
        { error: 'The admin account cannot be deleted.' },
        { status: 400 },
      );
    }

    await db.query('DELETE FROM users WHERE id = :id', { id: userId });

    return NextResponse.json({ ok: true, username: user.username });
  } catch (error) {
    if (error instanceof HfDbError) {
      return NextResponse.json(
        { error: error.detail || 'Failed to delete user.' },
        { status: error.status || 500 },
      );
    }

    return NextResponse.json(
      { error: 'Unexpected error while deleting user.' },
      { status: 500 },
    );
  }
}
