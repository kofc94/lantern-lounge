import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CheckIn from './CheckIn';
import useAuth from '../hooks/useAuth';
import { checkInUser, recordGuests } from '../services/api';

// Mock dependencies
vi.mock('../hooks/useAuth');
vi.mock('../services/api');

let mockOnUpdate;
vi.mock('react-qr-barcode-scanner', () => ({
  default: ({ onUpdate }) => {
    mockOnUpdate = onUpdate;
    return <div data-testid="barcode-scanner">Scanner</div>;
  }
}));

// Mock Haptics
vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    notification: vi.fn(),
    impact: vi.fn(),
  },
  NotificationType: { Success: 'SUCCESS', Error: 'ERROR' },
  ImpactStyle: { Heavy: 'HEAVY' },
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
    
    fireEvent.click(getByText('Sign-in with email instead'));
    
    const emailInput = getByPlaceholderText('member@example.com');
    fireEvent.change(emailInput, { target: { value: 'member@example.com' } });
    
    checkInUser.mockResolvedValueOnce({ id: 'ulid-1', userName: 'Member' });
    fireEvent.click(getByText('Verify & Check In'));

    await waitFor(() => {
      expect(getByText('Welcome Member!')).toBeInTheDocument();
    });
  });

  it('handles scanner updates with LL-CHECKIN prefix', async () => {
    render(<CheckIn />);
    
    checkInUser.mockResolvedValueOnce({ id: 'ulid-1', userName: 'Scanner User' });

    await act(async () => {
      mockOnUpdate(null, { text: 'LL-CHECKIN:test@example.com' });
    });

    await waitFor(() => {
      expect(checkInUser).toHaveBeenCalledWith('test@example.com', 'fake-token');
    });
  });

  it('handles raw email scanning', async () => {
    render(<CheckIn />);
    checkInUser.mockResolvedValueOnce({ id: 'ulid-1', userName: 'Email User' });

    await act(async () => {
      mockOnUpdate(null, { text: 'direct@example.com' });
    });

    await waitFor(() => {
      expect(checkInUser).toHaveBeenCalledWith('direct@example.com', 'fake-token');
    });
  });

  it('handles guest list submission and limit warnings', async () => {
    const { getByText, getByPlaceholderText } = render(<CheckIn />);
    
    fireEvent.click(getByText('Sign-in with email instead'));
    checkInUser.mockResolvedValueOnce({ id: 'ulid-1', userName: 'Member' });
    fireEvent.change(getByPlaceholderText('member@example.com'), { target: { value: 'm@ex.com' } });
    fireEvent.click(getByText('Verify & Check In'));

    await waitFor(() => expect(getByText(/Having some friends/i)).toBeInTheDocument());

    fireEvent.change(getByPlaceholderText('Full name'), { target: { value: 'Guest' } });
    fireEvent.change(getByPlaceholderText('Email'), { target: { value: 'g@ex.com' } });

    // Mock response with limit reached (visitCount 4)
    recordGuests.mockResolvedValueOnce({ 
      id: 'ulid-1', 
      guests: [{ name: 'Guest', email: 'g@ex.com', visitCount: 4 }] 
    });

    fireEvent.click(getByText('Submit & Finish'));

    await waitFor(() => {
      expect(getByText('Member Invitation')).toBeInTheDocument();
      expect(getByText(/Visit #4/i)).toBeInTheDocument();
    });
  });

  it('handles expired membership state', async () => {
    const { getByText, getByPlaceholderText } = render(<CheckIn />);
    fireEvent.click(getByText('Sign-in with email instead'));
    
    const expiredError = new Error('Membership expired');
    expiredError.code = 'membership_expired';
    expiredError.expiryDate = '2023-01-01';
    checkInUser.mockRejectedValueOnce(expiredError);

    fireEvent.change(getByPlaceholderText('member@example.com'), { target: { value: 'expired@ex.com' } });
    fireEvent.click(getByText('Verify & Check In'));

    await waitFor(() => {
      expect(getByText('Membership Expired')).toBeInTheDocument();
    });
  });

  it('handles 500 server errors', async () => {
    const { getByText, getByPlaceholderText } = render(<CheckIn />);
    fireEvent.click(getByText('Sign-in with email instead'));
    
    const serverError = new Error('Server Crash');
    serverError.status = 500;
    checkInUser.mockRejectedValueOnce(serverError);

    fireEvent.change(getByPlaceholderText('member@example.com'), { target: { value: 'fail@ex.com' } });
    fireEvent.click(getByText('Verify & Check In'));

    await waitFor(() => {
      expect(mockSetGlobalError).toHaveBeenCalledWith(serverError);
    });
  });
});
