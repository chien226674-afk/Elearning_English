import express from 'express';
import UserController from '../controllers/userController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import upload from '../services/uploadService.js';

const router = express.Router();

router.put('/profile', requireAuth, UserController.updateProfile);
router.post('/upload-avatar', requireAuth, upload.single('avatar'), UserController.uploadAvatar);
router.put('/change-password', requireAuth, UserController.changePassword);
router.put('/change-email', requireAuth, UserController.changeEmail);
router.delete('/account', requireAuth, UserController.deleteAccount);

// Stats
router.get('/stats', requireAuth, UserController.getStats);
router.get('/progress-charts', requireAuth, UserController.getProgressCharts);
router.get('/wrong-words', requireAuth, UserController.getWrongWords);
router.post('/wrong-words/complete', requireAuth, UserController.completeWrongWord);

// Achievements
router.get('/achievements', requireAuth, UserController.getAchievements);

// Settings
router.get('/settings', requireAuth, UserController.getSettings);
router.put('/settings', requireAuth, UserController.updateSettings);

export default router;
