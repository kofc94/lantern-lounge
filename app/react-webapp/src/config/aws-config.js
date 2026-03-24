// AWS Cognito and API Configuration

const CONFIG = {
  // API Gateway endpoint — default to LocalStack if in development and no env var provided
  apiEndpoint: import.meta.env.VITE_API_ENDPOINT ?? (import.meta.env.DEV ? 'http://localhost:4566/restapis/local/local/_user_request_' : ''),

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
