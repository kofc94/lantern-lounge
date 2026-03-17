import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

/**
 * Custom DatePicker with popup calendar
 */
const DatePicker = ({ 
  label, 
  name, 
  value, 
  onChange, 
  required = false, 
  error, 
  className = '',
  theme = 'dark' // 'dark' or 'vintage'
}) => {
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
    <div className={clsx('mb-6', className)} ref={pickerRef}>
      {label && (
        <label className={clsx(
          "block mb-2 font-display font-bold uppercase tracking-widest text-xs",
          theme === 'dark' ? "text-gray-300" : "text-stone-500"
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Date Input (displays selected date) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full px-4 py-3 rounded-sm border transition-all duration-200 text-left',
          theme === 'dark' 
            ? 'bg-dark text-white border-gray-600 focus:ring-primary' 
            : 'bg-white text-neutral-dark border-stone-300 focus:ring-accent-gold/50 focus:border-accent-gold',
          'focus:outline-none focus:ring-2 focus:border-transparent',
          error ? 'border-red-500' : '',
          'hover:border-stone-400'
        )}
      >
        {formatDisplayDate(value)}
      </button>

      {error && <p className="mt-2 text-sm text-red-500 font-bold">{error}</p>}

      {/* Calendar Popup */}
      {isOpen && (
        <div className={clsx(
          "absolute z-50 mt-2 border shadow-2xl p-4 w-80 rounded-sm",
          theme === 'dark' ? "bg-dark-light border-gray-700" : "bg-white border-stone-200"
        )}>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className={clsx(
                "w-8 h-8 flex items-center justify-center rounded transition-colors",
                theme === 'dark' ? "bg-dark-card hover:bg-primary text-white" : "bg-stone-100 hover:bg-stone-200 text-stone-600"
              )}
            >
              &lt;
            </button>
            <h3 className={clsx(
              "font-display font-bold",
              theme === 'dark' ? "text-white" : "text-neutral-dark"
            )}>
              {monthYear}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className={clsx(
                "w-8 h-8 flex items-center justify-center rounded transition-colors",
                theme === 'dark' ? "bg-dark-card hover:bg-primary text-white" : "bg-stone-100 hover:bg-stone-200 text-stone-600"
              )}
            >
              &gt;
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-stone-400 text-[10px] font-mono uppercase tracking-widest py-1">
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
                    'p-2 text-xs font-bold rounded transition-all',
                    day.isCurrentMonth
                      ? (theme === 'dark' ? 'text-white hover:bg-dark-card' : 'text-stone-700 hover:bg-stone-50')
                      : 'text-stone-300',
                    selected && (theme === 'dark' ? 'bg-primary text-white' : 'bg-accent-gold text-white'),
                    today && !selected && (theme === 'dark' ? 'ring-1 ring-primary' : 'ring-1 ring-primary/50'),
                    disabled
                      ? 'cursor-not-allowed opacity-20 line-through'
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
              'w-full mt-4 px-4 py-2 rounded transition-colors text-xs font-black uppercase tracking-widest',
              isDisabled(new Date())
                ? 'opacity-20 cursor-not-allowed'
                : (theme === 'dark' ? 'bg-primary text-white' : 'bg-neutral-dark text-white hover:bg-black')
            )}
          >
            Today
          </button>

          {/* Helper Text */}
          <p className="mt-3 text-[10px] text-stone-400 text-center uppercase tracking-tighter">
            Closed: Sat, Sun, Mon
          </p>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
