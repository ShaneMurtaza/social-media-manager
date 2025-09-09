const express = require('express');
const { query } = require('../db'); // Import from your db.js file
const { withRetry } = require('../utils/databaseRetry'); // Import the retry utility
const router = express.Router();

// Route to schedule a post
router.post('/schedule', async (req, res) => {
    try {
        const { content, media_url, scheduled_for, platforms } = req.body;
        
        // Use the retry utility for database operations
        const result = await withRetry(async () => {
            const sql = `INSERT INTO scheduled_posts (content, media_url, scheduled_for, platforms) VALUES ($1, $2, $3, $4) RETURNING id`;
            return await query(sql, [content, media_url, scheduled_for, JSON.stringify(platforms)]);
        });
        
        res.json({ id: result.rows[0].id });
    } catch (err) {
        console.error('Error scheduling post:', err);
        res.status(500).json({ error: 'Failed to schedule post. Please try again.' });
    }
});

// Route to get upcoming posts
router.get('/upcoming', async (req, res) => {
    try {
        const result = await withRetry(async () => {
            const sql = `SELECT * FROM scheduled_posts WHERE is_posted = false ORDER BY scheduled_for ASC`;
            return await query(sql);
        });
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching upcoming posts:', err);
        res.status(500).json({ error: err.message });
    }
});

// Route to get recent activity
router.get('/recent', async (req, res) => {
    try {
        const result = await withRetry(async () => {
            const sql = `SELECT * FROM scheduled_posts WHERE is_posted = true ORDER BY posted_at DESC LIMIT 5`;
            return await query(sql);
        });
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching recent posts:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;