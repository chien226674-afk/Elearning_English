import { query } from '../config/db.js';

class LessonModel {
  /**
   * Tìm bài học theo các bộ lọc
   * @param {Object} filters 
   * @param {string} filters.userId - ID người dùng để check tiến độ
   * @param {string} filters.categoryId - ID danh mục (nếu có)
   * @param {string} filters.status - 'all' (chưa học), 'completed' (đã học)
   * @param {string} filters.searchTerm - Từ khóa tìm kiếm
   * @param {number} filters.limit - Số lượng bản ghi
   * @param {number} filters.offset - Vị trí bắt đầu
   */
  static async findAll({ userId, categoryId, status, searchTerm, limit = 8, offset = 0 }) {
    let text = `
      SELECT b.*, d.ten_danh_muc,
        CASE WHEN t.ma_tien_trinh IS NOT NULL THEN true ELSE false END as da_hoc,
        t.diem_so, t.ngay_hoan_thanh
      FROM bai_hoc b
      LEFT JOIN danh_muc d ON b.ma_danh_muc = d.ma_danh_muc
      LEFT JOIN (
        SELECT * FROM tien_trinh_hoc_tap WHERE ma_nguoi_dung = $1
      ) t ON b.ma_bai_hoc = t.ma_bai_hoc
      WHERE b.trang_thai_hoat_dong = true
    `;
    const values = [userId];
    let placeholderIdx = 2;

    if (categoryId) {
      text += ` AND b.ma_danh_muc = $${placeholderIdx++}`;
      values.push(categoryId);
    }

    if (status === 'completed') {
      text += ` AND t.ma_tien_trinh IS NOT NULL`;
    } else if (status === 'unlearned') {
      text += ` AND t.ma_tien_trinh IS NULL`;
    }

    if (searchTerm) {
      text += ` AND (b.tieu_de ILIKE $${placeholderIdx} OR b.mo_ta ILIKE $${placeholderIdx})`;
      values.push(`%${searchTerm}%`);
      placeholderIdx++;
    }

    text += ` ORDER BY b.ngay_tao DESC`;
    
    // Thêm pagination
    text += ` LIMIT $${placeholderIdx++} OFFSET $${placeholderIdx++}`;
    values.push(limit, offset);

    const { rows } = await query(text, values);
    return rows;
  }

  static async findById(id, userId = null) {
    const text = `
      SELECT b.*, d.ten_danh_muc,
        CASE WHEN t.ma_tien_trinh IS NOT NULL THEN true ELSE false END as da_hoc
      FROM bai_hoc b
      LEFT JOIN danh_muc d ON b.ma_danh_muc = d.ma_danh_muc
      LEFT JOIN (
        SELECT * FROM tien_trinh_hoc_tap WHERE ma_nguoi_dung = $2
      ) t ON b.ma_bai_hoc = t.ma_bai_hoc
      WHERE b.ma_bai_hoc = $1
    `;
    const values = [id, userId];
    const { rows } = await query(text, values);
    return rows[0];
  }

  /**
   * Tìm bài học chưa học để đề xuất
   * @param {Object} filters 
   * @param {string} filters.userId - ID người dùng
   * @param {number} filters.limit - Số lượng bài học cần lấy
   */
  static async findUnlearned({ userId, limit = 4 }) {
    const text = `
      SELECT b.*, d.ten_danh_muc,
        false as da_hoc,
        null as diem_so,
        null as ngay_hoan_thanh
      FROM bai_hoc b
      LEFT JOIN danh_muc d ON b.ma_danh_muc = d.ma_danh_muc
      LEFT JOIN (
        SELECT ma_bai_hoc FROM tien_trinh_hoc_tap WHERE ma_nguoi_dung = $1
      ) t ON b.ma_bai_hoc = t.ma_bai_hoc
      WHERE b.trang_thai_hoat_dong = true
        AND t.ma_bai_hoc IS NULL
      ORDER BY b.ngay_tao DESC
      LIMIT $2
    `;
    const { rows } = await query(text, [userId, limit]);
    return rows;
  }

  /**
   * Tìm 1 bài học chưa học ngẫu nhiên
   * @param {string} userId - ID người dùng
   */
  static async findRandomUnlearned(userId) {
    const text = `
      SELECT b.ma_bai_hoc
      FROM bai_hoc b
      LEFT JOIN (
        SELECT ma_bai_hoc FROM tien_trinh_hoc_tap WHERE ma_nguoi_dung = $1
      ) t ON b.ma_bai_hoc = t.ma_bai_hoc
      WHERE b.trang_thai_hoat_dong = true
        AND t.ma_bai_hoc IS NULL
      ORDER BY RANDOM()
      LIMIT 1
    `;
    const { rows } = await query(text, [userId]);
    return rows[0] || null;
  }

  /**
   * Tìm 1 bài học ngẫu nhiên bất kỳ (nếu đã học hết)
   */
  static async findRandom() {
    const text = `
      SELECT ma_bai_hoc
      FROM bai_hoc
      WHERE trang_thai_hoat_dong = true
      ORDER BY RANDOM()
      LIMIT 1
    `;
    const { rows } = await query(text);
    return rows[0] || null;
  }

  // Lấy dữ liệu học tập của một bài (Từ vựng + Câu)
  static async getPracticeData(lessonId) {
    const lessonQuery = 'SELECT tieu_de FROM bai_hoc WHERE ma_bai_hoc = $1';
    const lessonResult = await query(lessonQuery, [lessonId]);
    const title = lessonResult.rows[0]?.tieu_de || 'Bài Tập Luyện Nói';

    const vocabQuery = 'SELECT ma_tu_vung as id, tu_tieng_anh as english, nghia_tieng_viet as vietnamese, thu_tu_hien_thi as "order", \'vocab\' as type FROM bai_tap_tu_vung WHERE ma_bai_hoc = $1 ORDER BY thu_tu_hien_thi ASC';
    const vocabResult = await query(vocabQuery, [lessonId]);

    const sentenceQuery = 'SELECT ma_bai_tap_cau as id, cau_tieng_anh as english, cau_tieng_viet as vietnamese, thu_tu_hien_thi as "order", \'sentence\' as type FROM bai_tap_cau WHERE ma_bai_hoc = $1 ORDER BY thu_tu_hien_thi ASC';
    const sentenceResult = await query(sentenceQuery, [lessonId]);

    return {
      title,
      vocabularies: vocabResult.rows,
      sentences: sentenceResult.rows
    };
  }

  // Lấy câu tiếng Anh chuẩn từ id từ vựng
  static async getVocabularyById(id) {
    const { rows } = await query('SELECT tu_tieng_anh as english FROM bai_tap_tu_vung WHERE ma_tu_vung = $1', [id]);
    return rows[0];
  }

  // Lấy câu tiếng Anh chuẩn từ id câu
  static async getSentenceById(id) {
    const { rows } = await query('SELECT cau_tieng_anh as english FROM bai_tap_cau WHERE ma_bai_tap_cau = $1', [id]);
    return rows[0];
  }

  // Lấy tiến trình học tập của một bài (để kiểm tra xem đã học chưa)
  static async getProgress(userId, lessonId) {
    const text = 'SELECT * FROM tien_trinh_hoc_tap WHERE ma_nguoi_dung = $1 AND ma_bai_hoc = $2';
    const { rows } = await query(text, [userId, lessonId]);
    return rows[0];
  }

  // Hoàn thành bài học
  static async completeLesson(userId, lessonId, score, exp) {
    const text = `
      INSERT INTO tien_trinh_hoc_tap (ma_nguoi_dung, ma_bai_hoc, diem_so, diem_kn_thu_duoc)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (ma_nguoi_dung, ma_bai_hoc) 
      DO UPDATE SET 
        diem_so = GREATEST(tien_trinh_hoc_tap.diem_so, EXCLUDED.diem_so),
        ngay_hoan_thanh = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const { rows } = await query(text, [userId, lessonId, score, exp]);
    return rows[0];
  }

  // Ghi nhận từ phát âm sai
  static async recordWrongWords(userId, wrongWordsArray) {
    if (!wrongWordsArray || wrongWordsArray.length === 0) return;
    
    // Tạo câu lệnh UPSERT cho mỗi từ
    for (const word of wrongWordsArray) {
       const text = `
          INSERT INTO tu_phat_am_sai (ma_nguoi_dung, tu_vung, so_lan_sai)
          VALUES ($1, $2, 1)
          ON CONFLICT (ma_tu_sai) DO NOTHING -- wait, ma_tu_sai is PK default uuid.
       `;
       // Let's modify table structure logic. Wait, tu_phat_am_sai has schema:
       // ma_tu_sai UUID PK DEFAULT gen_random_uuid(), ma_nguoi_dung, tu_vung, so_lan_sai, ngay_luyen_tap_cuoi
       // We don't have a UNIQUE(ma_nguoi_dung, tu_vung). So let's check first or use UPDATE
       
       const checkQuery = `SELECT ma_tu_sai FROM tu_phat_am_sai WHERE ma_nguoi_dung = $1 AND tu_vung = $2`;
       const { rows } = await query(checkQuery, [userId, word]);
       if (rows.length > 0) {
         await query(`UPDATE tu_phat_am_sai SET so_lan_sai = so_lan_sai + 1, ngay_luyen_tap_cuoi = CURRENT_TIMESTAMP WHERE ma_tu_sai = $1`, [rows[0].ma_tu_sai]);
       } else {
         await query(`INSERT INTO tu_phat_am_sai (ma_nguoi_dung, tu_vung) VALUES ($1, $2)`, [userId, word]);
       }
    }
  }
  // --- ADMIN CRUD METHODS ---
  static async adminGetAllLessons() {
    const text = `
      SELECT b.*, d.ten_danh_muc,
        (SELECT COUNT(*) FROM bai_tap_tu_vung v WHERE v.ma_bai_hoc = b.ma_bai_hoc) as total_vocab,
        (SELECT COUNT(*) FROM bai_tap_cau c WHERE c.ma_bai_hoc = b.ma_bai_hoc) as total_sentence
      FROM bai_hoc b
      LEFT JOIN danh_muc d ON b.ma_danh_muc = d.ma_danh_muc
      ORDER BY b.ngay_tao DESC
    `;
    const { rows } = await query(text);
    return rows;
  }

  static async createLesson(data) {
    const text = `
      INSERT INTO bai_hoc (ma_danh_muc, tieu_de, mo_ta, thoi_luong_phut, do_kho, trang_thai_hoat_dong)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [data.ma_danh_muc || null, data.tieu_de, data.mo_ta, data.thoi_luong_phut, data.do_kho, data.trang_thai_hoat_dong ?? true];
    const { rows } = await query(text, values);
    return rows[0];
  }

  static async updateLesson(id, data) {
    const text = `
      UPDATE bai_hoc 
      SET ma_danh_muc = $1, tieu_de = $2, mo_ta = $3, thoi_luong_phut = $4, do_kho = $5, trang_thai_hoat_dong = $6, ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE ma_bai_hoc = $7
      RETURNING *
    `;
    const values = [data.ma_danh_muc || null, data.tieu_de, data.mo_ta, data.thoi_luong_phut, data.do_kho, data.trang_thai_hoat_dong ?? true, id];
    const { rows } = await query(text, values);
    return rows[0];
  }

  static async deleteLesson(id) {
    const text = 'DELETE FROM bai_hoc WHERE ma_bai_hoc = $1 RETURNING *';
    const { rows } = await query(text, [id]);
    return rows[0];
  }

  // Vocab CRUD
  static async addVocab(data) {
    const text = `INSERT INTO bai_tap_tu_vung (ma_bai_hoc, tu_tieng_anh, nghia_tieng_viet, thu_tu_hien_thi) VALUES ($1, $2, $3, $4) RETURNING *`;
    const { rows } = await query(text, [data.ma_bai_hoc, data.tu_tieng_anh, data.nghia_tieng_viet, data.thu_tu_hien_thi || 1]);
    return rows[0];
  }
  static async updateVocab(id, data) {
    const text = `UPDATE bai_tap_tu_vung SET tu_tieng_anh = $1, nghia_tieng_viet = $2, thu_tu_hien_thi = $3 WHERE ma_tu_vung = $4 RETURNING *`;
    const { rows } = await query(text, [data.tu_tieng_anh, data.nghia_tieng_viet, data.thu_tu_hien_thi, id]);
    return rows[0];
  }
  static async deleteVocab(id) {
    const text = 'DELETE FROM bai_tap_tu_vung WHERE ma_tu_vung = $1 RETURNING *';
    const { rows } = await query(text, [id]);
    return rows[0];
  }

  // Sentence CRUD
  static async addSentence(data) {
    const text = `INSERT INTO bai_tap_cau (ma_bai_hoc, cau_tieng_anh, cau_tieng_viet, thu_tu_hien_thi) VALUES ($1, $2, $3, $4) RETURNING *`;
    const { rows } = await query(text, [data.ma_bai_hoc, data.cau_tieng_anh, data.cau_tieng_viet, data.thu_tu_hien_thi || 1]);
    return rows[0];
  }
  static async updateSentence(id, data) {
    const text = `UPDATE bai_tap_cau SET cau_tieng_anh = $1, cau_tieng_viet = $2, thu_tu_hien_thi = $3 WHERE ma_bai_tap_cau = $4 RETURNING *`;
    const { rows } = await query(text, [data.cau_tieng_anh, data.cau_tieng_viet, data.thu_tu_hien_thi, id]);
    return rows[0];
  }
  static async deleteSentence(id) {
    const text = 'DELETE FROM bai_tap_cau WHERE ma_bai_tap_cau = $1 RETURNING *';
    const { rows } = await query(text, [id]);
    return rows[0];
  }
}

export default LessonModel;
