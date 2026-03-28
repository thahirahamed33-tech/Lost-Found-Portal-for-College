const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'database.db'));
try{
  const lost = db.prepare('SELECT * FROM lost_items').all();
  console.log('LOST ITEMS:', JSON.stringify(lost, null, 2));
  const found = db.prepare('SELECT * FROM found_items').all();
  console.log('FOUND ITEMS:', JSON.stringify(found, null, 2));
} 
  catch (e) 
{
  console.error(e);
}
