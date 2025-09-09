import { Router } from 'express';
import { pool } from '../db/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all shipments (staff/admin see all, users see their own)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let query: string;
    let params: any[];
    
    if (req.user!.role === 'user') {
      query = `
        SELECT s.*, u.name as customer_name, u.company as customer_company,
               q.total_cost as quote_amount
        FROM shipments s
        LEFT JOIN users u ON s.customer_id = u.id
        LEFT JOIN quotes q ON s.quote_id = q.id
        WHERE s.customer_id = $1
        ORDER BY s.created_at DESC
      `;
      params = [req.user!.id];
    } else {
      query = `
        SELECT s.*, u.name as customer_name, u.company as customer_company,
               q.total_cost as quote_amount
        FROM shipments s
        LEFT JOIN users u ON s.customer_id = u.id
        LEFT JOIN quotes q ON s.quote_id = q.id
        ORDER BY s.created_at DESC
      `;
      params = [];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single shipment with tracking events
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Get shipment details
    const shipmentResult = await pool.query(
      `SELECT s.*, u.name as customer_name, u.company as customer_company,
              q.total_cost as quote_amount
       FROM shipments s
       LEFT JOIN users u ON s.customer_id = u.id
       LEFT JOIN quotes q ON s.quote_id = q.id
       WHERE s.id = $1`,
      [id]
    );
    
    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const shipment = shipmentResult.rows[0];
    
    // Check access permissions
    if (req.user!.role === 'user' && shipment.customer_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get tracking events
    const trackingResult = await pool.query(
      'SELECT * FROM tracking_events WHERE shipment_id = $1 ORDER BY date DESC',
      [id]
    );
    
    // Get documents
    const documentsResult = await pool.query(
      'SELECT * FROM documents WHERE shipment_id = $1 ORDER BY uploaded_at DESC',
      [id]
    );
    
    res.json({
      ...shipment,
      trackingEvents: trackingResult.rows,
      documents: documentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update shipment status (staff/admin only)
router.patch('/:id/status', authenticateToken, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { status, location, description } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    await client.query('BEGIN');
    
    // Update shipment status
    const shipmentResult = await client.query(
      'UPDATE shipments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (shipmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    // Create tracking event
    await client.query(
      `INSERT INTO tracking_events (id, shipment_id, date, status, location, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `TE-${uuidv4()}`,
        id,
        new Date(),
        status,
        location || null,
        description || `Status updated to ${status}`
      ]
    );
    
    await client.query('COMMIT');
    
    res.json(shipmentResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating shipment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update shipment weights (staff/admin only)
router.patch('/:id/weights', authenticateToken, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { actualWeight } = req.body;
    
    if (actualWeight === undefined) {
      return res.status(400).json({ error: 'Actual weight is required' });
    }
    
    const result = await pool.query(
      'UPDATE shipments SET actual_weight = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [actualWeight, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating shipment weights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add tracking event (staff/admin only)
router.post('/:id/tracking', authenticateToken, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, location, description, date } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Verify shipment exists
    const shipmentResult = await pool.query(
      'SELECT id FROM shipments WHERE id = $1',
      [id]
    );
    
    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const result = await pool.query(
      `INSERT INTO tracking_events (id, shipment_id, date, status, location, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        `TE-${uuidv4()}`,
        id,
        date || new Date(),
        status,
        location || null,
        description || null
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding tracking event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload document
router.post('/:id/documents', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, type, size, url } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Document name and URL are required' });
    }
    
    // Verify shipment exists and check permissions
    const shipmentResult = await pool.query(
      'SELECT customer_id FROM shipments WHERE id = $1',
      [id]
    );
    
    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const shipment = shipmentResult.rows[0];
    
    // Check permissions
    if (req.user!.role === 'user' && shipment.customer_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      `INSERT INTO documents (id, shipment_id, name, type, size, url, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        `DOC-${uuidv4()}`,
        id,
        name,
        type || null,
        size || null,
        url,
        req.user!.id
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get documents for shipment
router.get('/:id/documents', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Verify shipment exists and check permissions
    const shipmentResult = await pool.query(
      'SELECT customer_id FROM shipments WHERE id = $1',
      [id]
    );
    
    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const shipment = shipmentResult.rows[0];
    
    // Check permissions
    if (req.user!.role === 'user' && shipment.customer_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      `SELECT d.*, u.name as uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.shipment_id = $1
       ORDER BY d.uploaded_at DESC`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete document
router.delete('/:shipmentId/documents/:documentId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { shipmentId, documentId } = req.params;
    
    // Verify shipment exists and check permissions
    const shipmentResult = await pool.query(
      'SELECT customer_id FROM shipments WHERE id = $1',
      [shipmentId]
    );
    
    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const shipment = shipmentResult.rows[0];
    
    // Get document to check uploader
    const docResult = await pool.query(
      'SELECT uploaded_by FROM documents WHERE id = $1 AND shipment_id = $2',
      [documentId, shipmentId]
    );
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const document = docResult.rows[0];
    
    // Check permissions - only uploader, shipment owner, or staff/admin can delete
    const canDelete = 
      req.user!.role === 'admin' ||
      req.user!.role === 'staff' ||
      document.uploaded_by === req.user!.id ||
      (req.user!.role === 'user' && shipment.customer_id === req.user!.id);
    
    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await pool.query(
      'DELETE FROM documents WHERE id = $1 AND shipment_id = $2',
      [documentId, shipmentId]
    );
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;