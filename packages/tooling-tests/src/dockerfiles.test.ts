import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers';

const read = (relativePath: string) => readFileSync(path.join(repoRoot, relativePath), 'utf-8');

describe('Dockerfiles', () => {
  it('server Dockerfile builds and runs via pnpm', () => {
    const dockerfile = read('apps/server/Dockerfile');
    expect(dockerfile).toContain('FROM node:20-alpine AS base');
    expect(dockerfile).toContain('FROM deps AS build');
    expect(dockerfile).toContain('pnpm --filter @acme/db db:generate');
    expect(dockerfile).toContain('pnpm --filter @acme/server build');
    expect(dockerfile).toContain('COPY --from=build /app/apps/server/dist ./apps/server/dist');
    expect(dockerfile).toContain('CMD ["node", "apps/server/dist/index.js"]');
  });

  it('web Dockerfile produces a static bundle served by nginx', () => {
    const dockerfile = read('apps/web/Dockerfile');
    expect(dockerfile).toContain('FROM node:20-alpine AS base');
    expect(dockerfile).toContain('RUN pnpm --filter @acme/web build');
    expect(dockerfile).toContain('FROM nginx:1.27-alpine AS runner');
    expect(dockerfile).toContain('/usr/share/nginx/html');
    expect(dockerfile).toContain('EXPOSE 80');
  });
});
