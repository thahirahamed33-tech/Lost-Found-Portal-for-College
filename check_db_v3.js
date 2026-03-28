const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'database.db'));
try {
  const lost = db.prepare('SELECT id, created_at FROM lost_items').all();
  console.log('LOST TIMESTAMPS:', JSON.stringify(lost, null, 2));
} catch (e) {
  console.error(e);
}
