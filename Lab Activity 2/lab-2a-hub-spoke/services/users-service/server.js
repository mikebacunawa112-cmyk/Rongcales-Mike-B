const express = require('express');
const app = express();
const PORT = 5001;

// Sample data - 5 users
const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@email.com', role: 'Admin' },
  { id: 2, name: 'Bob Smith', email: 'bob@email.com', role: 'User' },
  { id: 3, name: 'Carol Davis', email: 'carol@email.com', role: 'Editor' },
  { id: 4, name: 'David Wilson', email: 'david@email.com', role: 'User' },
  { id: 5, name: 'Eva Martinez', email: 'eva@email.com', role: 'User' }
];

// Endpoint: GET /users
app.get('/users', (req, res) => {
  console.log('User Service: Returning', users.length, 'users');
  res.json({
    service: 'User Service',
    status: 'success',
    count: users.length,
    data: users,
    timestamp: new Date().toISOString()
  });
});

// Health check: GET /ping
app.get('/ping', (req, res) => {
  res.json({ status: 'online', service: 'User Service' });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(40));
  console.log('USER SERVICE STARTED');
  console.log('='.repeat(40));
  console.log(`Port: ${PORT}`);
  console.log(`GET /users    Returns ${users.length} users`);
  console.log(`GET /ping     Health check`);
  console.log('='.repeat(40));
});