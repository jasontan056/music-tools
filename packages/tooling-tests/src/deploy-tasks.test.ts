import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { repoRoot } from './helpers';

const removeTempFiles = (logFile: string) => {
  if (existsSync(logFile)) {
    rmSync(logFile);
  }
};

describe('deploy-tasks.sh', () => {
  afterEach(() => {
    removeTempFiles(path.join(repoRoot, 'calls.log'));
  });

  const runWithStubs = (extraEnv: NodeJS.ProcessEnv = {}) => {
    const binDir = mkdtempSync(path.join(tmpdir(), 'deploy-tasks-'));
    const logFile = path.join(repoRoot, 'calls.log');
    writeFileSync(logFile, '');

    const writeStub = (name: string, contents: string) => {
      const file = path.join(binDir, name);
      writeFileSync(file, contents, { mode: 0o755 });
    };

    // Stub docker to log commands
    writeStub(
      'docker',
      `#!/usr/bin/env bash
set -euo pipefail
echo "docker $@" >> "${logFile}"
`
    );

    // Stub sleep to no-op
    writeStub(
      'sleep',
      `#!/usr/bin/env bash
exit 0
`
    );

    const env = {
      SERVER_IMAGE: 'ghcr.io/acme/server:local',
      WEB_IMAGE: 'ghcr.io/acme/web:local',
      COMPOSE_PROJECT_NAME: 'testproj',
      PATH: `${binDir}:${process.env.PATH}`,
      ...extraEnv
    } satisfies NodeJS.ProcessEnv;

    const result = spawnSync('bash', ['scripts/deploy-tasks.sh'], {
      cwd: repoRoot,
      env: { ...process.env, ...env },
      encoding: 'utf-8'
    });

    const calls = readFileSync(logFile, 'utf-8');
    return { result, calls };
  };

  it('runs push + seed by default', () => {
    const { result, calls } = runWithStubs();
    expect(result.status).toBe(0);
    expect(calls).toContain('docker compose up -d db');
    expect(calls).toContain('pnpm --filter @acme/db db:push');
    expect(calls).toContain('pnpm --filter @acme/db db:seed');
  });

  it('allows migrate without seed when configured', () => {
    const { result, calls } = runWithStubs({
      DB_COMMAND: 'db:migrate',
      RUN_SEED: 'false'
    });
    expect(result.status).toBe(0);
    expect(calls).toContain('pnpm --filter @acme/db db:migrate');
    expect(calls).not.toContain('db:seed');
  });
});
