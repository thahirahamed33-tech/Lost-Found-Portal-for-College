const express = require('express');
const router = express.Router();
const lostController = require('../controllers/lostController');
const { auth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/lost-items', auth, upload.single('image'), lostController.createLostItem);
router.get('/my-lost-items', auth, lostController.getMyLostItems);
router.get('/lost-items', auth, lostController.getAllLostItems);
router.post('/lost-items/resolve', auth, lostController.resolveLostItem);

module.exports = router;
