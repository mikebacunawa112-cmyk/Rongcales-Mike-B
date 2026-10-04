const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'lab3-secret-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory data store
let users = [];
let nextId = 1;

// Seed initial admin user
users.push({
  id: nextId++,
  username: 'admin',
  password: bcrypt.hashSync('admin123', 10),
  role: 'admin'
});

// Middleware: Verify JWT Token
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Handle optional malformed header without Bearer prefix safely
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid Authorization header format' });
  }

  const token = parts[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

// Middleware: Restrict access to Admins only
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'REST API is running' });
});

// Get All Users (Admin Only)
app.get('/api/users', auth, adminOnly, (req, res) => {
  const safeUsers = users.map(user => ({
    id: user.id,
    username: user.username,
    role: user.role
  }));
  res.json(safeUsers);
});

// Get Single User Profile
app.get('/api/users/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (req.user.id !== user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.json({ id: user.id, username: user.username, role: user.role });
});

// User Registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: nextId++, username, password: hashedPassword, role: 'user' };
  users.push(newUser);

  res.status(201).json({
    message: 'User registered successfully',
    user: { id: newUser.id, username: newUser.username, role: newUser.role }
  });
});

// User Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// Update User
app.put('/api/users/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (req.user.id !== user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { username, password, role } = req.body;

  // Prevent changing to an already taken username
  if (username && username !== user.username) {
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    user.username = username;
  }

  if (password) user.password = await bcrypt.hash(password, 10);
  if (role && req.user.role === 'admin') user.role = role;

  res.json({
    message: 'User updated successfully',
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// Delete User (Admin Only)
app.delete('/api/users/:id', auth, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  const deletedUser = users.splice(index, 1)[0];
  res.json({
    message: 'User deleted successfully',
    user: { id: deletedUser.id, username: deletedUser.username }
  });
});

// Get Profile
app.get('/api/profile', auth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ id: user.id, username: user.username, role: user.role });
});

// Default Route Redirect
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Start Server
app.listen(PORT, () => {
  // FIXED: Added missing backticks to template literal
  console.log(`Server running on http://localhost:${PORT}`);
});