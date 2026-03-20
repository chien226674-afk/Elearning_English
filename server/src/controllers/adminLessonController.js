import LessonModel from '../models/lessonModel.js';

class AdminLessonController {
  static async getAllLessons(req, res) {
    try {
      const lessons = await LessonModel.adminGetAllLessons();
      res.json(lessons);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }

  static async getLessonDetail(req, res) {
    try {
      const { id } = req.params;
      const lesson = await LessonModel.findById(id);
      if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài học' });
      
      const practiceData = await LessonModel.getPracticeData(id);
      res.json({ ...lesson, vocabularies: practiceData.vocabularies, sentences: practiceData.sentences });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }

  static async createLesson(req, res) {
    try {
      const lesson = await LessonModel.createLesson(req.body);
      res.status(201).json(lesson);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi tạo bài học' });
    }
  }

  static async updateLesson(req, res) {
    try {
      const { id } = req.params;
      const lesson = await LessonModel.updateLesson(id, req.body);
      res.json(lesson);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi cập nhật bài học' });
    }
  }

  static async deleteLesson(req, res) {
    try {
      const { id } = req.params;
      await LessonModel.deleteLesson(id);
      res.json({ message: 'Đã xóa bài học' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi xóa bài học' });
    }
  }

  // Vocab
  static async addVocab(req, res) {
    try {
      const { id } = req.params; // lesson id
      const vocab = await LessonModel.addVocab({ ma_bai_hoc: id, ...req.body });
      res.status(201).json(vocab);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi thêm từ vựng' });
    }
  }

  static async updateVocab(req, res) {
    try {
      const { vocabId } = req.params;
      const vocab = await LessonModel.updateVocab(vocabId, req.body);
      res.json(vocab);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi cập nhật từ vựng' });
    }
  }

  static async deleteVocab(req, res) {
    try {
      const { vocabId } = req.params;
      await LessonModel.deleteVocab(vocabId);
      res.json({ message: 'Đã xóa từ vựng' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi xóa từ vựng' });
    }
  }

  // Sentence
  static async addSentence(req, res) {
    try {
      const { id } = req.params; // lesson id
      const sentence = await LessonModel.addSentence({ ma_bai_hoc: id, ...req.body });
      res.status(201).json(sentence);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi thêm câu' });
    }
  }

  static async updateSentence(req, res) {
    try {
      const { sentenceId } = req.params;
      const sentence = await LessonModel.updateSentence(sentenceId, req.body);
      res.json(sentence);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi cập nhật câu' });
    }
  }

  static async deleteSentence(req, res) {
    try {
      const { sentenceId } = req.params;
      await LessonModel.deleteSentence(sentenceId);
      res.json({ message: 'Đã xóa câu' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi xóa câu' });
    }
  }
}

export default AdminLessonController;
