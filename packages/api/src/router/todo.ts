import { z } from 'zod';
import { authedProcedure, publicProcedure, router } from '../trpc';

const todoInput = z.object({
  title: z.string().min(3),
  description: z.string().optional()
});

export const todoRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.todo.findMany({
      include: {
        owner: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }),
  create: authedProcedure.input(todoInput).mutation(async ({ ctx, input }) => {
    return ctx.prisma.todo.create({
      data: {
        title: input.title,
        description: input.description,
        ownerId: ctx.userId
      }
    });
  }),
  toggle: authedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        completed: z.boolean()
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.todo.update({
        where: { id: input.id },
        data: { completed: input.completed }
      });
    })
});
