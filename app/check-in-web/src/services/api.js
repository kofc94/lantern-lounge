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
 * Fetch a wallet pass (mock token) for the user
 * @param {string} authToken - JWT auth token (required)
 * @returns {Promise<Object>} - Wallet pass info
 */
export const fetchWalletPass = async (authToken) => {
  if (!authToken) {
    throw new Error('You must be signed in to get a wallet pass');
  }

  const base = CONFIG.checkinsApiEndpoint || CONFIG.apiEndpoint;
  try {
    const response = await fetch(`${base}${CONFIG.api.getPass}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching wallet pass:', error);
    throw error;
  }
};

/**
 * Record a check-in (Staff only)
 * @param {string} walletToken - Token from guest's QR code (optional)
 * @param {string} email - Guest's email address (optional)
 * @param {string} authToken - Staff JWT auth token (required)
 * @returns {Promise<Object>} - Check-in result
 */
export const checkInUser = async (walletToken, email, authToken) => {
  if (!authToken) {
    throw new Error('Unauthorized');
  }

  const base = CONFIG.checkinsApiEndpoint || CONFIG.apiEndpoint;
  try {
    const response = await fetch(`${base}${CONFIG.api.checkIn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ 
        wallet_token: walletToken,
        email: email
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to check in');
    }

    return await response.json();
  } catch (error) {
    console.error('Error during check-in:', error);
    throw error;
  }
};

export default {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchWalletPass,
  checkInUser
};
