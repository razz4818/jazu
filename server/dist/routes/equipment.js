"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all equipment requirements for current restaurant
router.get('/', auth_1.extractTenantScope, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const rows = await (0, db_1.queryAll)(`
      SELECT id, restaurant_id, name, code, icon, description,
             is_required, is_enabled, min_confidence, is_custom, created_at
      FROM equipment_requirements
      WHERE restaurant_id = ?
      ORDER BY is_required DESC, created_at ASC
    `, [restaurantId]);
        const equipment = rows.map(r => ({
            id: r.id,
            restaurantId: r.restaurant_id,
            name: r.name,
            code: r.code,
            icon: r.icon,
            description: r.description,
            isRequired: Boolean(r.is_required),
            isEnabled: Boolean(r.is_enabled),
            minConfidence: r.min_confidence,
            isCustom: Boolean(r.is_custom),
            createdAt: r.created_at
        }));
        res.json({ equipment });
    }
    catch (error) {
        console.error('Fetch equipment error:', error);
        res.status(500).json({ error: 'Failed to fetch equipment requirements' });
    }
});
// Create new custom equipment requirement
router.post('/', auth_1.extractTenantScope, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { name, description, isRequired = true, isEnabled = true, minConfidence = 0.85, icon = 'Shield' } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Equipment name is required' });
            return;
        }
        const code = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        const existing = await (0, db_1.queryOne)('SELECT id FROM equipment_requirements WHERE restaurant_id = ? AND code = ?', [restaurantId, code]);
        if (existing) {
            res.status(400).json({ error: `Equipment requirement '${name}' already exists` });
            return;
        }
        const id = `eq_${(0, uuid_1.v4)().substring(0, 8)}`;
        const numConfidence = typeof minConfidence === 'number' ? Math.min(Math.max(minConfidence, 0.1), 1.0) : 0.85;
        await (0, db_1.execute)(`
      INSERT INTO equipment_requirements (
        id, restaurant_id, name, code, icon, description, is_required, is_enabled, min_confidence, is_custom
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
            id,
            restaurantId,
            name.trim(),
            code,
            icon,
            description ? description.trim() : `Worker must wear ${name.trim()}.`,
            isRequired ? 1 : 0,
            isEnabled ? 1 : 0,
            numConfidence
        ]);
        res.status(201).json({
            message: 'Equipment requirement added successfully',
            equipment: {
                id,
                restaurantId,
                name: name.trim(),
                code,
                icon,
                description: description ? description.trim() : `Worker must wear ${name.trim()}.`,
                isRequired: Boolean(isRequired),
                isEnabled: Boolean(isEnabled),
                minConfidence: numConfidence,
                isCustom: true
            }
        });
    }
    catch (error) {
        console.error('Create equipment error:', error);
        res.status(500).json({ error: 'Failed to create equipment requirement' });
    }
});
// Update equipment requirement
router.put('/:id', auth_1.extractTenantScope, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { id } = req.params;
        const { name, description, isRequired, isEnabled, minConfidence, icon } = req.body;
        const existing = await (0, db_1.queryOne)('SELECT id FROM equipment_requirements WHERE restaurant_id = ? AND id = ?', [restaurantId, id]);
        if (!existing) {
            res.status(404).json({ error: 'Equipment requirement not found' });
            return;
        }
        const updates = [];
        const params = [];
        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name.trim());
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description.trim());
        }
        if (isRequired !== undefined) {
            updates.push('is_required = ?');
            params.push(isRequired ? 1 : 0);
        }
        if (isEnabled !== undefined) {
            updates.push('is_enabled = ?');
            params.push(isEnabled ? 1 : 0);
        }
        if (minConfidence !== undefined) {
            updates.push('min_confidence = ?');
            params.push(Math.min(Math.max(Number(minConfidence), 0.1), 1.0));
        }
        if (icon !== undefined) {
            updates.push('icon = ?');
            params.push(icon);
        }
        if (updates.length > 0) {
            params.push(restaurantId, id);
            await (0, db_1.execute)(`
        UPDATE equipment_requirements
        SET ${updates.join(', ')}
        WHERE restaurant_id = ? AND id = ?
      `, params);
        }
        res.json({ message: 'Equipment requirement updated successfully' });
    }
    catch (error) {
        console.error('Update equipment error:', error);
        res.status(500).json({ error: 'Failed to update equipment requirement' });
    }
});
// Delete equipment requirement
router.delete('/:id', auth_1.extractTenantScope, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { id } = req.params;
        const existing = await (0, db_1.queryOne)('SELECT id, is_custom FROM equipment_requirements WHERE restaurant_id = ? AND id = ?', [restaurantId, id]);
        if (!existing) {
            res.status(404).json({ error: 'Equipment requirement not found' });
            return;
        }
        await (0, db_1.execute)('DELETE FROM equipment_requirements WHERE restaurant_id = ? AND id = ?', [restaurantId, id]);
        res.json({ message: 'Equipment requirement removed successfully' });
    }
    catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({ error: 'Failed to delete equipment requirement' });
    }
});
exports.default = router;
