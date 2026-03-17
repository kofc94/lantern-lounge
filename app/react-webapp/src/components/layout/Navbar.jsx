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
            <li className="pl-6 ml-6 border-l border-white/10">
              <button
                onClick={handleAuthButtonClick}
                className="bg-primary hover:bg-primary-hover text-white rounded-sm px-8 py-3.5 text-sm font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(178,34,34,0.3)] active:scale-95"
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
