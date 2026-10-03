const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/authMiddleware');

router.get('/notifications', auth, notificationController.getNotifications);
router.post('/notifications/read', auth, notificationController.markRead);
router.post('/notifications/read-all', auth, notificationController.markAllRead);
router.post('/notifications/read-one', auth, notificationController.markRead); // reuse markRead
router.post('/notifications/delete', auth, notificationController.deleteNotification);

module.exports = router;
