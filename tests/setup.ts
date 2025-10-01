import React from 'react';
import { vi } from 'vitest';
import { act } from 'react';
import { render as rtlRender, cleanup } from '@testing-library/react';
import { TfhProvider, TFH_STORAGE } from '@/lib/tfh';

// Mock next/image to a plain img for DOM/jest-style testing
vi.mock('next/image', () => {
  return {
    __esModule: true,
    default: (props: any) => React.createElement('img', { ...props }),
  };
});

// Render helper backed by Testing Library
export function renderElement(el: React.ReactElement) {
  const r = rtlRender(React.createElement(TfhProvider, null, el));
  return {
    container: r.container,
    root: { unmount: r.unmount },
    unmount() { try { r.unmount(); } catch {} try { cleanup(); } catch {} },
  } as const;
}

// Stable RNG seed for deterministic matching in tests
try { localStorage.setItem(TFH_STORAGE.SEED, 'test-seed'); } catch {}

// Tell React we are in an act-capable environment to silence warnings
// See: https://react.dev/reference/react/act
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
