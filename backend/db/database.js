const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

// Store data in json file (use /tmp on Vercel for serverless write permission)
const dbFilePath = process.env.VERCEL 
  ? path.join('/tmp', 'db_data.json')
  : path.join(__dirname, '..', 'db_data.json');

let data = {
  users: [],
  lost_items: [],
  found_items: [],
  notifications: []
};

// Load existing data from file if present
function loadData() {
  try {
    if (fs.existsSync(dbFilePath)) {
      const content = fs.readFileSync(dbFilePath, 'utf8');
      data = JSON.parse(content);
      if (!data.users) data.users = [];
      if (!data.lost_items) data.lost_items = [];
      if (!data.found_items) data.found_items = [];
      if (!data.notifications) data.notifications = [];
    }
  } catch (e) {
    console.error("Error loading db file:", e.message);
  }

  // Ensure default admin exists
  const adminExists = data.users.some(u => u.role === 'admin' || u.email === 'admin@college.edu');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    data.users.push({
      id: nanoid(),
      fullname: 'College Admin',
      reg_no: 'ADMIN',
      email: 'admin@college.edu',
      password: hash,
      role: 'admin'
    });
    saveData();
  }
}

function saveData() {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving db file:", e.message);
  }
}

loadData();

// Pure JS Database Engine providing SQLite-compatible API (get, all, run, exec)
const db = {
  exec: (sql) => {
    // Schema initialization is handled automatically by memory store
    return true;
  },

  prepare: (sql) => {
    const normalizedSql = sql.trim().replace(/\s+/g, ' ');

    return {
      get: (...params) => {
        // Flatten params if passed as array
        if (params.length === 1 && Array.isArray(params[0])) params = params[0];

        if (/SELECT id FROM users WHERE role = \?/i.test(normalizedSql)) {
          const role = params[0];
          return data.users.find(u => u.role === role) || null;
        }

        if (/SELECT \* FROM users WHERE email = \?/i.test(normalizedSql)) {
          const email = params[0];
          return data.users.find(u => u.email === email) || null;
        }

        if (/SELECT id, fullname, email, reg_no, role FROM users WHERE id = \?/i.test(normalizedSql) ||
            /SELECT \* FROM users WHERE id = \?/i.test(normalizedSql)) {
          const id = params[0];
          return data.users.find(u => u.id === id) || null;
        }

        if (/SELECT user_id FROM lost_items WHERE id = \?/i.test(normalizedSql)) {
          const id = params[0];
          const item = data.lost_items.find(i => i.id === id);
          return item ? { user_id: item.user_id } : null;
        }

        if (/SELECT COUNT\(\*\) as count FROM lost_items WHERE status = 'lost'/i.test(normalizedSql)) {
          const count = data.lost_items.filter(i => i.status === 'lost').length;
          return { count };
        }

        if (/SELECT COUNT\(\*\) as count FROM found_items WHERE status = 'found'/i.test(normalizedSql)) {
          const count = data.found_items.filter(i => i.status === 'found').length;
          return { count };
        }

        if (/SELECT COUNT\(\*\) as count FROM lost_items WHERE status = 'claimed'/i.test(normalizedSql)) {
          const count = data.lost_items.filter(i => i.status === 'claimed').length;
          return { count };
        }

        return null;
      },

      all: (...params) => {
        if (params.length === 1 && Array.isArray(params[0])) params = params[0];

        if (/SELECT id, fullname, reg_no, email, role FROM users/i.test(normalizedSql)) {
          return data.users.map(u => ({ id: u.id, fullname: u.fullname, reg_no: u.reg_no, email: u.email, role: u.role }));
        }

        if (/SELECT id FROM users WHERE id != \?/i.test(normalizedSql)) {
          const currentId = params[0];
          return data.users.filter(u => u.id !== currentId).map(u => ({ id: u.id }));
        }

        if (/SELECT \* FROM lost_items WHERE user_id = \?/i.test(normalizedSql)) {
          const userId = params[0];
          return data.lost_items
            .filter(i => i.user_id === userId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        if (/SELECT li\.\*, u\.fullname, u\.email FROM lost_items li JOIN users u ON li\.user_id = u\.id/i.test(normalizedSql)) {
          return data.lost_items
            .filter(i => i.status === 'lost' || i.status === 'claimed')
            .map(i => {
              const u = data.users.find(user => user.id === i.user_id) || {};
              return { ...i, fullname: u.fullname || 'Unknown', email: u.email || '' };
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        if (/SELECT \* FROM lost_items/i.test(normalizedSql)) {
          return [...data.lost_items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        if (/SELECT \* FROM found_items WHERE status = 'found'/i.test(normalizedSql)) {
          return data.found_items
            .filter(i => i.status === 'found')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        if (/SELECT \* FROM found_items/i.test(normalizedSql)) {
          return [...data.found_items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        if (/SELECT user_id FROM lost_items WHERE item_name LIKE \? OR location LIKE \?/i.test(normalizedSql)) {
          const searchName = (params[0] || '').replace(/%/g, '').toLowerCase();
          const searchLoc = (params[1] || '').replace(/%/g, '').toLowerCase();
          return data.lost_items
            .filter(i => (searchName && i.item_name.toLowerCase().includes(searchName)) || 
                         (searchLoc && i.location.toLowerCase().includes(searchLoc)))
            .map(i => ({ user_id: i.user_id }));
        }

        if (/SELECT \* FROM notifications WHERE user_id = \?/i.test(normalizedSql)) {
          const userId = params[0];
          return data.notifications
            .filter(n => n.user_id === userId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        return [];
      },

      run: (...params) => {
        if (params.length === 1 && Array.isArray(params[0])) params = params[0];

        // INSERT INTO users
        if (/INSERT INTO users/i.test(normalizedSql)) {
          const [id, fullname, reg_no, email, password, role = 'user'] = params;
          const exists = data.users.some(u => u.email === email || u.reg_no === reg_no);
          if (exists) {
            throw new Error('UNIQUE constraint failed: reg_no or email already exists');
          }
          data.users.push({ id, fullname, reg_no, email, password, role });
          saveData();
          return { lastInsertRowid: id, changes: 1 };
        }

        // INSERT INTO lost_items
        if (/INSERT INTO lost_items/i.test(normalizedSql)) {
          const [id, user_id, item_name, date, location, category, contact_info, description, image_url] = params;
          data.lost_items.push({
            id, user_id, item_name, date, location, category, contact_info, description, image_url,
            status: 'lost', created_at: new Date().toISOString()
          });
          saveData();
          return { lastInsertRowid: id, changes: 1 };
        }

        // INSERT INTO found_items
        if (/INSERT INTO found_items/i.test(normalizedSql)) {
          const [id, reporter_id, item_name, date, location, category, contact_info, description, image_url] = params;
          data.found_items.push({
            id, reporter_id, item_name, date, location, category, contact_info, description, image_url,
            status: 'found', created_at: new Date().toISOString()
          });
          saveData();
          return { lastInsertRowid: id, changes: 1 };
        }

        // INSERT INTO notifications
        if (/INSERT INTO notifications/i.test(normalizedSql)) {
          const [id, user_id, message] = params;
          data.notifications.push({
            id, user_id, message, is_read: 0, created_at: new Date().toISOString()
          });
          saveData();
          return { lastInsertRowid: id, changes: 1 };
        }

        // UPDATE lost_items SET status = 'claimed' WHERE id = ?
        if (/UPDATE lost_items SET status = 'claimed' WHERE id = \?/i.test(normalizedSql)) {
          const id = params[0];
          const item = data.lost_items.find(i => i.id === id);
          if (item) item.status = 'claimed';
          saveData();
          return { changes: item ? 1 : 0 };
        }

        // UPDATE found_items SET status = 'claimed' WHERE id = ?
        if (/UPDATE found_items SET status = 'claimed' WHERE id = \?/i.test(normalizedSql)) {
          const id = params[0];
          const item = data.found_items.find(i => i.id === id);
          if (item) item.status = 'claimed';
          saveData();
          return { changes: item ? 1 : 0 };
        }

        // UPDATE users SET fullname = ?, email = ?, reg_no = ? WHERE id = ?
        if (/UPDATE users SET fullname = \?, email = \?, reg_no = \? WHERE id = \?/i.test(normalizedSql)) {
          const [fullname, email, reg_no, id] = params;
          const user = data.users.find(u => u.id === id);
          if (user) {
            const exists = data.users.some(u => u.id !== id && (u.email === email || u.reg_no === reg_no));
            if (exists) {
              throw new Error('UNIQUE constraint failed: Email or Register Number already exists');
            }
            user.fullname = fullname;
            user.email = email;
            user.reg_no = reg_no;
            saveData();
          }
          return { changes: user ? 1 : 0 };
        }

        // UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?
        if (/UPDATE notifications SET is_read = 1 WHERE id = \? AND user_id = \?/i.test(normalizedSql)) {
          const [id, userId] = params;
          const notif = data.notifications.find(n => n.id === id && n.user_id === userId);
          if (notif) notif.is_read = 1;
          saveData();
          return { changes: notif ? 1 : 0 };
        }

        // UPDATE notifications SET is_read = 1 WHERE user_id = ?
        if (/UPDATE notifications SET is_read = 1 WHERE user_id = \?/i.test(normalizedSql)) {
          const userId = params[0];
          data.notifications.forEach(n => { if (n.user_id === userId) n.is_read = 1; });
          saveData();
          return { changes: 1 };
        }

        // DELETE FROM users WHERE id = ?
        if (/DELETE FROM users WHERE id = \?/i.test(normalizedSql)) {
          const id = params[0];
          data.users = data.users.filter(u => u.id !== id);
          saveData();
          return { changes: 1 };
        }

        // DELETE FROM lost_items WHERE id = ?
        if (/DELETE FROM lost_items WHERE id = \?/i.test(normalizedSql)) {
          const id = params[0];
          data.lost_items = data.lost_items.filter(i => i.id !== id);
          saveData();
          return { changes: 1 };
        }

        // DELETE FROM found_items WHERE id = ?
        if (/DELETE FROM found_items WHERE id = \?/i.test(normalizedSql)) {
          const id = params[0];
          data.found_items = data.found_items.filter(i => i.id !== id);
          saveData();
          return { changes: 1 };
        }

        // DELETE FROM notifications WHERE id = ? AND user_id = ?
        if (/DELETE FROM notifications WHERE id = \? AND user_id = \?/i.test(normalizedSql)) {
          const [id, userId] = params;
          data.notifications = data.notifications.filter(n => !(n.id === id && n.user_id === userId));
          saveData();
          return { changes: 1 };
        }

        return { changes: 0 };
      }
    };
  }
};

module.exports = db;
