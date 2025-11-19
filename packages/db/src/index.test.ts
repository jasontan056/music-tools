import { describe, it, expect, vi, beforeEach } from 'vitest';

const prismaInstances: unknown[] = [];

vi.mock('@prisma/client', () => {
  class PrismaClient {
    constructor() {
      prismaInstances.push(this);
    }
  }

  return { PrismaClient };
});

const loadClient = async () => (await import('./index')).prisma;

beforeEach(() => {
  vi.resetModules();
  prismaInstances.length = 0;
});

describe('Prisma singleton', () => {
  it('creates only one client per module', async () => {
    const first = await loadClient();
    const second = await loadClient();
    expect(first).toBe(second);
    expect(prismaInstances).toHaveLength(1);
  });

  it('stores the client on the global object when not in production', async () => {
    (globalThis as any).prisma = undefined;
    const client = await loadClient();
    expect((globalThis as any).prisma).toBe(client);
  });
});
