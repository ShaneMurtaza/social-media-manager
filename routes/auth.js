// Add these lines at the TOP of routes/auth.js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
import express from 'express';
import { query } from '../db.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = express.Router();

// Email transporter configuration
const transporter = nodemailer.createTransporter({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send verification email
router.post('/send-verification', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if user exists
        const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userId = userResult.rows[0].id;
        
        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Save verification token
        await query(
            'INSERT INTO email_verifications (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [userId, token, expiresAt]
        );
        
        // Send verification email
        const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}`;
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email Address',
            html: `
                <h2>Email Verification</h2>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationUrl}">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
            `
        });
        
        res.json({ message: 'Verification email sent' });
    } catch (error) {
        console.error('Error sending verification email:', error);
        res.status(500).json({ error: 'Failed to send verification email' });
    }
});

// Verify email
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        
        // Find verification token
        const verificationResult = await query(
            'SELECT * FROM email_verifications WHERE token = $1 AND expires_at > NOW()',
            [token]
        );
        
        if (verificationResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }
        
        const verification = verificationResult.rows[0];
        
        // Update user as verified
        await query(
            'UPDATE users SET email_verified = TRUE WHERE id = $1',
            [verification.user_id]
        );
        
        // Delete used verification token
        await query('DELETE FROM email_verifications WHERE id = $1', [verification.id]);
        
        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
});

// Admin approval endpoints
router.get('/admin/pending-users', async (req, res) => {
    try {
        const result = await query(`
            SELECT u.id, u.name, u.email, u.created_at 
            FROM users u 
            WHERE u.email_verified = TRUE AND u.admin_approved = FALSE
            ORDER BY u.created_at DESC
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ error: 'Failed to fetch pending users' });
    }
});

router.post('/admin/approve-user', async (req, res) => {
    try {
        const { userId, adminId } = req.body;
        
        await query(
            'UPDATE users SET admin_approved = TRUE WHERE id = $1',
            [userId]
        );
        
        await query(
            'INSERT INTO admin_approvals (user_id, status, reviewed_by, reviewed_at) VALUES ($1, $2, $3, NOW())',
            [userId, 'approved', adminId]
        );
        
        res.json({ message: 'User approved successfully' });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ error: 'Failed to approve user' });
    }
});

router.post('/admin/reject-user', async (req, res) => {
    try {
        const { userId, adminId, reason } = req.body;
        
        await query(
            'INSERT INTO admin_approvals (user_id, status, reviewed_by, reviewed_at) VALUES ($1, $2, $3, NOW())',
            [userId, 'rejected', adminId]
        );
        
        // Optionally, you might want to delete the user or keep them for records
        res.json({ message: 'User rejected successfully' });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ error: 'Failed to reject user' });
    }
});

export default router;