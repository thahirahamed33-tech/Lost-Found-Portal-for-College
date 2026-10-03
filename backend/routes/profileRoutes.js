const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { auth } = require('../middleware/authMiddleware');

router.post('/profile/update', auth, profileController.updateProfile);

module.exports = router;
