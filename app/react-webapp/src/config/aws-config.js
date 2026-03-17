// AWS Cognito and API Configuration

const CONFIG = {
  // API Gateway endpoint — empty in dev (Vite proxies /calendar/* to mock server)
  apiEndpoint: import.meta.env.VITE_API_ENDPOINT ?? '',

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
