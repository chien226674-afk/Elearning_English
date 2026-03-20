import AchievementModel from '../models/achievementModel.js';

class AdminAchievementController {
  static async getAll(req, res) {
    try {
      const achievements = await AchievementModel.getAllAdmin();
      res.json(achievements);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi tải danh sách thành tựu' });
    }
  }

  static async create(req, res) {
    try {
      const { ten_thanh_tuu, mo_ta, ten_icon, phan_thuong_kn, loai_dieu_kien, gia_tri } = req.body;
      const imageUrl = req.file ? req.file.path : null;

      const newAchievement = await AchievementModel.create({
        ten_thanh_tuu,
        mo_ta,
        ten_icon: ten_icon || null,
        image_url: imageUrl,
        phan_thuong_kn: parseInt(phan_thuong_kn || 0),
        loai_dieu_kien: loai_dieu_kien || null,
        gia_tri: parseInt(gia_tri || 0),
      });

      res.status(201).json(newAchievement);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi tạo thành tựu' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { ten_thanh_tuu, mo_ta, ten_icon, phan_thuong_kn, loai_dieu_kien, gia_tri, existing_image_url } = req.body;
      const imageUrl = req.file ? req.file.path : existing_image_url;

      const updatedAchievement = await AchievementModel.update(id, {
        ten_thanh_tuu,
        mo_ta,
        ten_icon: ten_icon || null,
        image_url: imageUrl,
        phan_thuong_kn: parseInt(phan_thuong_kn || 0),
        loai_dieu_kien: loai_dieu_kien || null,
        gia_tri: parseInt(gia_tri || 0),
      });

      res.json(updatedAchievement);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi cập nhật thành tựu' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await AchievementModel.delete(id);
      res.json({ message: 'Đã xóa thành tựu' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi xóa thành tựu' });
    }
  }
}

export default AdminAchievementController;
