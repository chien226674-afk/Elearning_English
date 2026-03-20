import AuthService from '../services/authService.js';

class AuthController {
  // POST /auth/register
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng cung cấp username, email và password' });
      }

      const response = await AuthService.register(username, email, password);
      res.status(201).json(response);
    } catch (error) {
      console.error('Lỗi khi đăng ký:', error.message);
      res.status(400).json({ message: error.message });
    }
  }

  // GET /auth/verify-email?token=xxx
  static async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ message: 'Token không hợp lệ' });
      }

      const response = await AuthService.verifyEmail(token);
      res.json(response);
    } catch (error) {
       console.error('Lỗi khi xác thực email:', error.message);
       res.status(400).json({ message: error.message });
    }
  }

  // POST /auth/login
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Vui lòng cung cấp email và password' });
      }

      const response = await AuthService.login(email, password);
      res.json(response);
    } catch (error) {
       console.error('Lỗi khi đăng nhập:', error.message);
       res.status(401).json({ message: error.message });
    }
  }

  // POST /auth/google
  static async googleLogin(req, res) {
    try {
      const { token } = req.body; // Google ID Token từ frontend
      
      if (!token) {
        return res.status(400).json({ message: 'Google Token không hợp lệ' });
      }

      const response = await AuthService.googleLogin(token);
      res.json(response);
    } catch (error) {
       console.error('Lỗi khi đăng nhập Google:', error.message);
       res.status(401).json({ message: error.message });
    }
  }

  // POST /auth/forgot-password
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Vui lòng cung cấp email' });
      }

      const response = await AuthService.forgotPassword(email);
      res.json(response);
    } catch (error) {
       console.error('Lỗi khi yêu cầu đặt lại mật khẩu:', error.message);
       res.status(400).json({ message: error.message });
    }
  }

  // POST /auth/reset-password
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token và mật khẩu mới là bắt buộc' });
      }

      const response = await AuthService.resetPassword(token, newPassword);
      res.json(response);
    } catch (error) {
       console.error('Lỗi khi đặt lại mật khẩu:', error.message);
       res.status(400).json({ message: error.message });
    }
  }
}

export default AuthController;
