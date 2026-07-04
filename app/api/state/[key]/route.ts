import { NextRequest, NextResponse } from 'next/server';
import { HfDbError } from '@minhvhdev/hf-db-sdk';

import { getSessionFromRequest } from '@/lib/auth/session';
import { ensureDbReady, getDb } from '@/lib/hf-db';

export const runtime = 'nodejs';

function parseStateRow(row: Record<string, unknown>) {
  return {
    value: String(row.value_text),
  };
}

function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function decodeStateKey(key: string) {
  return decodeURIComponent(key);
}

async function getParams(
  context: { params: Promise<{ key: string }> },
) {
  return context.params;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    await ensureDbReady();
    const db = getDb();

    const { key } = await getParams(context);
    const stateKey = decodeStateKey(key);
    const rows = await db.typedQuery(
      parseStateRow,
      `SELECT value_text
       FROM user_state
       WHERE user_id = :userId AND state_key = :stateKey
       LIMIT 1`,
      {
        userId: session.userId,
        stateKey,
      },
    );

    return NextResponse.json({ value: rows[0]?.value ?? null });
  } catch (error) {
    if (error instanceof HfDbError) {
      return NextResponse.json(
        { error: error.detail || 'Failed to read state.' },
        { status: error.status || 500 },
      );
    }

    return NextResponse.json(
      { error: 'Unexpected error while reading state.' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    await ensureDbReady();
    const db = getDb();

    const body = (await request.json()) as { value?: string };
    const value = body.value;

    if (typeof value !== 'string') {
      return NextResponse.json(
        { error: 'State value must be a string.' },
        { status: 400 },
      );
    }

    const { key } = await getParams(context);
    const stateKey = decodeStateKey(key);

    await db.query(
      `INSERT INTO user_state (user_id, state_key, value_text, updated_at)
       VALUES (:userId, :stateKey, :value, now())
       ON CONFLICT (user_id, state_key)
       DO UPDATE SET value_text = EXCLUDED.value_text, updated_at = now()`,
      {
        userId: session.userId,
        stateKey,
        value,
      },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HfDbError) {
      return NextResponse.json(
        { error: error.detail || 'Failed to write state.' },
        { status: error.status || 500 },
      );
    }

    return NextResponse.json(
      { error: 'Unexpected error while writing state.' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    await ensureDbReady();
    const db = getDb();

    const { key } = await getParams(context);
    const stateKey = decodeStateKey(key);

    await db.query(
      `DELETE FROM user_state
       WHERE user_id = :userId AND state_key = :stateKey`,
      {
        userId: session.userId,
        stateKey,
      },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HfDbError) {
      return NextResponse.json(
        { error: error.detail || 'Failed to delete state.' },
        { status: error.status || 500 },
      );
    }

    return NextResponse.json(
      { error: 'Unexpected error while deleting state.' },
      { status: 500 },
    );
  }
}
