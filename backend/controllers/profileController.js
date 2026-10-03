const db = require('../db/database');

exports.updateProfile = (req, res) => {
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
};
