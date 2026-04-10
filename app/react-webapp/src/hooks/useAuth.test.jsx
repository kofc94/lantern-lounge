import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useAuth from './useAuth';
import { AuthContext } from '../contexts/AuthContext';

describe('useAuth hook', () => {
  it('returns context value when used within AuthProvider', () => {
    const mockContextValue = { isAuthenticated: true, user: { name: 'Test' } };
    
    // Render the hook within a test provider
    const wrapper = ({ children }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toEqual(mockContextValue);
  });

  it('throws an error when used outside of AuthProvider', () => {
    // Suppress console.error for expected throw
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });
});
