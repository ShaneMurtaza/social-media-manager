const express = require('express');
const { query } = require('../db'); // Changed from db to {query}
const router = express.Router();

// Route to schedule a post
router.post('/schedule', async (req, res) => {
    try {
        const { content, media_url, scheduled_for, platforms } = req.body;
        const sql = `INSERT INTO scheduled_posts (content, media_url, scheduled_for, platforms) VALUES ($1, $2, $3, $4) RETURNING id`;
        const result = await query(sql, [content, media_url, scheduled_for, JSON.stringify(platforms)]);
        res.json({ id: result.rows[0].id });
    } catch (err) {
        console.error('Error scheduling post:', err);
        res.status(500).json({ error: err.message });
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