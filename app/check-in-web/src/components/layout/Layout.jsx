import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import AuthModal from '../auth/AuthModal';
import Button from '../common/Button';
import GlobalError from '../common/GlobalError';

const Layout = ({ children }) => {
  const { user, isAuthenticated, signOut, isAdmin } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark text-white font-sans">
      <nav className="bg-dark-light border-b border-white/5">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-display font-bold text-lantern-gold tracking-tight leading-none">
            Lantern Lounge{' '}
            <span className="text-white/50 font-normal text-sm uppercase tracking-widest font-sans">
              Check-In
            </span>
          </span>

          <div>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-none">{user?.name}</p>
                  <p className="text-[10px] text-lantern-gold/60 uppercase tracking-widest mt-0.5">
                    {isAdmin ? 'Administrator' : 'Staff'}
                  </p>
                </div>
                <Button onClick={signOut} variant="ghost" size="sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsAuthModalOpen(true)} variant="outline" size="sm">
                Staff Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <GlobalError />
    </div>
  );
};

export default Layout;
