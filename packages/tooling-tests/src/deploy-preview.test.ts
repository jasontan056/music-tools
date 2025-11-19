import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { repoRoot } from './helpers';

const runScript = (env: NodeJS.ProcessEnv) =>
  spawnSync('bash', ['scripts/deploy-preview.sh'], {
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

describe('deploy-preview.sh', () => {
  it('exits early when secrets are missing', () => {
    const result = runScript({});
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('Missing preview deploy secrets');
  });

  it('runs the remote workflow with the provided secrets', () => {
    const binDir = mkdtempSync(path.join(tmpdir(), 'deploy-stub-'));
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
if [ -p /dev/stdin ]; then
  cat >> "${stdinLog}"
fi
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
      SSH_HOST: 'preview.example.com',
      SSH_USER: 'deploy',
      SSH_KEY: Buffer.from('fake-key').toString('base64'),
      GITHUB_HEAD_REF: 'feature/test-branch',
      PATH: `${binDir}:${process.env.PATH}`
    } satisfies NodeJS.ProcessEnv;

    const result = runScript(env);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('feature-test-branch');

    const calls = readFileSync(logFile, 'utf-8');
    expect(calls).toContain('rsync -e');
    const sshCalls = calls
      .split('\n')
      .filter((line) => line.trim().startsWith('ssh '));
    expect(sshCalls).toHaveLength(2);
    expect(calls).toContain('/var/www/skeleton-previews/feature-test-branch');

    const scriptSource = readFileSync(path.join(repoRoot, 'scripts/deploy-preview.sh'), 'utf-8');
    expect(scriptSource).toContain('pnpm --filter @acme/db db:push');
    expect(scriptSource).toContain('pnpm --filter @acme/db db:seed');
    expect(scriptSource).toContain('docker compose up -d --build');

    const keyPath = path.join(repoRoot, 'temp_key');
    expect(existsSync(keyPath)).toBe(false);
  });
});
