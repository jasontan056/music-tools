import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { Session, User } from '@prisma/client';
import { prisma } from '@acme/db';

const AUTH_HEADER_PREFIX = 'Bearer ';

const findSession = async (authorization?: string | string[]) => {
  if (!authorization) {
    return null;
  }

  const value = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!value?.startsWith(AUTH_HEADER_PREFIX)) {
    return null;
  }

  const token = value.slice(AUTH_HEADER_PREFIX.length);
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session;
};

export const createContext = async ({ req }: CreateExpressContextOptions) => {
  const session = await findSession(req.headers.authorization);

  return {
    prisma,
    session,
    user: session?.user ?? null,
    sessionToken: session?.token ?? null
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
