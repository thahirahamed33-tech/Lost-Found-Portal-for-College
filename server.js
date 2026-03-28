const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const multer = require('multer');
const fs = require('fs');
const db = require('./db/database');

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'lfd_college_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Create default admin if not exists
const checkAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!checkAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (id, fullname, reg_no, email, password, role) VALUES (?, ?, ?, ?, ?, ?)')
    .run(nanoid(), 'College Admin', 'ADMIN', 'admin@college.edu', hash, 'admin');
  console.log('Default admin created: admin@college.edu / admin123');
}

// Routes
// Authentication
app.post('/api/register', async (req, res) => {
  const { fullname, reg_no, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (id, fullname, reg_no, email, password) VALUES (?, ?, ?, ?, ?)')
      .run(nanoid(), fullname, reg_no, email, hash);
    res.json({ success: true, message: 'Registration successful!' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
       return res.status(400).json({ success: false, message: 'Registration number or email already exists!' });
    }
    res.status(500).json({ success: false, message: 'Registration failed!' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.userName = user.fullname;
    res.json({ success: true, user: { id: user.id, fullname: user.fullname, role: user.role } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials!' });
  }
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/session', (req, res) => {
  if (req.session.userId) {
    const user = db.prepare('SELECT id, fullname, email, reg_no, role FROM users WHERE id = ?').get(req.session.userId);
    if (!user) return res.json({ loggedIn: false });
    res.json({ 
        loggedIn: true, 
        user: { 
            id: user.id, 
            name: user.fullname, 
            email: user.email, 
            reg_no: user.reg_no, 
            role: user.role 
        } 
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// User Auth Middleware
const auth = (req, res, next) => {
  if (req.session.userId) next();
  else res.status(401).json({ error: 'Unauthorized' });
};

// Admin Auth Middleware
const adminOnly = (req, res, next) => {
  if (req.session.role === 'admin') next();
  else res.status(403).json({ error: 'Access forbidden' });
};

// Lost Items
app.post('/api/lost-items', auth, upload.single('image'), (req, res) => {
  const { name, date, location, description, category, contact_info } = req.body;
  const id = nanoid();
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  try {
    db.prepare('INSERT INTO lost_items (id, user_id, item_name, date, location, category, contact_info, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.session.userId, name, date, location, category, contact_info, description, image_url);

    // Confirmation for reporter
    db.prepare('INSERT INTO notifications (id, user_id, message) VALUES (?, ?, ?)')
      .run(nanoid(), req.session.userId, `Report received: You successfully posted about your lost "${name}". We will notify you if there is a match!`);

    // Notify all other users about the new lost item
    const allOtherUsers = db.prepare('SELECT id FROM users WHERE id != ?').all(req.session.userId);
    allOtherUsers.forEach(u => {
      db.prepare('INSERT INTO notifications (id, user_id, message) VALUES (?, ?, ?)')
        .run(nanoid(), u.id, `🔍 New Lost Item Alert: "${name}" was reported lost at "${location}". Check All Lost Items to help out!`);
    });

    // Matching logic: check if this was already found
    const potentialFounders = db.prepare('SELECT item_name, contact_info FROM found_items WHERE item_name LIKE ? OR location LIKE ?').all(`%${name}%`, `%${location}%`);
    if (potentialFounders.length > 0) {
        const contact = potentialFounders[0].contact_info || 'the admin office';
        db.prepare('INSERT INTO notifications (id, user_id, message) VALUES (?, ?, ?)')
          .run(nanoid(), req.session.userId, `Good news! We found a potential match for your lost "${name}". Contact: ${contact}. Check the Found Items list!`);
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to report lost item.' });
  }
});

app.get('/api/my-lost-items', auth, (req, res) => {
  const items = db.prepare('SELECT * FROM lost_items WHERE user_id = ? ORDER BY created_at DESC').all(req.session.userId);
  res.json(items);
});

// All Lost Items (Public/User view)
app.get('/api/lost-items', auth, (req, res) => {
  const items = db.prepare(`
    SELECT li.*, u.fullname, u.email 
    FROM lost_items li
    JOIN users u ON li.user_id = u.id
    WHERE li.status IN ('lost', 'claimed') 
    ORDER BY li.created_at DESC
  `).all();
  res.json(items);
});

app.post('/api/lost-items/resolve', auth, (req, res) => {
    const { id } = req.body;
    // User can resolve their own, Admin can resolve any
    const item = db.prepare('SELECT user_id FROM lost_items WHERE id = ?').get(id);
    if (item && (item.user_id === req.session.userId || req.session.role === 'admin')) {
        db.prepare("UPDATE lost_items SET status = 'claimed' WHERE id = ?").run(id);
        res.json({ success: true });
    } else {
        res.status(403).json({ error: 'Unauthorized' });
    }
});

// Found Items (Admin or Authorized User)
app.post('/api/found-items', auth, upload.single('image'), (req, res) => {
  const { name, date, location, description, category, contact_info } = req.body;
  const id = nanoid();
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  db.prepare('INSERT INTO found_items (id, reporter_id, item_name, date, location, category, contact_info, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.session.userId, name, date, location, category, contact_info, description, image_url);

  // Confirmation for reporter
  db.prepare('INSERT INTO notifications (id, user_id, message) VALUES (?, ?, ?)')
    .run(nanoid(), req.session.userId, `Thank you for reporting! Your found item report for "${name}" is now active and helping someone else.`);

  // Notify all other users about the new found item
  const allOtherUsers = db.prepare('SELECT id FROM users WHERE id != ?').all(req.session.userId);
  allOtherUsers.forEach(u => {
    db.prepare('INSERT INTO notifications (id, user_id, message) VALUES (?, ?, ?)')
      .run(nanoid(), u.id, `📦 New Found Item: "${name}" was found at "${location}". Check Found Items — it might be yours!`);
  });

  // Smart match: notify losers who reported this item
  const potentialLosers = db.prepare('SELECT user_id FROM lost_items WHERE item_name LIKE ? OR location LIKE ?').all(`%${name}%`, `%${location}%`);
  potentialLosers.forEach(p => {
    db.prepare('INSERT INTO notifications (id, user_id, message) VALUES (?, ?, ?)')
      .run(nanoid(), p.user_id, `A potential match for your lost item "${name}" has been found! Contact the finder at: ${contact_info || 'the reported location'}`);
  });

  res.json({ success: true, id });
});

app.get('/api/found-items', auth, (req, res) => {
  const items = db.prepare("SELECT * FROM found_items WHERE status = 'found' ORDER BY created_at DESC").all();
  res.json(items);
});

app.post('/api/found-items/claim', auth, (req, res) => {
    const { id } = req.body;
    if (req.session.role === 'admin') {
        db.prepare("UPDATE found_items SET status = 'claimed' WHERE id = ?").run(id);
        res.json({ success: true });
    } else {
         res.status(403).json({ error: 'Only admins can mark as claimed' });
    }
});

// Notifications
app.get('/api/notifications', auth, (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.session.userId);
  res.json(notifications);
});

app.post('/api/notifications/read', auth, (req, res) => {
  const { id } = req.body;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.session.userId);
  res.json({ success: true });
});

app.post('/api/notifications/read-all', auth, (req, res) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.session.userId);
    res.json({ success: true });
});

app.post('/api/notifications/read-one', auth, (req, res) => {
    const { id } = req.body;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.session.userId);
    res.json({ success: true });
});

app.post('/api/notifications/delete', auth, (req, res) => {
    const { id } = req.body;
    db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(id, req.session.userId);
    res.json({ success: true });
});

app.post('/api/profile/update', auth, (req, res) => {
  const { fullname, email, reg_no } = req.body;
  
  try {
    db.prepare('UPDATE users SET fullname = ?, email = ?, reg_no = ? WHERE id = ?')
      .run(fullname, email, reg_no, req.session.userId);
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ success: false, error: 'Email or Register Number already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

// Admin management
app.get('/api/admin/users', auth, adminOnly, (req, res) => {
    res.json(db.prepare('SELECT id, fullname, reg_no, email, role FROM users').all());
});

app.get('/api/admin/lost-items', auth, adminOnly, (req, res) => {
    res.json(db.prepare('SELECT * FROM lost_items').all());
});

app.get('/api/admin/found-items', auth, adminOnly, (req, res) => {
    res.json(db.prepare('SELECT * FROM found_items').all());
});

app.get('/api/stats', auth, (req, res) => {
    const lost = db.prepare("SELECT COUNT(*) as count FROM lost_items WHERE status = 'lost'").get().count;
    const found = db.prepare("SELECT COUNT(*) as count FROM found_items WHERE status = 'found'").get().count;
    
    // Only count 'recovered' from resolved lost items to prevent double adding 2 for a single item
    const claimed = db.prepare("SELECT COUNT(*) as count FROM lost_items WHERE status = 'claimed'").get().count;
    res.json({ lost, found, claimed });
});

app.post('/api/admin/users/delete', auth, adminOnly, (req, res) => {
    const { id } = req.body;
    if (id === req.session.userId) return res.status(400).json({ error: 'Cannot delete yourself' });
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
});

app.post('/api/admin/lost-items/delete', auth, adminOnly, (req, res) => {
    const { id } = req.body;
    db.prepare('DELETE FROM lost_items WHERE id = ?').run(id);
    res.json({ success: true });
});

app.post('/api/admin/found-items/delete', auth, adminOnly, (req, res) => {
    const { id } = req.body;
    db.prepare('DELETE FROM found_items WHERE id = ?').run(id);
    res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
