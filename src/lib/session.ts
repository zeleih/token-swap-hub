import 'server-only';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const globalForSession = globalThis as typeof globalThis & {
  __tokenHubJwtSecret?: string;
  __tokenHubJwtSecretWarningShown?: boolean;
};

function getSessionSecret() {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  if (!globalForSession.__tokenHubJwtSecret) {
    if (process.env.NODE_ENV === 'production' && !globalForSession.__tokenHubJwtSecretWarningShown) {
      console.warn('JWT_SECRET is not configured. Falling back to an ephemeral secret; set JWT_SECRET before deployment.');
      globalForSession.__tokenHubJwtSecretWarningShown = true;
    }

    globalForSession.__tokenHubJwtSecret = `dev-${crypto.randomUUID()}-${crypto.randomUUID()}`;
  }

  return globalForSession.__tokenHubJwtSecret;
}

const key = new TextEncoder().encode(getSessionSecret());

type SessionPayload = JWTPayload & {
  userId: string;
  expiresAt: string;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, expiresAt: expiresAt.toISOString() });
  
  const c = await cookies();
  c.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  const c = await cookies();
  c.delete('session');
}

export async function verifySession() {
  const c = await cookies();
  const cookie = c.get('session')?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return null;
  }

  return { userId: session.userId as string };
}
