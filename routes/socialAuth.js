const express = require('express');
const axios = require('axios');
const router = express.Router();

// Route to initiate Facebook authentication
router.get('/facebook', (req, res) => {
    const facebookLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.FB_APP_ID}&redirect_uri=${process.env.FB_REDIRECT_URI}&scope=pages_manage_posts,pages_read_engagement,business_management`;
    res.redirect(facebookLoginUrl);
});

// Route to handle Facebook callback
router.get('/facebook/callback', async (req, res) => {
    try {
        const { code } = req.query;

        // Exchange code for access token
        const tokenResponse = await axios.get(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FB_APP_ID}&redirect_uri=${process.env.FB_REDIRECT_URI}&client_secret=${process.env.FB_APP_SECRET}&code=${code}`);
        const userAccessToken = tokenResponse.data.access_token;

        // Use the User Token to get Page Access Token
        const pageResponse = await axios.get(`https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`);
        const pageAccessToken = pageResponse.data.data[0].access_token; // Gets the first page

        // TODO: Save pageAccessToken to database

        res.send('Your Facebook Page was connected successfully! You can now schedule posts to it.');
    } catch (error) {
        console.error('Facebook OAuth error:', error.response.data);
        res.status(500).send('Authentication failed');
    }
});

module.exports = router;