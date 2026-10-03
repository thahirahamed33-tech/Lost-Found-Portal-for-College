const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const multer = require('multer');
const fs = require('fs');
const db = require('./backend/db/database');

const uploadDir = process.env.VERCEL 
  ? path.join('/tmp', 'uploads') 
  : path.join(__dirname, 'frontend', 'uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.log('Upload directory warning:', err.message);
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


// Export upload for routes to use it
module.exports.upload = upload;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(session({
  secret: 'lfd_college_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Create default admin if not exists
try {
  const checkAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!checkAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (id, fullname, reg_no, email, password, role) VALUES (?, ?, ?, ?, ?, ?)')
      .run(nanoid(), 'College Admin', 'ADMIN', 'admin@college.edu', hash, 'admin');
    console.log('Default admin created: admin@college.edu / admin123');
  }
} catch (e) {
  console.log("Admin initialization warning:", e.message);
}


// Import Routers
const authRoutes = require('./backend/routes/authRoutes');
const lostRoutes = require('./backend/routes/lostRoutes');
const foundRoutes = require('./backend/routes/foundRoutes');
const notificationRoutes = require('./backend/routes/notificationRoutes');
const adminRoutes = require('./backend/routes/adminRoutes');
const profileRoutes = require('./backend/routes/profileRoutes');

// Mount Routers
app.use('/api', authRoutes);
app.use('/api', lostRoutes);
app.use('/api', foundRoutes);
app.use('/api', notificationRoutes);
app.use('/api', adminRoutes);
app.use('/api', profileRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;

