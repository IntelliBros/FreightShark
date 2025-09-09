import { Router } from 'express';
import { pool } from '../db/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all quote requests (staff/admin only)
router.get('/requests', authenticateToken, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`
      SELECT qr.*, u.name as customer_name, u.company as customer_company 
      FROM quote_requests qr
      LEFT JOIN users u ON qr.customer_id = u.id
      ORDER BY qr.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quote requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get quote requests for current user
router.get('/requests/my', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM quote_requests WHERE customer_id = $1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user quote requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single quote request
router.get('/requests/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM quote_requests WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote request not found' });
    }
    
    const quoteRequest = result.rows[0];
    
    // Check access permissions
    if (req.user!.role === 'user' && quoteRequest.customer_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(quoteRequest);
  } catch (error) {
    console.error('Error fetching quote request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create quote request
router.post('/requests', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      serviceType = 'Air Freight',
      pickupLocation,
      destinationWarehouses,
      cargoReadyDate,
      totalWeight,
      totalVolume,
      totalCartons,
      specialRequirements
    } = req.body;
    
    if (!pickupLocation || !destinationWarehouses || !cargoReadyDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate quote request ID
    const seqResult = await pool.query(
      "SELECT increment_sequence('quote') as seq"
    );
    const requestId = `QR-${String(seqResult.rows[0].seq).padStart(5, '0')}`;
    
    const result = await pool.query(
      `INSERT INTO quote_requests (
        id, customer_id, service_type, pickup_location, destination_warehouses,
        cargo_ready_date, total_weight, total_volume, total_cartons, special_requirements
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        requestId,
        (req as AuthRequest).user!.id,
        serviceType,
        pickupLocation,
        JSON.stringify(destinationWarehouses),
        cargoReadyDate,
        totalWeight,
        totalVolume,
        totalCartons,
        specialRequirements
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating quote request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update quote request status (staff/admin only)
router.patch('/requests/:id/status', authenticateToken, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const result = await pool.query(
      'UPDATE quote_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote request not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating quote request status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all quotes (staff/admin see all, users see their own)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let query: string;
    let params: any[];
    
    if (req.user!.role === 'user') {
      query = `
        SELECT q.*, qr.service_type, qr.pickup_location, qr.destination_warehouses,
               u.name as customer_name, u.company as customer_company,
               s.name as staff_name
        FROM quotes q
        LEFT JOIN quote_requests qr ON q.request_id = qr.id
        LEFT JOIN users u ON q.customer_id = u.id
        LEFT JOIN users s ON q.staff_id = s.id
        WHERE q.customer_id = $1
        ORDER BY q.created_at DESC
      `;
      params = [req.user!.id];
    } else {
      query = `
        SELECT q.*, qr.service_type, qr.pickup_location, qr.destination_warehouses,
               u.name as customer_name, u.company as customer_company,
               s.name as staff_name
        FROM quotes q
        LEFT JOIN quote_requests qr ON q.request_id = qr.id
        LEFT JOIN users u ON q.customer_id = u.id
        LEFT JOIN users s ON q.staff_id = s.id
        ORDER BY q.created_at DESC
      `;
      params = [];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single quote
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT q.*, qr.service_type, qr.pickup_location, qr.destination_warehouses,
              u.name as customer_name, u.company as customer_company,
              s.name as staff_name
       FROM quotes q
       LEFT JOIN quote_requests qr ON q.request_id = qr.id
       LEFT JOIN users u ON q.customer_id = u.id
       LEFT JOIN users s ON q.staff_id = s.id
       WHERE q.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    const quote = result.rows[0];
    
    // Check access permissions
    if (req.user!.role === 'user' && quote.customer_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create quote (staff/admin only)
router.post('/', authenticateToken, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const {
      requestId,
      customerId,
      freightCost,
      insuranceCost,
      additionalCharges,
      totalCost,
      validUntil,
      perWarehouseCosts,
      commissionRatePerKg,
      notes
    } = req.body;
    
    if (!requestId || !customerId || !freightCost || !totalCost || !validUntil) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate quote ID
    const seqResult = await pool.query(
      "SELECT increment_sequence('quote') as seq"
    );
    const quoteId = `Q-${String(seqResult.rows[0].seq).padStart(5, '0')}`;
    
    const result = await pool.query(
      `INSERT INTO quotes (
        id, request_id, customer_id, staff_id, freight_cost, insurance_cost,
        additional_charges, total_cost, valid_until, per_warehouse_costs,
        commission_rate_per_kg, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        quoteId,
        requestId,
        customerId,
        req.user!.id,
        freightCost,
        insuranceCost,
        additionalCharges ? JSON.stringify(additionalCharges) : null,
        totalCost,
        validUntil,
        perWarehouseCosts ? JSON.stringify(perWarehouseCosts) : null,
        commissionRatePerKg,
        notes,
        'Pending'
      ]
    );
    
    // Update quote request status
    await pool.query(
      'UPDATE quote_requests SET status = $1 WHERE id = $2',
      ['Quoted', requestId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update quote status
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Get quote to check permissions
    const quoteResult = await pool.query(
      'SELECT * FROM quotes WHERE id = $1',
      [id]
    );
    
    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    const quote = quoteResult.rows[0];
    
    // Check permissions
    if (req.user!.role === 'user') {
      if (quote.customer_id !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // Users can only accept or reject quotes
      if (!['Accepted', 'Rejected'].includes(status)) {
        return res.status(403).json({ error: 'Invalid status for user' });
      }
    }
    
    const result = await pool.query(
      'UPDATE quotes SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating quote status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept quote and create shipment
router.post('/:id/accept', authenticateToken, async (req: AuthRequest, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // Get quote with request details
    const quoteResult = await client.query(
      `SELECT q.*, qr.pickup_location, qr.destination_warehouses, qr.cargo_ready_date,
              qr.total_weight, qr.total_volume, qr.total_cartons
       FROM quotes q
       JOIN quote_requests qr ON q.request_id = qr.id
       WHERE q.id = $1`,
      [id]
    );
    
    if (quoteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    const quote = quoteResult.rows[0];
    
    // Check permissions
    if (req.user!.role === 'user' && quote.customer_id !== req.user!.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update quote status
    await client.query(
      'UPDATE quotes SET status = $1 WHERE id = $2',
      ['Accepted', id]
    );
    
    // Generate shipment ID
    const seqResult = await client.query(
      "SELECT increment_sequence('shipment') as seq"
    );
    const shipmentId = `FS-${String(seqResult.rows[0].seq).padStart(5, '0')}`;
    
    // Create shipment
    const shipmentResult = await client.query(
      `INSERT INTO shipments (
        id, quote_id, customer_id, status, origin, destination,
        cargo_details, estimated_weight, estimated_delivery
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        shipmentId,
        quote.id,
        quote.customer_id,
        'Booking Confirmed',
        quote.pickup_location,
        quote.destination_warehouses,
        JSON.stringify({
          totalCartons: quote.total_cartons,
          totalVolume: quote.total_volume
        }),
        quote.total_weight,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      ]
    );
    
    // Create initial tracking event
    await client.query(
      `INSERT INTO tracking_events (id, shipment_id, date, status, location, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `TE-${uuidv4()}`,
        shipmentId,
        new Date(),
        'Booking Confirmed',
        quote.pickup_location,
        'Shipment booking has been confirmed'
      ]
    );
    
    await client.query('COMMIT');
    
    res.json({
      quote: { ...quote, status: 'Accepted' },
      shipment: shipmentResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting quote:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;