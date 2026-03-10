import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

/**
 * Custom DatePicker with popup calendar
 */
const DatePicker = ({ label, name, value, onChange, required = false, error, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(value ? new Date(value) : new Date());
  const pickerRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'Select a date';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const handleDateClick = (date) => {
    const formatted = formatDate(date);
    onChange({ target: { name, value: formatted } });
    setIsOpen(false);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setDisplayMonth(newDate);
  };

  const isSelected = (date) => {
    if (!value) return false;
    return formatDate(date) === value;
  };

  const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isClosedDay = (date) => {
    const dayOfWeek = date.getDay();
    // 0 = Sunday, 1 = Monday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 6;
  };

  const isDisabled = (date) => {
    return isPastDate(date) || isClosedDay(date);
  };

  const monthYear = displayMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className={clsx('mb-4', className)} ref={pickerRef}>
      {label && (
        <label className="block mb-2 text-white font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Date Input (displays selected date) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full px-4 py-3 rounded-lg border bg-dark text-white transition-all duration-200 text-left',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          error ? 'border-red-500' : 'border-gray-600',
          'hover:border-gray-500'
        )}
      >
        {formatDisplayDate(value)}
      </button>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-dark-light border border-gray-700 rounded-lg shadow-2xl p-4 w-80">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="w-8 h-8 flex items-center justify-center bg-dark-card hover:bg-primary text-white rounded transition-colors"
            >
              &lt;
            </button>
            <h3 className="text-white font-display font-bold">
              {monthYear}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="w-8 h-8 flex items-center justify-center bg-dark-card hover:bg-primary text-white rounded transition-colors"
            >
              &gt;
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-gray-400 text-xs font-semibold py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(displayMonth).map((day, index) => {
              const selected = isSelected(day.date);
              const today = isToday(day.date);
              const disabled = isDisabled(day.date);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !disabled && handleDateClick(day.date)}
                  disabled={disabled}
                  className={clsx(
                    'p-2 text-sm rounded transition-all',
                    day.isCurrentMonth
                      ? 'text-white hover:bg-dark-card'
                      : 'text-gray-600',
                    selected && 'bg-primary hover:bg-primary-hover text-white font-bold',
                    today && !selected && 'ring-1 ring-primary',
                    disabled
                      ? 'cursor-not-allowed opacity-30 line-through hover:bg-transparent'
                      : 'cursor-pointer'
                  )}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              if (!isDisabled(today)) {
                handleDateClick(today);
              }
            }}
            disabled={isDisabled(new Date())}
            className={clsx(
              'w-full mt-4 px-4 py-2 rounded transition-colors text-sm font-medium',
              isDisabled(new Date())
                ? 'bg-dark-card/50 text-gray-500 cursor-not-allowed'
                : 'bg-dark-card hover:bg-primary text-white'
            )}
          >
            Today
          </button>

          {/* Helper Text */}
          <p className="mt-3 text-xs text-gray-400 text-center">
            Closed: Saturday, Sunday, Monday
          </p>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
