const express = require('express');
const { query } = require('../db');
const { withRetry } = require('../utils/databaseRetry');
const router = express.Router();

// Route to schedule a post with enhanced error handling
router.post('/schedule', async (req, res) => {
  try {
    const { content, media_url, scheduled_for, platforms } = req.body;
    
    // Validate required fields
    if (!content || !scheduled_for || !platforms || platforms.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, scheduled_for, or platforms' 
      });
    }

    const result = await withRetry(async () => {
      const sql = `INSERT INTO scheduled_posts (content, media_url, scheduled_for, platforms) VALUES ($1, $2, $3, $4) RETURNING id`;
      return await query(sql, [content, media_url, scheduled_for, JSON.stringify(platforms)]);
    });
    
    res.json({ 
      success: true,
      id: result.rows[0].id,
      message: 'Post scheduled successfully!'
    });
  } catch (err) {
    console.error('Error scheduling post:', err);
    
    // Specific error messages
    if (err.message.includes('connection')) {
      res.status(503).json({ error: 'Database connection failed. Please try again.' });
    } else if (err.message.includes('scheduled_posts')) {
      res.status(500).json({ error: 'Database error. Please check your table structure.' });
    } else {
      res.status(500).json({ error: 'Failed to schedule post. Please try again.' });
    }
  }
});

// Route to get upcoming posts
router.get('/upcoming', async (req, res) => {
  try {
    const sql = `SELECT * FROM scheduled_posts WHERE is_posted = false ORDER BY scheduled_for ASC`;
    const result = await query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching upcoming posts:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route to get recent activity
router.get('/recent', async (req, res) => {
  try {
    const sql = `SELECT * FROM scheduled_posts WHERE is_posted = true ORDER BY posted_at DESC LIMIT 5`;
    const result = await query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching recent posts:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;