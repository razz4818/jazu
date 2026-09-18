import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../db';
import { extractTenantScope } from '../middleware/auth';

const router = Router();

// List all workers for restaurant (with last verification status)
router.get('/', extractTenantScope, async (req: Request, res: Response) => {
  try {
    const restaurantId = req.restaurantId!;
    const search = req.query.search ? String(req.query.search).toLowerCase() : '';
    const department = req.query.department ? String(req.query.department) : '';

    let sql = `
      SELECT w.id, w.restaurant_id, w.worker_code, w.first_name, w.last_name,
             w.department, w.status, w.avatar_color, w.created_at,
             (SELECT COUNT(*) FROM verification_attempts va WHERE va.worker_id = w.id) as registration_count,
             (SELECT result FROM verification_attempts va WHERE va.worker_id = w.id ORDER BY va.timestamp DESC LIMIT 1) as last_result,
             (SELECT timestamp FROM verification_attempts va WHERE va.worker_id = w.id ORDER BY va.timestamp DESC LIMIT 1) as last_timestamp
      FROM workers w
      WHERE w.restaurant_id = ?
    `;

    const params: any[] = [restaurantId];

    if (department && department !== 'all') {
      sql += ` AND w.department = ?`;
      params.push(department);
    }

    if (search) {
      sql += ` AND (LOWER(w.first_name || ' ' || w.last_name) LIKE ? OR LOWER(w.worker_code) LIKE ? OR LOWER(w.department) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY w.first_name ASC`;

    const rows = await queryAll(sql, params);

    const workers = rows.map(r => ({
      id: r.id,
      restaurantId: r.restaurant_id,
      workerCode: r.worker_code,
      firstName: r.first_name,
      lastName: r.last_name,
      department: r.department,
      status: r.status,
      avatarColor: r.avatar_color || '#10b981',
      registrationCount: r.registration_count || 0,
      lastVerification: r.last_result ? {
        result: r.last_result,
        timestamp: r.last_timestamp
      } : undefined,
      createdAt: r.created_at
    }));

    res.json({ workers });
  } catch (error) {
    console.error('Fetch workers error:', error);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// Get worker details and recent history
router.get('/:id', extractTenantScope, async (req: Request, res: Response) => {
  try {
    const restaurantId = req.restaurantId!;
    const { id } = req.params;

    const worker = await queryOne(`
      SELECT w.id, w.restaurant_id, w.worker_code, w.first_name, w.last_name,
             w.department, w.status, w.avatar_color, w.created_at
      FROM workers w
      WHERE w.restaurant_id = ? AND (w.id = ? OR w.worker_code = ?)
    `, [restaurantId, id, id]);

    if (!worker) {
      res.status(404).json({ error: 'Worker not found' });
      return;
    }

    // Get recent verification attempts
    const historyRows = await queryAll(`
      SELECT va.id, va.camera_id, va.result, va.items_snapshot,
             va.missing_required, va.detected_items, va.confidence_overall,
             va.duration_ms, va.timestamp, c.name as camera_name
      FROM verification_attempts va
      LEFT JOIN cameras c ON va.camera_id = c.id
      WHERE va.restaurant_id = ? AND va.worker_id = ?
      ORDER BY va.timestamp DESC
      LIMIT 20
    `, [restaurantId, worker.id]);

    const history = historyRows.map(h => ({
      id: h.id,
      cameraId: h.camera_id,
      cameraName: h.camera_name || 'Main Camera',
      result: h.result,
      items: JSON.parse(h.items_snapshot || '{}'),
      missingRequired: JSON.parse(h.missing_required || '[]'),
      detectedItems: JSON.parse(h.detected_items || '[]'),
      confidenceOverall: h.confidence_overall,
      durationMs: h.duration_ms,
      timestamp: h.timestamp
    }));

    res.json({
      worker: {
        id: worker.id,
        restaurantId: worker.restaurant_id,
        workerCode: worker.worker_code,
        firstName: worker.first_name,
        lastName: worker.last_name,
        department: worker.department,
        status: worker.status,
        avatarColor: worker.avatar_color,
        createdAt: worker.created_at
      },
      history
    });
  } catch (error) {
    console.error('Get worker error:', error);
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

// Create new worker
router.post('/', extractTenantScope, async (req: Request, res: Response) => {
  try {
    const restaurantId = req.restaurantId!;
    const { workerCode, firstName, lastName, department, avatarColor } = req.body;

    if (!workerCode || !firstName || !lastName || !department) {
      res.status(400).json({ error: 'Worker code, first name, last name, and department are required' });
      return;
    }

    const cleanCode = workerCode.trim().toUpperCase();

    // Check if worker code exists in this restaurant
    const existing = await queryOne('SELECT id FROM workers WHERE restaurant_id = ? AND worker_code = ?', [restaurantId, cleanCode]);
    if (existing) {
      res.status(400).json({ error: `Worker with code ${cleanCode} already exists in this restaurant` });
      return;
    }

    const id = `w_${uuidv4().substring(0, 8)}`;
    const color = avatarColor || '#10b981';

    await execute(`
      INSERT INTO workers (id, restaurant_id, worker_code, first_name, last_name, department, status, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
    `, [id, restaurantId, cleanCode, firstName.trim(), lastName.trim(), department.trim(), color]);

    res.status(201).json({
      message: 'Worker created successfully',
      worker: {
        id,
        restaurantId,
        workerCode: cleanCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        department: department.trim(),
        status: 'active',
        avatarColor: color
      }
    });
  } catch (error) {
    console.error('Create worker error:', error);
    res.status(500).json({ error: 'Failed to create worker' });
  }
});

// Update worker
router.put('/:id', extractTenantScope, async (req: Request, res: Response) => {
  try {
    const restaurantId = req.restaurantId!;
    const { id } = req.params;
    const { workerCode, firstName, lastName, department, status, avatarColor } = req.body;

    const existing = await queryOne('SELECT id FROM workers WHERE restaurant_id = ? AND id = ?', [restaurantId, id]);
    if (!existing) {
      res.status(404).json({ error: 'Worker not found' });
      return;
    }

    await execute(`
      UPDATE workers
      SET worker_code = COALESCE(?, worker_code),
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          department = COALESCE(?, department),
          status = COALESCE(?, status),
          avatar_color = COALESCE(?, avatar_color)
      WHERE restaurant_id = ? AND id = ?
    `, [
      workerCode ? workerCode.trim().toUpperCase() : null,
      firstName ? firstName.trim() : null,
      lastName ? lastName.trim() : null,
      department ? department.trim() : null,
      status || null,
      avatarColor || null,
      restaurantId,
      id
    ]);

    res.json({ message: 'Worker updated successfully' });
  } catch (error) {
    console.error('Update worker error:', error);
    res.status(500).json({ error: 'Failed to update worker' });
  }
});

// Delete or toggle deactivate worker
router.delete('/:id', extractTenantScope, async (req: Request, res: Response) => {
  try {
    const restaurantId = req.restaurantId!;
    const { id } = req.params;

    const existing = await queryOne('SELECT id FROM workers WHERE restaurant_id = ? AND id = ?', [restaurantId, id]);
    if (!existing) {
      res.status(404).json({ error: 'Worker not found' });
      return;
    }

    await execute('DELETE FROM workers WHERE restaurant_id = ? AND id = ?', [restaurantId, id]);
    res.json({ message: 'Worker removed successfully' });
  } catch (error) {
    console.error('Delete worker error:', error);
    res.status(500).json({ error: 'Failed to delete worker' });
  }
});

export default router;
