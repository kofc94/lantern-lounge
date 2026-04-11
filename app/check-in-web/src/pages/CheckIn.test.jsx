import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CheckIn from './CheckIn';
import useAuth from '../hooks/useAuth';
import { checkInUser, recordGuests } from '../services/api';

// Mock dependencies
vi.mock('../hooks/useAuth');
vi.mock('../services/api');
vi.mock('react-qr-barcode-scanner', () => ({
  default: () => <div data-testid="barcode-scanner">Scanner</div>
}));

describe('CheckIn Page', () => {
  const mockGetToken = vi.fn().mockResolvedValue('fake-token');
  const mockSetGlobalError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      isStaff: true,
      getToken: mockGetToken,
      setGlobalError: mockSetGlobalError,
    });
  });

  it('renders scanner by default for staff', () => {
    const { getByTestId, getByText } = render(<CheckIn />);
    expect(getByTestId('barcode-scanner')).toBeInTheDocument();
    expect(getByText(/Please scan your Wallet Pass/i)).toBeInTheDocument();
  });

  it('denies access to non-staff', () => {
    useAuth.mockReturnValue({ isStaff: false });
    const { getByText } = render(<CheckIn />);
    expect(getByText('Access Denied')).toBeInTheDocument();
  });

  it('handles manual email check-in', async () => {
    const { getByText, getByPlaceholderText } = render(<CheckIn />);
    
    // Switch to manual entry
    fireEvent.click(getByText('Sign-in with email instead'));
    
    const emailInput = getByPlaceholderText('member@example.com');
    fireEvent.change(emailInput, { target: { value: 'member@example.com' } });
    
    const mockCheckInResult = {
      id: 'ulid-123',
      userName: 'Member Name',
      timestamp: new Date().toISOString()
    };
    checkInUser.mockResolvedValueOnce(mockCheckInResult);

    fireEvent.click(getByText('Verify & Check In'));

    await waitFor(() => {
      expect(getByText('Welcome Member!')).toBeInTheDocument();
      expect(getByText(/Having some friends/i)).toBeInTheDocument();
    });
  });

  it('handles guest submission', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(<CheckIn />);
    
    // Setup state at guest step
    fireEvent.click(getByText('Sign-in with email instead'));
    checkInUser.mockResolvedValueOnce({ id: 'ulid-123', userName: 'Member' });
    fireEvent.change(getByPlaceholderText('member@example.com'), { target: { value: 'm@ex.com' } });
    fireEvent.click(getByText('Verify & Check In'));

    await waitFor(() => expect(getByText(/Having some friends/i)).toBeInTheDocument());

    // Add a guest
    fireEvent.change(getByPlaceholderText('Full name'), { target: { value: 'Guest One' } });
    fireEvent.change(getByPlaceholderText('Email'), { target: { value: 'guest@ex.com' } });

    recordGuests.mockResolvedValueOnce({ 
      id: 'ulid-123', 
      guests: [{ name: 'Guest One', email: 'guest@ex.com', visitCount: 1 }] 
    });

    fireEvent.click(getByText('Submit & Finish'));

    await waitFor(() => {
      expect(recordGuests).toHaveBeenCalled();
      // Should return to scanner on success with no warnings
      expect(getByTestId('barcode-scanner')).toBeInTheDocument();
    });
  });

  it('displays warnings when guests reach visit limit', async () => {
    const { getByText, getByPlaceholderText } = render(<CheckIn />);
    
    // Advance to guests step
    fireEvent.click(getByText('Sign-in with email instead'));
    checkInUser.mockResolvedValueOnce({ id: 'ulid-123', userName: 'Member' });
    fireEvent.change(getByPlaceholderText('member@example.com'), { target: { value: 'm@ex.com' } });
    fireEvent.click(getByText('Verify & Check In'));

    await waitFor(() => expect(getByText(/Having some friends/i)).toBeInTheDocument());

    // High visit count guest
    fireEvent.change(getByPlaceholderText('Full name'), { target: { value: 'Frequent Guest' } });
    fireEvent.change(getByPlaceholderText('Email'), { target: { value: 'frequent@ex.com' } });

    recordGuests.mockResolvedValueOnce({ 
      id: 'ulid-123', 
      guests: [{ name: 'Frequent Guest', email: 'frequent@ex.com', visitCount: 4 }] 
    });

    fireEvent.click(getByText('Submit & Finish'));

    await waitFor(() => {
      expect(getByText('Member Invitation')).toBeInTheDocument();
      expect(getByText(/Visit #4 — Time to Join!/i)).toBeInTheDocument();
    });
  });
});
