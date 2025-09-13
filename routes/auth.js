// Remove the nodemailer import and replace with Resend
// Add this line at the TOP of the file with the other imports
import bcrypt from 'bcrypt';
import express from 'express';
import { query } from '../db.js';
import crypto from 'crypto';
// Remove this line: import nodemailer from 'nodemailer';
import { Resend } from 'resend'; // Add Resend import

const router = express.Router();

// 2. REPLACE THE EMAIL TRANSPORTER CONFIGURATION WITH RESEND
// Remove the entire transporter configuration block and replace with:
const resend = new Resend(process.env.RESEND_API_KEY);

// 3. FIND THE "/send-verification" ROUTE AND REPLACE THE EMAIL SENDING PART
// Look for this section in your code:
//   await transporter.sendMail({ ... });
// REPLACE THAT ENTIRE BLOCK with the code below:

        // Send verification email using Resend
        const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}`;
        
        const { data, error } = await resend.emails.send({
          from: 'onboarding@resend.dev', // You can change this later after verifying your domain with Resend
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

        // User Registration Endpoint
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    try {
        const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // 2. Hash the password (You need to install bcrypt: npm install bcrypt)
        // For now, we'll just store it (THIS IS INSECURE - we will fix this next)
        const hashedPassword = password; // This is bad! We will fix this.

        // 3. Save the new user to the database
        const newUser = await query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
            [name, email, hashedPassword]
        );

        const userId = newUser.rows[0].id;

        // 4. NOW, CALL THE EXISTING VERIFICATION LOGIC
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
            // Even if email fails, the user is created. You might want to handle this differently.
        }

        console.log('Email sent successfully:', data);
        res.json({ message: 'User registered successfully. Please check your email to verify your account.' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});
      // Hash the password with a salt round of 10
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Email sent successfully:', data);
        
        res.json({ message: 'Verification email sent' });