import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { renderElement } from '../setup';
import MatchesSidebar from '@/app/_components/MatchesSidebar';

// MatchesSidebar reads from useTfhMatches(horses) and renders list; to ensure there is content,
// we mock the hook to return a small set and a spy for remove.
vi.mock('@/lib/tfh', async () => {
  const actual = await vi.importActual<any>('@/lib/tfh');
  const matches = [
    { name: 'SideA', age: 5, breed: 'B', location: 'L', gender: 'Gelding', heightCm: 150, color: 'Bay', temperament: 'Calm', disciplines: [], description: '', interests: [], image: '/TFH/Tinder-for-Horses-cover-image.png' },
  ];
  return {
    ...actual,
    useTfhMatches: () => ({ matches, removeMatch: (name: string) => { (globalThis as any).__removed = name; } }),
  } as any;
});

describe('MatchesSidebar', () => {
  it('confirms before unmatching from sidebar list', async () => {
    (globalThis as any).__removed = null;
    const { container, unmount } = renderElement(<MatchesSidebar />);
    try {
      await new Promise((r) => setTimeout(r, 0));
      // Click the unmatch icon button -> opens confirm dialog
      const btn = Array.from(container.querySelectorAll('button')).find((b: any) => b.getAttribute('aria-label') === 'Unmatch');
      expect(btn).toBeTruthy();
      await act(async () => { (btn as HTMLButtonElement).click(); });
      const dialog = container.querySelector('[data-testid="confirm-dialog"]') as HTMLElement;
      expect(dialog).toBeTruthy();
      const confirm = Array.from(dialog.querySelectorAll('button')).find((b: any) => b.textContent?.trim() === 'Unmatch');
      expect(confirm).toBeTruthy();
      await act(async () => { (confirm as HTMLButtonElement).click(); });
      expect((globalThis as any).__removed).toBe('SideA');
    } finally {
      unmount();
    }
  });
});
