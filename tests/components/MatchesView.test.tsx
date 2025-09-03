import React from 'react';
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { renderElement } from '../setup';
import MatchesView from '@/app/_components/MatchesView';
import type { Horse } from '@/lib/horses';

const h = (name: string): Horse => ({
  name,
  age: 5,
  breed: 'Breed',
  location: 'Loc',
  gender: 'Gelding',
  heightCm: 150,
  color: 'Bay',
  temperament: 'Calm',
  disciplines: [],
  description: '',
  interests: [],
  image: '/TFH/Tinder-for-Horses-cover-image.png',
});

describe('MatchesView', () => {
  it('confirms before unmatching from card', async () => {
    let removed: string | null = null;
    const onRemove = (name: string) => { removed = name; };
    const { container, unmount } = renderElement(<MatchesView matches={[h('Alpha')]} onRemove={onRemove} />);
    try {
      await new Promise((r) => setTimeout(r, 0));
      const btn = Array.from(container.querySelectorAll('button')).find((b: any) => b.textContent?.trim() === 'Unmatch');
      expect(btn).toBeTruthy();
      // Click and expect confirm dialog
      await act(async () => { (btn as HTMLButtonElement).click(); });
      const dialog = container.querySelector('[data-testid="confirm-dialog"]') as HTMLElement;
      expect(dialog).toBeTruthy();
      const confirm = Array.from(dialog.querySelectorAll('button')).find((b: any) => b.textContent?.trim() === 'Unmatch');
      expect(confirm).toBeTruthy();
      await act(async () => { (confirm as HTMLButtonElement).click(); });
      expect(removed).toBe('Alpha');
    } finally {
      unmount();
    }
  });
});
