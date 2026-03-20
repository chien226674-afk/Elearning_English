import { query } from '../config/db.js';

class AdminController {
  // Lấy dữ liệu tổng quan cho Dashboard
  static async getOverviewStats(req, res) {
    try {
      const usersRes = await query('SELECT COUNT(*) FROM nguoi_dung');
      const lessonsRes = await query('SELECT COUNT(*) FROM bai_hoc');
      const sessionsRes = await query('SELECT COUNT(*) FROM tien_trinh_hoc_tap');
      const achievementsRes = await query('SELECT COUNT(*) FROM thanh_tuu_nguoi_dung');

      res.json({
        totalUsers: parseInt(usersRes.rows[0].count, 10),
        totalLessons: parseInt(lessonsRes.rows[0].count, 10),
        totalSessions: parseInt(sessionsRes.rows[0].count, 10),
        totalAchievements: parseInt(achievementsRes.rows[0].count, 10),
      });
    } catch (error) {
      console.error('Error fetching admin overview stats:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy thống kê tổng quan' });
    }
  }

  // Lấy dữ liệu biểu đồ (Registration, Sessions per day)
  static async getChartData(req, res) {
    try {
      // 7 ngày qua
      const registrationQuery = `
        WITH RECURSIVE last_7_days AS (
          SELECT current_date - i AS day_date FROM generate_series(6, 0, -1) AS i
        )
        SELECT d.day_date as date, COUNT(n.ma_nguoi_dung) as value
        FROM last_7_days d
        LEFT JOIN nguoi_dung n ON DATE(n.ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = d.day_date
        GROUP BY d.day_date
        ORDER BY d.day_date ASC;
      `;
      const sessionsQuery = `
        WITH RECURSIVE last_7_days AS (
          SELECT current_date - i AS day_date FROM generate_series(6, 0, -1) AS i
        )
        SELECT d.day_date as date, COUNT(t.ma_tien_trinh) as value
        FROM last_7_days d
        LEFT JOIN tien_trinh_hoc_tap t ON DATE(t.ngay_hoan_thanh AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = d.day_date
        GROUP BY d.day_date
        ORDER BY d.day_date ASC;
      `;

      const regRes = await query(registrationQuery);
      const sesRes = await query(sessionsQuery);

      res.json({
        registrations: regRes.rows.map(row => ({ date: row.date, value: parseInt(row.value, 10) })),
        sessions: sesRes.rows.map(row => ({ date: row.date, value: parseInt(row.value, 10) })),
      });
    } catch (error) {
      console.error('Error fetching admin chart data:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu biểu đồ' });
    }
  }

  // Lấy Insights (top lessons, abandoned, hard words)
  static async getInsights(req, res) {
    try {
      // Top lessons
      const topLessonsQuery = `
        SELECT b.tieu_de as name, COUNT(t.ma_bai_hoc) as count
        FROM tien_trinh_hoc_tap t
        JOIN bai_hoc b ON t.ma_bai_hoc = b.ma_bai_hoc
        GROUP BY b.ma_bai_hoc, b.tieu_de
        ORDER BY count DESC
        LIMIT 5;
      `;
      // Từ phát âm sai nhiều nhất
      const topMistakesQuery = `
        SELECT tu_vung as word, SUM(so_lan_sai) as mistakes
        FROM tu_phat_am_sai
        GROUP BY tu_vung
        ORDER BY mistakes DESC
        LIMIT 5;
      `;

      const [topLessons, topMistakes] = await Promise.all([
        query(topLessonsQuery),
        query(topMistakesQuery)
      ]);

      res.json({
        topLessons: topLessons.rows,
        topMistakes: topMistakes.rows,
      });
    } catch (error) {
      console.error('Error fetching admin insights:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy insights' });
    }
  }
}

export default AdminController;
