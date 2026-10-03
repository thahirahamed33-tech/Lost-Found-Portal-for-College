const { nanoid } = require('../utils/idGenerator');
const db = require('../db/database');

exports.createLostItem = (req, res) => {
  const { name, date, location, description, category, contact_info } = req.body;
  const id = nanoid();
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  try {
    db.prepare('INSERT INTO lost_items (id, user_id, item_name, date, location, category, contact_info, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.session.userId, name, date, location, category, contact_info, description, image_url);

    // Confirmation + notifications (simplified)
    db.prepare('INSERT INTO notifications (id, user_id, message) VALUES (?, ?, ?)')
      .run(nanoid(), req.session.userId, `Report received: You successfully posted about your lost "${name}".`);

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to report lost item.' });
  }
};

exports.getMyLostItems = (req, res) => {
  const items = db.prepare('SELECT * FROM lost_items WHERE user_id = ? ORDER BY created_at DESC').all(req.session.userId);
  res.json(items);
};

exports.getAllLostItems = (req, res) => {
  const items = db.prepare(`
    SELECT li.*, u.fullname, u.email 
    FROM lost_items li
    JOIN users u ON li.user_id = u.id
    WHERE li.status IN ('lost', 'claimed') 
    ORDER BY li.created_at DESC
  `).all();
  res.json(items);
};

exports.resolveLostItem = (req, res) => {
  const { id } = req.body;
  const item = db.prepare('SELECT user_id FROM lost_items WHERE id = ?').get(id);
  if (item && (item.user_id === req.session.userId || req.session.role === 'admin')) {
    db.prepare("UPDATE lost_items SET status = 'claimed' WHERE id = ?").run(id);
    res.json({ success: true });
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
};

