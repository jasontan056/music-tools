import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers';

const turboConfig = JSON.parse(readFileSync(path.join(repoRoot, 'turbo.json'), 'utf-8')) as {
  tasks: Record<
    string,
    {
      dependsOn?: string[];
      outputs?: string[];
      cache?: boolean;
      env?: string[];
    }
  >;
};

describe('turbo.json', () => {
  it('declares cache + dependency relationships for dev-build-test flow', () => {
    expect(turboConfig.tasks.dev?.cache).toBe(false);
    expect(turboConfig.tasks.dev?.dependsOn).toContain('^dev');

    expect(turboConfig.tasks.build?.dependsOn).toContain('^build');
    expect(turboConfig.tasks.build?.outputs).toEqual(expect.arrayContaining(['dist/**', 'build/**']));
    expect(turboConfig.tasks.build?.env).toContain('DATABASE_URL');

    expect(turboConfig.tasks.lint?.dependsOn).toContain('^lint');
    expect(turboConfig.tasks.test?.dependsOn).toContain('^test');
  });
});
