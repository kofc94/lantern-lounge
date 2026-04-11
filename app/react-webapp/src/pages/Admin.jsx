import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchUsers, updateUserRole } from '../services/api';
import Button from '../components/common/Button';
import clsx from 'clsx';

/**
 * Admin Page - User management and profile role assignment
 */
const Admin = () => {
  const { getToken, isAdmin, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [paginationToken, setPaginationToken] = useState(null);
  const [nextPaginationToken, setNextPaginationToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null); // username of user being updated
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const isFetching = useRef(false);

  const loadUsers = async (token = null) => {
    if (isFetching.current) return;
    
    try {
      isFetching.current = true;
      setIsLoading(true);
      setError(null);
      const authToken = await getToken();
      const data = await fetchUsers(authToken, token);
      setUsers(data.users);
      setNextPaginationToken(data.paginationToken);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    if (isAdmin && !authLoading) {
      loadUsers();
    }
  }, [isAdmin, authLoading]);

  const handleUpdate = async (username, newProfile) => {
    try {
      setIsUpdating(username);
      setError(null);
      setSuccess(null);
      const authToken = await getToken();

      await updateUserRole(username, newProfile, authToken);

      setSuccess(`User status updated to ${newProfile}.`);
      // Refresh user list to show new profile
      await loadUsers(paginationToken);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    } finally {
      setIsUpdating(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-serif text-neutral-dark mb-4">Access Denied</h1>
        <p className="text-stone-600">You must have administrator privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-5xl font-serif text-neutral-dark mb-4 tracking-tight">
          Registry <span className="text-stone-400 font-light italic">Management</span>
        </h1>
        <p className="text-stone-600 max-w-2xl font-serif italic text-lg border-l-2 border-primary/30 pl-6 py-2 bg-stone-50/50">
          Manage member status and administrative privileges for the Lantern Lounge community.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-8 p-4 bg-green-500/10 border border-green-500/50 rounded-sm text-green-700 font-medium">
          {success}
        </div>
      )}

      <div className="bg-white border border-[#dcd1bc] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#dcd1bc]">
            <thead className="bg-[#f9f3e9]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-mono text-[#a69681] uppercase tracking-[0.2em] font-bold">User</th>
                <th className="px-6 py-4 text-left text-xs font-mono text-[#a69681] uppercase tracking-[0.2em] font-bold">Email</th>
                <th className="px-6 py-4 text-left text-xs font-mono text-[#a69681] uppercase tracking-[0.2em] font-bold">Joined</th>
                <th className="px-6 py-4 text-center text-xs font-mono text-[#a69681] uppercase tracking-[0.2em] font-bold">Registry Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-[#fffcf7]">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-stone-400 italic">Consulting the archives...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-stone-400 italic">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.username} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-serif text-neutral-dark font-bold">{user.name || 'Anonymous'}</div>
                      <div className="text-xs font-mono text-stone-400">{user.username}</div>
                    </td>
                    <td className="px-6 py-5 text-stone-600 font-serif">{user.email}</td>
                    <td className="px-6 py-5">
                      <div className="text-xs font-mono text-stone-500 uppercase">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex justify-center items-center space-x-8">
                        {['limited', 'member', 'admin'].map((role) => (
                          <label key={role} className="flex items-center space-x-2 cursor-pointer group">
                            <input
                              type="radio"
                              name={`role-${user.username}`}
                              value={role}
                              checked={user.profile === role}
                              onChange={() => handleUpdate(user.username, role)}
                              disabled={isUpdating === user.username}
                              className={clsx(
                                "w-4 h-4 border-stone-300 focus:ring-offset-0 cursor-pointer",
                                role === 'admin' ? "accent-red-600" : "accent-stone-800"
                              )}
                            />
                            <span className={clsx(
                              "text-xs font-mono uppercase tracking-widest transition-colors",
                              user.profile === role
                                ? (role === 'admin' ? "text-red-700 font-bold" : "text-stone-900 font-bold")
                                : "text-stone-400 group-hover:text-stone-600"
                            )}>
                              {role}
                            </span>
                          </label>
                        ))}

                        {isUpdating === user.username && (
                          <span className="absolute right-4 text-[8px] font-mono text-stone-400 animate-pulse uppercase">Syncing...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(nextPaginationToken || paginationToken) && (
          <div className="px-6 py-4 bg-[#f9f3e9] border-t border-[#dcd1bc] flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              disabled={!paginationToken || isLoading}
              onClick={() => {
                loadUsers();
                setPaginationToken(null);
              }}
              className="!border-[#c5b8a5] !text-[#6d5d4d]"
            >
              First Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!nextPaginationToken || isLoading}
              onClick={() => {
                setPaginationToken(nextPaginationToken);
                loadUsers(nextPaginationToken);
              }}
              className="!border-[#c5b8a5] !text-[#6d5d4d]"
            >
              Next Archive &rarr;
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
