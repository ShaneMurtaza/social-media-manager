import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Middleware to check admin permissions
const requireAdmin = (permission) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id; // Assuming you have user authentication
            
            const result = await query(`
                SELECT r.permissions 
                FROM users u
                JOIN user_roles ur ON u.id = ur.user_id
                JOIN roles r ON ur.role_id = r.id
                WHERE u.id = $1
            `, [userId]);
            
            if (result.rows.length === 0) {
                return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
            }
            
            const permissions = result.rows[0].permissions;
            
            // Check if user has the required permission
            if (permission && !hasPermission(permissions, permission)) {
                return res.status(403).json({ error: 'Insufficient permissions.' });
            }
            
            next();
        } catch (error) {
            console.error('Admin middleware error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };
};

// Helper function to check permissions
function hasPermission(permissions, requiredPermission) {
    const [resource, action] = requiredPermission.split('.');
    return permissions[resource] && permissions[resource].includes(action);
}

// Get all users with their roles
router.get('/users', requireAdmin('users.read'), async (req, res) => {
    try {
        const result = await query(`
            SELECT u.id, u.name, u.email, u.created_at, 
                   r.name as role_name, r.id as role_id
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            ORDER BY u.created_at DESC
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Assign role to user
router.post('/users/:userId/role', requireAdmin('users.assign_roles'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { roleId, adminId } = req.body;
        
        // Check if user already has this role
        const existingRole = await query(
            'SELECT * FROM user_roles WHERE user_id = $1 AND role_id = $2',
            [userId, roleId]
        );
        
        if (existingRole.rows.length > 0) {
            return res.status(400).json({ error: 'User already has this role' });
        }
        
        // Assign the role
        await query(
            'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3)',
            [userId, roleId, adminId]
        );
        
        // Update user's primary role if not set or if assigning a higher role
        await query(
            'UPDATE users SET primary_role_id = $1 WHERE id = $2 AND (primary_role_id IS NULL OR primary_role_id > $1)',
            [roleId, userId]
        );
        
        // Log the action
        await query(
            'INSERT INTO admin_audit_log (admin_id, action, target_user_id, details) VALUES ($1, $2, $3, $4)',
            [adminId, 'assign_role', userId, `Assigned role ID: ${roleId}`]
        );
        
        res.json({ message: 'Role assigned successfully' });
    } catch (error) {
        console.error('Error assigning role:', error);
        res.status(500).json({ error: 'Failed to assign role' });
    }
});

// Remove role from user
router.delete('/users/:userId/role/:roleId', requireAdmin('users.assign_roles'), async (req, res) => {
    try {
        const { userId, roleId } = req.params;
        const { adminId } = req.body;
        
        await query(
            'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
            [userId, roleId]
        );
        
        // Update user's primary role if needed
        const userRoles = await query(
            'SELECT role_id FROM user_roles WHERE user_id = $1 ORDER BY role_id ASC',
            [userId]
        );
        
        if (userRoles.rows.length > 0) {
            await query(
                'UPDATE users SET primary_role_id = $1 WHERE id = $2',
                [userRoles.rows[0].role_id, userId]
            );
        } else {
            await query(
                'UPDATE users SET primary_role_id = NULL WHERE id = $1',
                [userId]
            );
        }
        
        // Log the action
        await query(
            'INSERT INTO admin_audit_log (admin_id, action, target_user_id, details) VALUES ($1, $2, $3, $4)',
            [adminId, 'remove_role', userId, `Removed role ID: ${roleId}`]
        );
        
        res.json({ message: 'Role removed successfully' });
    } catch (error) {
        console.error('Error removing role:', error);
        res.status(500).json({ error: 'Failed to remove role' });
    }
});

// Get admin audit logs
router.get('/audit-logs', requireAdmin('users.read'), async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        
        const result = await query(`
            SELECT al.*, a.name as admin_name, u.name as target_user_name
            FROM admin_audit_log al
            LEFT JOIN users a ON al.admin_id = a.id
            LEFT JOIN users u ON al.target_user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await query('SELECT COUNT(*) FROM admin_audit_log');
        
        res.json({
            logs: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            totalPages: Math.ceil(countResult.rows[0].count / limit)
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

// Get all roles
router.get('/roles', requireAdmin('users.read'), async (req, res) => {
    try {
        const result = await query('SELECT * FROM roles ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

export default router;