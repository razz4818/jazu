import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../db';
import { extractTenantScope } from '../middleware/auth';

const router = Router();

// Get all cameras for restaurant
router.get('/', extractTenantScope, async (req: Request, res: Response) => {
  try {
    const restaurantId = req.restaurantId!;

    const rows = await queryAll(`
      SELECT id, restaurant_id, camera_code, name, location, status,
             resolution, ip_address, last_active_at, created_at
      FROM cameras
      WHERE restaurant_id = ?
      ORDER BY camera_code ASC
    `, [restaurantId]);

    const cameras = rows.map(r => ({
      id: r.id,
      restaurantId: r.restaurant_id,
      cameraCode: r.camera_code,
      name: r.name,
      location: r.location,
      status: r.status,
      resolution: r.resolution || '1080p',
      ipAddress: r.ip_address || '192.168.1.101',
      lastActiveAt: r.last_active_at,
      createdAt: r.created_at
    }));

    res.json({ cameras });
  } catch (error) {
    console.error('Fetch cameras error:', error);
    res.status(500).json({ error: 'Failed to fetch cameras' });
  }
});

// Create new camera
router.post('/', extractTenantScope, async (req: Request, res: Response) => {
  try {
    const restaurantId = req.restaurantId!;
    const { cameraCode, name, location, status = 'online', resolution = '1080p', ipAddress = '192.168.1.105' } = req.body;

    if (!cameraCode || !name || !location) {
      res.status(400).json({ error: 'Camera code, name, and location are required' });
      return;
    }

    const cleanCode = cameraCode.trim().toUpperCase();
    const existing = await queryOne('SELECT id FROM cameras WHERE restaurant_id = ? AND camera_code = ?', [restaurantId, cleanCode]);
    if (existing) {
      res.status(400).json({ error: `Camera with code ${cleanCode} already exists` });
      return;
    }

    const id = `cam_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    await execute(`
      INSERT INTO cameras (id, restaurant_id, camera_code, name, location, status, resolution, ip_address, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, restaurantId, cleanCode, name.trim(), location.trim(), status, resolution, ipAddress, now]);

    res.status(201).json({
      message: 'Camera added successfully',
      camera: {
        id,
        restaurantId,
        cameraCode: cleanCode,
        name: name.trim(),
        location: location.trim(),
        status,
        resolution,
        ipAddress,
        lastActiveAt: now
      }
    });
  } catch (error) {
    console.error('Create camera error:', error);
    res.status(500).json({ error: 'Failed to add camera' });
  }
});

// Update camera
router.put('/:id', extractTenantScope, async (req: Request, res: Response) => {
  try {
    const restaurantId = req.restaurantId!;
    const { id } = req.params;
    const { cameraCode, name, location, status, resolution, ipAddress } = req.body;

    const existing = await queryOne('SELECT id FROM cameras WHERE restaurant_id = ? AND id = ?', [restaurantId, id]);
    if (!existing) {
      res.status(404).json({ error: 'Camera not found' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (cameraCode) {
      updates.push('camera_code = ?');
      params.push(cameraCode.trim().toUpperCase());
    }
    if (name) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (location) {
      updates.push('location = ?');
      params.push(location.trim());
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (resolution) {
      updates.push('resolution = ?');
      params.push(resolution);
    }
    if (ipAddress) {
      updates.push('ip_address = ?');
      params.push(ipAddress);
    }

    if (updates.length > 0) {
      params.push(restaurantId, id);
      await execute(`
        UPDATE cameras
        SET ${updates.join(', ')}
        WHERE restaurant_id = ? AND id = ?
      `, params);
    }

    res.json({ message: 'Camera updated successfully' });
  } catch (error) {
    console.error('Update camera error:', error);
    res.status(500).json({ error: 'Failed to update camera' });
  }
});

// Delete camera
router.delete('/:id', extractTenantScope, async (req: Request, res: Response) => {
  try {
    const restaurantId = req.restaurantId!;
    const { id } = req.params;

    const existing = await queryOne('SELECT id FROM cameras WHERE restaurant_id = ? AND id = ?', [restaurantId, id]);
    if (!existing) {
      res.status(404).json({ error: 'Camera not found' });
      return;
    }

    await execute('DELETE FROM cameras WHERE restaurant_id = ? AND id = ?', [restaurantId, id]);
    res.json({ message: 'Camera removed successfully' });
  } catch (error) {
    console.error('Delete camera error:', error);
    res.status(500).json({ error: 'Failed to delete camera' });
  }
});

// Camera heartbeat/ping
router.post('/:id/heartbeat', extractTenantScope, async (req: Request, res: Response) => {
  try {
    const restaurantId = req.restaurantId!;
    const { id } = req.params;
    const now = new Date().toISOString();

    await execute(`
      UPDATE cameras
      SET status = 'online', last_active_at = ?
      WHERE restaurant_id = ? AND (id = ? OR camera_code = ?)
    `, [now, restaurantId, id, id]);

    res.json({ status: 'online', lastActiveAt: now });
  } catch (error) {
    console.error('Camera heartbeat error:', error);
    res.status(500).json({ error: 'Failed to update camera heartbeat' });
  }
});

export default router;
