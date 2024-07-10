const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.registerInitiate);
router.post('/register/verify', authController.verifyAndCompleteRegistration);
router.post('/login', authController.initLogin);
router.post('/login/verify', authController.verifyAndCompletelogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Example of a protected route
router.get('/protected', authMiddleware, (req, res) => {
    res.status(200).json({ message: 'You are authenticated', userId: req.userId, role: req.role });
});

module.exports = router;
