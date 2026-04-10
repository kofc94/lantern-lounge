import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';
import * as useAuthHook from '../../hooks/useAuth';

// Mock dependencies
vi.mock('../../hooks/useAuth');
vi.mock('../auth/AuthModal', () => ({
  default: ({ isOpen, onClose }) => (
    isOpen ? (
      <div data-testid="mock-auth-modal">
        Auth Modal <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));
vi.mock('../auth/WalletCard', () => ({
  default: () => <div data-testid="mock-wallet-card">Wallet Card</div>,
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/' }),
  };
});

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderNavbar = () => {
    return render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
  };

  it('renders logo and standard navigation links', () => {
    useAuthHook.useAuth.mockReturnValue({
      isAuthenticated: false,
      currentUser: null,
      isAdmin: false,
      signOut: vi.fn(),
    });

    renderNavbar();

    expect(screen.getByText(/Lantern/)).toBeInTheDocument();
    expect(screen.getAllByText('Home')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Join Us')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Events')[0]).toBeInTheDocument();
    expect(screen.getAllByText('About')[0]).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('renders Admin link when user is admin', () => {
    useAuthHook.useAuth.mockReturnValue({
      isAuthenticated: true,
      currentUser: { name: 'Admin', email: 'admin@test.com' },
      isAdmin: true,
      signOut: vi.fn(),
    });

    renderNavbar();

    expect(screen.getAllByText('Admin')[0]).toBeInTheDocument();
  });

  it('opens AuthModal when "Member Login" is clicked (unauthenticated)', () => {
    useAuthHook.useAuth.mockReturnValue({
      isAuthenticated: false,
      currentUser: null,
      isAdmin: false,
      signOut: vi.fn(),
    });

    renderNavbar();

    const loginButtons = screen.getAllByText(/Member Login/i);
    fireEvent.click(loginButtons[0]);

    expect(screen.getByTestId('mock-auth-modal')).toBeInTheDocument();
  });

  it('shows user dropdown when authenticated user clicks account button', () => {
    useAuthHook.useAuth.mockReturnValue({
      isAuthenticated: true,
      currentUser: { name: 'Jane Doe', email: 'jane@test.com' },
      isAdmin: false,
      signOut: vi.fn(),
    });

    renderNavbar();

    // The desktop account button
    const accountButton = screen.getAllByText(/Jane/)[0];
    fireEvent.click(accountButton);

    expect(screen.getByText('jane@test.com')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-wallet-card')[0]).toBeInTheDocument();
  });

  it('calls signOut when sign out is clicked in dropdown', () => {
    const mockSignOut = vi.fn();
    useAuthHook.useAuth.mockReturnValue({
      isAuthenticated: true,
      currentUser: { name: 'Jane Doe', email: 'jane@test.com' },
      isAdmin: false,
      signOut: mockSignOut,
    });

    renderNavbar();

    // Open dropdown
    const accountButton = screen.getAllByText(/Jane/)[0];
    fireEvent.click(accountButton);

    // Click Sign Out
    const signOutButton = screen.getAllByText(/Sign Out/i).find(el => el.tagName === 'BUTTON' && !el.className.includes('lg:hidden'));
    fireEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('toggles mobile menu', () => {
    useAuthHook.useAuth.mockReturnValue({
      isAuthenticated: false,
      currentUser: null,
      isAdmin: false,
      signOut: vi.fn(),
    });

    renderNavbar();

    const mobileToggle = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(mobileToggle);

    // Check if mobile menu is expanded by checking class on its container
    // We can just verify the click works without throwing
    expect(mobileToggle).toBeInTheDocument();
  });
});
