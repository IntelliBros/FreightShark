import { Router } from 'express';
import { pool } from '../db/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get active announcements (all authenticated users)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as created_by_name
       FROM announcements a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.is_active = true
       ORDER BY a.created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all announcements including inactive (staff/admin only)
router.get('/all', authenticateToken, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as created_by_name
       FROM announcements a
       LEFT JOIN users u ON a.created_by = u.id
       ORDER BY a.created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single announcement
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT a.*, u.name as created_by_name
       FROM announcements a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create announcement (staff/admin only)
router.post('/', authenticateToken, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { title, content, type = 'info' } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    if (!['info', 'warning', 'success', 'error'].includes(type)) {
      return res.status(400).json({ error: 'Invalid announcement type' });
    }
    
    const announcementId = `ANN-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    const result = await pool.query(
      `INSERT INTO announcements (id, title, content, type, created_by, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [announcementId, title, content, type, req.user!.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update announcement (staff/admin only)
router.patch('/:id', authenticateToken, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, isActive } = req.body;
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }
    
    if (content !== undefined) {
      updates.push(`content = $${paramCount}`);
      values.push(content);
      paramCount++;
    }
    
    if (type !== undefined) {
      if (!['info', 'warning', 'success', 'error'].includes(type)) {
        return res.status(400).json({ error: 'Invalid announcement type' });
      }
      updates.push(`type = $${paramCount}`);
      values.push(type);
      paramCount++;
    }
    
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(isActive);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const result = await pool.query(
      `UPDATE announcements SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete announcement (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM announcements WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;