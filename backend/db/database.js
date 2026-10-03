const Database = require('better-sqlite3');
const path = require('path');
const { nanoid } = require('nanoid');

const db = new Database(path.join(__dirname, '..', 'database.db'));

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

// Migration for existing database
try { db.exec("ALTER TABLE lost_items ADD COLUMN category TEXT;"); } catch(e){}
try { db.exec("ALTER TABLE lost_items ADD COLUMN contact_info TEXT;"); } catch(e){}
try { db.exec("ALTER TABLE lost_items ADD COLUMN image_url TEXT;"); } catch(e){}
try { db.exec("ALTER TABLE found_items ADD COLUMN category TEXT;"); } catch(e){}
try { db.exec("ALTER TABLE found_items ADD COLUMN contact_info TEXT;"); } catch(e){}
try { db.exec("ALTER TABLE found_items ADD COLUMN image_url TEXT;"); } catch(e){}

module.exports = db;
