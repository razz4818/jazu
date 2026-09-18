"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
const db_1 = require("../db");
const seed_1 = require("../db/seed");
(0, vitest_1.describe)('SafeKitchen AI - API & Tenant Isolation Tests', () => {
    let adminToken;
    (0, vitest_1.beforeAll)(async () => {
        await (0, db_1.getDb)();
        await (0, seed_1.seedDatabase)();
        // Create a second restaurant for tenant isolation testing
        await (0, db_1.execute)(`
      INSERT OR IGNORE INTO restaurants (id, name, slug)
      VALUES ('rest_other_999', 'Other Bistro', 'other-bistro')
    `);
        await (0, db_1.execute)(`
      INSERT OR IGNORE INTO workers (id, restaurant_id, worker_code, first_name, last_name, department)
      VALUES ('w_other_1', 'rest_other_999', 'WK-9999', 'Secret', 'Employee', 'Pastry')
    `);
    });
    (0, vitest_1.it)('1. Authentication with Demo Admin Credentials Succeeds', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({
            email: 'admin@demokitchen.test',
            password: 'Admin123!'
        });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.token).toBeDefined();
        (0, vitest_1.expect)(res.body.user.email).toBe('admin@demokitchen.test');
        (0, vitest_1.expect)(res.body.restaurant.id).toBe('rest_demokitchen_001');
        adminToken = res.body.token;
    });
    (0, vitest_1.it)('2. Invalid Password Fails Authentication', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({
            email: 'admin@demokitchen.test',
            password: 'WrongPassword!'
        });
        (0, vitest_1.expect)(res.status).toBe(401);
    });
    (0, vitest_1.it)('3. Workers list isolates by restaurant tenant', async () => {
        // Request with Demo Kitchen tenant
        const resDemo = await (0, supertest_1.default)(index_1.default)
            .get('/api/workers')
            .set('x-restaurant-id', 'rest_demokitchen_001');
        (0, vitest_1.expect)(resDemo.status).toBe(200);
        (0, vitest_1.expect)(resDemo.body.workers.length).toBeGreaterThan(0);
        const workerCodes = resDemo.body.workers.map((w) => w.workerCode);
        (0, vitest_1.expect)(workerCodes).toContain('WK-1024');
        (0, vitest_1.expect)(workerCodes).not.toContain('WK-9999'); // Other restaurant's worker not visible
        // Request with Other Bistro tenant
        const resOther = await (0, supertest_1.default)(index_1.default)
            .get('/api/workers')
            .set('x-restaurant-id', 'rest_other_999');
        (0, vitest_1.expect)(resOther.status).toBe(200);
        const otherCodes = resOther.body.workers.map((w) => w.workerCode);
        (0, vitest_1.expect)(otherCodes).toContain('WK-9999');
        (0, vitest_1.expect)(otherCodes).not.toContain('WK-1024');
    });
    (0, vitest_1.it)('4. Worker Verification Check-in Endpoint Evaluates & Stores Attempt', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/verification')
            .set('x-restaurant-id', 'rest_demokitchen_001')
            .send({
            workerId: 'WK-1024',
            cameraId: 'cam_01',
            detection: {
                personDetected: true,
                multiplePeople: false,
                personPosition: 'good',
                items: {
                    gloves: { detected: true, confidence: 0.96 },
                    hair_cover: { detected: true, confidence: 0.94 },
                    apron: { detected: true, confidence: 0.92 }
                },
                timestamp: Date.now(),
                inferenceTimeMs: 38
            }
        });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.result).toBe('PASS');
        (0, vitest_1.expect)(res.body.worker.workerCode).toBe('WK-1024');
        (0, vitest_1.expect)(res.body.attemptId).toBeDefined();
    });
    (0, vitest_1.it)('5. Equipment Requirements can be dynamically fetched', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/equipment')
            .set('x-restaurant-id', 'rest_demokitchen_001');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.equipment.length).toBeGreaterThanOrEqual(3);
        const codes = res.body.equipment.map((e) => e.code);
        (0, vitest_1.expect)(codes).toContain('gloves');
        (0, vitest_1.expect)(codes).toContain('hair_cover');
        (0, vitest_1.expect)(codes).toContain('apron');
    });
    (0, vitest_1.it)('6. Dashboard Stats endpoint returns summary metrics', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/verification/stats')
            .set('x-restaurant-id', 'rest_demokitchen_001');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.compliancePercentage).toBeGreaterThanOrEqual(0);
        (0, vitest_1.expect)(res.body.activeWorkersCount).toBeGreaterThan(0);
        (0, vitest_1.expect)(res.body.recentRegistrations.length).toBeGreaterThan(0);
    });
});
