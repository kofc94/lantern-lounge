import clsx from 'clsx';

/**
 * Reusable FormGroup component
 * Handles input, textarea, select, checkbox fields with consistent styling
 */
const FormGroup = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  helperText = '',
  disabled = false,
  rows = 4,
  options = [], // For select fields
  className = '',
  theme = 'dark', // 'dark' or 'vintage'
  ...props
}) => {
  const inputBaseClasses = clsx(
    'w-full px-4 py-3 rounded-sm border transition-all duration-200',
    theme === 'dark' ? 'bg-dark text-white border-gray-600' : 'bg-white text-neutral-dark border-stone-300'
  );
  
  const inputFocusClasses = theme === 'dark' 
    ? 'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
    : 'focus:outline-none focus:ring-2 focus:ring-accent-gold/50 focus:border-accent-gold';

  const inputErrorClasses = error ? 'border-red-500' : '';
  const inputDisabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const renderInput = () => {
    const commonClasses = clsx(
      inputBaseClasses,
      inputFocusClasses,
      inputErrorClasses,
      inputDisabledClasses
    );

    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={commonClasses}
            {...props}
          />
        );

      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={commonClasses}
            {...props}
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={name}
              name={name}
              checked={value}
              onChange={onChange}
              required={required}
              disabled={disabled}
              className={clsx(
                "w-5 h-5 rounded focus:ring-2",
                theme === 'dark' 
                  ? "text-primary bg-dark border-gray-600 focus:ring-primary"
                  : "text-accent-gold bg-white border-stone-300 focus:ring-accent-gold"
              )}
              {...props}
            />
            {label && (
              <label htmlFor={name} className={clsx(
                "ml-3 font-medium",
                theme === 'dark' ? "text-white" : "text-neutral-dark"
              )}>
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
          </div>
        );

      default:
        return (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={commonClasses}
            {...props}
          />
        );
    }
  };

  // Checkbox layout is different
  if (type === 'checkbox') {
    return (
      <div className={clsx('mb-6', className)}>
        {renderInput()}
        {helperText && !error && (
          <p className={clsx("mt-2 text-sm", theme === 'dark' ? "text-gray-400" : "text-stone-500")}>{helperText}</p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={clsx('mb-6', className)}>
      {label && (
        <label htmlFor={name} className={clsx(
          "block mb-2 font-display font-bold uppercase tracking-widest text-xs",
          theme === 'dark' ? "text-gray-300" : "text-stone-500"
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {helperText && !error && (
        <p className={clsx("mt-2 text-sm font-medium", theme === 'dark' ? "text-gray-500" : "text-stone-400")}>{helperText}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-500 font-bold">{error}</p>
      )}
    </div>
  );
};

export default FormGroup;
