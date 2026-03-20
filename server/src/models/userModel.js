import { query } from '../config/db.js';

class UserModel {
  // Tìm người dùng theo email
  static async findByEmail(email) {
    const text = 'SELECT * FROM nguoi_dung WHERE email = $1';
    const values = [email];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Tìm người dùng theo ID
  static async findById(id) {
    const text = 'SELECT * FROM nguoi_dung WHERE ma_nguoi_dung = $1';
    const values = [id];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Tìm người dùng theo Google ID
  static async findByGoogleId(googleId) {
    const text = 'SELECT * FROM nguoi_dung WHERE google_id = $1';
    const values = [googleId];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Tạo người dùng mới
  static async create({ ten_dang_nhap, email, mat_khau_hash, google_id = null, anh_dai_dien = null, email_verified = false, mo_ta = null }) {
    const text = `
      INSERT INTO nguoi_dung(ten_dang_nhap, email, mat_khau_hash, google_id, anh_dai_dien, email_verified, mo_ta)
      VALUES($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [ten_dang_nhap, email, mat_khau_hash, google_id, anh_dai_dien, email_verified, mo_ta];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Cập nhật thông tin profile
  static async update(id, { ten_dang_nhap, anh_dai_dien, mo_ta }) {
    const text = `
      UPDATE nguoi_dung 
      SET ten_dang_nhap = $1, anh_dai_dien = $2, mo_ta = $3, ngay_cap_nhat = CURRENT_TIMESTAMP 
      WHERE ma_nguoi_dung = $4 
      RETURNING *
    `;
    const values = [ten_dang_nhap, anh_dai_dien, mo_ta, id];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Cập nhật trạng thái xác thực email
  static async updateEmailVerified(id) {
    const text = `
      UPDATE nguoi_dung 
      SET email_verified = TRUE, ngay_cap_nhat = CURRENT_TIMESTAMP 
      WHERE ma_nguoi_dung = $1 
      RETURNING *
    `;
    const values = [id];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Cập nhật mật khẩu
  static async updatePassword(id, hashedPassword) {
    const text = `
      UPDATE nguoi_dung 
      SET mat_khau_hash = $1, ngay_cap_nhat = CURRENT_TIMESTAMP 
      WHERE ma_nguoi_dung = $2 
      RETURNING *
    `;
    const values = [hashedPassword, id];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Cập nhật Email
  static async updateEmail(id, newEmail) {
    const text = `
      UPDATE nguoi_dung 
      SET email = $1, email_verified = FALSE, ngay_cap_nhat = CURRENT_TIMESTAMP 
      WHERE ma_nguoi_dung = $2 
      RETURNING *
    `;
    const values = [newEmail, id];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Xóa tài khoản
  static async delete(id) {
    const text = 'DELETE FROM nguoi_dung WHERE ma_nguoi_dung = $1 RETURNING *';
    const values = [id];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Lấy cài đặt học tập của người dùng
  static async getSettings(userId) {
    const text = 'SELECT * FROM cai_dat_nguoi_dung WHERE ma_nguoi_dung = $1';
    let { rows } = await query(text, [userId]);
    
    if (rows.length === 0) {
      // Create default settings if not exist
      const insertText = `
        INSERT INTO cai_dat_nguoi_dung (ma_nguoi_dung, che_do_phan_hoi_ai, kieu_giong_doc, toc_do_am_thanh)
        VALUES ($1, 'friendly', 'US', 1.0)
        RETURNING *
      `;
      const result = await query(insertText, [userId]);
      return result.rows[0];
    }
    return rows[0];
  }

  // Cập nhật cài đặt học tập
  static async updateSettings(userId, { feedbackMode, accent, audioSpeed }) {
    const text = `
      INSERT INTO cai_dat_nguoi_dung (ma_nguoi_dung, che_do_phan_hoi_ai, kieu_giong_doc, toc_do_am_thanh, ngay_cap_nhat)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (ma_nguoi_dung) 
      DO UPDATE SET 
        che_do_phan_hoi_ai = EXCLUDED.che_do_phan_hoi_ai,
        kieu_giong_doc = EXCLUDED.kieu_giong_doc,
        toc_do_am_thanh = EXCLUDED.toc_do_am_thanh,
        ngay_cap_nhat = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [userId, feedbackMode, accent, audioSpeed];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Cộng kinh nghiệm và tính lại cấp độ
  static async addExperience(userId, expToAdd) {
    const user = await this.findById(userId);
    if (!user) throw new Error('Không tìm thấy người dùng');

    const newExp = (user.diem_kinh_nghiem_hien_tai || 0) + expToAdd;
    // Cấp độ mới: exp / 100 
    const newLevel = Math.floor(newExp / 100) + 1;

    const text = `
      UPDATE nguoi_dung 
      SET 
        diem_kinh_nghiem_hien_tai = $1, 
        cap_do = $2, 
        ngay_cap_nhat = CURRENT_TIMESTAMP 
      WHERE ma_nguoi_dung = $3 
      RETURNING *
    `;
    const values = [newExp, newLevel, userId];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Thống kê thành tích học tập
  static async getUserStats(userId) {
    const user = await this.findById(userId);
    if (!user) throw new Error('Không tìm thấy người dùng');

    // 1. Số bài học đã hoàn thành & Điểm trung bình & Thời gian luyện tập (Cách 1: Ước tính)
    const statsQuery = `
      WITH UserProgress AS (
        SELECT t.diem_so, t.ngay_hoan_thanh, b.thoi_luong_phut
        FROM tien_trinh_hoc_tap t
        JOIN bai_hoc b ON t.ma_bai_hoc = b.ma_bai_hoc
        WHERE t.ma_nguoi_dung = $1
      )
      SELECT 
        COUNT(*) as total_completed,
        COALESCE(SUM(diem_so), 0) as total_sum,
        COALESCE(AVG(diem_so), 0) as avg_score,
        COALESCE(SUM(thoi_luong_phut), 0) as total_minutes,
        COUNT(CASE WHEN DATE(ngay_hoan_thanh AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN 1 END) as completed_today,
        COALESCE(SUM(CASE WHEN DATE(ngay_hoan_thanh AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN thoi_luong_phut END), 0) as daily_minutes,
        (SELECT diem_so FROM UserProgress ORDER BY ngay_hoan_thanh DESC LIMIT 1) as latest_score
      FROM UserProgress
    `;
    const statsRes = await query(statsQuery, [userId]);
    const totalCompleted = parseInt(statsRes.rows[0].total_completed, 10);
    const totalSum = parseFloat(statsRes.rows[0].total_sum);
    const avgScore = Math.round(parseFloat(statsRes.rows[0].avg_score));
    const totalMinutes = parseInt(statsRes.rows[0].total_minutes, 10);
    const dailyMinutes = parseInt(statsRes.rows[0].daily_minutes, 10);
    
    const completedToday = parseInt(statsRes.rows[0].completed_today, 10);
    const latestScore = statsRes.rows[0].latest_score !== null ? parseFloat(statsRes.rows[0].latest_score) : 0;

    let avgScoreDelta = 0;
    if (completedToday > 0) {
      if (totalCompleted === 1) {
        avgScoreDelta = avgScore; // Only 1 lesson ever
      } else if (totalCompleted > 1) {
        const prevAvg = (totalSum - latestScore) / (totalCompleted - 1);
        avgScoreDelta = Math.round(avgScore - prevAvg);
      }
    }

    // 2. Tính chuỗi ngày học liên tục (Streak)
    const streakQuery = `
      SELECT DISTINCT DATE(ngay_hoan_thanh) as hoc_date
      FROM tien_trinh_hoc_tap
      WHERE ma_nguoi_dung = $1
      ORDER BY hoc_date DESC
    `;
    const streakRes = await query(streakQuery, [userId]);
    const dates = streakRes.rows.map(r => new Date(r.hoc_date));
    
    let streak = 0;
    
    // Normalize today
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // If user hasn't studied today but studied yesterday, the streak is still valid but begins checking from yesterday.
    if (dates.length > 0) {
      const lastStudyDate = dates[0];
      lastStudyDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((checkDate.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Did study today
      } else if (diffDays === 1) {
        // Did not study today, but studied yesterday -> Streak continues, just start counting from yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Missed more than 1 day -> Streak broken
        dates.length = 0; 
      }
    }

    for (let d of dates) {
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === checkDate.getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1); // Move back 1 day
      } else {
        break; // Streak broken
      }
    }

    return {
      level: user.cap_do || 1,
      currentExp: user.diem_kinh_nghiem_hien_tai || 0,
      totalCompleted,
      avgScore,
      streak,
      completedToday,
      avgScoreDelta,
      studiedToday: completedToday > 0,
      totalMinutes,
      dailyMinutes
    };
  }

  // Lấy hoạt động hàng tuần (thời lượng học mỗi ngày trong 7 ngày qua)
  static async getWeeklyActivity(userId) {
    const text = `
      WITH RECURSIVE last_7_days AS (
        SELECT current_date - i AS day_date
        FROM generate_series(0, 6) AS i
      ),
      daily_minutes AS (
        SELECT 
          DATE(t.ngay_hoan_thanh AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') as hoc_date,
          SUM(b.thoi_luong_phut) as total_minutes
        FROM tien_trinh_hoc_tap t
        JOIN bai_hoc b ON t.ma_bai_hoc = b.ma_bai_hoc
        WHERE t.ma_nguoi_dung = $1
          AND t.ngay_hoan_thanh >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY hoc_date
      )
      SELECT 
        EXTRACT(ISODOW FROM d.day_date) as day_of_week,
        d.day_date,
        COALESCE(m.total_minutes, 0) as total_minutes
      FROM last_7_days d
      LEFT JOIN daily_minutes m ON d.day_date = m.hoc_date
      ORDER BY d.day_date ASC;
    `;
    const { rows } = await query(text, [userId]);
    return rows;
  }

  // Lấy điểm phát âm trung bình theo tuần (trong 4 tuần qua)
  static async getPronunciationProgress(userId) {
    const text = `
      WITH RECURSIVE last_4_weeks AS (
        SELECT i AS week_offset
        FROM generate_series(3, 0, -1) AS i
      ),
      weekly_scores AS (
        SELECT 
          FLOOR((CURRENT_DATE - DATE(ngay_hoan_thanh AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) / 7) as week_offset,
          AVG(diem_so) as avg_score
        FROM tien_trinh_hoc_tap
        WHERE ma_nguoi_dung = $1
          AND ngay_hoan_thanh >= CURRENT_DATE - INTERVAL '28 days'
        GROUP BY week_offset
      )
      SELECT 
        l.week_offset,
        COALESCE(ROUND(s.avg_score), 0) as avg_score
      FROM last_4_weeks l
      LEFT JOIN weekly_scores s ON l.week_offset = s.week_offset
      ORDER BY l.week_offset ASC;
    `;
    const { rows } = await query(text, [userId]);
    return rows;
  }

  // Lấy danh sách từ thường phát âm sai
  static async getWrongWords(userId, limit = 10) {
    const text = `
      SELECT tu_vung as word, so_lan_sai as mistakes
      FROM tu_phat_am_sai 
      WHERE ma_nguoi_dung = $1
      ORDER BY so_lan_sai DESC, ngay_luyen_tap_cuoi DESC
      LIMIT $2
    `;
    const { rows } = await query(text, [userId, limit]);
    return rows;
  }

  // Xóa từ phát âm sai khi đã luyện tập thành công và cộng điểm kinh nghiệm
  static async resolveWrongWord(userId, word) {
    const text = 'DELETE FROM tu_phat_am_sai WHERE ma_nguoi_dung = $1 AND tu_vung = $2';
    await query(text, [userId, word]);
    return this.addExperience(userId, 10);
  }
}

export default UserModel;
