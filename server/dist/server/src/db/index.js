"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.saveDb = saveDb;
exports.queryAll = queryAll;
exports.queryOne = queryOne;
exports.execute = execute;
const sql_js_1 = __importDefault(require("sql.js"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let dbInstance = null;
const dbFilePath = path_1.default.resolve(__dirname, '../../safekitchen.sqlite');
const schemaPath = path_1.default.resolve(__dirname, 'schema.sql');
async function getDb() {
    if (dbInstance) {
        return dbInstance;
    }
    const SQL = await (0, sql_js_1.default)();
    if (fs_1.default.existsSync(dbFilePath)) {
        const fileBuffer = fs_1.default.readFileSync(dbFilePath);
        dbInstance = new SQL.Database(fileBuffer);
    }
    else {
        dbInstance = new SQL.Database();
    }
    // Ensure tables and schema exist
    if (fs_1.default.existsSync(schemaPath)) {
        const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf-8');
        dbInstance.run(schemaSql);
        saveDb();
    }
    return dbInstance;
}
function saveDb() {
    if (!dbInstance)
        return;
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs_1.default.writeFileSync(dbFilePath, buffer);
}
// Helpers for querying
async function queryAll(sql, params = []) {
    const db = await getDb();
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
        stmt.bind(params);
    }
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}
async function queryOne(sql, params = []) {
    const results = await queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
}
async function execute(sql, params = []) {
    const db = await getDb();
    if (params && params.length > 0) {
        const stmt = db.prepare(sql);
        stmt.run(params);
        stmt.free();
    }
    else {
        db.run(sql);
    }
    saveDb();
}
