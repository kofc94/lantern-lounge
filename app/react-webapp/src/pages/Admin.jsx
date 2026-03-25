import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchUsers, updateUserRole } from '../services/api';
import Button from '../components/common/Button';
import clsx from 'clsx';

/**
 * Admin Page - User management and profile role assignment
 */
const Admin = () => {
  const { getToken, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [paginationToken, setPaginationToken] = useState(null);
  const [nextPaginationToken, setNextPaginationToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null); // username of user being updated
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadUsers = async (token = null) => {
    try {
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
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const handleUpdate = async (username, currentProfile, action, value) => {
    try {
      setIsUpdating(username);
      setError(null);
      setSuccess(null);
      const authToken = await getToken();

      let newProfile = currentProfile;

      if (action === 'toggle_admin') {
        newProfile = value ? 'admin' : 'member'; // If removing admin, default back to member
      } else if (action === 'set_membership') {
        newProfile = value;
      }

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
                <th className="px-6 py-4 text-center text-xs font-mono text-[#a69681] uppercase tracking-[0.2em] font-bold">Admin</th>
                <th className="px-6 py-4 text-center text-xs font-mono text-[#a69681] uppercase tracking-[0.2em] font-bold">Membership</th>
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
                users.map((user) => {
                  const isUserAdmin = user.profile === 'admin';
                  const isMember = user.profile === 'member';
                  const isLimited = user.profile === 'limited';

                  return (
                    <tr key={user.username} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-serif text-neutral-dark font-bold">{user.name || 'Anonymous'}</div>
                        <div className="text-xs font-mono text-stone-400">{user.username}</div>
                      </td>
                      <td className="px-6 py-5 text-stone-600 font-serif">{user.email}</td>
                      
                      {/* Admin Column */}
                      <td className="px-6 py-5 text-center">
                        <div className="flex justify-center">
                          <input 
                            type="checkbox"
                            checked={isUserAdmin}
                            onChange={(e) => handleUpdate(user.username, user.profile, 'toggle_admin', e.target.checked)}
                            disabled={isUpdating === user.username}
                            className="w-5 h-5 accent-primary border-stone-300 rounded focus:ring-primary cursor-pointer"
                          />
                        </div>
                      </td>

                      {/* Membership Column */}
                      <td className="px-6 py-5">
                        <div className="flex justify-center items-center space-x-6">
                          <label className="flex items-center space-x-2 cursor-pointer group">
                            <input 
                              type="radio"
                              name={`membership-${user.username}`}
                              value="limited"
                              checked={isLimited}
                              onChange={() => handleUpdate(user.username, user.profile, 'set_membership', 'limited')}
                              disabled={isUpdating === user.username || isUserAdmin}
                              className="w-4 h-4 accent-stone-800 border-stone-300 focus:ring-stone-800 cursor-pointer"
                            />
                            <span className={clsx(
                              "text-xs font-mono uppercase tracking-widest transition-colors",
                              isLimited ? "text-stone-900 font-bold" : "text-stone-400 group-hover:text-stone-600"
                            )}>Limited</span>
                          </label>

                          <label className="flex items-center space-x-2 cursor-pointer group">
                            <input 
                              type="radio"
                              name={`membership-${user.username}`}
                              value="member"
                              checked={isMember}
                              onChange={() => handleUpdate(user.username, user.profile, 'set_membership', 'member')}
                              disabled={isUpdating === user.username || isUserAdmin}
                              className="w-4 h-4 accent-stone-800 border-stone-300 focus:ring-stone-800 cursor-pointer"
                            />
                            <span className={clsx(
                              "text-xs font-mono uppercase tracking-widest transition-colors",
                              isMember ? "text-stone-900 font-bold" : "text-stone-400 group-hover:text-stone-600"
                            )}>Member</span>
                          </label>
                          
                          {isUpdating === user.username && (
                            <span className="absolute right-4 text-[8px] font-mono text-stone-400 animate-pulse uppercase">Syncing...</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
