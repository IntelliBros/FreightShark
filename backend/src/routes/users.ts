import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, company, role, amazon_seller_id, ein_tax_id, staff_position, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only view their own profile, staff/admin can view any
    if (req.user!.role === 'user' && req.user!.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'SELECT id, name, email, company, role, amazon_seller_id, ein_tax_id, staff_position, created_at FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { name, email, password, company, role, amazonSellerId, einTaxId, staffPosition } = req.body;
    
    if (!name || !email || !password || !company || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = `user-${uuidv4()}`;
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, company, role, amazon_seller_id, ein_tax_id, staff_position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, email, company, role, amazon_seller_id, ein_tax_id, staff_position, created_at`,
      [userId, name, email, passwordHash, company, role, amazonSellerId, einTaxId, staffPosition]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, company, amazonSellerId, einTaxId, staffPosition } = req.body;
    
    // Users can only update their own profile, admin can update any
    if (req.user!.role !== 'admin' && req.user!.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    
    if (company !== undefined) {
      updates.push(`company = $${paramCount}`);
      values.push(company);
      paramCount++;
    }
    
    if (amazonSellerId !== undefined) {
      updates.push(`amazon_seller_id = $${paramCount}`);
      values.push(amazonSellerId);
      paramCount++;
    }
    
    if (einTaxId !== undefined) {
      updates.push(`ein_tax_id = $${paramCount}`);
      values.push(einTaxId);
      paramCount++;
    }
    
    if (staffPosition !== undefined) {
      updates.push(`staff_position = $${paramCount}`);
      values.push(staffPosition);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount}
       RETURNING id, name, email, company, role, amazon_seller_id, ein_tax_id, staff_position, created_at`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role (admin only)
router.patch('/:id/role', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['admin', 'staff', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const result = await pool.query(
      `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING id, name, email, company, role, amazon_seller_id, ein_tax_id, staff_position, created_at`,
      [role, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (req.user!.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const userStats = await pool.query(
      `SELECT 
        role,
        COUNT(*) as count
       FROM users
       GROUP BY role`
    );
    
    const recentUsers = await pool.query(
      `SELECT id, name, email, company, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 10`
    );
    
    res.json({
      usersByRole: userStats.rows,
      recentUsers: recentUsers.rows
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;