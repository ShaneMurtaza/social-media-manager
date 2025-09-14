import { query } from '../db.js';

export const requireAuth = async (req, res, next) => {
    try {
        // Get session token from headers
        const sessionToken = req.headers.authorization?.replace('Bearer ', '');
        
        if (!sessionToken) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Find user by session token
        const userResult = await query(
            'SELECT * FROM users WHERE session_token = $1',
            [sessionToken]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid session token' });
        }

        const user = userResult.rows[0];

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(403).json({ error: 'Email not verified' });
        }

        // Check if admin approval is required and if the user is admin approved
        if (!user.admin_approved) {
            return res.status(403).json({ error: 'Account pending admin approval' });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};