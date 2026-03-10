// Calendar Application with AWS Cognito Authentication and API Integration

// Global state
let currentUser = null;
let currentMonth = new Date();
let selectedDate = null;
let allEvents = [];
let currentEventId = null;
let pendingVerificationEmail = null;

// Cognito User Pool
const poolData = {
    UserPoolId: CONFIG.cognito.userPoolId,
    ClientId: CONFIG.cognito.appClientId
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// ==================== Authentication Functions ====================

function checkAuthStatus() {
    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
            if (err || !session.isValid()) {
                handleSignOut();
                return;
            }

            cognitoUser.getUserAttributes((err, attributes) => {
                if (err) {
                    console.error('Error getting user attributes:', err);
                    return;
                }

                const email = attributes.find(attr => attr.Name === 'email')?.Value;
                const name = attributes.find(attr => attr.Name === 'name')?.Value;

                currentUser = {
                    email: email,
                    name: name,
                    session: session
                };

                updateAuthUI();
                loadCalendar();
            });
        });
    } else {
        currentUser = null;
        updateAuthUI();
        loadCalendar();
    }
}

function updateAuthUI() {
    // Handle navbar auth button (if exists - for events.html)
    const navAuthText = document.getElementById('navAuthText');
    const memberLoginBtn = document.getElementById('memberLoginBtn');

    // Handle calendar page auth elements (if exist - for calendar.html)
    const signInBtn = document.getElementById('signInBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');

    const createEventBtn = document.getElementById('createEventBtn');
    const authMessage = document.getElementById('authMessage');

    if (currentUser) {
        // Update navbar button
        if (navAuthText) {
            navAuthText.textContent = currentUser.name || currentUser.email;
        }
        if (memberLoginBtn) {
            memberLoginBtn.onclick = (e) => {
                e.preventDefault();
                if (confirm('Sign out?')) {
                    handleSignOut();
                }
            };
        }

        // Update calendar page buttons
        if (signInBtn) signInBtn.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            if (userName) userName.textContent = currentUser.name || currentUser.email;
        }

        if (createEventBtn) createEventBtn.style.display = 'block';
        if (authMessage) {
            authMessage.textContent = `Welcome, ${currentUser.name || currentUser.email}! You can create and manage events.`;
        }
    } else {
        // Update navbar button
        if (navAuthText) {
            navAuthText.textContent = 'Member Login';
        }
        if (memberLoginBtn) {
            memberLoginBtn.onclick = (e) => {
                e.preventDefault();
                // Check if sign-in modal exists (on events page)
                if (document.getElementById('signInModal')) {
                    openSignInModal();
                } else {
                    // Redirect to events page to sign in
                    window.location.href = 'events.html';
                }
            };
        }

        // Update calendar page buttons
        if (signInBtn) signInBtn.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';

        if (createEventBtn) createEventBtn.style.display = 'none';
        if (authMessage) {
            authMessage.textContent = 'Sign in to create and manage events';
        }
    }
}

function signIn(email, password) {
    return new Promise((resolve, reject) => {
        const authenticationData = {
            Username: email,
            Password: password
        };

        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

        const userData = {
            Username: email,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
                resolve(result);
                checkAuthStatus();
            },
            onFailure: (err) => {
                reject(err);
            }
        });
    });
}

function signUp(name, email, password) {
    return new Promise((resolve, reject) => {
        const attributeList = [
            new AmazonCognitoIdentity.CognitoUserAttribute({
                Name: 'email',
                Value: email
            }),
            new AmazonCognitoIdentity.CognitoUserAttribute({
                Name: 'name',
                Value: name
            })
        ];

        userPool.signUp(email, password, attributeList, null, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

function confirmRegistration(email, code) {
    return new Promise((resolve, reject) => {
        const userData = {
            Username: email,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.confirmRegistration(code, true, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

function resendConfirmationCode(email) {
    return new Promise((resolve, reject) => {
        const userData = {
            Username: email,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.resendConfirmationCode((err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

function handleSignOut() {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
        cognitoUser.signOut();
    }
    currentUser = null;
    updateAuthUI();
    loadCalendar();
}

function getAuthToken() {
    return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();

        if (!cognitoUser) {
            resolve(null);
            return;
        }

        cognitoUser.getSession((err, session) => {
            if (err || !session.isValid()) {
                resolve(null);
                return;
            }
            resolve(session.getIdToken().getJwtToken());
        });
    });
}

// ==================== API Functions ====================

async function fetchEvents(startDate = null, endDate = null) {
    try {
        showLoading(true);

        let url = `${CONFIG.apiEndpoint}${CONFIG.api.getItems}`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        const token = await getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allEvents = data.items || [];

        return allEvents;
    } catch (error) {
        console.error('Error fetching events:', error);
        showError('Failed to load events. Please try again.');
        return [];
    } finally {
        showLoading(false);
    }
}

async function createEvent(eventData) {
    try {
        showLoading(true);

        const token = await getAuthToken();
        if (!token) {
            throw new Error('You must be signed in to create events');
        }

        const response = await fetch(`${CONFIG.apiEndpoint}${CONFIG.api.createItem}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create event');
        }

        const data = await response.json();
        await loadCalendar();
        return data;
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    } finally {
        showLoading(false);
    }
}

async function updateEvent(eventId, eventData) {
    try {
        showLoading(true);

        const token = await getAuthToken();
        if (!token) {
            throw new Error('You must be signed in to update events');
        }

        const response = await fetch(`${CONFIG.apiEndpoint}${CONFIG.api.updateItem}/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update event');
        }

        const data = await response.json();
        await loadCalendar();
        return data;
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    } finally {
        showLoading(false);
    }
}

async function deleteEvent(eventId) {
    try {
        showLoading(true);

        const token = await getAuthToken();
        if (!token) {
            throw new Error('You must be signed in to delete events');
        }

        const response = await fetch(`${CONFIG.apiEndpoint}${CONFIG.api.deleteItem}/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete event');
        }

        await loadCalendar();
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    } finally {
        showLoading(false);
    }
}

// ==================== Calendar Rendering Functions ====================

async function loadCalendar() {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const startDate = formatDate(firstDay);
    const endDate = formatDate(lastDay);

    await fetchEvents(startDate, endDate);
    renderCalendar();
}

function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Update month header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayOfWeek = firstDay.getDay();
    const lastDateOfMonth = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

    // Generate calendar days
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevLastDate - i;
        const date = new Date(year, month - 1, day);
        calendarDays.appendChild(createDayElement(date, true));
    }

    // Current month days
    for (let day = 1; day <= lastDateOfMonth; day++) {
        const date = new Date(year, month, day);
        calendarDays.appendChild(createDayElement(date, false));
    }

    // Next month days
    const remainingDays = 42 - calendarDays.children.length;
    for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        calendarDays.appendChild(createDayElement(date, true));
    }
}

function createDayElement(date, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';

    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }

    // Check if today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    }

    // Check if selected
    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        dayElement.classList.add('selected');
    }

    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayElement.appendChild(dayNumber);

    // Events for this day
    const dateStr = formatDate(date);
    const dayEvents = allEvents.filter(event => event.date === dateStr);

    if (dayEvents.length > 0) {
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events';

        // Show up to 3 event indicators
        const displayEvents = dayEvents.slice(0, 3);
        displayEvents.forEach(event => {
            const indicator = document.createElement('span');
            indicator.className = 'event-indicator';
            if (!event.isPublic) {
                indicator.classList.add('private');
            }
            eventsContainer.appendChild(indicator);
        });

        if (dayEvents.length > 3) {
            const count = document.createElement('div');
            count.className = 'event-count';
            count.textContent = `+${dayEvents.length - 3} more`;
            eventsContainer.appendChild(count);
        }

        dayElement.appendChild(eventsContainer);
    }

    // Click handler
    dayElement.addEventListener('click', () => {
        selectedDate = date;
        renderCalendar();
        showEventsForDate(date);
    });

    return dayElement;
}

function showEventsForDate(date) {
    const dateStr = formatDate(date);
    const dayEvents = allEvents.filter(event => event.date === dateStr);

    const eventDetails = document.getElementById('eventDetails');
    const eventList = document.getElementById('eventList');

    if (dayEvents.length === 0) {
        eventDetails.style.display = 'none';
        return;
    }

    eventDetails.style.display = 'block';
    eventList.innerHTML = '';

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', dateOptions);

    const header = document.createElement('h3');
    header.textContent = `Events for ${formattedDate}`;
    eventList.appendChild(header);

    dayEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = `event-item ${event.isPublic ? 'public' : 'private'}`;

        const title = document.createElement('div');
        title.className = 'event-title';
        title.textContent = event.title;
        eventItem.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'event-meta';
        if (event.time) {
            const time = document.createElement('span');
            time.textContent = `⏰ ${event.time}`;
            meta.appendChild(time);
        }
        if (event.location) {
            const location = document.createElement('span');
            location.textContent = `📍 ${event.location}`;
            meta.appendChild(location);
        }
        const visibility = document.createElement('span');
        visibility.textContent = event.isPublic ? '🌐 Public' : '🔒 Private';
        meta.appendChild(visibility);
        eventItem.appendChild(meta);

        if (event.description) {
            const description = document.createElement('div');
            description.className = 'event-description';
            description.textContent = event.description;
            eventItem.appendChild(description);
        }

        if (event.createdBy) {
            const owner = document.createElement('div');
            owner.className = 'event-owner';
            owner.textContent = `Created by: ${event.createdBy}`;
            eventItem.appendChild(owner);
        }

        // Only allow editing if user owns the event
        if (currentUser && event.createdBy === currentUser.email) {
            eventItem.style.cursor = 'pointer';
            eventItem.addEventListener('click', () => {
                openEventModal(event);
            });
        }

        eventList.appendChild(eventItem);
    });
}

// ==================== Modal Functions ====================

function openSignInModal() {
    document.getElementById('signInModal').style.display = 'flex';
    document.getElementById('authError').style.display = 'none';
    document.getElementById('authSuccess').style.display = 'none';
    showSignInForm();
}

function closeSignInModal() {
    document.getElementById('signInModal').style.display = 'none';
    document.getElementById('signInEmail').value = '';
    document.getElementById('signInPassword').value = '';
    document.getElementById('signUpName').value = '';
    document.getElementById('signUpEmail').value = '';
    document.getElementById('signUpPassword').value = '';
    document.getElementById('verificationCode').value = '';
    pendingVerificationEmail = null;
}

function showSignInForm() {
    document.getElementById('signInForm').style.display = 'block';
    document.getElementById('signUpForm').style.display = 'none';
    document.getElementById('verifyEmailForm').style.display = 'none';
    document.getElementById('authError').style.display = 'none';
    document.getElementById('authSuccess').style.display = 'none';
}

function showSignUpForm() {
    document.getElementById('signInForm').style.display = 'none';
    document.getElementById('signUpForm').style.display = 'block';
    document.getElementById('verifyEmailForm').style.display = 'none';
    document.getElementById('authError').style.display = 'none';
    document.getElementById('authSuccess').style.display = 'none';
}

function showVerifyEmailForm(email) {
    document.getElementById('signInForm').style.display = 'none';
    document.getElementById('signUpForm').style.display = 'none';
    document.getElementById('verifyEmailForm').style.display = 'block';
    document.getElementById('verifyEmailAddress').textContent = email;
    document.getElementById('authError').style.display = 'none';
    document.getElementById('authSuccess').style.display = 'none';
    pendingVerificationEmail = email;
}

function openEventModal(event = null) {
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('eventModalTitle');
    const deleteBtn = document.getElementById('deleteEvent');
    const form = document.getElementById('eventForm');

    if (event) {
        // Edit mode
        modalTitle.textContent = 'Edit Event';
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventIsPublic').checked = event.isPublic === 1;
        deleteBtn.style.display = 'block';
        currentEventId = event.id;
    } else {
        // Create mode
        modalTitle.textContent = 'Create Event';
        form.reset();
        if (selectedDate) {
            document.getElementById('eventDate').value = formatDate(selectedDate);
        }
        deleteBtn.style.display = 'none';
        currentEventId = null;
    }

    document.getElementById('eventError').style.display = 'none';
    modal.style.display = 'flex';
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
    document.getElementById('eventForm').reset();
    currentEventId = null;
}

// ==================== Utility Functions ====================

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
}

function showError(message, elementId = 'authError') {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function showSuccess(message, elementId = 'authSuccess') {
    const successElement = document.getElementById(elementId);
    successElement.textContent = message;
    successElement.style.display = 'block';
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 5000);
}

// ==================== Event Listeners ====================

document.addEventListener('DOMContentLoaded', () => {
    // Check auth status on load
    checkAuthStatus();

    // Navigation controls
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        loadCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        loadCalendar();
    });

    document.getElementById('todayBtn').addEventListener('click', () => {
        currentMonth = new Date();
        selectedDate = new Date();
        loadCalendar();
        showEventsForDate(selectedDate);
    });

    // Auth buttons (only on calendar.html)
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    if (signInBtn) signInBtn.addEventListener('click', openSignInModal);
    if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);

    // Member Login button (on events.html) - handled in updateAuthUI()

    // Sign in/up modals
    document.getElementById('showSignUp').addEventListener('click', (e) => {
        e.preventDefault();
        showSignUpForm();
    });

    document.getElementById('showSignIn').addEventListener('click', (e) => {
        e.preventDefault();
        showSignInForm();
    });

    document.getElementById('showVerifyEmail').addEventListener('click', (e) => {
        e.preventDefault();
        // Get email from sign-in form if entered, otherwise prompt
        let email = document.getElementById('signInEmail').value;
        if (!email) {
            email = prompt('Enter your email address to resend verification code:');
            if (!email) return; // User cancelled
        }
        showVerifyEmailForm(email);
    });

    // Sign in form
    document.getElementById('signInSubmit').addEventListener('click', async () => {
        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;

        try {
            await signIn(email, password);
            closeSignInModal();
        } catch (error) {
            showError(error.message || 'Sign in failed');
        }
    });

    // Sign up form
    document.getElementById('signUpSubmit').addEventListener('click', async () => {
        const name = document.getElementById('signUpName').value;
        const email = document.getElementById('signUpEmail').value;
        const password = document.getElementById('signUpPassword').value;

        try {
            await signUp(name, email, password);
            showVerifyEmailForm(email);
        } catch (error) {
            showError(error.message || 'Sign up failed');
        }
    });

    // Verify email form
    document.getElementById('verifySubmit').addEventListener('click', async () => {
        const code = document.getElementById('verificationCode').value;

        if (!pendingVerificationEmail) {
            showError('No pending verification. Please sign up first.');
            return;
        }

        try {
            await confirmRegistration(pendingVerificationEmail, code);
            showSuccess('Email verified successfully! You can now sign in.');
            setTimeout(() => {
                showSignInForm();
            }, 2000);
        } catch (error) {
            showError(error.message || 'Verification failed. Please check your code.');
        }
    });

    // Resend verification code
    document.getElementById('resendCode').addEventListener('click', async (e) => {
        e.preventDefault();

        if (!pendingVerificationEmail) {
            showError('No pending verification. Please sign up first.');
            return;
        }

        try {
            await resendConfirmationCode(pendingVerificationEmail);
            showSuccess('Verification code resent! Check your email.');
        } catch (error) {
            showError(error.message || 'Failed to resend code.');
        }
    });

    // Back to sign in from verification
    document.getElementById('backToSignIn').addEventListener('click', (e) => {
        e.preventDefault();
        showSignInForm();
    });

    // Event modal
    document.getElementById('createEventBtn').addEventListener('click', () => {
        openEventModal();
    });

    document.getElementById('eventForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const eventData = {
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            location: document.getElementById('eventLocation').value,
            description: document.getElementById('eventDescription').value,
            isPublic: document.getElementById('eventIsPublic').checked
        };

        try {
            if (currentEventId) {
                await updateEvent(currentEventId, eventData);
            } else {
                await createEvent(eventData);
            }
            closeEventModal();
        } catch (error) {
            showError(error.message || 'Failed to save event', 'eventError');
        }
    });

    document.getElementById('cancelEvent').addEventListener('click', closeEventModal);

    document.getElementById('deleteEvent').addEventListener('click', async () => {
        if (!currentEventId) return;

        if (confirm('Are you sure you want to delete this event?')) {
            try {
                await deleteEvent(currentEventId);
                closeEventModal();
            } catch (error) {
                showError(error.message || 'Failed to delete event', 'eventError');
            }
        }
    });

    // Close modals
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            modal.style.display = 'none';
        });
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
});
