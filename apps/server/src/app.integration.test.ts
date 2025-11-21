import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { Server } from 'node:http';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { AppRouter } from '@acme/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..', '..');

type ApiModule = typeof import('@acme/api');

describe('API + database integration', () => {
  let container: StartedPostgreSqlContainer;
  let authToken: string | null = null;
  let server: Server | null = null;
  let baseUrl: string | null = null;
  // Lazily imported after DATABASE_URL is set to avoid using .env value
  let appRouter: ApiModule['appRouter'] | null = null;
  let createContext: ApiModule['createContext'] | null = null;

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
    // Import only after env is set so Prisma picks up the container URL
    const apiModule = await import('@acme/api');
    appRouter = apiModule.appRouter;
    createContext = apiModule.createContext;

    const { createServer } = await import('./app');
    const app = createServer();
    server = app.listen(0);
    await new Promise<void>((resolve) => {
      server?.once('listening', resolve);
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to determine server address');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }
    const { prisma } = await import('@acme/db');
    await prisma.$disconnect();

    if (container) {
      await container.stop();
    }
  });

  const createCaller = async () => {
    if (!appRouter || !createContext) {
      throw new Error('API modules not loaded');
    }
    const req = {
      headers: authToken ? { authorization: `Bearer ${authToken}` } : {}
    } as CreateExpressContextOptions['req'];
    const res = {} as CreateExpressContextOptions['res'];
    const ctx = await createContext({ req, res });
    return appRouter.createCaller(ctx);
  };

  const unwrap = <T>(value: T | { json: T }) => {
    if (value && typeof value === 'object' && 'json' in (value as Record<string, unknown>)) {
      return (value as { json: T }).json;
    }
    return value;
  };

  const getHttpClient = () => {
    if (!baseUrl) {
      throw new Error('Server not started');
    }
    return createTRPCProxyClient<AppRouter>({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${baseUrl}/trpc`,
          headers() {
            return authToken ? { Authorization: `Bearer ${authToken}` } : {};
          }
        })
      ]
    });
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

    const callerTodos = await authedClient.todo.list();
    expect(callerTodos.find((item) => item.id === todo.id)).toBeDefined();
    await authedClient.todo.updateStatus({
      id: todo.id,
      status: 'DONE'
    });

    const httpClient = getHttpClient();
    const me = unwrap(await httpClient.auth.me.query(undefined));
    expect(me).toBeTruthy();
    expect(me.email).toBe(email);

    const todosViaHttp = unwrap(await httpClient.todo.list.query(undefined));
    expect(todosViaHttp.find((item) => item.id === todo.id)).toBeDefined();

    const stats = unwrap(await httpClient.todo.stats.query(undefined));
    expect(stats.byStatus.DONE).toBeGreaterThan(0);
  });
});
