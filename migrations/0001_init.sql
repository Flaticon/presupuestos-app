CREATE TABLE IF NOT EXISTS app_data (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
