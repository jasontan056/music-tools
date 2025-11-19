import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { AuthPayload } from '@acme/common';
import type { Context } from '../context';
import { authedProcedure, publicProcedure, router } from '../trpc';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

const credentialsSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const registerSchema = credentialsSchema.extend({
  name: z.string().min(2).max(60)
});

const toUserPayload = (user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
}): AuthPayload['user'] => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role as AuthPayload['user']['role'],
  createdAt: user.createdAt.toISOString()
});

export const authRouter = router({
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'An account with that email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await ctx.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash
      }
    });

    const token = await createSession(ctx.prisma, user.id);

    return {
      token,
      user: toUserPayload(user)
    } satisfies AuthPayload;
  }),
  login: publicProcedure.input(credentialsSchema).mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    await ctx.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = await createSession(ctx.prisma, user.id);

    return {
      token,
      user: toUserPayload(user)
    } satisfies AuthPayload;
  }),
  logout: authedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.session.delete({ where: { id: ctx.session.id } });
    return { success: true };
  }),
  me: authedProcedure.query(({ ctx }) => toUserPayload(ctx.user))
});

const createSession = async (prisma: Context['prisma'], userId: string) => {
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      token,
      expiresAt,
      userId
    }
  });

  return token;
};
