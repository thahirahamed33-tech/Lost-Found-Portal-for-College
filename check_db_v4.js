const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'database.db'));
try {
  const lost = db.prepare("SELECT count(*) as count FROM lost_items WHERE status = 'lost'").get().count;
  console.log('COUNT WITH SINGLE QUOTE:', lost);
  const lostDouble = db.prepare('SELECT count(*) as count FROM lost_items WHERE status = "lost"').get().count;
  console.log('COUNT WITH DOUBLE QUOTE:', lostDouble);
} catch (e) {
  console.error(e);
}
