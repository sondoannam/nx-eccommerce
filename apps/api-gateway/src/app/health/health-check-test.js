// health-check-test.js
// This script checks all health endpoints in the system
// Run with: node health-check-test.js

const http = require('http');

// Define the endpoints to check
const endpoints = [
  {
    name: 'API Gateway Health',
    host: 'localhost',
    port: 8080,
    path: '/health',
  },
  {
    name: 'API Gateway Liveness',
    host: 'localhost',
    port: 8080,
    path: '/health/liveness',
  },
  {
    name: 'API Gateway Readiness',
    host: 'localhost',
    port: 8080,
    path: '/health/readiness',
  },
  {
    name: 'API Gateway Services',
    host: 'localhost',
    port: 8080,
    path: '/api/health/services',
  },
  {
    name: 'Auth Service Health',
    host: 'localhost',
    port: 8001,
    path: '/health',
  },
  {
    name: 'Auth Service Liveness',
    host: 'localhost',
    port: 8001,
    path: '/health/liveness',
  },
  {
    name: 'Auth Service Readiness',
    host: 'localhost',
    port: 8001,
    path: '/health/readiness',
  },
];

console.log('===== MULTI-VENDOR SAAS HEALTH CHECK =====');
console.log(`${new Date().toISOString()}\n`);

// Check all endpoints in sequence
let currentIndex = 0;

function checkNextEndpoint() {
  if (currentIndex >= endpoints.length) {
    console.log('\n===== ALL HEALTH CHECKS COMPLETED =====');
    return;
  }

  const endpoint = endpoints[currentIndex];
  currentIndex++;

  const options = {
    host: endpoint.host,
    port: endpoint.port,
    path: endpoint.path,
    method: 'GET',
    timeout: 5000, // 5 seconds
  };

  console.log(
    `\nTesting: ${endpoint.name} (${endpoint.host}:${endpoint.port}${endpoint.path})...`
  );

  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const parsedData = JSON.parse(data);

        if (endpoint.path.includes('/health')) {
          if (parsedData.status === 'ok') {
            console.log('✅ Overall status: OK');
          } else {
            console.log('❌ Overall status:', parsedData.status);
          }
        }

        // Display details for full health checks
        if (endpoint.path === '/health' && parsedData.details) {
          console.log('\nDetails:');
          Object.keys(parsedData.details).forEach((key) => {
            const status = parsedData.details[key].status;
            console.log(`${status === 'up' ? '✅' : '❌'} ${key}: ${status}`);
          });
        } else {
          // Just show the response for other endpoints
          console.log('Response:');
          console.log(JSON.stringify(parsedData, null, 2));
        }
      } catch (e) {
        console.error('Error parsing response:', e);
        console.log('Raw response:', data);
      }

      // Continue with the next endpoint
      checkNextEndpoint();
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Problem with health check: ${e.message}`);
    checkNextEndpoint(); // Continue despite the error
  });

  req.on('timeout', () => {
    console.error('❌ Connection timeout');
    req.destroy();
    checkNextEndpoint(); // Continue despite the timeout
  });

  req.end();
}

// Start checking endpoints
checkNextEndpoint();
