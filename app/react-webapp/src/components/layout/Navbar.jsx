import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthModal from '../auth/AuthModal';
import clsx from 'clsx';

/**
 * Navbar component - replaces the navbar duplicated across 6 HTML files
 * Includes logo, navigation links, auth button, and mobile hamburger menu
 */
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const location = useLocation();
  const { currentUser, isAuthenticated, signOut, isAdmin } = useAuth();
  const dropdownRef = useRef(null);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/join-us', label: 'Join Us' },
    { path: '/events', label: 'Events' },
    { path: '/about', label: 'About' },
  ];

  if (isAdmin) {
    navLinks.push({ path: '/admin', label: 'Admin' });
  }

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleAuthButtonClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      setIsUserDropdownOpen(!isUserDropdownOpen);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleSignOut = async () => {
    setIsUserDropdownOpen(false);
    await signOut();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  // Determine user type
  const userType = isAdmin ? 'Administrator' : 'Club Member';

  return (
    <nav className="fixed top-0 w-full bg-dark/90 backdrop-blur-md z-50 border-b border-white/5">
      <div className="container-custom">
        <div className="flex justify-between items-center h-24">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="relative">
              <img
                src="/assets/logo-512.png"
                alt="Lantern Lounge Logo"
                className="h-14 w-14 object-contain transition-transform duration-500 group-hover:rotate-12"
              />
              <div className="absolute -inset-1 border border-accent-gold/20 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-2xl font-display font-bold tracking-tight">
                The <span className="text-accent-gold">Lantern</span> Lounge
              </span>
              <span className="text-gray-500 text-[10px] uppercase tracking-[0.2em] font-bold hidden md:block">
                Lexington, Massachusetts
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center space-x-2">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={clsx(
                    'px-5 py-2 rounded-sm transition-all duration-300 font-medium text-sm uppercase tracking-widest',
                    isActive(link.path)
                      ? 'text-accent-gold bg-accent-gold/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pl-6 ml-6 border-l border-white/10 relative" ref={dropdownRef}>
              <button
                onClick={handleAuthButtonClick}
                className="bg-primary hover:bg-primary-hover text-white rounded-sm px-8 py-3.5 text-sm font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(178,34,34,0.3)] active:scale-95 flex items-center gap-2"
              >
                {isAuthenticated
                  ? currentUser?.name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Account'
                  : 'Member Login'}
                {isAuthenticated && (
                  <span className={clsx("transition-transform duration-300", isUserDropdownOpen && "rotate-180")}>
                    ▾
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              {isAuthenticated && isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-neutral-paper shadow-2xl border border-stone-200 rounded-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="absolute inset-0 opacity-5 pointer-events-none bg-grain mix-blend-multiply" />
                  <div className="p-6 relative z-10">
                    <div className="mb-4 border-b border-stone-100 pb-4">
                      <p className="text-xs font-mono uppercase tracking-[0.2em] text-accent-gold mb-1">User Profile</p>
                      <p className="text-xl font-display font-bold text-neutral-dark truncate">
                        {currentUser?.name || 'Member'}
                      </p>
                      <p className="text-sm text-stone-500 truncate">{currentUser?.email}</p>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-1">Membership</p>
                      <div className="flex items-center gap-2">
                        <div className={clsx(
                          "w-2 h-2 rounded-full",
                          isAdmin ? "bg-primary" : "bg-accent-gold"
                        )} />
                        <span className="text-sm font-bold text-neutral-dark italic">
                          {userType}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="w-full bg-neutral-dark hover:bg-black text-white py-3 rounded-sm text-xs font-black uppercase tracking-[0.2em] transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </li>
          </ul>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={handleMobileMenuToggle}
            className="lg:hidden flex flex-col justify-center items-center w-10 h-10 space-y-1.5"
            aria-label="Toggle mobile menu"
          >
            <span
              className={clsx(
                'block w-6 h-0.5 bg-white transition-all duration-300',
                isMobileMenuOpen && 'rotate-45 translate-y-2'
              )}
            />
            <span
              className={clsx(
                'block w-6 h-0.5 bg-white transition-all duration-300',
                isMobileMenuOpen && 'opacity-0'
              )}
            />
            <span
              className={clsx(
                'block w-6 h-0.5 bg-white transition-all duration-300',
                isMobileMenuOpen && '-rotate-45 -translate-y-2'
              )}
            />
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={clsx(
            'lg:hidden transition-all duration-300 overflow-hidden bg-dark/95 backdrop-blur-xl',
            isMobileMenuOpen ? 'max-h-[32rem] pb-8' : 'max-h-0'
          )}
        >
          <ul className="space-y-4 pt-4 px-2">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'block px-6 py-4 rounded-sm transition-all duration-300 font-bold text-sm uppercase tracking-widest',
                    isActive(link.path)
                      ? 'text-accent-gold bg-accent-gold/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            
            {isAuthenticated && (
              <li className="px-6 py-4 border-t border-white/5 mt-4">
                <div className="flex flex-col gap-1 mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent-gold">Profile</span>
                  <span className="text-white font-display text-lg">{currentUser?.name}</span>
                  <span className="text-gray-500 text-xs italic">{userType}</span>
                </div>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-center px-6 py-4 rounded-sm bg-primary hover:bg-primary-hover text-white font-bold uppercase tracking-widest transition-all"
                >
                  Sign Out
                </button>
              </li>
            )}

            {!isAuthenticated && (
              <li className="px-2 mt-4">
                <button
                  onClick={(e) => {
                    handleAuthButtonClick(e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-center px-6 py-4 rounded-sm bg-primary hover:bg-primary-hover text-white font-bold uppercase tracking-widest transition-all"
                >
                  Member Login
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
};

export default Navbar;
