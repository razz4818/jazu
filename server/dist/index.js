"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const workers_1 = __importDefault(require("./routes/workers"));
const equipment_1 = __importDefault(require("./routes/equipment"));
const cameras_1 = __importDefault(require("./routes/cameras"));
const verification_1 = __importDefault(require("./routes/verification"));
const reports_1 = __importDefault(require("./routes/reports"));
const settings_1 = __importDefault(require("./routes/settings"));
const ai_1 = __importDefault(require("./routes/ai"));
const db_1 = require("./db");
const seed_1 = require("./db/seed");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-restaurant-id']
}));
app.use(express_1.default.json({ limit: '15mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '15mb' }));
// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'SafeKitchen AI Backend Service',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/workers', workers_1.default);
app.use('/api/equipment', equipment_1.default);
app.use('/api/cameras', cameras_1.default);
app.use('/api/verification', verification_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/ai', ai_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Start Server
async function startServer() {
    try {
        await (0, db_1.getDb)();
        await (0, seed_1.seedDatabase)();
        app.listen(PORT, () => {
            console.log(`🚀 SafeKitchen AI Server running on http://localhost:${PORT}`);
            console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
if (process.env.NODE_ENV !== 'test') {
    startServer();
}
exports.default = app;
