import type { Prisma } from '@prisma/client';
import { TodoPriority, TodoStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { authedProcedure, router } from '../trpc';
import type { Context } from '../context';

const filtersSchema = z
  .object({
    status: z.nativeEnum(TodoStatus).optional(),
    priority: z.nativeEnum(TodoPriority).optional(),
    search: z.string().max(100).optional()
  })
  .optional();

const createInput = z.object({
  title: z.string().min(3),
  description: z.string().max(500).optional(),
  priority: z.nativeEnum(TodoPriority).default(TodoPriority.MEDIUM),
  dueAt: z.coerce.date().optional()
});

const statusInput = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(TodoStatus)
});

const deleteInput = z.object({
  id: z.string().cuid()
});

const includeUser = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true
    }
  }
} satisfies Prisma.TodoInclude;

const buildWhere = (ctx: Context, input?: z.infer<typeof filtersSchema>): Prisma.TodoWhereInput => {
  const where: Prisma.TodoWhereInput = {
    ownerId: ctx.user?.id
  };

  if (!input) {
    return where;
  }

  if (input.status) {
    where.status = input.status;
  }

  if (input.priority) {
    where.priority = input.priority;
  }

  if (input.search) {
    where.OR = [
      { title: { contains: input.search, mode: 'insensitive' } },
      { description: { contains: input.search, mode: 'insensitive' } }
    ];
  }

  return where;
};

const orderBy: Prisma.TodoOrderByWithRelationInput[] = [
  { status: 'asc' },
  { priority: 'desc' },
  { createdAt: 'desc' }
];

export const todoRouter = router({
  list: authedProcedure.input(filtersSchema).query(async ({ ctx, input }) => {
    return ctx.prisma.todo.findMany({
      where: buildWhere(ctx, input),
      include: includeUser,
      orderBy
    });
  }),
  stats: authedProcedure.query(async ({ ctx }) => {
    const grouped = await ctx.prisma.todo.groupBy({
      by: ['status'],
      where: {
        ownerId: ctx.user.id
      },
      _count: { _all: true }
    });

    const totals = grouped.reduce<Record<TodoStatus, number>>(
      (acc, group) => {
        acc[group.status] = group._count._all;
        return acc;
      },
      {
        [TodoStatus.BACKLOG]: 0,
        [TodoStatus.IN_PROGRESS]: 0,
        [TodoStatus.DONE]: 0
      }
    );

    const total = Object.values(totals).reduce((sum, value) => sum + value, 0);

    return {
      total,
      byStatus: totals
    };
  }),
  create: authedProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const todo = await ctx.prisma.todo.create({
      data: {
        title: input.title,
        description: input.description,
        owner: {
          connect: { id: ctx.user.id }
        },
        priority: input.priority,
        dueAt: input.dueAt
      },
      include: includeUser
    });

    return todo;
  }),
  updateStatus: authedProcedure.input(statusInput).mutation(async ({ ctx, input }) => {
    await assertOwner(ctx, input.id);
    const todo = await ctx.prisma.todo.update({
      where: {
        id: input.id
      },
      data: {
        status: input.status
      },
      include: includeUser
    });

    return todo;
  }),
  delete: authedProcedure.input(deleteInput).mutation(async ({ ctx, input }) => {
    await assertOwner(ctx, input.id);
    await ctx.prisma.todo.delete({
      where: {
        id: input.id
      }
    });

    return { success: true };
  })
});

const assertOwner = async (ctx: Context, todoId: string) => {
  const todo = await ctx.prisma.todo.findUnique({
    where: { id: todoId },
    select: { ownerId: true }
  });

  if (!todo || todo.ownerId !== ctx.user?.id) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Todo not found' });
  }
};
