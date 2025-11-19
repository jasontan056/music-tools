import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { createServer } from './app';

vi.mock('@acme/api', async () => {
  const { initTRPC } = await import('@trpc/server');
  const t = initTRPC.context<{}>().create();
  const router = t.router({
    ping: t.procedure.query(() => 'pong')
  });

  return {
    appRouter: router,
    createContext: () => ({})
  };
});

beforeAll(() => {
  process.env.WEB_URL = 'http://localhost:5173';
});

describe('createServer', () => {
  it('responds to health checks', async () => {
    const app = createServer();
    const response = await request(app).get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.app).toBeDefined();
  });

  it('registers tRPC middleware', () => {
    const app = createServer();
    const stack = (app as any)._router.stack as Array<{ name?: string; regexp?: { toString(): string } }>;
    const hasTrpc = stack.some((layer) => layer?.regexp?.toString().includes('\\/trpc'));
    expect(hasTrpc).toBe(true);
  });
});
