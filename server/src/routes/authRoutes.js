import express from 'express';
import AuthController from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/google', AuthController.googleLogin);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/verify-email', AuthController.verifyEmail);

// Protected Test Route (Ví dụ)
router.get('/me', requireAuth, (req, res) => {
    res.json({ message: 'Bạn đã đăng nhập', user: req.user });
});

export default router;
