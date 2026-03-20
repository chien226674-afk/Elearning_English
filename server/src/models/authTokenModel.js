import { query } from '../config/db.js';

class AuthTokenModel {
  // Tạo token mới
  static async create({ user_id, token, type, expires_at }) {
    const text = `
      INSERT INTO auth_tokens(user_id, token, type, expires_at)
      VALUES($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [user_id, token, type, expires_at];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Tìm token
  static async findByTokenAndType(token, type) {
    const text = 'SELECT * FROM auth_tokens WHERE token = $1 AND type = $2 AND expires_at > CURRENT_TIMESTAMP';
    const values = [token, type];
    const { rows } = await query(text, values);
    return rows[0];
  }

  // Xóa token (sau khi đã sử dụng)
  static async deleteByToken(token) {
    const text = 'DELETE FROM auth_tokens WHERE token = $1';
    const values = [token];
    await query(text, values);
  }

  // Xóa các token cũ của một user cho 1 type nhất định
  static async deleteByUserAndType(user_id, type) {
    const text = 'DELETE FROM auth_tokens WHERE user_id = $1 AND type = $2';
    const values = [user_id, type];
    await query(text, values);
  }
}

export default AuthTokenModel;
