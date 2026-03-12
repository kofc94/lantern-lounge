import { useState } from 'react';
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
  const location = useLocation();
  const { currentUser, isAuthenticated, signOut } = useAuth();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/join-us', label: 'Join Us' },
    { path: '/events', label: 'Events' },
    { path: '/about', label: 'About' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleAuthButtonClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      if (window.confirm('Sign out?')) {
        signOut();
      }
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-dark/95 backdrop-blur-sm z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <img
              src="/assets/logo-512.png"
              alt="Lantern Lounge Logo"
              className="h-12 w-12 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-white text-xl font-display font-bold">
                The Lantern Lounge
              </span>
              <span className="text-gray-400 text-sm hidden md:block">
                177 Bedford St, Lexington MA 02420
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={clsx(
                    'px-4 py-2 rounded-lg transition-all duration-200 font-medium',
                    isActive(link.path)
                      ? 'text-primary bg-primary/10'
                      : 'text-white hover:text-primary hover:bg-primary/5'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={handleAuthButtonClick}
                className="ml-4 bg-primary hover:bg-primary-hover text-white rounded-full px-6 py-3 font-medium transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg"
              >
                {isAuthenticated
                  ? currentUser?.name?.split(' ')[0] || currentUser?.email || 'Account'
                  : 'Member Login'}
              </button>
            </li>
          </ul>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={handleMobileMenuToggle}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 space-y-1.5"
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
            'md:hidden transition-all duration-300 overflow-hidden',
            isMobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
          )}
        >
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'block px-4 py-3 rounded-lg transition-all duration-200 font-medium',
                    isActive(link.path)
                      ? 'text-primary bg-primary/10'
                      : 'text-white hover:text-primary hover:bg-primary/5'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={(e) => {
                  handleAuthButtonClick(e);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-all"
              >
                {isAuthenticated
                  ? currentUser?.name?.split(' ')[0] || currentUser?.email || 'Account'
                  : 'Member Login'}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
};

export default Navbar;
