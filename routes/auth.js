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
    // FIX 1: Destructure 'password' from req.body, not 'password_hash'
    const { name, email, password } = req.body; // Changed from password_hash to password

    // 1. Check if user already exists
    try {
        const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // 2. Hash the password with a salt round of 10
        const hashedPassword = await bcrypt.hash(password, 10); // Now using 'password'

        // 3. Save the new user to the database
        // FIX 2: Ensure your 'users' table has the exact columns you're inserting into.
        const newUser = await query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
            [name, email, hashedPassword]
        );

        const userId = newUser.rows[0].id;

        // 4. Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Save verification token
        // FIX 3: Ensure the 'email_verifications' table exists with columns user_id, token, expires_at
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
        // FIX 4: This is the most important fix for debugging.
        // The generic error was likely caused by an error object that wasn't being properly logged.
        console.error('Registration error details:', error); // Enhanced logging
        res.status(500).json({ error: 'Failed to register user. Please check the server logs for details.' });
    }
});

// ... (Admin approval endpoints remain the same) ...

export default router;