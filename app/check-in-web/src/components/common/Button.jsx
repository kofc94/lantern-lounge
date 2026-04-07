import clsx from 'clsx';

const Button = ({
  children,
  variant = 'gold',
  size = 'md',
  fullWidth = false,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black rounded-sm';

  const variants = {
    // Primary action for the check-in UI — warm gold glow
    gold: 'bg-lantern-gold hover:bg-amber-400 text-black shadow-[0_0_12px_rgba(197,160,89,0.2)] hover:shadow-[0_0_24px_rgba(197,160,89,0.4)] focus:ring-lantern-gold',
    // Heritage red — used for admin/destructive actions
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-md hover:shadow-lg focus:ring-primary',
    // Subtle dark — for secondary/cancel actions on dark backgrounds
    secondary: 'bg-transparent border border-white/20 text-gray-300 hover:border-white/40 hover:text-white focus:ring-white/20',
    danger: 'bg-red-700 hover:bg-red-600 text-white focus:ring-red-500',
    outline: 'border border-lantern-gold/60 text-lantern-gold hover:border-lantern-gold hover:bg-lantern-gold/10 focus:ring-lantern-gold',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5 focus:ring-white/20',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
