import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { repoRoot } from './helpers';

const runScript = (env: NodeJS.ProcessEnv) =>
  spawnSync('bash', ['scripts/deploy-prod.sh'], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: 'utf-8'
  });

const removeTempKey = () => {
  const keyPath = path.join(repoRoot, 'temp_key');
  if (existsSync(keyPath)) {
    rmSync(keyPath);
  }
};

afterEach(removeTempKey);

describe('deploy-prod.sh', () => {
  it('exits early when secrets are missing', () => {
    const result = runScript({});
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('Missing production deploy secrets');
  });

  it('invokes remote deploy with migrate + no seed', () => {
    const binDir = mkdtempSync(path.join(tmpdir(), 'deploy-prod-'));
    const logFile = path.join(binDir, 'calls.log');
    const stdinLog = path.join(binDir, 'ssh-input.log');
    writeFileSync(logFile, '');
    writeFileSync(stdinLog, '');

    const writeStub = (name: string, contents: string) => {
      const file = path.join(binDir, name);
      writeFileSync(file, contents, { mode: 0o755 });
    };

    writeStub(
      'ssh',
      `#!/usr/bin/env bash
set -euo pipefail
echo "ssh $@" >> "${logFile}"
cat >> "${stdinLog}"
`
    );

    writeStub(
      'rsync',
      `#!/usr/bin/env bash
set -euo pipefail
echo "rsync $@" >> "${logFile}"
`
    );

    const env = {
      PRODUCTION_SSH_HOST: 'prod.example.com',
      PRODUCTION_SSH_USER: 'deploy',
      PRODUCTION_SSH_KEY: Buffer.from('fake-key').toString('base64'),
      GITHUB_REPOSITORY: 'acme/TestRepo',
      GITHUB_REF: 'refs/heads/main',
      SERVER_IMAGE: 'ghcr.io/acme/server:main',
      WEB_IMAGE: 'ghcr.io/acme/web:main',
      PRODUCTION_HOST_DOMAIN: 'example.com',
      PATH: `${binDir}:${process.env.PATH}`
    } satisfies NodeJS.ProcessEnv;

    const result = runScript(env);
    if (result.status !== 0) {
      // Helpful debug if the stub exits unexpectedly
      console.error('deploy-prod.sh stderr:', result.stderr);
    }
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('acme-testrepo-prod');

    const calls = readFileSync(logFile, 'utf-8');
    expect(calls).toContain('rsync -e');
    expect(calls).toContain('~/deployments/skeleton-prod/acme-testrepo-prod');

    const sshCalls = calls
      .split('\n')
      .filter((line) => line.trim().startsWith('ssh '));
    expect(sshCalls).toHaveLength(2);

    const remoteScript = readFileSync(stdinLog, 'utf-8');
    expect(remoteScript).toContain('DB_COMMAND="${DB_COMMAND:-db:migrate}"');
    expect(remoteScript).toContain('RUN_SEED="${RUN_SEED:-false}"');
    expect(remoteScript).toContain('HOST_DOMAIN="${HOST_DOMAIN:-example.com}"');

    const keyPath = path.join(repoRoot, 'temp_key');
    expect(existsSync(keyPath)).toBe(false);
  });
});
