import { NextResponse } from 'next/server';

export const SESSION_COOKIE_NAME = 'study-perk-session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type UserRole = 'admin' | 'user';

type SessionPayload = {
  userId: number;
  username: string;
  role: UserRole;
  exp: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('Missing SESSION_SECRET environment variable.');
  }

  return secret;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function importSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(payload: string) {
  const key = await importSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

async function verifySignature(payload: string, signature: string) {
  const key = await importSigningKey();
  return crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64Url(signature),
    encoder.encode(payload),
  );
}

export async function createSessionToken(user: {
  id: number;
  username: string;
  role: UserRole;
}) {
  const payload: SessionPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const isValid = await verifySignature(encodedPayload, signature);

  if (!isValid) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decoder.decode(fromBase64Url(encodedPayload)),
    ) as SessionPayload;

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(
  request: Request & { cookies: { get(name: string): { value: string } | undefined } },
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
