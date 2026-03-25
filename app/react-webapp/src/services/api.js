import CONFIG from '../config/aws-config';

/**
 * Fetch events from the API
 * @param {string} startDate - Start date for filtering (optional)
 * @param {string} endDate - End date for filtering (optional)
 * @param {string} authToken - JWT auth token (optional)
 * @returns {Promise<Array>} - Array of events
 */
export const fetchEvents = async (startDate = null, endDate = null, authToken = null) => {
  try {
    let url = `${CONFIG.apiEndpoint}${CONFIG.api.getItems}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

/**
 * Create a new event
 * @param {Object} eventData - Event data to create
 * @param {string} authToken - JWT auth token (required)
 * @returns {Promise<Object>} - Created event
 */
export const createEvent = async (eventData, authToken) => {
  if (!authToken) {
    throw new Error('You must be signed in to create events');
  }

  try {
    const response = await fetch(`${CONFIG.apiEndpoint}${CONFIG.api.createItem}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create event');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Update an existing event
 * @param {string} eventId - Event ID to update
 * @param {Object} eventData - Updated event data
 * @param {string} authToken - JWT auth token (required)
 * @returns {Promise<Object>} - Updated event
 */
export const updateEvent = async (eventId, eventData, authToken) => {
  if (!authToken) {
    throw new Error('You must be signed in to update events');
  }

  try {
    const response = await fetch(`${CONFIG.apiEndpoint}${CONFIG.api.updateItem}/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update event');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

/**
 * Delete an event
 * @param {string} eventId - Event ID to delete
 * @param {string} authToken - JWT auth token (required)
 * @returns {Promise<void>}
 */
export const deleteEvent = async (eventId, authToken) => {
  if (!authToken) {
    throw new Error('You must be signed in to delete events');
  }

  try {
    const response = await fetch(`${CONFIG.apiEndpoint}${CONFIG.api.deleteItem}/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete event');
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * Fetch all users (Admin only)
 * @param {string} authToken - JWT auth token
 * @param {string} paginationToken - Optional token for next page
 * @returns {Promise<Object>} - Users and next pagination token
 */
export const fetchUsers = async (authToken, paginationToken = null) => {
  if (!authToken) throw new Error('Authentication required');

  try {
    let url = `${CONFIG.usersApiEndpoint}/users`;
    if (paginationToken) {
      url += `?paginationToken=${encodeURIComponent(paginationToken)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Update a user's role profile (Admin only)
 * @param {string} username - Target username
 * @param {string} profile - New role ('admin', 'member', 'limited')
 * @param {string} authToken - JWT auth token
 */
export const updateUserRole = async (username, profile, authToken) => {
  if (!authToken) throw new Error('Authentication required');

  try {
    const response = await fetch(`${CONFIG.usersApiEndpoint}/users/${username}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ profile })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export default {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchUsers,
  updateUserRole
};
