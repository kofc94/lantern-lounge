import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

/**
 * Reusable Modal component
 * Handles sign-in, sign-up, event modals, etc.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  theme = 'dark', // 'dark' or 'vintage'
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const themeClasses = {
    dark: 'bg-dark-light border-gray-700 text-white',
    vintage: 'bg-neutral-paper border-stone-200 text-neutral-dark',
  };

  const titleClasses = {
    dark: 'text-white',
    vintage: 'text-neutral-dark',
  };

  const closeButtonClasses = {
    dark: 'text-gray-400 hover:text-white',
    vintage: 'text-stone-400 hover:text-primary',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={clsx(
          'rounded-sm shadow-2xl w-full transform transition-all border relative overflow-hidden',
          theme === 'dark' ? themeClasses.dark : themeClasses.vintage,
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {theme === 'vintage' && (
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-grain mix-blend-multiply" />
        )}

        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between p-6 border-b relative z-10',
          theme === 'dark' ? 'border-gray-700' : 'border-stone-200'
        )}>
          <h2 className={clsx(
            'text-2xl font-display font-bold',
            theme === 'dark' ? titleClasses.dark : titleClasses.vintage
          )}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className={clsx(
              'transition-colors text-3xl leading-none',
              theme === 'dark' ? closeButtonClasses.dark : closeButtonClasses.vintage
            )}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 relative z-10">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
