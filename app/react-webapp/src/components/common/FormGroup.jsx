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
  ...props
}) => {
  const inputBaseClasses = 'w-full px-4 py-3 rounded-lg border bg-dark text-white transition-all duration-200';
  const inputFocusClasses = 'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';
  const inputErrorClasses = error ? 'border-red-500' : 'border-gray-600';
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
              className="w-5 h-5 text-primary bg-dark border-gray-600 rounded focus:ring-primary focus:ring-2"
              {...props}
            />
            {label && (
              <label htmlFor={name} className="ml-3 text-white">
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
      <div className={clsx('mb-4', className)}>
        {renderInput()}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-400">{helperText}</p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={clsx('mb-4', className)}>
      {label && (
        <label htmlFor={name} className="block mb-2 text-white font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-400">{helperText}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FormGroup;
