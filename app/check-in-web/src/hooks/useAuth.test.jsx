import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAuth } from './useAuth';
import { AuthContext } from '../contexts/AuthContext';

describe('useAuth hook', () => {
  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this expected error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });

  it('returns auth properties from context', () => {
    const mockUser = { email: 'staff@example.com', groups: ['staff'] };
    const wrapper = ({ children }) => (
      <AuthContext.Provider value={{ currentUser: mockUser, isLoading: false, isAuthenticated: true }}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isStaff).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('correctly identifies admin users', () => {
    const mockUser = { email: 'admin@example.com', groups: ['admin'] };
    const wrapper = ({ children }) => (
      <AuthContext.Provider value={{ currentUser: mockUser, isLoading: false, isAuthenticated: true }}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isStaff).toBe(true);
  });
});
