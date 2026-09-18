-- SafeKitchen AI Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  worker_code TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  avatar_color TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (restaurant_id, worker_code),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS equipment_requirements (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  is_required INTEGER NOT NULL DEFAULT 1,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  min_confidence REAL NOT NULL DEFAULT 0.85,
  is_custom INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (restaurant_id, code),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cameras (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  camera_code TEXT NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  resolution TEXT DEFAULT '1080p',
  ip_address TEXT DEFAULT '192.168.1.101',
  last_active_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (restaurant_id, camera_code),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification_attempts (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  camera_id TEXT,
  result TEXT NOT NULL, -- 'PASS', 'FAIL', 'NEEDS_RETRY'
  items_snapshot TEXT NOT NULL, -- JSON string of items and evaluation
  missing_required TEXT, -- JSON array of missing required item names
  missing_optional TEXT, -- JSON array of missing optional item names
  detected_items TEXT, -- JSON array of detected item names
  confidence_overall REAL NOT NULL DEFAULT 0.0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
  FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS restaurant_settings (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT UNIQUE NOT NULL,
  restaurant_name TEXT NOT NULL,
  logo_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  default_min_confidence REAL NOT NULL DEFAULT 0.85,
  max_failed_attempts_warning INTEGER NOT NULL DEFAULT 3,
  verification_timeout_sec INTEGER NOT NULL DEFAULT 15,
  require_hands_visible INTEGER NOT NULL DEFAULT 1,
  require_head_visible INTEGER NOT NULL DEFAULT 1,
  allow_snapshot_storage INTEGER NOT NULL DEFAULT 0,
  ai_mode TEXT NOT NULL DEFAULT 'demo',
  real_model_endpoint TEXT,
  real_model_api_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workers_restaurant ON workers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_equipment_restaurant ON equipment_requirements(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_cameras_restaurant ON cameras(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_verifications_restaurant ON verification_attempts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_verifications_worker ON verification_attempts(worker_id);
CREATE INDEX IF NOT EXISTS idx_verifications_timestamp ON verification_attempts(timestamp);
