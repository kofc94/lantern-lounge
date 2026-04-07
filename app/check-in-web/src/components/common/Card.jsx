import clsx from 'clsx';

/**
 * Reusable Card component with multiple variants
 * Replaces .feature-card, .benefit-item, .perk-item, .membership-card, .event-card
 */
const Card = ({
  children,
  variant = 'default',
  hover = true,
  onClick,
  imageUrl,
  imageAlt = '',
  className = '',
  ...props
}) => {
  const baseClasses = 'bg-dark-card rounded-lg shadow-lg transition-all duration-300';

  const variantClasses = {
    default: 'p-8',
    feature: 'p-8 text-center',
    event: 'p-6',
    membership: 'p-8 border-2 border-gray-700',
  };

  const hoverClasses = hover ? 'hover:transform hover:-translate-y-2 hover:shadow-xl' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      onClick={onClick}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        hoverClasses,
        clickableClasses,
        className
      )}
      {...props}
    >
      {imageUrl && (
        <div className="mb-6">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}
      {children}
    </div>
  );
};

// Subcomponents for composable card structure
Card.Header = ({ children, className = '' }) => (
  <div className={clsx('mb-4', className)}>{children}</div>
);

Card.Body = ({ children, className = '' }) => (
  <div className={clsx('mb-4', className)}>{children}</div>
);

Card.Footer = ({ children, className = '' }) => (
  <div className={clsx('mt-6', className)}>{children}</div>
);

export default Card;
