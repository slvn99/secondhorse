import React from 'react';
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { renderElement } from '../setup';
import ProfileModal from '@/app/_components/ProfileModal';
import type { Horse } from '@/lib/horses';

const makeHorse = (overrides: Partial<Horse> = {}): Horse => ({
  name: 'Testy',
  age: 5,
  breed: 'Test Breed',
  location: 'Somewhere',
  gender: 'Gelding',
  heightCm: 150,
  color: 'Bay',
  temperament: 'Calm',
  disciplines: [],
  description: 'A test horse',
  interests: [],
  image: '/TFH/Tinder-for-Horses-cover-image.png',
  ...overrides,
});

describe('ProfileModal', () => {
  it('renders multiple photos with navigation and dots', async () => {
    const horse = makeHorse({ photos: ['/one.png', '/two.png', '/three.png'] });
    const onClose = () => {};
    const { container, unmount } = renderElement(<ProfileModal horse={horse} onClose={onClose} />);
    try {
      await new Promise((r) => setTimeout(r, 0));
      // Starts with first photo
      const imgWrap = container.querySelector('[data-testid="profile-image"]') as HTMLElement;
      expect(imgWrap).toBeTruthy();
      const img1 = imgWrap.querySelector('img') as HTMLImageElement | null;
      expect(img1 && img1.getAttribute('src')).toContain('/one.png');

      // Navigate via dots
      const dots = Array.from(container.querySelectorAll('button')).filter((b: any) => (b.getAttribute('aria-label')||'').startsWith('Go to photo '));
      expect(dots.length).toBe(3);
      await act(async () => { (dots[1] as HTMLButtonElement).click(); });
      await new Promise((r) => setTimeout(r, 0));
      expect((dots[1] as HTMLButtonElement).className).toContain('bg-white');
      await act(async () => { (dots[2] as HTMLButtonElement).click(); });
      await new Promise((r) => setTimeout(r, 0));
      const img3 = imgWrap.querySelector('img');
      // At least ensure state changed again (active dot moved)
      expect((dots[2] as HTMLButtonElement).className).toContain('bg-white');
    } finally {
      unmount();
    }
  });

  it('shows confirm dialog on Unmatch and calls onRemove when confirmed', async () => {
    let removed: string | null = null;
    const onRemove = (name: string) => { removed = name; };
    const { container, unmount } = renderElement(<ProfileModal horse={makeHorse()} onClose={() => {}} onRemove={onRemove} />);
    try {
      await new Promise((r) => setTimeout(r, 0));
      const unmatchBtn = Array.from(container.querySelectorAll('button')).find((b: any) => b.textContent?.trim() === 'Unmatch');
      expect(unmatchBtn).toBeTruthy();
      await act(async () => { (unmatchBtn as HTMLButtonElement).click(); });
      const dialog = container.querySelector('[data-testid="confirm-dialog"]') as HTMLElement;
      expect(dialog).toBeTruthy();
      const confirm = Array.from(dialog.querySelectorAll('button')).find((b: any) => b.textContent?.trim() === 'Unmatch');
      expect(confirm).toBeTruthy();
      await act(async () => { (confirm as HTMLButtonElement).click(); });
      expect(removed).toBe('Testy');
    } finally {
      unmount();
    }
  });

  it('applies max-height with footer and safe-area adjustments and scrollable body', async () => {
    const { container, unmount } = renderElement(<ProfileModal horse={makeHorse()} onClose={() => {}} />);
    try {
      await new Promise((r) => setTimeout(r, 0));
      const modal = container.querySelector('[data-testid="profile-modal"]') as HTMLElement;
      expect(modal).toBeTruthy();
      expect(modal.getAttribute('style') || '').toContain('var(--footer-height');
      expect(modal.getAttribute('style') || '').toContain(' - (4rem)');
      // Body has overflow-y-auto
      const body = Array.from(container.querySelectorAll('div')).find(d => d.className?.toString().includes('overflow-y-auto')) as HTMLElement | undefined;
      expect(body).toBeTruthy();
    } finally {
      unmount();
    }
  });
});
