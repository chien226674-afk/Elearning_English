import CategoryModel from '../models/categoryModel.js';

class CategoryController {
  static async getAll(req, res) {
    try {
      const categories = await CategoryModel.getAll();
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách danh mục' });
    }
  }

  static async create(req, res) {
    try {
      const { ten_danh_muc, mo_ta } = req.body;
      if (!ten_danh_muc) return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
      const category = await CategoryModel.create(ten_danh_muc, mo_ta);
      res.status(201).json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi tạo danh mục' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { ten_danh_muc, mo_ta } = req.body;
      const category = await CategoryModel.update(id, ten_danh_muc, mo_ta);
      if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
      res.json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật danh mục' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const category = await CategoryModel.delete(id);
      if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
      res.json({ message: 'Xóa danh mục thành công' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi xóa danh mục' });
    }
  }
}

export default CategoryController;
