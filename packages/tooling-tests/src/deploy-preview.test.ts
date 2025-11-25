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
      SSH_HOST: 'preview.example.com',
      SSH_USER: 'deploy',
      SSH_KEY: Buffer.from('fake-key').toString('base64'),
      GITHUB_REPOSITORY: 'acme/TestRepo',
      GITHUB_HEAD_REF: 'feature/test-branch',
      SERVER_IMAGE: 'ghcr.io/acme/server:sha',
      WEB_IMAGE: 'ghcr.io/acme/web:sha',
      HOST_DOMAIN: 'example.com',
      REGISTRY_USER: 'user',
      REGISTRY_TOKEN: 'token',
      PATH: `${binDir}:${process.env.PATH}`
    } satisfies NodeJS.ProcessEnv;

    const result = runScript(env);
    if (result.status !== 0) {
      console.error('deploy-preview.sh stderr:', result.stderr);
    }
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('acme-testrepo-feature-test-branch');

    const calls = readFileSync(logFile, 'utf-8');
    expect(calls).toContain('rsync -e');
    const sshCalls = calls
      .split('\n')
      .filter((line) => line.trim().startsWith('ssh '));
    expect(sshCalls).toHaveLength(2);
    expect(calls).toContain('~/deployments/skeleton-previews/acme-testrepo/feature-test-branch');

    const scriptSource = readFileSync(path.join(repoRoot, 'scripts/deploy-preview.sh'), 'utf-8');
    expect(scriptSource).toContain('REGISTRY_TOKEN');
    expect(scriptSource).toContain('docker login ghcr.io');
    expect(scriptSource).toContain('PREVIEW_SLUG="${REPO_SLUG}-${BRANCH_SLUG}"');

    const remoteScript = readFileSync(stdinLog, 'utf-8');
    expect(remoteScript).toContain('export REGISTRY_USER="');
    expect(remoteScript).toContain('export REGISTRY_TOKEN="');

    const keyPath = path.join(repoRoot, 'temp_key');
    expect(existsSync(keyPath)).toBe(false);
  });
});
