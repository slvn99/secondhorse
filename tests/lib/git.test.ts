import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getLastCommitDate, getShortCommit, __setExecSyncForTests } from '@/lib/git';

describe('git helpers', () => {
  beforeEach(() => {
    __setExecSyncForTests(((cmd: string) => {
      // Default fallback if not explicitly mocked per-test
      if (cmd.includes('rev-parse')) return 'deadbeef\n' as any;
      if (cmd.includes('git log')) return '1970-01-01\n' as any;
      return '' as any;
    }) as any);
  });

  it('returns short commit on success', () => {
    __setExecSyncForTests((() => 'abc123\n') as any);
    expect(getShortCommit()).toBe('abc123');
  });

  it('returns null on failure (short commit)', () => {
    __setExecSyncForTests((() => { throw new Error('boom'); }) as any);
    expect(getShortCommit()).toBeNull();
  });

  it('returns last commit date on success', () => {
    __setExecSyncForTests((() => '2024-09-01\n') as any);
    expect(getLastCommitDate()).toBe('2024-09-01');
  });

  it('returns null on failure (date)', () => {
    __setExecSyncForTests((() => { throw new Error('boom'); }) as any);
    expect(getLastCommitDate()).toBeNull();
  });
});
