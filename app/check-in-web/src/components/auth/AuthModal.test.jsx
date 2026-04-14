import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AuthModal from './AuthModal';
import { useAuth } from '../../hooks/useAuth';
import { federatedSignIn } from '../../services/cognito';

// Mock dependencies
vi.mock('../../hooks/useAuth');
vi.mock('../../services/cognito');
vi.mock('../common/Modal', () => ({
  default: ({ children, isOpen, title }) => isOpen ? (
    <div data-testid="modal">
      <h1>{title}</h1>
      {children}
    </div>
  ) : null
}));

describe('AuthModal Component', () => {
  const mockSignIn = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ signIn: mockSignIn });
  });

  it('renders nothing when closed', () => {
    const { queryByTestId } = render(<AuthModal isOpen={false} onClose={mockOnClose} />);
    expect(queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders form when open', () => {
    const { getByLabelText, getByText } = render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    expect(getByText('Staff Sign In')).toBeInTheDocument();
    expect(getByLabelText(/Email/i)).toBeInTheDocument();
    expect(getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('handles successful email sign in', async () => {
    mockSignIn.mockResolvedValueOnce({ success: true });
    const { getByLabelText, getByRole } = render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    
    fireEvent.change(getByLabelText(/Email/i), { target: { value: 'staff@example.com' } });
    fireEvent.change(getByLabelText(/Password/i), { target: { value: 'password' } });
    
    await act(async () => {
      fireEvent.submit(getByRole('button', { name: /Sign In/i }));
    });

    expect(mockSignIn).toHaveBeenCalledWith('staff@example.com', 'password');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays error on failed sign in', async () => {
    mockSignIn.mockResolvedValueOnce({ success: false, error: 'Invalid credentials' });
    const { getByLabelText, getByRole, getByText } = render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    
    await act(async () => {
      fireEvent.submit(getByRole('button', { name: /Sign In/i }));
    });

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('calls federatedSignIn when Google button is clicked', () => {
    const { getByText } = render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    fireEvent.click(getByText(/Continue with Google/i));
    expect(federatedSignIn).toHaveBeenCalledWith('Google');
  });
});
