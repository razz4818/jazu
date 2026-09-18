"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("./index");
async function seedDatabase() {
    console.log('🌱 Seeding SafeKitchen AI database...');
    await (0, index_1.getDb)();
    // 1. Seed Demo Restaurant
    const restaurantId = 'rest_demokitchen_001';
    const existingRest = await (0, index_1.queryOne)('SELECT id FROM restaurants WHERE id = ?', [restaurantId]);
    if (!existingRest) {
        await (0, index_1.execute)(`
      INSERT INTO restaurants (id, name, slug, logo_url, address)
      VALUES (?, ?, ?, ?, ?)
    `, [
            restaurantId,
            'Demo Kitchen',
            'demo-kitchen',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=128&auto=format&fit=crop&q=80',
            '742 Evergreen Terrace, Springfield, OR'
        ]);
    }
    // 2. Seed Admin User
    const adminEmail = 'admin@demokitchen.test';
    const existingUser = await (0, index_1.queryOne)('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (!existingUser) {
        const passwordHash = await bcryptjs_1.default.hash('Admin123!', 10);
        await (0, index_1.execute)(`
      INSERT INTO users (id, restaurant_id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
            'user_admin_001',
            restaurantId,
            'Chef Gordon Admin',
            adminEmail,
            passwordHash,
            'admin'
        ]);
        console.log('✅ Demo Admin created: admin@demokitchen.test / Admin123!');
    }
    // 3. Seed Restaurant Settings
    const existingSettings = await (0, index_1.queryOne)('SELECT id FROM restaurant_settings WHERE restaurant_id = ?', [restaurantId]);
    if (!existingSettings) {
        await (0, index_1.execute)(`
      INSERT INTO restaurant_settings (
        id, restaurant_id, restaurant_name, logo_url, timezone,
        default_min_confidence, max_failed_attempts_warning,
        verification_timeout_sec, require_hands_visible, require_head_visible,
        allow_snapshot_storage, ai_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            'sett_001',
            restaurantId,
            'Demo Kitchen',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=128&auto=format&fit=crop&q=80',
            'America/New_York',
            0.85,
            3,
            15,
            1,
            1,
            0,
            'demo'
        ]);
    }
    // 4. Seed Default Equipment Requirements
    const defaultEquipments = [
        {
            id: 'eq_gloves_001',
            name: 'Gloves',
            code: 'gloves',
            icon: 'Hand',
            description: 'Worker must be wearing clean, certified food-handling sanitary gloves.',
            isRequired: 1,
            isEnabled: 1,
            minConfidence: 0.85,
            isCustom: 0
        },
        {
            id: 'eq_hair_cover_002',
            name: 'Hair Cover',
            code: 'hair_cover',
            icon: 'UserCheck',
            description: 'Worker must wear an approved hairnet, chef hat, or skull cap covering all hair.',
            isRequired: 1,
            isEnabled: 1,
            minConfidence: 0.85,
            isCustom: 0
        },
        {
            id: 'eq_apron_003',
            name: 'Apron',
            code: 'apron',
            icon: 'Shield',
            description: 'Worker must be wearing a clean food preparation apron tied securely.',
            isRequired: 1,
            isEnabled: 1,
            minConfidence: 0.85,
            isCustom: 0
        },
        {
            id: 'eq_face_mask_004',
            name: 'Face Mask',
            code: 'face_mask',
            icon: 'Smile',
            description: 'Protective face covering over nose and mouth for cold prep areas.',
            isRequired: 0,
            isEnabled: 1,
            minConfidence: 0.80,
            isCustom: 0
        },
        {
            id: 'eq_safety_shoes_005',
            name: 'Safety Shoes',
            code: 'safety_shoes',
            icon: 'Footprints',
            description: 'Non-slip closed-toe safety shoes for wet kitchen floor safety.',
            isRequired: 0,
            isEnabled: 1,
            minConfidence: 0.80,
            isCustom: 0
        }
    ];
    for (const eq of defaultEquipments) {
        const existing = await (0, index_1.queryOne)('SELECT id FROM equipment_requirements WHERE restaurant_id = ? AND code = ?', [restaurantId, eq.code]);
        if (!existing) {
            await (0, index_1.execute)(`
        INSERT INTO equipment_requirements (
          id, restaurant_id, name, code, icon, description, is_required, is_enabled, min_confidence, is_custom
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                eq.id,
                restaurantId,
                eq.name,
                eq.code,
                eq.icon,
                eq.description,
                eq.isRequired,
                eq.isEnabled,
                eq.minConfidence,
                eq.isCustom
            ]);
        }
    }
    // 5. Seed Demo Workers
    const demoWorkers = [
        { id: 'w_01', code: 'WK-1024', first: 'Elena', last: 'Gomez', dept: 'Prep Kitchen', color: '#10b981' },
        { id: 'w_02', code: 'WK-1025', first: 'Marcus', last: 'Vance', dept: 'Grill Line', color: '#f59e0b' },
        { id: 'w_03', code: 'WK-1026', first: 'Aisha', last: 'Patel', dept: 'Pastry & Bakery', color: '#ec4899' },
        { id: 'w_04', code: 'WK-1027', first: 'Lucas', last: 'Rivera', dept: 'Sous Chef / Expo', color: '#3b82f6' },
        { id: 'w_05', code: 'WK-1028', first: 'David', last: 'Kim', dept: 'Line Cook', color: '#8b5cf6' },
        { id: 'w_06', code: 'WK-1029', first: 'Sarah', last: 'Jenkins', dept: 'Sanitation & Stewarding', color: '#06b6d4' },
        { id: 'w_07', code: 'WK-1030', first: 'Carlos', last: 'Mendez', dept: 'Prep Kitchen', color: '#14b8a6' },
        { id: 'w_08', code: 'WK-1031', first: 'Maya', last: 'Lin', dept: 'Salad & Cold Station', color: '#84cc16' }
    ];
    for (const w of demoWorkers) {
        const existing = await (0, index_1.queryOne)('SELECT id FROM workers WHERE restaurant_id = ? AND worker_code = ?', [restaurantId, w.code]);
        if (!existing) {
            await (0, index_1.execute)(`
        INSERT INTO workers (id, restaurant_id, worker_code, first_name, last_name, department, status, avatar_color)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
      `, [w.id, restaurantId, w.code, w.first, w.last, w.dept, w.color]);
        }
    }
    // 6. Seed Cameras
    const demoCameras = [
        { id: 'cam_01', code: 'CAM-001', name: 'Kitchen Entrance Main', location: 'Station 1 Main Door', status: 'online' },
        { id: 'cam_02', code: 'CAM-002', name: 'Prep Station Checkpoint', location: 'Prep Kitchen North Corridor', status: 'online' },
        { id: 'cam_03', code: 'CAM-003', name: 'Bakery & Pastry Area', location: 'Station 3 Bakery Entrance', status: 'offline' }
    ];
    for (const cam of demoCameras) {
        const existing = await (0, index_1.queryOne)('SELECT id FROM cameras WHERE restaurant_id = ? AND camera_code = ?', [restaurantId, cam.code]);
        if (!existing) {
            await (0, index_1.execute)(`
        INSERT INTO cameras (id, restaurant_id, camera_code, name, location, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [cam.id, restaurantId, cam.code, cam.name, cam.location, cam.status]);
        }
    }
    // 7. Seed Past Verification Records (Today and Past Days)
    const existingAttemptsCount = await (0, index_1.queryOne)('SELECT COUNT(*) as count FROM verification_attempts WHERE restaurant_id = ?', [restaurantId]);
    if (existingAttemptsCount && existingAttemptsCount.count === 0) {
        console.log('Generating realistic historical verification records...');
        const now = new Date();
        const sampleAttempts = [
            {
                workerId: 'w_01',
                workerCode: 'WK-1024',
                result: 'PASS',
                minsAgo: 12,
                missing: [],
                snapshot: {
                    gloves: { code: 'gloves', name: 'Gloves', required: true, detected: true, confidence: 0.96, threshold: 0.85, passed: true },
                    hair_cover: { code: 'hair_cover', name: 'Hair Cover', required: true, detected: true, confidence: 0.94, threshold: 0.85, passed: true },
                    apron: { code: 'apron', name: 'Apron', required: true, detected: true, confidence: 0.92, threshold: 0.85, passed: true },
                    face_mask: { code: 'face_mask', name: 'Face Mask', required: false, detected: true, confidence: 0.88, threshold: 0.80, passed: true }
                }
            },
            {
                workerId: 'w_02',
                workerCode: 'WK-1025',
                result: 'FAIL',
                minsAgo: 25,
                missing: ['Gloves'],
                snapshot: {
                    gloves: { code: 'gloves', name: 'Gloves', required: true, detected: false, confidence: 0.0, threshold: 0.85, passed: false },
                    hair_cover: { code: 'hair_cover', name: 'Hair Cover', required: true, detected: true, confidence: 0.91, threshold: 0.85, passed: true },
                    apron: { code: 'apron', name: 'Apron', required: true, detected: true, confidence: 0.89, threshold: 0.85, passed: true }
                }
            },
            {
                workerId: 'w_03',
                workerCode: 'WK-1026',
                result: 'PASS',
                minsAgo: 45,
                missing: [],
                snapshot: {
                    gloves: { code: 'gloves', name: 'Gloves', required: true, detected: true, confidence: 0.97, threshold: 0.85, passed: true },
                    hair_cover: { code: 'hair_cover', name: 'Hair Cover', required: true, detected: true, confidence: 0.95, threshold: 0.85, passed: true },
                    apron: { code: 'apron', name: 'Apron', required: true, detected: true, confidence: 0.90, threshold: 0.85, passed: true }
                }
            },
            {
                workerId: 'w_04',
                workerCode: 'WK-1027',
                result: 'PASS',
                minsAgo: 70,
                missing: [],
                snapshot: {
                    gloves: { code: 'gloves', name: 'Gloves', required: true, detected: true, confidence: 0.93, threshold: 0.85, passed: true },
                    hair_cover: { code: 'hair_cover', name: 'Hair Cover', required: true, detected: true, confidence: 0.89, threshold: 0.85, passed: true },
                    apron: { code: 'apron', name: 'Apron', required: true, detected: true, confidence: 0.94, threshold: 0.85, passed: true }
                }
            },
            {
                workerId: 'w_05',
                workerCode: 'WK-1028',
                result: 'FAIL',
                minsAgo: 95,
                missing: ['Hair Cover'],
                snapshot: {
                    gloves: { code: 'gloves', name: 'Gloves', required: true, detected: true, confidence: 0.92, threshold: 0.85, passed: true },
                    hair_cover: { code: 'hair_cover', name: 'Hair Cover', required: true, detected: false, confidence: 0.12, threshold: 0.85, passed: false },
                    apron: { code: 'apron', name: 'Apron', required: true, detected: true, confidence: 0.88, threshold: 0.85, passed: true }
                }
            },
            {
                workerId: 'w_06',
                workerCode: 'WK-1029',
                result: 'PASS',
                minsAgo: 140,
                missing: [],
                snapshot: {
                    gloves: { code: 'gloves', name: 'Gloves', required: true, detected: true, confidence: 0.95, threshold: 0.85, passed: true },
                    hair_cover: { code: 'hair_cover', name: 'Hair Cover', required: true, detected: true, confidence: 0.92, threshold: 0.85, passed: true },
                    apron: { code: 'apron', name: 'Apron', required: true, detected: true, confidence: 0.91, threshold: 0.85, passed: true }
                }
            }
        ];
        let attemptIndex = 1;
        for (const sample of sampleAttempts) {
            const attemptDate = new Date(now.getTime() - sample.minsAgo * 60 * 1000);
            const isoTimestamp = attemptDate.toISOString();
            await (0, index_1.execute)(`
        INSERT INTO verification_attempts (
          id, restaurant_id, worker_id, camera_id, result, items_snapshot,
          missing_required, missing_optional, detected_items,
          confidence_overall, duration_ms, notes, timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                `att_demo_${attemptIndex++}`,
                restaurantId,
                sample.workerId,
                'cam_01',
                sample.result,
                JSON.stringify(sample.snapshot),
                JSON.stringify(sample.missing),
                JSON.stringify([]),
                JSON.stringify(Object.keys(sample.snapshot).filter(k => sample.snapshot[k].detected)),
                sample.result === 'PASS' ? 0.94 : 0.65,
                1850,
                'Demo registration check-in record',
                isoTimestamp,
                isoTimestamp
            ]);
        }
        // Add extra historical records across previous days for chart rendering
        for (let dayOffset = 1; dayOffset <= 6; dayOffset++) {
            const dayPassCount = 18 + Math.floor(Math.random() * 8);
            const dayFailCount = 1 + Math.floor(Math.random() * 4);
            const dayDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
            for (let i = 0; i < dayPassCount; i++) {
                const d = new Date(dayDate.getTime() + (i * 30 + 10) * 60 * 1000);
                await (0, index_1.execute)(`
          INSERT INTO verification_attempts (
            id, restaurant_id, worker_id, camera_id, result, items_snapshot,
            missing_required, missing_optional, detected_items,
            confidence_overall, duration_ms, notes, timestamp, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                    `att_hist_${dayOffset}_pass_${i}`,
                    restaurantId,
                    demoWorkers[i % demoWorkers.length].id,
                    'cam_01',
                    'PASS',
                    JSON.stringify({
                        gloves: { code: 'gloves', name: 'Gloves', required: true, detected: true, confidence: 0.94, threshold: 0.85, passed: true },
                        hair_cover: { code: 'hair_cover', name: 'Hair Cover', required: true, detected: true, confidence: 0.92, threshold: 0.85, passed: true },
                        apron: { code: 'apron', name: 'Apron', required: true, detected: true, confidence: 0.90, threshold: 0.85, passed: true }
                    }),
                    JSON.stringify([]),
                    JSON.stringify([]),
                    JSON.stringify(['Gloves', 'Hair Cover', 'Apron']),
                    0.92,
                    1600,
                    'Historical registration',
                    d.toISOString(),
                    d.toISOString()
                ]);
            }
            for (let j = 0; j < dayFailCount; j++) {
                const d = new Date(dayDate.getTime() + (j * 75 + 40) * 60 * 1000);
                const missingItem = j % 2 === 0 ? 'Gloves' : 'Apron';
                await (0, index_1.execute)(`
          INSERT INTO verification_attempts (
            id, restaurant_id, worker_id, camera_id, result, items_snapshot,
            missing_required, missing_optional, detected_items,
            confidence_overall, duration_ms, notes, timestamp, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                    `att_hist_${dayOffset}_fail_${j}`,
                    restaurantId,
                    demoWorkers[(j + 2) % demoWorkers.length].id,
                    'cam_01',
                    'FAIL',
                    JSON.stringify({
                        gloves: { code: 'gloves', name: 'Gloves', required: true, detected: missingItem !== 'Gloves', confidence: missingItem === 'Gloves' ? 0 : 0.91, threshold: 0.85, passed: missingItem !== 'Gloves' },
                        hair_cover: { code: 'hair_cover', name: 'Hair Cover', required: true, detected: true, confidence: 0.93, threshold: 0.85, passed: true },
                        apron: { code: 'apron', name: 'Apron', required: true, detected: missingItem !== 'Apron', confidence: missingItem === 'Apron' ? 0 : 0.88, threshold: 0.85, passed: missingItem !== 'Apron' }
                    }),
                    JSON.stringify([missingItem]),
                    JSON.stringify([]),
                    JSON.stringify(['Hair Cover']),
                    0.61,
                    2100,
                    'Historical failed attempt',
                    d.toISOString(),
                    d.toISOString()
                ]);
            }
        }
    }
    (0, index_1.saveDb)();
    console.log('✨ Seed complete! SafeKitchen AI ready with rich demo data.');
}
if (require.main === module || process.argv[1]?.includes('seed')) {
    seedDatabase().then(() => {
        process.exit(0);
    }).catch((err) => {
        console.error('Seed error:', err);
        process.exit(1);
    });
}
