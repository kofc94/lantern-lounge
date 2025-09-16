// Events management system
class EventManager {
    constructor() {
        this.events = this.loadEvents();
        this.currentDate = new Date();
        this.editingEventId = null;
        this.init();
    }

    init() {
        this.updateMemberActions();
        this.setupEventListeners();
        this.displayEvents();
        this.updateCalendarHeader();
        this.createSampleEvents();
    }

    createSampleEvents() {
        // Create some sample events if none exist
        if (this.events.length === 0) {
            const sampleEvents = [
                {
                    id: 'event1',
                    title: 'Trivia Night',
                    date: '2024-12-28',
                    time: '19:00',
                    description: 'Test your knowledge with our weekly trivia competition! Prizes for the winners.',
                    type: 'trivia',
                    createdBy: 'admin'
                },
                {
                    id: 'event2',
                    title: 'Cribbage Tournament',
                    date: '2024-12-30',
                    time: '18:30',
                    description: 'Monthly cribbage tournament. All skill levels welcome!',
                    type: 'cribbage',
                    createdBy: 'admin'
                },
                {
                    id: 'event3',
                    title: 'New Year\'s Eve Party',
                    date: '2024-12-31',
                    time: '20:00',
                    description: 'Ring in the new year with friends! Music, drinks, and celebration.',
                    type: 'other',
                    createdBy: 'admin'
                },
                {
                    id: 'event4',
                    title: 'Painting Night',
                    date: '2025-01-03',
                    time: '19:00',
                    description: 'Create your own masterpiece while enjoying drinks with friends.',
                    type: 'painting',
                    createdBy: 'admin'
                },
                {
                    id: 'event5',
                    title: 'Whisky Tasting',
                    date: '2025-01-05',
                    time: '19:30',
                    description: 'Sample fine whiskies from around the world. Limited spots available.',
                    type: 'tasting',
                    createdBy: 'admin'
                }
            ];
            this.events = sampleEvents;
            this.saveEvents();
            this.displayEvents();
        }
    }

    updateMemberActions() {
        const memberActions = document.getElementById('memberActions');
        if (window.authManager && window.authManager.isLoggedIn) {
            memberActions.style.display = 'block';
        } else {
            memberActions.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Modal controls
        const modal = document.getElementById('eventModal');
        const createBtn = document.getElementById('createEventBtn');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.getElementById('cancelBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        const eventForm = document.getElementById('eventForm');

        // Calendar navigation
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreateModal());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteEvent());
        }

        if (eventForm) {
            eventForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.changeMonth(-1));
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.changeMonth(1));
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.updateCalendarHeader();
        this.displayEvents();
    }

    updateCalendarHeader() {
        const monthSpan = document.getElementById('currentMonth');
        if (monthSpan) {
            const options = { year: 'numeric', month: 'long' };
            monthSpan.textContent = this.currentDate.toLocaleDateString('en-US', options);
        }
    }

    openCreateModal() {
        if (!window.authManager || !window.authManager.isLoggedIn) {
            alert('Please log in to create events.');
            return;
        }

        this.editingEventId = null;
        document.getElementById('modalTitle').textContent = 'Create New Event';
        document.getElementById('deleteBtn').style.display = 'none';
        document.getElementById('eventForm').reset();
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('eventDate').value = today;
        
        document.getElementById('eventModal').style.display = 'block';
    }

    openEditModal(eventId) {
        if (!window.authManager || !window.authManager.isLoggedIn) {
            alert('Please log in to edit events.');
            return;
        }

        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        this.editingEventId = eventId;
        document.getElementById('modalTitle').textContent = 'Edit Event';
        document.getElementById('deleteBtn').style.display = 'inline-block';
        
        // Populate form
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTime').value = event.time;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventType').value = event.type;
        
        document.getElementById('eventModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('eventModal').style.display = 'none';
        this.editingEventId = null;
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const eventData = {
            title: formData.get('eventTitle'),
            date: formData.get('eventDate'),
            time: formData.get('eventTime'),
            description: formData.get('eventDescription'),
            type: formData.get('eventType'),
            createdBy: window.authManager.username
        };

        if (this.editingEventId) {
            this.updateEvent(this.editingEventId, eventData);
        } else {
            this.createEvent(eventData);
        }

        this.closeModal();
    }

    createEvent(eventData) {
        const event = {
            id: 'event_' + Date.now(),
            ...eventData
        };
        
        this.events.push(event);
        this.saveEvents();
        this.displayEvents();
    }

    updateEvent(eventId, eventData) {
        const index = this.events.findIndex(e => e.id === eventId);
        if (index !== -1) {
            this.events[index] = { ...this.events[index], ...eventData };
            this.saveEvents();
            this.displayEvents();
        }
    }

    deleteEvent() {
        if (!this.editingEventId) return;
        
        if (confirm('Are you sure you want to delete this event?')) {
            this.events = this.events.filter(e => e.id !== this.editingEventId);
            this.saveEvents();
            this.displayEvents();
            this.closeModal();
        }
    }

    displayEvents() {
        const eventsGrid = document.getElementById('eventsGrid');
        if (!eventsGrid) return;

        // Filter events for current month view
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        
        const filteredEvents = this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
        });

        // Sort events by date and time
        filteredEvents.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateA - dateB;
        });

        if (filteredEvents.length === 0) {
            eventsGrid.innerHTML = '<div class="no-events">No events scheduled for this month.</div>';
            return;
        }

        eventsGrid.innerHTML = filteredEvents.map(event => this.createEventCard(event)).join('');

        // Add click listeners for event cards
        if (window.authManager && window.authManager.isLoggedIn) {
            document.querySelectorAll('.event-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('.event-actions')) {
                        this.openEditModal(card.dataset.eventId);
                    }
                });
            });
        }
    }

    createEventCard(event) {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const formattedTime = new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const typeColors = {
            trivia: '#FF6B6B',
            cribbage: '#4ECDC4',
            painting: '#45B7D1',
            tasting: '#FFA07A',
            bingo: '#98D8C8',
            sports: '#F39C12',
            cards: '#9B59B6',
            other: '#95A5A6'
        };

        const isLoggedIn = window.authManager && window.authManager.isLoggedIn;
        const editButton = isLoggedIn ? `<button class="edit-btn" onclick="eventManager.openEditModal('${event.id}')">Edit</button>` : '';

        return `
            <div class="event-card" data-event-id="${event.id}" style="border-left: 4px solid ${typeColors[event.type] || typeColors.other}">
                <div class="event-header">
                    <h3 class="event-title">${event.title}</h3>
                    <span class="event-type">${event.type.charAt(0).toUpperCase() + event.type.slice(1)}</span>
                </div>
                <div class="event-datetime">
                    <span class="event-date">${formattedDate}</span>
                    <span class="event-time">${formattedTime}</span>
                </div>
                ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                <div class="event-meta">
                    <span class="event-creator">Created by: ${event.createdBy}</span>
                </div>
                ${isLoggedIn ? `<div class="event-actions">${editButton}</div>` : ''}
            </div>
        `;
    }

    loadEvents() {
        const saved = localStorage.getItem('lanternLoungeEvents');
        return saved ? JSON.parse(saved) : [];
    }

    saveEvents() {
        localStorage.setItem('lanternLoungeEvents', JSON.stringify(this.events));
    }
}

// Initialize event manager when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.eventManager = new EventManager();
    
    // Update UI when auth state changes
    if (window.authManager) {
        const originalUpdateUI = window.authManager.updateUI;
        window.authManager.updateUI = function() {
            originalUpdateUI.call(this);
            if (window.eventManager) {
                window.eventManager.updateMemberActions();
            }
        };
    }
});