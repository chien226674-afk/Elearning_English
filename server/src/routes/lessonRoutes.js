import express from 'express';
import multer from 'multer';
import LessonController from '../controllers/lessonController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Tất cả route đều yêu cầu đăng nhập để check tiến độ
router.use(requireAuth);

router.get('/', LessonController.getCategories);
router.get('/list', LessonController.getLessons);
router.get('/suggested', LessonController.getSuggestedLessons);
router.get('/quick-start', LessonController.getQuickStartLesson);

// Practice routes
router.get('/:id/practice-data', LessonController.getPracticeData);
router.post('/evaluate-speaking-audio', upload.single('audio'), LessonController.evaluateSpeakingAudio);
router.post('/:id/complete-practice', LessonController.completePractice);

// TTS routes (ElevenLabs)
router.post('/tts/english', LessonController.ttsEnglish);
router.post('/tts/vietnamese', LessonController.ttsVietnamese);

// Timed Speaking Practice
router.get('/timed/prompt', LessonController.getTimedSpeakingPrompt);
router.post('/timed/evaluate', upload.single('audio'), LessonController.evaluateTimedSpeaking);

// AI Conversation
router.post('/conversation/init', LessonController.initConversation);
router.post('/conversation/chat', upload.single('audio'), LessonController.chatConversation);
router.post('/conversation/evaluate', LessonController.evaluateConversation);

export default router;
