// AWS Cognito and API Configuration

const CONFIG = {
  // API Gateway endpoints
  apiEndpoint: import.meta.env.VITE_API_ENDPOINT || (import.meta.env.DEV ? 'http://localhost:4566' : ''),
  usersApiEndpoint: import.meta.env.VITE_USERS_API_ENDPOINT || (import.meta.env.DEV ? 'http://localhost:4566' : ''),

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
    deleteItem: '/calendar/items'
  }
};

export default CONFIG;
