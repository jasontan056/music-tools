import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { appRouter, createContext } from '@acme/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..', '..');

describe('API + database integration', () => {
  let container: StartedPostgreSqlContainer;
  let authToken: string | null = null;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('skeleton3_integration')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();

    const dbUrl = container.getConnectionUri();
    process.env.DATABASE_URL = dbUrl;
    process.env.WEB_URL = 'http://localhost:5173';
    process.env.NODE_ENV = 'test';

    execSync('pnpm --filter @acme/db db:push', {
      cwd: workspaceRoot,
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'pipe'
    });
  });

  afterAll(async () => {
    const { prisma } = await import('@acme/db');
    await prisma.$disconnect();

    if (container) {
      await container.stop();
    }
  });

  const createCaller = async () => {
    const req = {
      headers: authToken ? { authorization: `Bearer ${authToken}` } : {}
    } as CreateExpressContextOptions['req'];
    const res = {} as CreateExpressContextOptions['res'];
    const ctx = await createContext({ req, res });
    return appRouter.createCaller(ctx);
  };

  it('registers, logs in, and creates todos end-to-end', async () => {
    authToken = null;
    const client = await createCaller();
    const email = `integration-${Date.now()}@example.com`;
    const password = 'super-secret1';
    const registerResponse = await client.auth.register({
      email,
      password,
      name: 'Integration Tester'
    });

    expect(registerResponse.user.email).toBe(email);
    expect(registerResponse.token).toBeTruthy();

    authToken = null;
    const loginClient = await createCaller();
    const loginResponse = await loginClient.auth.login({ email, password });
    expect(loginResponse.user.id).toBe(registerResponse.user.id);

    authToken = loginResponse.token;
    const authedClient = await createCaller();
    const dueAt = new Date('2030-01-01T12:00:00.000Z');
    const todo = await authedClient.todo.create({
      title: 'Wire up preview automation',
      description: 'Created by the integration test suite',
      priority: 'HIGH',
      dueAt
    });

    expect(todo.title).toContain('preview automation');
    expect(todo.owner.email).toBe(email);

    const todos = await authedClient.todo.list();
    expect(todos.find((item) => item.id === todo.id)).toBeDefined();

    const stats = await authedClient.todo.stats();
    expect(stats.byStatus[todo.status]).toBeGreaterThan(0);
  });
});
