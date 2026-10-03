const db = require('../db/database');

exports.getNotifications = (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.session.userId);
  res.json(notifications);
};

exports.markRead = (req, res) => {
  const { id } = req.body;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.session.userId);
  res.json({ success: true });
};

exports.markAllRead = (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.session.userId);
  res.json({ success: true });
};

exports.deleteNotification = (req, res) => {
  const { id } = req.body;
  db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(id, req.session.userId);
  res.json({ success: true });
};
