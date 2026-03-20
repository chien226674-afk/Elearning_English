import { query } from '../config/db.js';

class AchievementModel {
  // Lấy danh sách tất cả thành tựu + trạng thái đã đạt của một người dùng
  static async getUserAchievements(userId) {
    const sql = `
      SELECT 
        d.ma_thanh_tuu,
        d.ten_thanh_tuu,
        d.mo_ta,
        d.ten_icon,
        d.image_url,
        d.phan_thuong_kn,
        d.loai_dieu_kien,
        d.gia_tri,
        CASE WHEN t.ma_thanh_tuu IS NOT NULL THEN true ELSE false END as da_dat_duoc,
        t.ngay_dat_duoc
      FROM danh_sach_thanh_tuu d
      LEFT JOIN thanh_tuu_nguoi_dung t 
        ON d.ma_thanh_tuu = t.ma_thanh_tuu AND t.ma_nguoi_dung = $1
      ORDER BY da_dat_duoc DESC, d.phan_thuong_kn DESC
    `;
    const { rows } = await query(sql, [userId]);
    return rows;
  }

  // Tự động kiểm tra và trao thành tựu còn thiếu
  static async checkAndGrantAchievements(userId, stats) {
    const { streak, avgScore, totalCompleted } = stats;

    // Lấy tất cả thành tựu trong hệ thống
    const allAchievements = await query('SELECT * FROM danh_sach_thanh_tuu');
    
    // Lấy thành tựu người dùng đã có
    const existingRes = await query(
      'SELECT ma_thanh_tuu FROM thanh_tuu_nguoi_dung WHERE ma_nguoi_dung = $1',
      [userId]
    );
    const earned = new Set(existingRes.rows.map(r => r.ma_thanh_tuu));

    const newlyGranted = [];

    for (const ach of allAchievements.rows) {
      if (earned.has(ach.ma_thanh_tuu)) continue;

      let qualified = false;
      const condition = ach.loai_dieu_kien?.toUpperCase();
      const threshold = ach.gia_tri;

      if (condition === 'STREAK' && streak >= threshold) qualified = true;
      if (condition === 'DIEM_CAO' && avgScore >= threshold) qualified = true;
      if (condition === 'SO_BAI_HOC' && totalCompleted >= threshold) qualified = true;

      if (qualified) {
        await query(
          'INSERT INTO thanh_tuu_nguoi_dung (ma_nguoi_dung, ma_thanh_tuu) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, ach.ma_thanh_tuu]
        );
        newlyGranted.push(ach);
      }
    }

    return newlyGranted;
  }
  // --- ADMIN CRUD ---
  static async getAllAdmin() {
    const text = 'SELECT * FROM danh_sach_thanh_tuu ORDER BY phan_thuong_kn ASC';
    const { rows } = await query(text);
    return rows;
  }

  static async create(data) {
    const text = `
      INSERT INTO danh_sach_thanh_tuu (ten_thanh_tuu, mo_ta, ten_icon, image_url, phan_thuong_kn, loai_dieu_kien, gia_tri)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [data.ten_thanh_tuu, data.mo_ta, data.ten_icon, data.image_url, data.phan_thuong_kn || 0, data.loai_dieu_kien, data.gia_tri || 0];
    const { rows } = await query(text, values);
    return rows[0];
  }

  static async update(id, data) {
    const text = `
      UPDATE danh_sach_thanh_tuu
      SET ten_thanh_tuu = $1, mo_ta = $2, ten_icon = $3, image_url = $4, phan_thuong_kn = $5, loai_dieu_kien = $6, gia_tri = $7
      WHERE ma_thanh_tuu = $8
      RETURNING *
    `;
    const values = [data.ten_thanh_tuu, data.mo_ta, data.ten_icon, data.image_url, data.phan_thuong_kn || 0, data.loai_dieu_kien, data.gia_tri || 0, id];
    const { rows } = await query(text, values);
    return rows[0];
  }

  static async delete(id) {
    const text = 'DELETE FROM danh_sach_thanh_tuu WHERE ma_thanh_tuu = $1 RETURNING *';
    const { rows } = await query(text, [id]);
    return rows[0];
  }
}

export default AchievementModel;
