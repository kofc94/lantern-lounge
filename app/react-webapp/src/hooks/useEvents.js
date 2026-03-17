import { useState, useEffect, useCallback } from 'react';
import { fetchEvents, createEvent as apiCreateEvent, updateEvent as apiUpdateEvent, deleteEvent as apiDeleteEvent } from '../services/api';
import { useAuth } from './useAuth';

/**
 * Custom hook for managing events (API-based)
 */
export const useEvents = () => {
  const { getToken, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Calculate start and end date for current month view (including padded days)
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month - 1, 20).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 10).toISOString().split('T')[0];
      
      const authToken = isAuthenticated ? await getToken() : null;
      const fetchedEvents = await fetchEvents(startDate, endDate, authToken);
      setEvents(fetchedEvents);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, getToken, isAuthenticated]);

  // Load events on mount and when month changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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

  const createEvent = async (eventData) => {
    try {
      const authToken = await getToken();
      await apiCreateEvent(eventData, authToken);
      await loadEvents(); // Refresh list
      return { success: true };
    } catch (err) {
      console.error('Error creating event:', err);
      return { success: false, error: err.message };
    }
  };

  const updateEvent = async (eventId, eventData) => {
    try {
      const authToken = await getToken();
      await apiUpdateEvent(eventId, eventData, authToken);
      await loadEvents(); // Refresh list
      return { success: true };
    } catch (err) {
      console.error('Error updating event:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      const authToken = await getToken();
      await apiDeleteEvent(eventId, authToken);
      await loadEvents(); // Refresh list
      return { success: true };
    } catch (err) {
      console.error('Error deleting event:', err);
      return { success: false, error: err.message };
    }
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
    if (!date) return '';
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
    isLoading,
    error,
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
    isSelected,
    refreshEvents: loadEvents
  };
};

export default useEvents;
