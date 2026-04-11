import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GlobalError from './GlobalError';
import useAuth from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth');

describe('GlobalError Component', () => {
  const mockSetGlobalError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when there is no error', () => {
    useAuth.mockReturnValue({ globalError: null, setGlobalError: mockSetGlobalError });
    const { queryByText } = render(<GlobalError />);
    expect(queryByText('System Error')).not.toBeInTheDocument();
  });

  it('renders error message when provided as string', () => {
    useAuth.mockReturnValue({ 
      globalError: 'Something went wrong', 
      setGlobalError: mockSetGlobalError 
    });
    const { getByText } = render(<GlobalError />);
    expect(getByText('System Error')).toBeInTheDocument();
    expect(getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders error object with details', () => {
    useAuth.mockReturnValue({ 
      globalError: { message: 'Api Fail', details: 'Stack trace info' }, 
      setGlobalError: mockSetGlobalError 
    });
    const { getByText } = render(<GlobalError />);
    expect(getByText('Api Fail')).toBeInTheDocument();
    expect(getByText('Stack trace info')).toBeInTheDocument();
  });

  it('calls setGlobalError(null) when dismissed', () => {
    useAuth.mockReturnValue({ 
      globalError: 'Error', 
      setGlobalError: mockSetGlobalError 
    });
    const { getByText } = render(<GlobalError />);
    fireEvent.click(getByText('Dismiss'));
    expect(mockSetGlobalError).toHaveBeenCalledWith(null);
  });
});
