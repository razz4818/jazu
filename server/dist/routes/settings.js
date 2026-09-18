"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get restaurant settings
router.get('/', auth_1.extractTenantScope, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const row = await (0, db_1.queryOne)(`
      SELECT s.id, s.restaurant_id, s.restaurant_name, s.logo_url, s.timezone,
             s.default_min_confidence, s.max_failed_attempts_warning,
             s.verification_timeout_sec, s.require_hands_visible, s.require_head_visible,
             s.allow_snapshot_storage, s.ai_mode, s.real_model_endpoint,
             s.real_model_api_key, s.created_at, r.name as tenant_name
      FROM restaurant_settings s
      JOIN restaurants r ON s.restaurant_id = r.id
      WHERE s.restaurant_id = ?
    `, [restaurantId]);
        if (!row) {
            res.status(404).json({ error: 'Settings not found' });
            return;
        }
        res.json({
            settings: {
                id: row.id,
                restaurantId: row.restaurant_id,
                restaurantName: row.restaurant_name || row.tenant_name,
                logoUrl: row.logo_url,
                timezone: row.timezone,
                defaultMinConfidence: row.default_min_confidence,
                maxFailedAttemptsWarning: row.max_failed_attempts_warning,
                verificationTimeoutSec: row.verification_timeout_sec,
                requireHandsVisible: Boolean(row.require_hands_visible),
                requireHeadVisible: Boolean(row.require_head_visible),
                allowSnapshotStorage: Boolean(row.allow_snapshot_storage),
                aiMode: row.ai_mode || 'demo',
                realModelEndpoint: row.real_model_endpoint || '',
                realModelApiKey: row.real_model_api_key ? '********' : '',
                createdAt: row.created_at
            }
        });
    }
    catch (error) {
        console.error('Fetch settings error:', error);
        res.status(500).json({ error: 'Failed to fetch restaurant settings' });
    }
});
// Update settings
router.put('/', auth_1.extractTenantScope, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { restaurantName, logoUrl, timezone, defaultMinConfidence, maxFailedAttemptsWarning, verificationTimeoutSec, requireHandsVisible, requireHeadVisible, allowSnapshotStorage, aiMode, realModelEndpoint, realModelApiKey } = req.body;
        const updates = [];
        const params = [];
        if (restaurantName !== undefined) {
            updates.push('restaurant_name = ?');
            params.push(restaurantName.trim());
            // Also update restaurant table
            await (0, db_1.execute)('UPDATE restaurants SET name = ? WHERE id = ?', [restaurantName.trim(), restaurantId]);
        }
        if (logoUrl !== undefined) {
            updates.push('logo_url = ?');
            params.push(logoUrl);
            await (0, db_1.execute)('UPDATE restaurants SET logo_url = ? WHERE id = ?', [logoUrl, restaurantId]);
        }
        if (timezone !== undefined) {
            updates.push('timezone = ?');
            params.push(timezone);
        }
        if (defaultMinConfidence !== undefined) {
            updates.push('default_min_confidence = ?');
            params.push(Number(defaultMinConfidence));
        }
        if (maxFailedAttemptsWarning !== undefined) {
            updates.push('max_failed_attempts_warning = ?');
            params.push(Number(maxFailedAttemptsWarning));
        }
        if (verificationTimeoutSec !== undefined) {
            updates.push('verification_timeout_sec = ?');
            params.push(Number(verificationTimeoutSec));
        }
        if (requireHandsVisible !== undefined) {
            updates.push('require_hands_visible = ?');
            params.push(requireHandsVisible ? 1 : 0);
        }
        if (requireHeadVisible !== undefined) {
            updates.push('require_head_visible = ?');
            params.push(requireHeadVisible ? 1 : 0);
        }
        if (allowSnapshotStorage !== undefined) {
            updates.push('allow_snapshot_storage = ?');
            params.push(allowSnapshotStorage ? 1 : 0);
        }
        if (aiMode !== undefined) {
            updates.push('ai_mode = ?');
            params.push(aiMode);
        }
        if (realModelEndpoint !== undefined) {
            updates.push('real_model_endpoint = ?');
            params.push(realModelEndpoint);
        }
        if (realModelApiKey && realModelApiKey !== '********') {
            updates.push('real_model_api_key = ?');
            params.push(realModelApiKey);
        }
        if (updates.length > 0) {
            params.push(restaurantId);
            await (0, db_1.execute)(`
        UPDATE restaurant_settings
        SET ${updates.join(', ')}
        WHERE restaurant_id = ?
      `, params);
        }
        res.json({ message: 'Settings updated successfully' });
    }
    catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
exports.default = router;
