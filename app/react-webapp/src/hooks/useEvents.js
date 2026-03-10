import { useState, useEffect } from 'react';

/**
 * Custom hook for managing events (LocalStorage-based)
 * Used by Events page (simpler than Calendar page which uses API)
 */
export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Load events from localStorage on mount
  useEffect(() => {
    const loadEvents = () => {
      try {
        const stored = localStorage.getItem('lanternLoungeEvents');
        if (stored) {
          return JSON.parse(stored);
        }
        // Return sample events if none exist
        return getSampleEvents();
      } catch (error) {
        console.error('Error loading events:', error);
        return [];
      }
    };

    setEvents(loadEvents());
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (events.length > 0) {
      try {
        localStorage.setItem('lanternLoungeEvents', JSON.stringify(events));
      } catch (error) {
        console.error('Error saving events:', error);
      }
    }
  }, [events]);

  const getSampleEvents = () => [
    {
      id: 'event1',
      title: 'Trivia Night',
      date: '2024-12-28',
      description: 'Test your knowledge with our weekly trivia competition! Prizes for the winners.',
      createdBy: 'admin'
    },
    {
      id: 'event2',
      title: 'Cribbage Tournament',
      date: '2024-12-30',
      description: 'Monthly cribbage tournament. All skill levels welcome!',
      createdBy: 'admin'
    },
    {
      id: 'event3',
      title: "New Year's Eve Party",
      date: '2024-12-31',
      description: 'Ring in the new year with friends! Music, drinks, and celebration.',
      createdBy: 'admin'
    },
    {
      id: 'event4',
      title: 'Painting Night',
      date: '2025-01-03',
      description: 'Create your own masterpiece while enjoying drinks with friends.',
      createdBy: 'admin'
    },
    {
      id: 'event5',
      title: 'Whisky Tasting',
      date: '2025-01-05',
      description: 'Sample fine whiskies from around the world. Limited spots available.',
      createdBy: 'admin'
    }
  ];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const selectDate = (date) => {
    setSelectedDate(date);
  };

  const getEventsForDate = (date) => {
    const dateStr = formatDate(date);
    return events.filter(event => event.date === dateStr);
  };

  const createEvent = (eventData) => {
    const newEvent = {
      ...eventData,
      id: `event-${Date.now()}`,
      createdBy: 'user' // Would come from auth in real implementation
    };
    setEvents([...events, newEvent]);
  };

  const updateEvent = (eventId, eventData) => {
    setEvents(events.map(event =>
      event.id === eventId ? { ...event, ...eventData } : event
    ));
  };

  const deleteEvent = (eventId) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
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

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatMonthYear = () => {
    return currentMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isSelected = (date) => {
    return selectedDate && formatDate(date) === formatDate(selectedDate);
  };

  return {
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
    formatDate,
    formatMonthYear,
    isToday,
    isSelected
  };
};

export default useEvents;
