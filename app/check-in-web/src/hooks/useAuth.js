import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Custom hook to access Auth Context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { currentUser, isLoading, isAuthenticated, ...rest } = context;

  // Derived properties for easier permission checks
  const groups = currentUser?.groups || [];
  const isAdmin = groups.includes('admin');
  const isStaff = groups.includes('staff') || isAdmin;

  return {
    currentUser,
    user: currentUser, // Alias for convenience
    isLoading,
    loading: isLoading, // Alias for convenience
    isAuthenticated,
    isAdmin,
    isStaff,
    groups,
    ...rest
  };
};

export default useAuth;
