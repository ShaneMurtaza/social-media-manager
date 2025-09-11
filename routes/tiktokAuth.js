import express from 'express';
import axios from 'axios';
import { query } from '../db.js';
import { withRetry } from '../utils/databaseRetry.js';

const router = express.Router();

// TikTok OAuth initialization
router.get('/connect', (req, res) => {
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.upload&response_type=code&redirect_uri=${process.env.TIKTOK_REDIRECT_URI}&state=${req.query.user_id}`;
    res.redirect(authUrl);
});

// TikTok OAuth callback
router.get('/callback', async (req, res) => {
    try {
        const { code, state: userId } = req.query;
        
        // Exchange code for access token
        const tokenResponse = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
            client_key: process.env.TIKTOK_CLIENT_KEY,
            client_secret: process.env.TIKTOK_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.TIKTOK_REDIRECT_URI
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        
        // Get user info
        const userResponse = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        const userData = userResponse.data.data.user;
        
        // Store in database
        await withRetry(async () => {
            const sql = `INSERT INTO tiktok_accounts (user_id, tiktok_user_id, access_token, refresh_token, expires_at, username, display_name, avatar_url) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                         ON CONFLICT (tiktok_user_id) 
                         DO UPDATE SET access_token = $3, refresh_token = $4, expires_at = $5, updated_at = CURRENT_TIMESTAMP`;
            
            return await query(sql, [
                userId,
                userData.open_id,
                access_token,
                refresh_token,
                new Date(Date.now() + expires_in * 1000),
                userData.username,
                userData.display_name,
                userData.avatar_url
            ]);
        });

        res.redirect('/dashboard?tiktok_connected=true');
    } catch (error) {
        console.error('TikTok auth error:', error.response?.data || error.message);
        res.redirect('/dashboard?tiktok_error=true');
    }
});

export default router;