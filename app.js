const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static('public'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Import routes
const uploadRoutes = require('./routes/upload');
const socialAuthRoutes = require('./routes/socialAuth');
const postsRoutes = require('./routes/posts');

// Use Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', socialAuthRoutes);
app.use('/api/posts', postsRoutes);

// Basic home route
app.get('/', (req, res) => {
  res.send('Social Media Manager API is running!');
});

// Start the server
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});