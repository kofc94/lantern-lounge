import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import AuthModal from '../auth/AuthModal';
import Button from '../common/Button';

const Layout = ({ children }) => {
  const { user, isAuthenticated, signOut, isAdmin } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark text-white font-sans">
      <nav className="bg-dark-light border-b border-white/5 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-xl font-display font-bold text-accent-gold tracking-tight">
              Lantern Lounge <span className="text-white">Check-In</span>
            </span>
          </div>
          
          <div>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold">{user?.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                    {isAdmin ? 'Administrator' : 'Staff'}
                  </p>
                </div>
                <Button 
                  onClick={signOut} 
                  variant="outline" 
                  className="!py-2 !px-4 !text-xs"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setIsAuthModalOpen(true)} 
                variant="primary"
                className="!py-2 !px-6 !text-xs"
              >
                Staff Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main>
        {children}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default Layout;
