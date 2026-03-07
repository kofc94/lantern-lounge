import clsx from 'clsx';

/**
 * Reusable Button component with multiple variants
 * Replaces .cta-button, .btn-primary, .btn-secondary, .btn-danger, etc.
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'font-semibold transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-lg hover:shadow-xl hover:-translate-y-1 focus:ring-primary',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 hover:shadow-md focus:ring-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg focus:ring-red-500',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
    ghost: 'hover:bg-gray-100 text-gray-900 focus:ring-gray-400',
    cta: 'bg-primary hover:bg-primary-hover text-white px-10 py-4 rounded-full font-semibold uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-1 focus:ring-primary',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const widthClasses = fullWidth ? 'w-full' : '';

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none'
    : 'cursor-pointer';

  // CTA variant has its own sizing
  const appliedSizeClasses = variant === 'cta' ? '' : sizeClasses[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        appliedSizeClasses,
        widthClasses,
        disabledClasses,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
