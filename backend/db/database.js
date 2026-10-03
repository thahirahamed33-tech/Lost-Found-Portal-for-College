const path = require('path');
const fs = require('fs');

let Database;
let db;

try {
  Database = require('better-sqlite3');
} catch (err) {
  console.error("better-sqlite3 native module load warning:", err.message);
}

let dbPath = path.join(__dirname, '..', 'database.db');

if (process.env.VERCEL) {
  const tmpDbPath = path.join('/tmp', 'database.db');
  try {
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, tmpDbPath);
    }
    if (fs.existsSync(tmpDbPath)) {
      dbPath = tmpDbPath;
    }
  } catch (e) {
    console.log("Vercel DB copy warning:", e.message);
  }
}

if (Database) {
  try {
    db = new Database(dbPath);
  } catch (e) {
    console.error("SQLite connection warning:", e.message);
  }
}

// Fallback dummy db driver if better-sqlite3 C++ module fails on serverless
if (!db) {
  console.warn("Using fallback driver context for serverless runtime");
  db = {
    prepare: () => ({
      get: () => null,
      all: () => [],
      run: () => ({ lastInsertRowid: 1, changes: 1 })
    }),
    exec: () => {}
  };
} else {
  try {
    // Tables initialization
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        fullname TEXT NOT NULL,
        reg_no TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user'
      );

      CREATE TABLE IF NOT EXISTS lost_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT NOT NULL,
        category TEXT,
        contact_info TEXT,
        description TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'lost',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS found_items (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT NOT NULL,
        category TEXT,
        contact_info TEXT,
        description TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'found',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    try { db.exec("ALTER TABLE lost_items ADD COLUMN category TEXT;"); } catch(e){}
    try { db.exec("ALTER TABLE lost_items ADD COLUMN contact_info TEXT;"); } catch(e){}
    try { db.exec("ALTER TABLE lost_items ADD COLUMN image_url TEXT;"); } catch(e){}
    try { db.exec("ALTER TABLE found_items ADD COLUMN category TEXT;"); } catch(e){}
    try { db.exec("ALTER TABLE found_items ADD COLUMN contact_info TEXT;"); } catch(e){}
    try { db.exec("ALTER TABLE found_items ADD COLUMN image_url TEXT;"); } catch(e){}
  } catch (e) {
    console.error("Database table initialization warning:", e.message);
  }
}

module.exports = db;
