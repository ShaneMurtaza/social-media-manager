import express from 'express';
import path from 'path';
import { query } from './db.js';

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// API Routes
import postsRouter from './routes/posts.js';
import socialAuthRouter from './routes/socialAuth.js';
import uploadRouter from './routes/upload.js';

app.use('/api/posts', postsRouter);
app.use('/api/auth', socialAuthRouter);
app.use('/api/upload', uploadRouter);

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
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});