import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock window.location
delete window.location;
window.location = {
  ...window.location,
  origin: 'http://localhost:5173',
  assign: vi.fn(),
  replace: vi.fn(),
};

// Suppress known expected errors in test output
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
     args[0].includes('Warning: An update to %s inside a test was not wrapped in act'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};
