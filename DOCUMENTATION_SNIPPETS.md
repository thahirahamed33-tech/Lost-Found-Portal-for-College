# Key Code Snippets for Project Documentation

This document contains the primary code components which are essential for the project documentation.

## 1. Database Connection & Schema Initialization
**File:** `backend/db/database.js`
This module initializes the SQLite database and creates the necessary tables for users, items, and notifications.

```javascript
const Database = require('better-sqlite3');
const path = require('path');

// Connect to SQLite database
const db = new Database(path.join(__dirname, '..', 'database.db'));

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    fullname TEXT NOT NULL,
    reg_no TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS lost_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT DEFAULT 'lost',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  -- Additional tables: found_items, notifications...
`);

module.exports = db;
```

---

## 2. Main Server Entry Point
**File:** `server.js`
The entry point that configures the Express application, sessions, and routes.

```javascript
const express = require('express');
const session = require('express-session');
const db = require('./backend/db/database');
const authRoutes = require('./backend/routes/authRoutes');
const lostRoutes = require('./backend/routes/lostRoutes');

const app = express();
const PORT = 3000;

// Middleware configuration
app.use(express.json());
app.use(express.static('frontend'));
app.use(session({
  secret: 'lfd_college_secret_key',
  resave: false,
  saveUninitialized: false
}));

// API Routes
app.use('/api', authRoutes);
app.use('/api', lostRoutes);

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
```

---

## 3. Important Module: Authentication Controller
**File:** `/backend/controllers/authController.js`
This snippet demonstrates the logic for user registration and password hashing.

```javascript
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const db = require('../db/database');

exports.register = async (req, res) => {
  const { fullname, reg_no, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (id, fullname, reg_no, email, password) VALUES (?, ?, ?, ?, ?)')
      .run(nanoid(), fullname, reg_no, email, hash);
      
    res.json({ success: true, message: 'Registration successful!' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'User already exists!' });
  }
};
```

---

## 4. Middleware: Authentication Guard
**File:** `/backend/middleware/authMiddleware.js`
Protects private routes by checking the user's session existence.

```javascript
const auth = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized access. Please login.' });
  }
};

module.exports = auth;
```

---

## 5. Frontend: Main Dashboard Data Fetching (Sample)
**File:** `/frontend/js/dashboard.js`
This snippet shows how the frontend dynamically fetches and renders the unified feed of reported lost and found items.

```javascript
// Function to load all lost items on the dashboard
async function loadDashboardItems() {
    try {
        const response = await fetch('/api/lost-items');
        if (!response.ok) throw new Error('Failed to fetch items');
        
        const items = await response.json();
        const feedContainer = document.getElementById('item-feed');
        feedContainer.innerHTML = ''; // Clear previous loading states
        
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = \`
                <div class="card-header">
                    <h4>\${item.item_name}</h4>
                    <span class="badge \${item.status}">\${item.status}</span>
                </div>
                <div class="card-body">
                    <p><strong>Location:</strong> \${item.location}</p>
                    <p><strong>Reported By:</strong> \${item.fullname}</p>
                    <p><strong>Date:</strong> \${new Date(item.created_at).toLocaleDateString()}</p>
                </div>
            \`;
            feedContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', loadDashboardItems);
```
