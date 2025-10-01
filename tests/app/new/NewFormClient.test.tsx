import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { fireEvent } from '@testing-library/react';
import NewFormClient from '@/app/new/NewFormClient';
import { renderElement } from '../../setup';

describe('NewFormClient (React version)', () => {
  it('requires display name before proceeding and updates step indicator', async () => {
    const action = vi.fn();
    const { container, unmount } = renderElement(<NewFormClient action={action as any} notice={null} />);
    try {
      // Should show step 1
      const stepIndicator = container.querySelector('#tfh-step-indicator');
      expect(stepIndicator?.textContent).toContain('Step 1 of 3');

      // Click Continue without a name
      const nextBtn = container.querySelector('#tfh-next-step-1') as HTMLButtonElement;
      fireEvent.click(nextBtn);
      // Error box should appear
      const err = container.querySelector('#tfh-form-error') as HTMLElement;
      expect(err).toBeTruthy();
      expect(err.textContent || '').toMatch(/display name/i);

      // Fill a display name and continue
      const nameInput = container.querySelector('input[name="display_name"]') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Shadowfax' } });
      fireEvent.blur(nameInput);
      fireEvent.click(nextBtn);
      expect((container.querySelector('#tfh-step-indicator') as HTMLElement).textContent).toContain('Step 2 of 3');
    } finally {
      unmount();
    }
  });
});
