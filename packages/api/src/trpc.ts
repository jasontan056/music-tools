import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Missing user session' });
  }

  return next({
    ctx: {
      userId: ctx.userId,
      prisma: ctx.prisma
    }
  });
});

export const authedProcedure = t.procedure.use(enforceAuthed);
