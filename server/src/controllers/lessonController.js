import LessonModel from '../models/lessonModel.js';
import CategoryModel from '../models/categoryModel.js';
import UserModel from '../models/userModel.js';
import { SpeechService } from '../services/speechService.js';
import { TTSService } from '../services/ttsService.js';

class LessonController {
  // GET /api/lessons
  static async getCategories(req, res) {
    try {
      const categories = await CategoryModel.getAll();
      res.json(categories);
    } catch (error) {
      console.error('Lỗi khi lấy danh mục:', error.message);
      res.status(500).json({ message: 'Lỗi server khi lấy danh mục' });
    }
  }

  // GET /api/lessons/list
  static async getLessons(req, res) {
    try {
      const userId = req.user.user_id;
      const { categoryId, status, page = 1, limit = 8, searchTerm } = req.query; 

      const offset = (page - 1) * limit;

      const lessons = await LessonModel.findAll({
        userId,
        categoryId,
        status: status || 'all',
        searchTerm,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json(lessons);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bài học:', error.message);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách bài học' });
    }
  }

  // GET /api/lessons/suggested - Lấy bài học chưa học để đề xuất
  static async getSuggestedLessons(req, res) {
    try {
      const userId = req.user.user_id;
      const { limit = 4 } = req.query;

      const lessons = await LessonModel.findUnlearned({
        userId,
        limit: parseInt(limit)
      });

      res.json(lessons);
    } catch (error) {
      console.error('Lỗi khi lấy bài học đề xuất:', error.message);
      res.status(500).json({ message: 'Lỗi server khi lấy bài học đề xuất' });
    }
  }

  // GET /api/lessons/quick-start
  static async getQuickStartLesson(req, res) {
    try {
      const userId = req.user.user_id;
      let lesson = await LessonModel.findRandomUnlearned(userId);

      // Nếu đã học hết, lấy ngẫu nhiên 1 bài bất kỳ
      if (!lesson) {
        lesson = await LessonModel.findRandom();
      }

      if (!lesson) {
        return res.status(404).json({ message: 'Không có bài học khả dụng' });
      }

      res.json({ lessonId: lesson.ma_bai_hoc });
    } catch (error) {
      console.error('Lỗi khi lấy quick start lesson:', error.message);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }

  // GET /api/lessons/:id/practice-data
  static async getPracticeData(req, res) {
    try {
      const lessonId = req.params.id;
      const data = await LessonModel.getPracticeData(lessonId);
      res.json(data);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu bài học:', error.message);
      res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu bài học' });
    }
  }

  // POST /api/lessons/evaluate-speaking-audio
  static async evaluateSpeakingAudio(req, res) {
    try {
      console.log('--- ENTER evaluateSpeakingAudio ---');
      const userId = req.user.user_id;
      const { lessonItemId, type, feedbackMode } = req.body;
      const audioFile = req.file;

      console.log('User ID:', userId);
      console.log('lessonItemId:', lessonItemId, 'type:', type);
      console.log('Audio file:', audioFile ? `Present (Size: ${audioFile.size})` : 'Missing');
      console.log('Feedback Mode from client:', feedbackMode);

      if (!audioFile) {
        console.log('Error: Audio file missing');
        return res.status(400).json({ message: 'Không tìm thấy file audio' });
      }

      // Lấy expected text
      let expectedText = "";
      if (type === 'vocab') {
        const vocab = await LessonModel.getVocabularyById(lessonItemId);
        expectedText = vocab?.english;
      } else if (type === 'sentence') {
        const sentence = await LessonModel.getSentenceById(lessonItemId);
        expectedText = sentence?.english;
      } else if (type === 'custom_word') {
        expectedText = lessonItemId; // Using lessonItemId to carry the custom word string
      }

      console.log('Expected text:', expectedText);

      if (!expectedText) {
        console.log('Error: Expected text missing');
        return res.status(404).json({ message: 'Không tìm thấy mục học thuật chuẩn' });
      }

      // Use feedbackMode from client request, fallback to database setting
      let aiMode = feedbackMode;
      if (!aiMode) {
        const settings = await UserModel.getSettings(userId);
        aiMode = settings?.che_do_phan_hoi_ai || 'friendly';
      }
      console.log('AI Mode:', aiMode);

      // Gọi Speech Service (Whisper + Groq)
      console.log('Calling SpeechService.evaluateSpeech...');
      const evaluation = await SpeechService.evaluateSpeech(audioFile.buffer, audioFile.mimetype, expectedText, aiMode);
      console.log('SpeechService returned:', evaluation);
      
      let wrongWords = [];
      wrongWords = SpeechService.calculateWrongWords(expectedText, evaluation.spokenText);

      res.json({
        spokenText: evaluation.spokenText,
        overall_score: evaluation.overall_score,
        pronunciation: evaluation.pronunciation,
        fluency: evaluation.fluency,
        completion: evaluation.completion,
        feedback: evaluation.feedback,
        wrongWords
      });
      console.log('--- EXIT evaluateSpeakingAudio ---');

    } catch (error) {
      console.error('Lỗi khi đánh giá phát âm:', error);
      res.status(500).json({ message: 'Lỗi server khi đánh giá phát âm', details: error.message });
    }
  }

  // POST /api/lessons/tts/english
  static async ttsEnglish(req, res) {
    try {
      const { text, speed } = req.body;
      if (!text) return res.status(400).json({ message: 'Thiếu text' });

      const audioBuffer = await TTSService.speakEnglish(text, speed || 1.0);
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length,
      });
      res.send(audioBuffer);
    } catch (error) {
      console.error('Lỗi TTS English:', error.message);
      res.status(500).json({ message: 'Lỗi khi tạo audio tiếng Anh', details: error.message });
    }
  }

  // POST /api/lessons/tts/vietnamese
  static async ttsVietnamese(req, res) {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ message: 'Thiếu text' });

      const audioBuffer = await TTSService.speakVietnamese(text);
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length,
      });
      res.send(audioBuffer);
    } catch (error) {
      console.error('Lỗi TTS Vietnamese:', error.message);
      res.status(500).json({ message: 'Lỗi khi tạo audio tiếng Việt', details: error.message });
    }
  }

  // POST /api/lessons/:id/complete-practice
  static async completePractice(req, res) {
    try {
      const userId = req.user.user_id;
      const lessonId = req.params.id;
      // We now expect an array of all spoken item scores as `scores`, and wrongWordsArray
      const { wrongWordsArray, scores } = req.body;

      // 1. Ghi nhận từ sai
      if (wrongWordsArray && wrongWordsArray.length > 0) {
         await LessonModel.recordWrongWords(userId, wrongWordsArray);
      }

      // 2. Tính điểm trung bình (average score) từ mảng scores
      let averageScore = 100;
      if (scores && Array.isArray(scores) && scores.length > 0) {
         const sum = scores.reduce((acc, curr) => acc + (curr || 0), 0);
         averageScore = Math.round(sum / scores.length);
      } else if (req.body.score) {
         averageScore = req.body.score;
      }

      // 3. Kiểm tra xem user đã học bài này chưa để tính EXP (50 nếu chưa học, 20 nếu đã học)
      const existingProgress = await LessonModel.getProgress(userId, lessonId);
      const isFirstTime = !existingProgress;
      const expEarned = isFirstTime ? 50 : 20;

      // 4. Lưu / Cập nhật tiến độ học tập bài này
      const progress = await LessonModel.completeLesson(userId, lessonId, averageScore, expEarned);

      // 5. Cập nhật Tổng Kinh Nghiệm (điểm kinh nghiệm hiện tại) và Cấp độ cho Nguoi_Dung
      const updatedUser = await UserModel.addExperience(userId, expEarned);

      res.json({ 
        message: 'Đã lưu tiến trình học tập', 
        progress,
        expEarned,
        newTotalExp: updatedUser.diem_kinh_nghiem_hien_tai,
        newLevel: updatedUser.cap_do
      });
    } catch (error) {
      console.error('Lỗi khi hoàn thành bài học:', error.message);
      res.status(500).json({ message: 'Lỗi server khi hoàn thành bài học' });
    }
  }

  // GET /api/lessons/timed/prompt
  static async getTimedSpeakingPrompt(req, res) {
    try {
      const prompt = await SpeechService.generateTimedSpeakingPrompt();
      res.json({ prompt });
    } catch (error) {
      console.error('Lỗi lấy chủ đề nói:', error.message);
      res.status(500).json({ message: 'Lỗi server khi lấy chủ đề luyện nói' });
    }
  }

  // POST /api/lessons/timed/evaluate
  static async evaluateTimedSpeaking(req, res) {
    try {
      const userId = req.user.user_id;
      const { prompt } = req.body;
      const audioFile = req.file;

      if (!audioFile) {
        return res.status(400).json({ message: 'Không tìm thấy file audio' });
      }

      if (!prompt) {
        return res.status(400).json({ message: 'Thiếu chủ đề bài nói' });
      }

      const evaluation = await SpeechService.evaluateTimedSpeaking(audioFile.buffer, audioFile.mimetype, prompt);
      
      // Calculate EXP
      // "sau khi hoàn thành mỗi bài sẽ +20 điểm kn ngươi_dung nếu điểm chưa tốt và 30đ nếu tốt"
      // Let's assume average score of pronunciation and fluency >= 7 is 'good'
      const avgScore = (evaluation.pronunciation + evaluation.fluency) / 2;
      const expEarned = avgScore >= 7 ? 30 : 20;

      // Add EXP to user
      const updatedUser = await UserModel.addExperience(userId, expEarned);

      res.json({
        ...evaluation,
        expEarned,
        newTotalExp: updatedUser.diem_kinh_nghiem_hien_tai,
        newLevel: updatedUser.cap_do
      });
    } catch (error) {
      console.error('Lỗi khi đánh giá luyện nói tự do:', error);
      res.status(500).json({ message: 'Lỗi server khi đánh giá bài nói' });
    }
  }

  // POST /api/lessons/conversation/init
  static async initConversation(req, res) {
    try {
      const { role, scenario } = req.body;
      if (!role || !scenario) return res.status(400).json({ message: 'Thiếu role hoặc scenario' });

      const response = await SpeechService.generateConversationStart(role, scenario);
      
      res.json({
        aiText: response.aiText,
        hints: response.hints || []
      });
    } catch (error) {
      console.error('Lỗi initConversation:', error);
      res.status(500).json({ message: 'Lỗi khởi tạo hội thoại' });
    }
  }

  // POST /api/lessons/conversation/chat
  static async chatConversation(req, res) {
    try {
      const { role, scenario, history } = req.body;
      const audioFile = req.file;
      
      let userText = req.body.text; // Phao cứu sinh nếu client truyền text

      if (audioFile) {
        userText = await SpeechService.transcribeAudio(audioFile.buffer, audioFile.mimetype);
      }

      // Parse history
      const currentHistory = typeof history === 'string' ? JSON.parse(history) : (history || []);
      
      let isInitiative = false;
      if (!userText || userText.trim() === '' || userText === '...') {
        isInitiative = true;
      } else {
        currentHistory.push({ role: 'user', content: userText });
      }

      const response = await SpeechService.generateConversationResponse(currentHistory, role, scenario, isInitiative);
      
      res.json({
        userText,
        aiText: response.aiText,
        correction: response.correction,
        suggestion: response.suggestion,
        hints: response.hints || []
      });
    } catch (error) {
      console.error('[Backend] Lỗi chatConversation:', error);
      res.status(500).json({ 
        message: 'Lỗi trò chuyện. Thử lại nhé!', 
        details: error.message 
      });
    }
  }

  // POST /api/lessons/conversation/evaluate
  static async evaluateConversation(req, res) {
    try {
      const { history } = req.body;
      if (!history) return res.status(400).json({ message: 'Thiếu lịch sử trò chuyện' });

      const parsedHistory = typeof history === 'string' ? JSON.parse(history) : history;
      if (parsedHistory.length === 0) {
        return res.json({ overallScore: 0, strengths: "", weaknesses: "", tips: "", expEarned: 0 });
      }

      const evaluation = await SpeechService.evaluateConversationTranscript(parsedHistory);

      const userId = req.user.user_id;
      // Thưởng kinh nghiệm (nếu điểm 0 hoặc chưa nói gì thì không cộng)
      const hasUserSpoken = parsedHistory.some(m => m.role === 'user');
      let expEarned = 0;
      let updatedUser = null;
      
      if (evaluation.overallScore > 0 && hasUserSpoken) {
        expEarned = evaluation.overallScore > 70 ? 30 : 20;
      }

      // Add experience to user (only if expEarned > 0)
      if (expEarned > 0) {
        updatedUser = await UserModel.addExperience(userId, expEarned);
      }

      res.json({
        ...evaluation,
        expEarned,
        ...(updatedUser && {
          newTotalExp: updatedUser.diem_kinh_nghiem_hien_tai,
          newLevel: updatedUser.cap_do
        })
      });
    } catch (error) {
      console.error('Lỗi evaluateConversation:', error);
      res.status(500).json({ message: 'Lỗi đánh giá hội thoại' });
    }
  }
}

export default LessonController;
