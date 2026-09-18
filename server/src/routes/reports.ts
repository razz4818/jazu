import { Router, Request, Response } from 'express';
import { queryAll, queryOne } from '../db';
import { extractTenantScope } from '../middleware/auth';

const router = Router();

router.get('/', extractTenantScope, async (req: Request, res: Response) => {
  try {
    const restaurantId = req.restaurantId!;
    const timeframe = (req.query.timeframe as string) || '7d';
    let startDate: Date;
    const endDate = new Date();

    if (timeframe === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === '30d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'custom' && req.query.startDate) {
      startDate = new Date(String(req.query.startDate));
      if (req.query.endDate) {
        endDate.setTime(new Date(String(req.query.endDate)).getTime());
      }
    } else {
      // Default: 7 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    // 1. Overall stats for timeframe
    const overallStats = await queryOne<{ total: number; passed: number; failed: number }>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN result = 'PASS' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN result = 'FAIL' THEN 1 ELSE 0 END) as failed
      FROM verification_attempts
      WHERE restaurant_id = ? AND timestamp >= ? AND timestamp <= ?
    `, [restaurantId, startIso, endIso]);

    const total = overallStats?.total || 0;
    const passed = overallStats?.passed || 0;
    const failed = overallStats?.failed || 0;
    const complianceRate = total > 0 ? Math.round((passed / total) * 100) : 100;

    // 2. Daily breakdown
    const dailyRows = await queryAll<{ date_str: string; total: number; passed: number; failed: number }>(`
      SELECT
        substr(timestamp, 1, 10) as date_str,
        COUNT(*) as total,
        SUM(CASE WHEN result = 'PASS' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN result = 'FAIL' THEN 1 ELSE 0 END) as failed
      FROM verification_attempts
      WHERE restaurant_id = ? AND timestamp >= ? AND timestamp <= ?
      GROUP BY substr(timestamp, 1, 10)
      ORDER BY date_str ASC
    `, [restaurantId, startIso, endIso]);

    const dailyTrend = dailyRows.map(r => ({
      date: r.date_str,
      total: r.total,
      passed: r.passed,
      failed: r.failed,
      complianceRate: r.total > 0 ? Math.round((r.passed / r.total) * 100) : 100
    }));

    // 3. Missing PPE frequency breakdown
    const failedAttempts = await queryAll<{ missing_required: string }>(`
      SELECT missing_required
      FROM verification_attempts
      WHERE restaurant_id = ? AND result = 'FAIL' AND timestamp >= ? AND timestamp <= ?
    `, [restaurantId, startIso, endIso]);

    const missingCountMap: Record<string, number> = {};
    for (const attempt of failedAttempts) {
      try {
        const missingList: string[] = JSON.parse(attempt.missing_required || '[]');
        for (const item of missingList) {
          missingCountMap[item] = (missingCountMap[item] || 0) + 1;
        }
      } catch {}
    }

    const missingPpeFrequency = Object.entries(missingCountMap).map(([name, count]) => ({
      code: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name,
      count,
      percentage: failed > 0 ? Math.round((count / failed) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // 4. Department breakdown
    const deptRows = await queryAll<{ department: string; total: number; passed: number; failed: number }>(`
      SELECT
        w.department,
        COUNT(*) as total,
        SUM(CASE WHEN va.result = 'PASS' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN va.result = 'FAIL' THEN 1 ELSE 0 END) as failed
      FROM verification_attempts va
      JOIN workers w ON va.worker_id = w.id
      WHERE va.restaurant_id = ? AND va.timestamp >= ? AND va.timestamp <= ?
      GROUP BY w.department
      ORDER BY total DESC
    `, [restaurantId, startIso, endIso]);

    const departmentBreakdown = deptRows.map(d => ({
      department: d.department,
      total: d.total,
      passed: d.passed,
      failed: d.failed,
      complianceRate: d.total > 0 ? Math.round((d.passed / d.total) * 100) : 100
    }));

    res.json({
      timeframe,
      startDate: startIso,
      endDate: endIso,
      totalRegistrations: total,
      passedCount: passed,
      failedCount: failed,
      complianceRate,
      dailyTrend,
      missingPpeFrequency,
      departmentBreakdown
    });
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ error: 'Failed to generate compliance reports' });
  }
});

export default router;
