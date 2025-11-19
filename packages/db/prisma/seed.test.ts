import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { seedDemoData } from './seed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..', '..');

describe('seedDemoData', () => {
  let container: PostgreSqlContainer;
  let prisma: PrismaClient;
  let databaseUrl: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('skeleton3_seed')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();

    databaseUrl = container.getConnectionUri();
    execSync('pnpm --filter @acme/db db:push', {
      cwd: workspaceRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe'
    });

    prisma = new PrismaClient({
      datasources: {
        db: { url: databaseUrl }
      }
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (container) {
      await container.stop();
    }
  });

  it('clears the database and rehydrates the demo account', async () => {
    await seedDemoData(prisma);
    let users = await prisma.user.findMany({ include: { todos: true } });
    expect(users).toHaveLength(1);
    expect(users[0].todos).toHaveLength(3);
    expect(users[0].email).toBe('demo@example.com');
    expect(users[0].passwordHash).not.toBe('demo1234');

    const userId = users[0].id;
    await prisma.todo.create({
      data: {
        title: 'Should disappear',
        ownerId: userId
      }
    });
    await prisma.session.create({
      data: {
        token: 'temp-session',
        userId,
        expiresAt: new Date(Date.now() + 1000 * 60)
      }
    });

    await seedDemoData(prisma);
    users = await prisma.user.findMany({ include: { todos: true } });
    expect(users).toHaveLength(1);
    expect(users[0].todos).toHaveLength(3);

    const sessions = await prisma.session.count();
    expect(sessions).toBe(0);

    const statuses = users[0].todos.map((todo) => todo.status);
    expect(statuses).toEqual(expect.arrayContaining(['BACKLOG', 'IN_PROGRESS', 'DONE']));
  });
});
