"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.authenticate = authenticate;
exports.extractTenantScope = extractTenantScope;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'safekitchen-super-secret-key-2026';
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        req.restaurantId = decoded.restaurantId;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
}
// Optional auth for kiosk or publicly accessible endpoints within restaurant scope
function extractTenantScope(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = decoded;
            req.restaurantId = decoded.restaurantId;
            next();
            return;
        }
        catch {
            // Fallback to header or default
        }
    }
    // Tenant header or default fallback for public kiosk in single-tenant/demo context
    const tenantHeader = req.headers['x-restaurant-id'];
    req.restaurantId = tenantHeader || 'rest_demokitchen_001';
    next();
}
