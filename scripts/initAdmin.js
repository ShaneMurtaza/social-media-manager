import { query } from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

async function initializeAdmin() {
  try {
    const adminUserId = process.env.ADMIN_USER_ID;
    
    if (!adminUserId) {
      throw new Error('ADMIN_USER_ID environment variable not set');
    }

    console.log('Checking if user', adminUserId, 'has super_admin role...');

    // Check if the user already has the super_admin role
    const existingRole = await query(
      'SELECT * FROM user_roles WHERE user_id = $1 AND role_id = 1',
      [adminUserId]
    );

    if (existingRole.rows.length === 0) {
      // Assign super_admin role
      await query(
        'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, 1, $1)',
        [adminUserId]
      );
      console.log('Super admin role assigned successfully to user', adminUserId);
    } else {
      console.log('User already has super admin role');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
}

initializeAdmin();