/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { formatDate, formatRelativeDate } from './index';

describe('date formatting helpers', () => {
  it('formats ISO strings consistently', () => {
    const date = '2024-01-15T10:30:00.000Z';
    expect(formatDate(date)).toMatch(/2024/);
  });

  it('renders relative labels gracefully', () => {
    expect(formatRelativeDate(null)).toBe('No due date');
    expect(formatRelativeDate('2024-01-15T10:30:00.000Z')).toMatch(/Jan/);
  });
});
