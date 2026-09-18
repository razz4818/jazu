"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const verificationLogic_1 = require("../../../shared/verificationLogic");
const router = (0, express_1.Router)();
// Evaluate and record a worker PPE verification attempt
router.post('/', auth_1.extractTenantScope, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { workerId, cameraId, detection, durationMs = 1500 } = req.body;
        if (!workerId) {
            res.status(400).json({ error: 'Worker identification (workerId or workerCode) is required' });
            return;
        }
        if (!detection) {
            res.status(400).json({ error: 'AI detection payload is required' });
            return;
        }
        // 1. Fetch Worker
        const worker = await (0, db_1.queryOne)(`
      SELECT id, restaurant_id, worker_code, first_name, last_name, department, status, avatar_color
      FROM workers
      WHERE restaurant_id = ? AND (id = ? OR worker_code = ? OR LOWER(worker_code) = ?)
    `, [restaurantId, workerId, workerId, String(workerId).toLowerCase().trim()]);
        if (!worker) {
            res.status(404).json({ error: `Worker not found with ID/Code '${workerId}'` });
            return;
        }
        if (worker.status !== 'active') {
            res.status(403).json({ error: `Worker ${worker.worker_code} (${worker.first_name} ${worker.last_name}) is currently inactive. Contact your manager.` });
            return;
        }
        // 2. Fetch Active Equipment Requirements for Restaurant
        const reqRows = await (0, db_1.queryAll)(`
      SELECT id, restaurant_id, name, code, icon, description, is_required, is_enabled, min_confidence, is_custom, created_at
      FROM equipment_requirements
      WHERE restaurant_id = ? AND is_enabled = 1
    `, [restaurantId]);
        const requirements = reqRows.map(r => ({
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
        // 3. Evaluate Verification Outcome
        const outcome = (0, verificationLogic_1.evaluatePpeVerification)(detection, requirements);
        const now = new Date().toISOString();
        const attemptId = `att_${(0, uuid_1.v4)().substring(0, 10)}`;
        // 4. If outcome is PASS or FAIL, persist attempt to database
        if (outcome.result === 'PASS' || outcome.result === 'FAIL') {
            await (0, db_1.execute)(`
        INSERT INTO verification_attempts (
          id, restaurant_id, worker_id, camera_id, result, items_snapshot,
          missing_required, missing_optional, detected_items,
          confidence_overall, duration_ms, notes, timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                attemptId,
                restaurantId,
                worker.id,
                cameraId || 'cam_01',
                outcome.result,
                JSON.stringify(outcome.items),
                JSON.stringify(outcome.missingRequired),
                JSON.stringify(outcome.missingOptional),
                JSON.stringify(outcome.detectedItems),
                outcome.overallConfidence,
                Number(durationMs) || 1500,
                outcome.result === 'PASS' ? 'Check-in verified' : 'Required safety gear missing',
                now,
                now
            ]);
            // Update camera last active
            if (cameraId) {
                await (0, db_1.execute)(`
          UPDATE cameras
          SET status = 'online', last_active_at = ?
          WHERE restaurant_id = ? AND (id = ? OR camera_code = ?)
        `, [now, restaurantId, cameraId, cameraId]);
            }
        }
        res.json({
            result: outcome.result,
            passed: outcome.passed,
            statusTitle: outcome.statusTitle,
            message: outcome.message,
            worker: {
                id: worker.id,
                restaurantId: worker.restaurant_id,
                workerCode: worker.worker_code,
                firstName: worker.first_name,
                lastName: worker.last_name,
                department: worker.department,
                status: worker.status,
                avatarColor: worker.avatar_color
            },
            items: outcome.items,
            missingRequired: outcome.missingRequired,
            missingOptional: outcome.missingOptional,
            detectedItems: outcome.detectedItems,
            overallConfidence: outcome.overallConfidence,
            timestamp: now,
            attemptId
        });
    }
    catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Failed to process PPE verification' });
    }
});
// Get Dashboard overview statistics
router.get('/stats', auth_1.extractTenantScope, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        // Today's boundaries
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartIso = todayStart.toISOString();
        const todayStats = await (0, db_1.queryOne)(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN result = 'PASS' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN result = 'FAIL' THEN 1 ELSE 0 END) as failed
      FROM verification_attempts
      WHERE restaurant_id = ? AND timestamp >= ?
    `, [restaurantId, todayStartIso]);
        const totalToday = todayStats?.total || 0;
        const passedToday = todayStats?.passed || 0;
        const failedToday = todayStats?.failed || 0;
        const compliancePercentage = totalToday > 0 ? Math.round((passedToday / totalToday) * 100) : 100;
        const workerStats = await (0, db_1.queryOne)(`
      SELECT
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
        COUNT(*) as total_count
      FROM workers
      WHERE restaurant_id = ?
    `, [restaurantId]);
        const cameraStats = await (0, db_1.queryOne)(`
      SELECT
        SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_count,
        COUNT(*) as total_count
      FROM cameras
      WHERE restaurant_id = ?
    `, [restaurantId]);
        // Recent 10 registrations
        const recentRows = await (0, db_1.queryAll)(`
      SELECT va.id, va.restaurant_id, va.worker_id, va.camera_id, va.result,
             va.items_snapshot, va.missing_required, va.missing_optional,
             va.detected_items, va.confidence_overall, va.duration_ms,
             va.timestamp, w.worker_code, w.first_name, w.last_name,
             w.department, c.name as camera_name
      FROM verification_attempts va
      JOIN workers w ON va.worker_id = w.id
      LEFT JOIN cameras c ON va.camera_id = c.id
      WHERE va.restaurant_id = ?
      ORDER BY va.timestamp DESC
      LIMIT 10
    `, [restaurantId]);
        const recentRegistrations = recentRows.map(r => ({
            id: r.id,
            restaurantId: r.restaurant_id,
            workerId: r.worker_id,
            workerCode: r.worker_code,
            workerName: `${r.first_name} ${r.last_name}`,
            department: r.department,
            cameraId: r.camera_id,
            cameraName: r.camera_name || 'Main Camera',
            result: r.result,
            items: JSON.parse(r.items_snapshot || '{}'),
            missingRequired: JSON.parse(r.missing_required || '[]'),
            missingOptional: JSON.parse(r.missing_optional || '[]'),
            detectedItems: JSON.parse(r.detected_items || '[]'),
            confidenceOverall: r.confidence_overall,
            durationMs: r.duration_ms,
            timestamp: r.timestamp
        }));
        res.json({
            todayRegistrations: totalToday,
            successfulRegistrations: passedToday,
            failedRegistrations: failedToday,
            compliancePercentage,
            activeWorkersCount: workerStats?.active_count || 0,
            totalWorkersCount: workerStats?.total_count || 0,
            camerasOnlineCount: cameraStats?.online_count || 0,
            totalCamerasCount: cameraStats?.total_count || 0,
            recentRegistrations
        });
    }
    catch (error) {
        console.error('Fetch stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});
// Get registration history with search and filters
router.get('/history', auth_1.extractTenantScope, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const resultFilter = req.query.result ? String(req.query.result).toUpperCase() : '';
        const departmentFilter = req.query.department ? String(req.query.department) : '';
        const search = req.query.search ? String(req.query.search).toLowerCase() : '';
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        let sql = `
      SELECT va.id, va.restaurant_id, va.worker_id, va.camera_id, va.result,
             va.items_snapshot, va.missing_required, va.missing_optional,
             va.detected_items, va.confidence_overall, va.duration_ms,
             va.timestamp, w.worker_code, w.first_name, w.last_name,
             w.department, c.name as camera_name
      FROM verification_attempts va
      JOIN workers w ON va.worker_id = w.id
      LEFT JOIN cameras c ON va.camera_id = c.id
      WHERE va.restaurant_id = ?
    `;
        const params = [restaurantId];
        if (resultFilter && resultFilter !== 'ALL') {
            sql += ` AND va.result = ?`;
            params.push(resultFilter);
        }
        if (departmentFilter && departmentFilter !== 'all') {
            sql += ` AND w.department = ?`;
            params.push(departmentFilter);
        }
        if (search) {
            sql += ` AND (LOWER(w.first_name || ' ' || w.last_name) LIKE ? OR LOWER(w.worker_code) LIKE ? OR LOWER(w.department) LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ` ORDER BY va.timestamp DESC LIMIT ?`;
        params.push(limit);
        const rows = await (0, db_1.queryAll)(sql, params);
        const history = rows.map(r => ({
            id: r.id,
            restaurantId: r.restaurant_id,
            workerId: r.worker_id,
            workerCode: r.worker_code,
            workerName: `${r.first_name} ${r.last_name}`,
            department: r.department,
            cameraId: r.camera_id,
            cameraName: r.camera_name || 'Main Camera',
            result: r.result,
            items: JSON.parse(r.items_snapshot || '{}'),
            missingRequired: JSON.parse(r.missing_required || '[]'),
            missingOptional: JSON.parse(r.missing_optional || '[]'),
            detectedItems: JSON.parse(r.detected_items || '[]'),
            confidenceOverall: r.confidence_overall,
            durationMs: r.duration_ms,
            timestamp: r.timestamp
        }));
        res.json({ history });
    }
    catch (error) {
        console.error('Fetch history error:', error);
        res.status(500).json({ error: 'Failed to fetch registration history' });
    }
});
// Single attempt detail
router.get('/attempt/:id', auth_1.extractTenantScope, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { id } = req.params;
        const row = await (0, db_1.queryOne)(`
      SELECT va.id, va.restaurant_id, va.worker_id, va.camera_id, va.result,
             va.items_snapshot, va.missing_required, va.missing_optional,
             va.detected_items, va.confidence_overall, va.duration_ms,
             va.notes, va.timestamp, w.worker_code, w.first_name, w.last_name,
             w.department, c.name as camera_name
      FROM verification_attempts va
      JOIN workers w ON va.worker_id = w.id
      LEFT JOIN cameras c ON va.camera_id = c.id
      WHERE va.restaurant_id = ? AND va.id = ?
    `, [restaurantId, id]);
        if (!row) {
            res.status(404).json({ error: 'Verification attempt not found' });
            return;
        }
        res.json({
            attempt: {
                id: row.id,
                restaurantId: row.restaurant_id,
                workerId: row.worker_id,
                workerCode: row.worker_code,
                workerName: `${row.first_name} ${row.last_name}`,
                department: row.department,
                cameraId: row.camera_id,
                cameraName: row.camera_name || 'Main Camera',
                result: row.result,
                items: JSON.parse(row.items_snapshot || '{}'),
                missingRequired: JSON.parse(row.missing_required || '[]'),
                missingOptional: JSON.parse(row.missing_optional || '[]'),
                detectedItems: JSON.parse(row.detected_items || '[]'),
                confidenceOverall: row.confidence_overall,
                durationMs: row.duration_ms,
                notes: row.notes,
                timestamp: row.timestamp
            }
        });
    }
    catch (error) {
        console.error('Fetch attempt error:', error);
        res.status(500).json({ error: 'Failed to fetch verification attempt' });
    }
});
exports.default = router;
