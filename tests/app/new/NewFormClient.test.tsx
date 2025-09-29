import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { fireEvent } from '@testing-library/react';
import NewFormClient from '@/app/new/NewFormClient';
import { renderElement } from '../../setup';

describe('NewFormClient', () => {
  it('falls back when smooth scroll options are unsupported', async () => {
    const originalScrollTo = window.scrollTo;
    const scrollSpy = vi.fn<(arg: ScrollToOptions | number, y?: number) => void>((arg: ScrollToOptions | number) => {
      if (typeof arg === 'object' && arg !== null) {
        throw new Error('options not supported');
      }
    });
    (window as any).scrollTo = scrollSpy as any;

    const TestForm = () => (
      <>
        <div id="tfh-step-indicator" />
        <div id="tfh-form-error" className="hidden" />
        <form id="tfh-new-form">
          <div id="tfh-step-1">
            <input name="display_name" defaultValue="" />
            <button type="button" id="tfh-next-step">Add photos</button>
          </div>
          <div id="tfh-step-2" className="hidden">
            <button type="button" id="tfh-prev-step">Back</button>
            <button type="submit" id="tfh-save-btn">
              <span data-label>Save</span>
              <span data-spinner />
            </button>
          </div>
        </form>
      </>
    );

    const { container, unmount } = renderElement(
      <>
        <TestForm />
        <NewFormClient />
      </>
    );

    try {
      const form = container.querySelector('#tfh-new-form') as HTMLFormElement;
      await vi.waitFor(() => {
        expect(form.getAttribute('aria-busy')).toBe('false');
      });

      const nextBtn = container.querySelector('#tfh-next-step') as HTMLButtonElement;
      expect(() => fireEvent.click(nextBtn)).not.toThrow();

      expect(scrollSpy).toHaveBeenCalled();
      const fallbackCall = scrollSpy.mock.calls.some(([first]) => typeof first === 'number');
      expect(fallbackCall).toBe(true);

      const errBox = container.querySelector('#tfh-form-error') as HTMLElement;
      expect(errBox.classList.contains('hidden')).toBe(false);
    } finally {
      unmount();
      window.scrollTo = originalScrollTo;
    }
  });
});
