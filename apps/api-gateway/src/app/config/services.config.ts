/**
 * Configuration for all microservices in the system
 */
export const servicesConfig = [
  {
    path: 'auth-service',
    targetUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
    description: 'Authentication Service',
  },
  // Uncomment and customize these as you add more services
  // {
  //   path: 'user-service',
  //   targetUrl: process.env.USER_SERVICE_URL || 'http://localhost:8002',
  //   description: 'User Management Service'
  // },
  // {
  //   path: 'payment-service',
  //   targetUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8003',
  //   description: 'Payment Processing Service'
  // },
];
