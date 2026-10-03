const express = require('express');
const router = express.Router();
const foundController = require('../controllers/foundController');
const { auth } = require('../middleware/authMiddleware');
const upload = require('../../server').upload; // Temp ref, will fix later

router.post('/found-items', auth, upload.single('image'), foundController.reportFoundItem);
router.get('/found-items', auth, foundController.getAllFoundItems);
router.post('/found-items/claim', auth, foundController.claimFoundItem);

module.exports = router;
