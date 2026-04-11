import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Layout from './Layout';
import useAuth from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth');
vi.mock('../auth/AuthModal', () => ({
  default: ({ isOpen }) => isOpen ? <div data-testid="auth-modal">Auth Modal</div> : null
}));

describe('Layout Component', () => {
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children and login button when unauthenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      signOut: mockSignOut,
      isAdmin: false
    });

    const { getByText } = render(<Layout>Content</Layout>);
    expect(getByText('Content')).toBeInTheDocument();
    expect(getByText('Staff Login')).toBeInTheDocument();
  });

  it('renders user name and sign out button when authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: 'Staff Member' },
      signOut: mockSignOut,
      isAdmin: false
    });

    const { getByText } = render(<Layout>Content</Layout>);
    expect(getByText('Staff Member')).toBeInTheDocument();
    expect(getByText('Sign Out')).toBeInTheDocument();
  });

  it('calls signOut when sign out button is clicked', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: 'Staff Member' },
      signOut: mockSignOut,
      isAdmin: false
    });

    const { getByText } = render(<Layout>Content</Layout>);
    fireEvent.click(getByText('Sign Out'));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('opens auth modal when staff login is clicked', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      signOut: mockSignOut,
      isAdmin: false
    });

    const { getByText, getByTestId } = render(<Layout>Content</Layout>);
    fireEvent.click(getByText('Staff Login'));
    expect(getByTestId('auth-modal')).toBeInTheDocument();
  });
});
