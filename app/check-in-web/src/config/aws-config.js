// AWS Cognito and API Configuration

const CONFIG = {
  // API Gateway endpoints
  apiEndpoint: import.meta.env.VITE_API_ENDPOINT ?? 'https://ms0hk6rhol.execute-api.us-east-1.amazonaws.com',
  checkinsApiEndpoint: import.meta.env.VITE_CHECKINS_API_ENDPOINT ?? 'https://7st1x8hdu6.execute-api.us-east-1.amazonaws.com',

  // Cognito User Pool Configuration
  cognito: {
    userPoolId: 'us-east-1_Xzm1CCwb3',
    userPoolRegion: 'us-east-1',
    appClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '2m20er041ns5iigp4c7m7tkht1',
    domain: 'lantern-lounge-calendar-production.auth.us-east-1.amazoncognito.com'
  },

  // API Routes
  api: {
    getItems: '/calendar/items',
    createItem: '/calendar/items',
    updateItem: '/calendar/items',
    deleteItem: '/calendar/items',
    getPass: '/wallet/pass',
    checkIn: '/checkins',
    recordGuests: '/checkins/:id/guests'
  }
};

export default CONFIG;
