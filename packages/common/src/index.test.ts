/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { formatDate } from './index.js';

describe('date formatting helpers', () => {
  it('formats ISO strings consistently', () => {
    const date = '2024-01-15T10:30:00.000Z';
    expect(formatDate(date)).toMatch(/2024/);
  });

  it('formats Date objects', () => {
    const date = new Date('2024-01-15T10:30:00.000Z');
    expect(formatDate(date)).toMatch(/2024/);
  });
});
