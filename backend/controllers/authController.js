const bcrypt = require('bcryptjs');
const { nanoid } = require('../utils/idGenerator');
const db = require('../db/database');

exports.register = async (req, res) => {
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
};

exports.login = async (req, res) => {
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
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.json({ success: true });
};

exports.getSession = (req, res) => {
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
};

