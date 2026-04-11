import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import useEvents from '../hooks/useEvents';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import FormGroup from '../components/common/FormGroup';
import DatePicker from '../components/common/DatePicker';
import clsx from 'clsx';

/**
 * Events Page - Event calendar and management (API-based)
 */
const Events = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const isAdmin = currentUser?.groups?.includes('admin');
  
  const {
    events,
    isLoading,
    error: apiError,
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    visibility: 'PUBLIC',
    status: 'APPROVED'
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

    const dayEvents = getEventsForDate(day.date);
    
    // If day has events, select the first one to view
    if (dayEvents.length > 0) {
      handleViewEvent(dayEvents[0]);
      selectDate(day.date);
      return;
    }

    // Don't allow interaction with past dates or closed days
    if (isPast() || isClosed()) {
      return;
    }

    selectDate(day.date);

    // If user is authenticated and day has no events, open create modal
    if (isAuthenticated && dayEvents.length === 0) {
      setEditingEvent(null);
      setFormData({
        title: '',
        date: formatDate(day.date),
        description: '',
        visibility: 'PUBLIC',
        status: isAdmin ? 'APPROVED' : 'PENDING_APPROVAL'
      });
      setSubmitError(null);
      setIsEventModalOpen(true);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      date: selectedDate ? formatDate(selectedDate) : '',
      description: '',
      visibility: 'PUBLIC',
      status: isAdmin ? 'APPROVED' : 'PENDING_APPROVAL'
    });
    setSubmitError(null);
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      description: event.description,
      visibility: event.visibility || 'PUBLIC',
      status: event.status || 'APPROVED'
    });
    setSubmitError(null);
    setIsEventModalOpen(true);
    setIsViewModalOpen(false);
  };

  const handleViewEvent = (event) => {
    setViewingEvent(event);
    setIsViewModalOpen(true);
  };

  const handleApproveEvent = async (event) => {
    setIsSubmitting(true);
    const result = await updateEvent(event.id, { ...event, status: 'APPROVED' });
    if (result.success) {
      setIsViewModalOpen(false);
    } else {
      setSubmitError(result.error || 'Failed to approve event');
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    let result;
    if (editingEvent) {
      result = await updateEvent(editingEvent.id, formData);
    } else {
      result = await createEvent(formData);
    }

    if (result.success) {
      setIsEventModalOpen(false);
    } else {
      setSubmitError(result.error || 'Operation failed');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (editingEvent && window.confirm('Are you sure you want to delete this event?')) {
      setIsSubmitting(true);
      const result = await deleteEvent(editingEvent.id);
      if (result.success) {
        setIsEventModalOpen(false);
      } else {
        setSubmitError(result.error || 'Failed to delete event');
      }
      setIsSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen bg-dark pt-32 pb-24">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-accent-gold font-mono text-sm tracking-[0.3em] uppercase mb-6 block">Community</span>
          <h1 className="text-6xl md:text-7xl font-display font-black text-white mb-6 tracking-tight">
            The <span className="text-primary italic">Calendar</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            From jazz nights to whisky tastings, stay updated with the shared experiences that define our lounge.
          </p>

          {/* API Error Message */}
          {apiError && (
            <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-sm text-red-500 font-medium">
              {apiError}
            </div>
          )}

          {/* Member Guidelines - On Page */}
          <div className="max-w-3xl mx-auto p-8 border border-white/5 bg-white/5 backdrop-blur-sm rounded-sm text-left">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Eligibility', text: 'Any member in good standing can create events.' },
                { title: 'Inclusivity', text: 'Events are open to all members and their guests.' },
                { title: 'Oversight', text: 'All entries are subject to management approval.' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <span className="text-accent-gold font-display font-bold text-xs uppercase tracking-widest">{item.title}</span>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Wrapper - Deep Aged Parchment Style */}
        <div className={clsx(
          "bg-[#e2d7c5] p-1 shadow-[0_30px_70px_rgba(0,0,0,0.3),0_0_50px_rgba(197,160,89,0.2)] border border-[#c5b8a5] rounded-sm mb-12 relative overflow-hidden group transition-opacity duration-300",
          isLoading && "opacity-60 pointer-events-none"
        )}>
          {/* Intense Lamp-Light Glow */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent-gold/20 blur-[120px] rounded-full pointer-events-none transition-opacity duration-1000 group-hover:opacity-100 opacity-60" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none transition-opacity duration-1000 group-hover:opacity-100 opacity-60" />
          
          {/* Aged Parchment Texture Layer */}
          <div className="absolute inset-0 opacity-[0.15] pointer-events-none bg-grain mix-blend-multiply" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.05)_100%)] pointer-events-none" />

          <div className="bg-[#f2eadd]/80 backdrop-blur-[2px] p-8 md:p-12 relative z-10 border border-white/20">
            {/* Calendar Controls */}
            <div className="flex justify-between items-center mb-12 flex-wrap gap-8 border-b border-[#dcd1bc] pb-8">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="w-12 h-12 flex items-center justify-center border border-[#c5b8a5] hover:border-primary/40 text-[#8b7e6a] hover:text-primary transition-all rounded-sm bg-[#f9f3e9] shadow-inner"
                  aria-label="Previous Month"
                >
                  &larr;
                </button>
                <h2 className="text-3xl font-display font-black text-[#4a3f35] min-w-[240px] text-center tracking-tight uppercase">
                  {formatMonthYear()}
                </h2>
                <button
                  onClick={() => navigateMonth(1)}
                  className="w-12 h-12 flex items-center justify-center border border-[#c5b8a5] hover:border-primary/40 text-[#8b7e6a] hover:text-primary transition-all rounded-sm bg-[#f9f3e9] shadow-inner"
                  aria-label="Next Month"
                >
                  &rarr;
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={goToToday}
                  className="!border-[#c5b8a5] !text-[#6d5d4d] hover:!bg-[#f9f3e9]"
                >
                  Today
                </Button>
                {isAuthenticated && (
                  <Button 
                    variant="primary" 
                    onClick={handleCreateEvent}
                    className="!bg-[#2d241e] !text-[#f2eadd] shadow-2xl hover:!bg-black transition-colors"
                  >
                    + New Event
                  </Button>
                )}
              </div>
            </div>

            {/* Info Banner - Tea-Stained Style */}
            <div className="mb-10 p-5 bg-[#e9dfcc]/50 border border-[#dcd1bc] rounded-sm flex items-center gap-4 shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(178,34,34,0.6)]" />
              <p className="text-[#6d5d4d] font-bold text-xs uppercase tracking-widest">
                Club Schedule: <span className="text-[#4a3f35] italic normal-case font-medium ml-2">Open Tuesday–Friday. Closed Weekends & Monday.</span>
              </p>
            </div>

            {/* Calendar Grid */}
            <div className="mb-8 border border-[#dcd1bc] shadow-xl">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-px bg-[#dcd1bc]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center bg-[#e9dfcc] text-[#a69681] font-mono text-[10px] uppercase tracking-[0.4em] py-5 font-bold">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-px bg-[#dcd1bc]">
                {getDaysInMonth().map((day, index) => {
                  const dayEvents = getEventsForDate(day.date);
                  const isTodayDate = isToday(day.date);
                  const isSelectedDate = isSelected(day.date);

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
                        'min-h-[140px] p-4 transition-all relative group/day',
                        day.isCurrentMonth ? 'bg-[#fdf9f2]' : 'bg-[#e9dfcc]/40 text-[#a69681]',
                        (isDisabledDate && dayEvents.length === 0) ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[#f2eadd]',
                        isSelectedDate && 'bg-accent-gold/10 z-10'
                      )}
                    >
                      {/* Aged Vignette in each cell */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.02)_100%)] pointer-events-none" />

                      {/* Selection Highlight */}
                      {isSelectedDate && (
                        <div className="absolute inset-0 border-2 border-accent-gold/40 shadow-[inset_0_0_15px_rgba(197,160,89,0.1)] pointer-events-none" />
                      )}

                      <div className={clsx(
                        'text-sm font-black mb-4 flex justify-between items-center',
                        day.isCurrentMonth ? 'text-[#8b7e6a]' : 'text-[#c5b8a5]',
                        isTodayDate && '!text-primary'
                      )}>
                        <span className={clsx(
                          'relative transition-all duration-300',
                          isTodayDate && 'bg-primary/10 text-primary px-2 py-0.5 rounded-sm ring-1 ring-primary/20'
                        )}>
                          {day.date.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_rgba(178,34,34,0.5)]" />
                        )}
                      </div>
                      
                      <div className="space-y-2 relative z-10">
                        {dayEvents.slice(0, 2).map((event, i) => (
                          <div
                            key={i}
                            className={clsx(
                              "text-[10px] leading-tight border-l-2 px-2 py-2 font-black truncate shadow-md transform group-hover/day:translate-x-1 transition-transform",
                              event.status === 'PENDING_APPROVAL' 
                                ? "bg-amber-500 text-neutral-dark border-amber-700/30" 
                                : "bg-[#8B0000] text-[#fdf9f2] border-[#2d241e]/30"
                            )}
                            title={`${event.title}${event.status === 'PENDING_APPROVAL' ? ' (Approval pending)' : ''}`}
                          >
                            {event.status === 'PENDING_APPROVAL' && (
                              <span className="mr-1" title="Approval pending">⏳</span>
                            )}
                            {event.title.toUpperCase()}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-[#8b7e6a] font-black uppercase tracking-widest pl-2">
                            + {dayEvents.length - 2} More
                          </div>
                        )}
                      </div>

                      {isDisabledDate && day.isCurrentMonth && (
                        <div className="absolute inset-0 bg-[#e9dfcc]/40 backdrop-sepia-[0.3] pointer-events-none opacity-60" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Date Event List - Bold Overlay Style */}
        {selectedDate && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-white/10" />
              <h3 className="text-2xl font-display font-bold text-white whitespace-nowrap">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </h3>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            
            <div className="space-y-6">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map(event => (
                  <div
                    key={event.id}
                    className="bg-neutral-dark p-8 border border-white/5 hover:border-accent-gold/30 transition-all cursor-pointer group"
                    onClick={() => handleViewEvent(event)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-accent-gold font-mono text-xs uppercase tracking-[0.2em] block">
                            {event.visibility === 'PRIVATE' ? 'Members Only' : 'Featured Event'}
                          </span>
                          {event.status === 'PENDING_APPROVAL' && (
                            <span 
                              className="bg-amber-500/10 text-amber-500 border border-amber-500/30 font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm flex items-center gap-1.5 shadow-inner"
                              title="Approval pending"
                            >
                              <span className="text-sm">⏳</span> Approval pending
                            </span>
                          )}
                        </div>
                        <h4 className="text-3xl font-display font-bold text-white mb-4 group-hover:text-accent-gold transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
                          {event.description}
                        </p>
                      </div>
                      <span className="text-white/20 group-hover:text-white transition-colors">&rarr;</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 border border-dashed border-white/10">
                  <p className="text-gray-500 font-medium italic">No events scheduled for this date.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Event Details"
        size="md"
        theme="vintage"
      >
        <div className="relative z-10">
          <div className="mb-8 border-b border-stone-200 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-4xl font-display font-black text-neutral-dark tracking-tight">
                {viewingEvent?.title}
              </h3>
              {viewingEvent?.status === 'PENDING_APPROVAL' && (
                <span 
                  className="bg-amber-500 text-neutral-dark text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm flex items-center gap-1.5"
                  title="Approval pending"
                >
                  <span className="text-sm">⏳</span> Approval pending
                </span>
              )}
            </div>
            <div className="text-primary font-bold italic">
              {viewingEvent && new Date(viewingEvent.date + 'T00:00:00').toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
          </div>
          
          <div className="prose prose-stone max-w-none">
            <p className="text-xl text-stone-600 leading-relaxed mb-8">
              {viewingEvent?.description || 'No description provided for this event.'}
            </p>
          </div>

          {viewingEvent?.createdBy && (
            <div className="mb-8 pt-4 border-t border-stone-100">
              <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">
                Added by <span className="text-stone-600 font-bold">{viewingEvent.createdBy}</span>
                {viewingEvent.createdAt && ` on ${new Date(viewingEvent.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-stone-200 pt-8 mt-8">
            <div className="flex gap-4">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsViewModalOpen(false)}
                className="!border-stone-300 !text-stone-600 hover:!bg-stone-50"
              >
                Close
              </Button>
              {isAuthenticated && (isAdmin || viewingEvent?.createdByUserId === currentUser?.sub) && (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => handleEditEvent(viewingEvent)}
                  className="!bg-neutral-dark !text-white"
                >
                  Edit Event
                </Button>
              )}
            </div>
            
            {isAdmin && viewingEvent?.status === 'PENDING_APPROVAL' && (
              <Button
                variant="primary"
                fullWidth
                onClick={() => handleApproveEvent(viewingEvent)}
                className="!bg-green-700 hover:!bg-green-800 !text-white !border-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Approving...' : 'Approve Event'}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => !isSubmitting && setIsEventModalOpen(false)}
        title={editingEvent ? 'Edit Event' : 'New Event'}
        theme="vintage"
      >
        {submitError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-sm text-red-500 font-medium text-sm">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormGroup
            label="Event Title"
            name="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Enter event title"
            theme="vintage"
          />

          <DatePicker
            label="Event Date"
            name="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            theme="vintage"
          />

          <div className="grid grid-cols-2 gap-4">
            {isAdmin && (
              <FormGroup
                label="Visibility"
                name="visibility"
                type="select"
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                options={[
                  { label: 'Public', value: 'PUBLIC' },
                  { label: 'Private', value: 'PRIVATE' }
                ]}
                theme="vintage"
              />
            )}
            
            {isAdmin && (
              <FormGroup
                label="Status"
                name="status"
                type="select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { label: 'Pending', value: 'PENDING_APPROVAL' },
                  { label: 'Approved', value: 'APPROVED' }
                ]}
                theme="vintage"
              />
            )}
          </div>

          <FormGroup
            label="Description"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter event description (optional)"
            rows={4}
            theme="vintage"
          />

          <div className="flex space-x-4 mt-6">
            <Button 
              type="submit" 
              variant="primary" 
              fullWidth
              className="!bg-neutral-dark !text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : (editingEvent ? 'Update Event' : 'Create Event')}
            </Button>
            {editingEvent && (isAdmin || editingEvent?.createdByUserId === currentUser?.sub) && (
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? '...' : 'Delete'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEventModalOpen(false)}
              className="!border-stone-300 !text-stone-600 hover:!bg-stone-50"
              disabled={isSubmitting}
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
