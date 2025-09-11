import express from 'express';
import axios from 'axios';
import { query } from '../db.js';
import { withRetry } from '../utils/databaseRetry.js';

const router = express.Router();

// Upload video to TikTok
router.post('/upload', async (req, res) => {
    try {
        const { userId, videoUrl, caption, scheduleTime } = req.body;
        
        // Get user's TikTok access token
        const accountResult = await query(
            'SELECT access_token FROM tiktok_accounts WHERE user_id = $1',
            [userId]
        );

        if (accountResult.rows.length === 0) {
            return res.status(400).json({ error: 'TikTok account not connected' });
        }

        const accessToken = accountResult.rows[0].access_token;

        // Initialize upload
        const initResponse = await axios.post('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', 
            { source: 'PULL_FROM_URL', video_url: videoUrl },
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        const { publish_id } = initResponse.data.data;

        // Check upload status
        let status = 'processing';
        let videoId = null;

        while (status === 'processing') {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const statusResponse = await axios.get(
                `https://open.tiktokapis.com/v2/post/publish/status/fetch/?publish_id=${publish_id}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );

            status = statusResponse.data.data.status;
            videoId = statusResponse.data.data.video_id;
        }

        if (status === 'success') {
            // Store in database
            await withRetry(async () => {
                const sql = `INSERT INTO tiktok_videos (user_id, tiktok_account_id, video_url, caption, schedule_time, tiktok_video_id, status) 
                             VALUES ($1, $2, $3, $4, $5, $6, 'published')`;
                
                return await query(sql, [
                    userId,
                    accountResult.rows[0].id,
                    videoUrl,
                    caption,
                    scheduleTime,
                    videoId
                ]);
            });

            res.json({ success: true, videoId, message: 'Video published successfully!' });
        } else {
            res.status(500).json({ error: 'Video upload failed', details: status });
        }

    } catch (error) {
        console.error('TikTok upload error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to upload video to TikTok' });
    }
});

export default router;