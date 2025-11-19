import { describe, it, expect, beforeEach, vi } from 'vitest';
import { todoRouter } from '../router/todo';
import type { Context } from '../context';
import { TodoPriority, TodoStatus } from '@acme/common';

const mockPrisma = {
  todo: {
    findMany: vi.fn(),
    groupBy: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn()
  }
};

const authedContext = {
  prisma: mockPrisma,
  user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'USER', createdAt: new Date() },
  session: { id: 'session-1' },
  sessionToken: 'token',
  ctx: {}
} as unknown as Context & { user: NonNullable<Context['user']> };

const createCaller = () => todoRouter.createCaller(authedContext);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('todoRouter', () => {
  it('filters todos by status and priority', async () => {
    mockPrisma.todo.findMany.mockResolvedValue([]);

    const caller = createCaller();
    await caller.list({ status: TodoStatus.DONE, priority: TodoPriority.HIGH });

    expect(mockPrisma.todo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerId: authedContext.user.id,
          status: TodoStatus.DONE,
          priority: TodoPriority.HIGH
        })
      })
    );
  });

  it('creates todos for the authed user', async () => {
    const payload = {
      id: 'todo-1',
      title: 'Test',
      description: 'desc',
      priority: TodoPriority.MEDIUM,
      status: TodoStatus.BACKLOG,
      ownerId: authedContext.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      dueAt: new Date(),
      owner: { id: authedContext.user.id, name: 'Test', email: 'test@example.com' }
    };
    mockPrisma.todo.create.mockResolvedValue(payload);

    const caller = createCaller();
    const result = await caller.create({ title: 'Test', description: 'desc', priority: TodoPriority.MEDIUM, dueAt: new Date() });

    expect(mockPrisma.todo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Test',
          owner: expect.objectContaining({
            connect: { id: authedContext.user.id }
          })
        })
      })
    );
    expect(result).toEqual(payload);
  });

  it('prevents deleting todos not owned by the user', async () => {
    const strangerTodoId = 'cku2l1a1w000001234567890';
    mockPrisma.todo.findUnique.mockResolvedValue({ id: strangerTodoId, ownerId: 'someone-else' });

    const caller = createCaller();
    await expect(caller.delete({ id: strangerTodoId })).rejects.toThrow(/Todo not found/);
  });
});
