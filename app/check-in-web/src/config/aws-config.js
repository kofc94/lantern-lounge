// AWS Cognito and API Configuration

const CONFIG = {
  // API Gateway endpoints
  apiEndpoint: import.meta.env.VITE_API_ENDPOINT ?? 'https://ms0hk6rhol.execute-api.us-east-1.amazonaws.com',
  checkinsApiEndpoint: import.meta.env.VITE_CHECKINS_API_ENDPOINT ?? 'https://7st1x8hdu6.execute-api.us-east-1.amazonaws.com',

  // Cognito User Pool Configuration
  cognito: {
    userPoolId: 'us-east-1_Xzm1CCwb3',
    userPoolRegion: 'us-east-1',
    appClientId: '6n4p327ohinulk7g8g6nr66hgv',
    domain: 'lantern-lounge-calendar-production.auth.us-east-1.amazoncognito.com'
  },

  // API Routes
  api: {
    getItems: '/calendar/items',
    createItem: '/calendar/items',
    updateItem: '/calendar/items',
    deleteItem: '/calendar/items',
    getPass: '/wallet/pass',
    checkIn: '/checkin',
    checkInScan: '/checkin/scan'
  }
};

export default CONFIG;
