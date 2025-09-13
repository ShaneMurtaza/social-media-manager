import express from 'express';
import { query } from '../db.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Resend } from 'resend';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// Send verification email endpoint
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
        
        // Send verification email using Resend
        const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;
        
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Verify Your Email Address',
            html: `
                <h2>Email Verification</h2>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationUrl}">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            return res.status(500).json({ error: 'Failed to send verification email' });
        }

        console.log('Email sent successfully:', data);
        res.json({ message: 'Verification email sent' });
    } catch (error) {
        console.error('Error sending verification email:', error);
        res.status(500).json({ error: 'Failed to send verification email' });
    }
});

// Verify email endpoint
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

// User Registration Endpoint
router.post('/register', async (req, res) => {
    const { name, email, password_hash } = req.body;

    // 1. Check if user already exists
    try {
        const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // 2. Hash the password with a salt round of 10
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Save the new user to the database
        const newUser = await query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [name, email, hashedPassword]
);

        const userId = newUser.rows[0].id;

        // 4. Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Save verification token
        await query(
            'INSERT INTO email_verifications (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [userId, token, expiresAt]
        );

        // Send verification email using Resend
        const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;

        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Verify Your Email Address',
            html: `
                <h2>Email Verification</h2>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationUrl}">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            // Even if email fails, the user is created
            return res.json({ message: 'User registered successfully. Please contact support for verification.' });
        }

        console.log('Email sent successfully:', data);
        res.json({ message: 'User registered successfully. Please check your email to verify your account.' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
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