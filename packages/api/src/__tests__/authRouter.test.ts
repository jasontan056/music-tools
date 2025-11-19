/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authRouter } from '../router/auth';
import type { Context } from '../context';

vi.mock('nanoid', () => ({
  nanoid: () => 'test-token'
}));

const bcryptMocks = vi.hoisted(() => {
  const hashMock = vi.fn(async (value: string) => `hashed-${value}`);
  const compareMock = vi.fn(async (value: string, hash: string) => hash === `hashed-${value}`);
  return { hashMock, compareMock };
});

vi.mock('bcryptjs', () => ({
  default: {
    hash: bcryptMocks.hashMock,
    compare: bcryptMocks.compareMock
  },
  hash: bcryptMocks.hashMock,
  compare: bcryptMocks.compareMock
}));

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  session: {
    create: vi.fn(),
    delete: vi.fn()
  }
};

const baseContext = {
  prisma: mockPrisma,
  session: null,
  sessionToken: null,
  user: null
} as unknown as Context;

const createCaller = () => authRouter.createCaller(baseContext);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authRouter', () => {
  it('registers a new user and returns a token', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const createdUser = {
      id: 'user-1',
      email: 'new@example.com',
      name: 'New User',
      role: 'USER',
      createdAt: new Date()
    };
    mockPrisma.user.create.mockResolvedValue(createdUser);
    mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });

    const caller = createCaller();
    const result = await caller.register({ email: 'new@example.com', name: 'New User', password: 'secret123' });

    expect(result.token).toBe('test-token');
    expect(result.user.email).toBe('new@example.com');
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: 'hashed-secret123'
        })
      })
    );
    expect(mockPrisma.session.create).toHaveBeenCalled();
  });

  it('logs in an existing user with valid credentials', async () => {
    const existingUser = {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo',
      role: 'USER',
      passwordHash: 'hashed-secret123',
      createdAt: new Date()
    };
    mockPrisma.user.findUnique.mockResolvedValue(existingUser);
    mockPrisma.user.update.mockResolvedValue(existingUser);
    mockPrisma.session.create.mockResolvedValue({ id: 'session-2' });

    const caller = createCaller();
    const result = await caller.login({ email: 'demo@example.com', password: 'secret123' });

    expect(result.user.email).toBe('demo@example.com');
    expect(mockPrisma.session.create).toHaveBeenCalled();
  });
});
