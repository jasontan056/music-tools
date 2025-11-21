import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers';

const compose = readFileSync(path.join(repoRoot, 'docker-compose.yml'), 'utf-8');

describe('docker-compose.yml', () => {
  it('advertises traefik with the shared web_proxy network', () => {
    expect(compose).toContain('traefik.docker.network=web_proxy');
  });

  it('uses host rules derived from COMPOSE_PROJECT_NAME', () => {
    expect(compose).toContain('Host(`${COMPOSE_PROJECT_NAME}.${HOST_DOMAIN:-lvh.me}`)');
    expect(compose).toContain('PathPrefix(`/trpc`, `/healthz`)');
  });
});
