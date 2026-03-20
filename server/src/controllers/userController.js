import UserModel from '../models/userModel.js';
import AchievementModel from '../models/achievementModel.js';
import bcrypt from 'bcrypt';

class UserController {
  // PUT /api/users/profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.user_id;
      const { username, avatar, description } = req.body;

      if (!username) {
        return res.status(400).json({ message: 'Tên hiển thị không được để trống' });
      }

      const updatedUser = await UserModel.update(userId, {
        ten_dang_nhap: username,
        anh_dai_dien: avatar,
        mo_ta: description
      });

      res.json({
        message: 'Cập nhật hồ sơ thành công',
        user: {
            id: updatedUser.ma_nguoi_dung,
            username: updatedUser.ten_dang_nhap,
            email: updatedUser.email,
            avatar: updatedUser.anh_dai_dien,
            mo_ta: updatedUser.mo_ta,
            isGoogleUser: !!updatedUser.google_id
        }
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật hồ sơ:', error.message);
      res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ' });
    }
  }

  // POST /api/users/upload-avatar
  static async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng chọn ảnh để tải lên' });
      }

      // Multer-storage-cloudinary đã upload lên Cloudinary, và gắn path/link vào req.file.path
      res.json({
        message: 'Tải ảnh lên thành công',
        avatarUrl: req.file.path
      });
    } catch (error) {
      console.error('Lỗi khi tải ảnh lên Cloudinary:', error.message);
      res.status(500).json({ message: 'Lỗi server khi tải ảnh' });
    }
  }

  // PUT /api/users/change-password
  static async changePassword(req, res) {
    try {
      const userId = req.user.user_id;
      const { currentPassword, newPassword } = req.body;

      // Tìm người dùng
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }

      // Kiểm tra mật khẩu hiện tại (chỉ khi không phải login bằng Google hoặc có mật khẩu)
      if (user.mat_khau_hash) {
        const isMatch = await bcrypt.compare(currentPassword, user.mat_khau_hash);
        if (!isMatch) {
          return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
        }
      }

      // Hash mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await UserModel.updatePassword(userId, hashedPassword);

      res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
      console.error('Lỗi khi đổi mật khẩu:', error.message);
      res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu' });
    }
  }

  // PUT /api/users/change-email
  static async changeEmail(req, res) {
    try {
      const userId = req.user.user_id;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email không được để trống' });
      }

      // Kiểm tra email đã tồn tại chưa
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser && existingUser.ma_nguoi_dung !== userId) {
        return res.status(400).json({ message: 'Email đã được sử dụng bởi tài khoản khác' });
      }

      const updatedUser = await UserModel.updateEmail(userId, email);

      res.json({
        message: 'Thay đổi email thành công. Vui lòng xác thực email mới.',
        user: {
          id: updatedUser.ma_nguoi_dung,
          username: updatedUser.ten_dang_nhap,
          email: updatedUser.email,
          avatar: updatedUser.anh_dai_dien,
          mo_ta: updatedUser.mo_ta,
          isGoogleUser: !!updatedUser.google_id
        }
      });
    } catch (error) {
      console.error('Lỗi khi thay đổi email:', error.message);
      res.status(500).json({ message: 'Lỗi server khi thay đổi email' });
    }
  }

  // DELETE /api/users/account
  static async deleteAccount(req, res) {
    try {
      const userId = req.user.user_id;
      await UserModel.delete(userId);
      res.json({ message: 'Xóa tài khoản thành công' });
    } catch (error) {
      console.error('Lỗi khi xóa tài khoản:', error.message);
      res.status(500).json({ message: 'Lỗi server khi xóa tài khoản' });
    }
  }

  // GET /api/users/settings
  static async getSettings(req, res) {
    try {
      const userId = req.user.user_id;
      const settings = await UserModel.getSettings(userId);
      res.json({
        feedbackMode: settings.che_do_phan_hoi_ai,
        accent: settings.kieu_giong_doc,
        audioSpeed: settings.toc_do_am_thanh,
      });
    } catch (error) {
      console.error('Lỗi khi lấy cài đặt:', error.message);
      res.status(500).json({ message: 'Lỗi server khi lấy cài đặt' });
    }
  }

  // PUT /api/users/settings
  static async updateSettings(req, res) {
    try {
      const userId = req.user.user_id;
      const { feedbackMode, accent, audioSpeed } = req.body;
      const settings = await UserModel.updateSettings(userId, { feedbackMode, accent, audioSpeed });
      res.json({
        message: 'Cập nhật cài đặt thành công',
        settings: {
          feedbackMode: settings.che_do_phan_hoi_ai,
          accent: settings.kieu_giong_doc,
          audioSpeed: settings.toc_do_am_thanh,
        }
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật cài đặt:', error.message);
      res.status(500).json({ message: 'Lỗi server khi cập nhật cài đặt' });
    }
  }
  // GET /api/users/stats
  static async getStats(req, res) {
    try {
      const userId = req.user.user_id;
      const stats = await UserModel.getUserStats(userId);
      // Auto-check and grant any new achievements
      try {
        await AchievementModel.checkAndGrantAchievements(userId, stats);
      } catch (achErr) {
        console.warn('Achievement check failed (non-critical):', achErr.message);
      }
      res.json(stats);
    } catch (error) {
      console.error('Lỗi khi lấy thống kê người dùng:', error.message);
      res.status(500).json({ message: 'Lỗi server khi lấy thống kê' });
    }
  }

  // GET /api/users/achievements
  static async getAchievements(req, res) {
    try {
      const userId = req.user.user_id;
      const achievements = await AchievementModel.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error('Lỗi khi lấy thành tựu:', error.message);
      res.status(500).json({ message: 'Lỗi server khi lấy thành tựu' });
    }
  }

  // GET /api/users/progress-charts
  static async getProgressCharts(req, res) {
    try {
      const userId = req.user.user_id;
      const weeklyActivity = await UserModel.getWeeklyActivity(userId);
      const pronunciationProgress = await UserModel.getPronunciationProgress(userId);

      const dayNames = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };
      const formattedWeekly = weeklyActivity.map(row => ({
        day: dayNames[row.day_of_week] || 'T?',
        Giờ: parseFloat((row.total_minutes / 60).toFixed(1))
      }));

      const formattedPronunciation = pronunciationProgress.map((row, index) => ({
        week: `Tuần ${index + 1}`,
        điểm: parseInt(row.avg_score, 10)
      }));

      res.json({
        weekly: formattedWeekly,
        pronunciation: formattedPronunciation
      });
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu biểu đồ:', error.message);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }

  // GET /api/users/wrong-words
  static async getWrongWords(req, res) {
    try {
      const userId = req.user.user_id;
      const words = await UserModel.getWrongWords(userId, 10);
      res.json(words);
    } catch (error) {
      console.error('Lỗi khi lấy từ sai:', error.message);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }

  // POST /api/users/wrong-words/complete
  static async completeWrongWord(req, res) {
    try {
      const userId = req.user.user_id;
      const { word } = req.body;
      if (!word) {
        return res.status(400).json({ message: 'Thiếu từ vựng cần hoàn thành' });
      }
      
      const updatedUser = await UserModel.resolveWrongWord(userId, word);
      
      res.json({ 
        message: 'Luyện tập thành công', 
        expAdded: 10,
        newLevel: updatedUser.cap_do,
        newExp: updatedUser.diem_kinh_nghiem_hien_tai
      });
    } catch (error) {
      console.error('Lỗi khi hoàn thành từ sai:', error.message);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
}

export default UserController;
