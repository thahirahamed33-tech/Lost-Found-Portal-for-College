const db = require('../db/database');

exports.getUsers = (req, res) => {
    res.json(db.prepare('SELECT id, fullname, reg_no, email, role FROM users').all());
};

exports.getLostItems = (req, res) => {
    res.json(db.prepare('SELECT * FROM lost_items').all());
};

exports.getFoundItems = (req, res) => {
    res.json(db.prepare('SELECT * FROM found_items').all());
};

exports.getStats = (req, res) => {
    const lost = db.prepare("SELECT COUNT(*) as count FROM lost_items WHERE status = 'lost'").get().count;
    const found = db.prepare("SELECT COUNT(*) as count FROM found_items WHERE status = 'found'").get().count;
    const claimed = db.prepare("SELECT COUNT(*) as count FROM lost_items WHERE status = 'claimed'").get().count;
    res.json({ lost, found, claimed });
};

exports.deleteUser = (req, res) => {
    const { id } = req.body;
    if (id === req.session.userId) return res.status(400).json({ error: 'Cannot delete yourself' });
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
};

exports.deleteLostItem = (req, res) => {
    const { id } = req.body;
    db.prepare('DELETE FROM lost_items WHERE id = ?').run(id);
    res.json({ success: true });
};

exports.deleteFoundItem = (req, res) => {
    const { id } = req.body;
    db.prepare('DELETE FROM found_items WHERE id = ?').run(id);
    res.json({ success: true });
};
