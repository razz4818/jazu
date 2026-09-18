import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'safekitchen-super-secret-key-2026';

export interface AuthenticatedUser {
  userId: string;
  restaurantId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      restaurantId?: string;
    }
  }
}

export function generateToken(payload: AuthenticatedUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    req.restaurantId = decoded.restaurantId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

// Optional auth for kiosk or publicly accessible endpoints within restaurant scope
export function extractTenantScope(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
      req.restaurantId = decoded.restaurantId;
      next();
      return;
    } catch {
      // Fallback to header or default
    }
  }

  // Tenant header or default fallback for public kiosk in single-tenant/demo context
  const tenantHeader = req.headers['x-restaurant-id'] as string;
  req.restaurantId = tenantHeader || 'rest_demokitchen_001';
  next();
}
