import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { prisma } from '@acme/db';

export const createContext = ({ req }: CreateExpressContextOptions) => {
  const userId = req.headers['x-user-id']?.toString() ?? null;

  return {
    prisma,
    userId
  };
};

export type Context = ReturnType<typeof createContext> extends Promise<infer T>
  ? T
  : ReturnType<typeof createContext>;
