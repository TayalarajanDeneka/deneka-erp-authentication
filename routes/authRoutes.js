const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Example of a protected route
router.get('/protected', authMiddleware, (req, res) => {
    res.status(200).json({ message: 'You are authenticated', userId: req.userId, role: req.role });
});

module.exports = router;
