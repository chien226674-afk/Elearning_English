import { query } from '../config/db.js';

class CategoryModel {
  static async getAll() {
    const text = 'SELECT * FROM danh_muc ORDER BY ten_danh_muc ASC';
    const { rows } = await query(text);
    return rows;
  }

  static async findById(id) {
    const text = 'SELECT * FROM danh_muc WHERE ma_danh_muc = $1';
    const values = [id];
    const { rows } = await query(text, values);
    return rows[0];
  }
  static async create(ten_danh_muc, mo_ta) {
    const text = 'INSERT INTO danh_muc (ten_danh_muc, mo_ta) VALUES ($1, $2) RETURNING *';
    const { rows } = await query(text, [ten_danh_muc, mo_ta]);
    return rows[0];
  }

  static async update(id, ten_danh_muc, mo_ta) {
    const text = 'UPDATE danh_muc SET ten_danh_muc = $1, mo_ta = $2 WHERE ma_danh_muc = $3 RETURNING *';
    const { rows } = await query(text, [ten_danh_muc, mo_ta, id]);
    return rows[0];
  }

  static async delete(id) {
    const text = 'DELETE FROM danh_muc WHERE ma_danh_muc = $1 RETURNING *';
    const { rows } = await query(text, [id]);
    return rows[0];
  }
}

export default CategoryModel;
