import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from './App';
import useAuth from './hooks/useAuth';

// Mock dependencies
vi.mock('./hooks/useAuth');
vi.mock('./components/layout/Layout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>
}));
vi.mock('./pages/CheckIn', () => ({
  default: () => <div data-testid="check-in-page">Check In Page</div>
}));

// We need to mock AuthProvider to just render children so we can control useAuth
vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state in ProtectedRoute', () => {
    useAuth.mockReturnValue({ loading: true });
    const { container } = render(<App />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders access denied when not staff', () => {
    useAuth.mockReturnValue({ loading: false, isAuthenticated: true, isStaff: false });
    const { getByText } = render(<App />);
    expect(getByText(/Staff Access/i)).toBeInTheDocument();
    expect(getByText(/Required/i)).toBeInTheDocument();
  });

  it('renders CheckIn page when authenticated as staff', () => {
    useAuth.mockReturnValue({ loading: false, isAuthenticated: true, isStaff: true });
    const { getByTestId } = render(<App />);
    expect(getByTestId('check-in-page')).toBeInTheDocument();
  });
});
