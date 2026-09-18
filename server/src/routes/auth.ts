import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne } from '../db';
import { generateToken, authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await queryOne(`
      SELECT u.id, u.restaurant_id, u.name, u.email, u.password_hash, u.role,
             r.name as restaurant_name, r.slug as restaurant_slug, r.logo_url
      FROM users u
      JOIN restaurants r ON u.restaurant_id = r.id
      WHERE u.email = ?
    `, [email.toLowerCase().trim()]);

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      restaurantId: user.restaurant_id,
      email: user.email,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user.id,
        restaurantId: user.restaurant_id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      restaurant: {
        id: user.restaurant_id,
        name: user.restaurant_name,
        slug: user.restaurant_slug,
        logoUrl: user.logo_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await queryOne(`
      SELECT u.id, u.restaurant_id, u.name, u.email, u.role,
             r.name as restaurant_name, r.slug as restaurant_slug, r.logo_url
      FROM users u
      JOIN restaurants r ON u.restaurant_id = r.id
      WHERE u.id = ?
    `, [req.user!.userId]);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        restaurantId: user.restaurant_id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      restaurant: {
        id: user.restaurant_id,
        name: user.restaurant_name,
        slug: user.restaurant_slug,
        logoUrl: user.logo_url
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Server error retrieving current user' });
  }
});

export default router;
