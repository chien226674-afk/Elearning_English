import express from 'express';
import AdminController from '../controllers/adminController.js';
import CategoryController from '../controllers/categoryController.js';
import AdminLessonController from '../controllers/adminLessonController.js';
import AdminAchievementController from '../controllers/adminAchievementController.js';
import upload from '../services/uploadService.js';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả các route admin phải qua requireAuth và requireAdmin
router.use(requireAuth, requireAdmin);

// Dashboard routes
router.get('/stats/overview', AdminController.getOverviewStats);
router.get('/stats/charts', AdminController.getChartData);
router.get('/stats/insights', AdminController.getInsights);

// Categories
router.get('/categories', CategoryController.getAll);
router.post('/categories', CategoryController.create);
router.put('/categories/:id', CategoryController.update);
router.delete('/categories/:id', CategoryController.delete);

// Lessons
router.get('/lessons', AdminLessonController.getAllLessons);
router.get('/lessons/:id', AdminLessonController.getLessonDetail);
router.post('/lessons', AdminLessonController.createLesson);
router.put('/lessons/:id', AdminLessonController.updateLesson);
router.delete('/lessons/:id', AdminLessonController.deleteLesson);

// Lesson content (Vocab)
router.post('/lessons/:id/vocab', AdminLessonController.addVocab);
router.put('/lessons/vocab/:vocabId', AdminLessonController.updateVocab);
router.delete('/lessons/vocab/:vocabId', AdminLessonController.deleteVocab);

// Lesson content (Sentence)
router.post('/lessons/:id/sentences', AdminLessonController.addSentence);
router.put('/lessons/sentences/:sentenceId', AdminLessonController.updateSentence);
router.delete('/lessons/sentences/:sentenceId', AdminLessonController.deleteSentence);

// Achievements
router.get('/achievements', AdminAchievementController.getAll);
router.post('/achievements', upload.single('image'), AdminAchievementController.create);
router.put('/achievements/:id', upload.single('image'), AdminAchievementController.update);
router.delete('/achievements/:id', AdminAchievementController.delete);

export default router;
