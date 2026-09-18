import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { getDb, execute } from '../db';
import { seedDatabase } from '../db/seed';

describe('SafeKitchen AI - API & Tenant Isolation Tests', () => {
  let adminToken: string;

  beforeAll(async () => {
    await getDb();
    await seedDatabase();

    // Create a second restaurant for tenant isolation testing
    await execute(`
      INSERT OR IGNORE INTO restaurants (id, name, slug)
      VALUES ('rest_other_999', 'Other Bistro', 'other-bistro')
    `);

    await execute(`
      INSERT OR IGNORE INTO workers (id, restaurant_id, worker_code, first_name, last_name, department)
      VALUES ('w_other_1', 'rest_other_999', 'WK-9999', 'Secret', 'Employee', 'Pastry')
    `);
  });

  it('1. Authentication with Demo Admin Credentials Succeeds', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@demokitchen.test',
        password: 'Admin123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('admin@demokitchen.test');
    expect(res.body.restaurant.id).toBe('rest_demokitchen_001');

    adminToken = res.body.token;
  });

  it('2. Invalid Password Fails Authentication', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@demokitchen.test',
        password: 'WrongPassword!'
      });

    expect(res.status).toBe(401);
  });

  it('3. Workers list isolates by restaurant tenant', async () => {
    // Request with Demo Kitchen tenant
    const resDemo = await request(app)
      .get('/api/workers')
      .set('x-restaurant-id', 'rest_demokitchen_001');

    expect(resDemo.status).toBe(200);
    expect(resDemo.body.workers.length).toBeGreaterThan(0);
    const workerCodes = resDemo.body.workers.map((w: any) => w.workerCode);
    expect(workerCodes).toContain('WK-1024');
    expect(workerCodes).not.toContain('WK-9999'); // Other restaurant's worker not visible

    // Request with Other Bistro tenant
    const resOther = await request(app)
      .get('/api/workers')
      .set('x-restaurant-id', 'rest_other_999');

    expect(resOther.status).toBe(200);
    const otherCodes = resOther.body.workers.map((w: any) => w.workerCode);
    expect(otherCodes).toContain('WK-9999');
    expect(otherCodes).not.toContain('WK-1024');
  });

  it('4. Worker Verification Check-in Endpoint Evaluates & Stores Attempt', async () => {
    const res = await request(app)
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

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('PASS');
    expect(res.body.worker.workerCode).toBe('WK-1024');
    expect(res.body.attemptId).toBeDefined();
  });

  it('5. Equipment Requirements can be dynamically fetched', async () => {
    const res = await request(app)
      .get('/api/equipment')
      .set('x-restaurant-id', 'rest_demokitchen_001');

    expect(res.status).toBe(200);
    expect(res.body.equipment.length).toBeGreaterThanOrEqual(3);
    const codes = res.body.equipment.map((e: any) => e.code);
    expect(codes).toContain('gloves');
    expect(codes).toContain('hair_cover');
    expect(codes).toContain('apron');
  });

  it('6. Dashboard Stats endpoint returns summary metrics', async () => {
    const res = await request(app)
      .get('/api/verification/stats')
      .set('x-restaurant-id', 'rest_demokitchen_001');

    expect(res.status).toBe(200);
    expect(res.body.compliancePercentage).toBeGreaterThanOrEqual(0);
    expect(res.body.activeWorkersCount).toBeGreaterThan(0);
    expect(res.body.recentRegistrations.length).toBeGreaterThan(0);
  });
});
