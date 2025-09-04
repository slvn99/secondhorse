import React from 'react';
import { vi } from 'vitest';
import { act } from 'react';
import { TFH_STORAGE } from '@/lib/tfh';

// Mock next/image to a plain img for DOM/jest-style testing
vi.mock('next/image', () => {
  return {
    __esModule: true,
    default: (props: any) => React.createElement('img', { ...props }),
  };
});

// Simple helpers to render/unmount without testing-library
export function renderElement(el: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const { createRoot } = require('react-dom/client');
  const root = createRoot(container);
  act(() => { root.render(el); });
  return {
    container,
    root,
    unmount() {
      try { act(() => { root.unmount(); }); } catch {}
      container.remove();
    },
  } as const;
}

// Stable RNG seed for deterministic matching in tests
try { localStorage.setItem(TFH_STORAGE.SEED, 'test-seed'); } catch {}

// Tell React we are in an act-capable environment to silence warnings
// See: https://react.dev/reference/react/act
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
