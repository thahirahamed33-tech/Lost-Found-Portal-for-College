const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/authMiddleware');

// Admin Auth Middleware
const adminOnly = (req, res, next) => {
  if (req.session.role === 'admin') next();
  else res.status(403).json({ error: 'Access forbidden' });
};

router.get('/admin/users', auth, adminOnly, adminController.getUsers);
router.get('/admin/lost-items', auth, adminOnly, adminController.getLostItems);
router.get('/admin/found-items', auth, adminOnly, adminController.getFoundItems);
router.get('/stats', auth, adminController.getStats);
router.post('/admin/users/delete', auth, adminOnly, adminController.deleteUser);
router.post('/admin/lost-items/delete', auth, adminOnly, adminController.deleteLostItem);
router.post('/admin/found-items/delete', auth, adminOnly, adminController.deleteFoundItem);

module.exports = router;
