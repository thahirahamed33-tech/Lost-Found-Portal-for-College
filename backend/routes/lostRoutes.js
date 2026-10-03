const express = require('express');
const router = express.Router();
const lostController = require('../controllers/lostController');
const { auth } = require('../middleware/authMiddleware');
const upload = require('../../server').upload; // Temp ref, will fix later

router.post('/lost-items', auth, upload.single('image'), lostController.createLostItem);
router.get('/my-lost-items', auth, lostController.getMyLostItems);
router.get('/lost-items', auth, lostController.getAllLostItems);
router.post('/lost-items/resolve', auth, lostController.resolveLostItem);

module.exports = router;

