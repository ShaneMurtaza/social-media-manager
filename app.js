const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/posts', require('./routes/posts'));
app.use('/api/auth', require('./routes/socialAuth'));
app.use('/api/upload', require('./routes/upload'));

// Add this after your other app.use() routes
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time');
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      time: result.rows[0].current_time 
    });
  } catch (error) {
    res.json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Social Media Manager API is running!' });
});

// Serve the main page for all other requests (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});