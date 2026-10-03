const db = require('../db/database');
const { nanoid } = require('../utils/idGenerator');

exports.reportFoundItem = (req, res) => {
  const { name, date, location, description, category, contact_info } = req.body;
  const id = nanoid();
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to report found item.' });
  }
};

exports.getAllFoundItems = (req, res) => {
  const items = db.prepare("SELECT * FROM found_items WHERE status = 'found' ORDER BY created_at DESC").all();
  res.json(items);
};

exports.claimFoundItem = (req, res) => {
  const { id } = req.body;
  if (req.session.role === 'admin') {
    db.prepare("UPDATE found_items SET status = 'claimed' WHERE id = ?").run(id);
    res.json({ success: true });
  } else {
    res.status(403).json({ error: 'Only admins can mark as claimed' });
  }
};
