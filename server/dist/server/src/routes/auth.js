"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const user = await (0, db_1.queryOne)(`
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
        const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const token = (0, auth_1.generateToken)({
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await (0, db_1.queryOne)(`
      SELECT u.id, u.restaurant_id, u.name, u.email, u.role,
             r.name as restaurant_name, r.slug as restaurant_slug, r.logo_url
      FROM users u
      JOIN restaurants r ON u.restaurant_id = r.id
      WHERE u.id = ?
    `, [req.user.userId]);
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
    }
    catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ error: 'Server error retrieving current user' });
    }
});
exports.default = router;
