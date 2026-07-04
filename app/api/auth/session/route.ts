import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      username: session.username,
      role: session.role,
    },
  });
}
