import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import useEvents from '../hooks/useEvents';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import FormGroup from '../components/common/FormGroup';
import DatePicker from '../components/common/DatePicker';
import clsx from 'clsx';

/**
 * Events Page - Event calendar and management (LocalStorage-based)
 * Converted from events.html + events.js
 */
const Events = () => {
  const { isAuthenticated } = useAuth();
  const {
    events,
    currentMonth,
    selectedDate,
    navigateMonth,
    goToToday,
    selectDate,
    getEventsForDate,
    createEvent,
    updateEvent,
    deleteEvent,
    getDaysInMonth,
    formatMonthYear,
    isToday,
    isSelected
  } = useEvents();

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: ''
  });

  const handleDayClick = (day) => {
    // Check if date is in the past
    const isPast = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(day.date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate < today;
    };

    // Check if day is closed (Saturday, Sunday, Monday)
    const isClosed = () => {
      const dayOfWeek = day.date.getDay();
      return dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 6;
    };

    // Don't allow interaction with past dates or closed days
    if (isPast() || isClosed()) {
      return;
    }

    selectDate(day.date);

    // If user is authenticated and day has no events, open create modal
    const dayEvents = getEventsForDate(day.date);
    if (isAuthenticated && dayEvents.length === 0) {
      setEditingEvent(null);
      setFormData({
        title: '',
        date: formatDate(day.date),
        description: ''
      });
      setIsEventModalOpen(true);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      date: selectedDate ? formatDate(selectedDate) : '',
      description: ''
    });
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      description: event.description
    });
    setIsEventModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEvent) {
      updateEvent(editingEvent.id, formData);
    } else {
      createEvent(formData);
    }
    setIsEventModalOpen(false);
  };

  const handleDelete = () => {
    if (editingEvent && window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent(editingEvent.id);
      setIsEventModalOpen(false);
    }
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-display font-bold text-white mb-4">
            Event Calendar
          </h1>
          <p className="text-gray-300">
            {isAuthenticated
              ? 'Welcome! You can create and manage events.'
              : 'Sign in to create and manage events'}
          </p>
        </div>

        {/* Calendar Controls */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="w-10 h-10 flex items-center justify-center bg-dark-card hover:bg-primary text-white rounded-lg transition-colors"
            >
              &lt;
            </button>
            <h2 className="text-2xl font-display font-bold text-white min-w-[200px] text-center">
              {formatMonthYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="w-10 h-10 flex items-center justify-center bg-dark-card hover:bg-primary text-white rounded-lg transition-colors"
            >
              &gt;
            </button>
          </div>
          <div className="flex space-x-4">
            <Button variant="secondary" onClick={goToToday}>
              Today
            </Button>
            {isAuthenticated && (
              <Button variant="primary" onClick={handleCreateEvent}>
                Create Event
              </Button>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-8 p-4 bg-dark-card rounded-lg border border-gray-700">
          <p className="text-gray-300 text-sm">
            <span className="text-primary font-semibold">Note:</span> We're currently closed on Saturday, Sunday, and Monday. Events can only be scheduled Tuesday-Friday.
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="bg-dark-card rounded-lg p-6 mb-8">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-gray-400 font-semibold py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((day, index) => {
              const dayEvents = getEventsForDate(day.date);
              const isTodayDate = isToday(day.date);
              const isSelectedDate = isSelected(day.date);

              // Check if date is disabled (past or closed day)
              const isPastDate = () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const checkDate = new Date(day.date);
                checkDate.setHours(0, 0, 0, 0);
                return checkDate < today;
              };

              const isClosedDay = () => {
                const dayOfWeek = day.date.getDay();
                return dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 6;
              };

              const isDisabledDate = isPastDate() || isClosedDay();

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={clsx(
                    'min-h-[100px] p-2 rounded-lg border transition-all',
                    day.isCurrentMonth
                      ? 'bg-dark border-gray-700'
                      : 'bg-dark/50 border-gray-800 text-gray-600',
                    isDisabledDate
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-dark-light',
                    isTodayDate && 'ring-2 ring-primary',
                    isSelectedDate && 'bg-primary/10 border-primary'
                  )}
                >
                  <div className={clsx(
                    'text-sm font-semibold mb-1',
                    day.isCurrentMonth ? 'text-white' : 'text-gray-600',
                    isDisabledDate && 'line-through'
                  )}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={i}
                        className="text-xs bg-primary/20 text-primary px-2 py-1 rounded truncate"
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Details for Selected Date */}
        {selectedDate && selectedDateEvents.length > 0 && (
          <div className="bg-dark-card rounded-lg p-6">
            <h3 className="text-2xl font-display font-bold text-white mb-4">
              Events on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <div className="space-y-4">
              {selectedDateEvents.map(event => (
                <div
                  key={event.id}
                  className="bg-dark p-4 rounded-lg hover:bg-dark-light transition-colors cursor-pointer"
                  onClick={() => isAuthenticated && handleEditEvent(event)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">
                        {event.title}
                      </h4>
                      <p className="text-gray-300">
                        {event.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEvent ? 'Edit Event' : 'Create Event'}
      >
        <form onSubmit={handleSubmit}>
          <FormGroup
            label="Event Title"
            name="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Enter event title"
          />

          <DatePicker
            label="Date"
            name="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <FormGroup
            label="Description"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter event description (optional)"
            rows={4}
          />

          <div className="flex space-x-4 mt-6">
            <Button type="submit" variant="primary" fullWidth>
              {editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
            {editingEvent && (
              <Button type="button" variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEventModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Events;
