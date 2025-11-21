import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
const t = initTRPC.context().create({
    transformer: superjson
});
export const router = t.router;
export const publicProcedure = t.procedure;
const enforceAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.user || !ctx.session) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Missing user session' });
    }
    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
            session: ctx.session,
            sessionToken: ctx.sessionToken
        }
    });
});
export const authedProcedure = t.procedure.use(enforceAuthed);
