import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import UserModel from '../models/userModel.js';
import AuthTokenModel from '../models/authTokenModel.js';
import { generateAccessToken, generateCryptoToken } from '../utils/token.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  // 1. Đăng ký tài khoản
  static async register(username, email, password) {
    // Kiểm tra email tồn tại
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('Email đã được đăng ký');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Tạo user (email_verified mặc định false)
    const newUser = await UserModel.create({
      ten_dang_nhap: username,
      email,
      mat_khau_hash: passwordHash,
      email_verified: false
    });

    // Tạo verification token
    const token = generateCryptoToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Hết hạn sau 24h

    await AuthTokenModel.create({
      user_id: newUser.ma_nguoi_dung,
      token,
      type: 'EMAIL_VERIFICATION',
      expires_at: expiresAt
    });

    // Gửi email
    await sendVerificationEmail(newUser.email, token);

    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.'
    };
  }

  // 2. Xác thực email
  static async verifyEmail(token) {
    const verificationToken = await AuthTokenModel.findByTokenAndType(token, 'EMAIL_VERIFICATION');

    if (!verificationToken) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }

    // Cập nhật trạng thái user
    await UserModel.updateEmailVerified(verificationToken.user_id);
    
    // Xóa tất cả token verify cũ của user này
    await AuthTokenModel.deleteByUserAndType(verificationToken.user_id, 'EMAIL_VERIFICATION');

    return { message: 'Xác thực email thành công' };
  }

  // 3. Đăng nhập
  static async login(email, password) {
    const user = await UserModel.findByEmail(email);
    
    if (!user) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    if (!user.mat_khau_hash) {
      throw new Error('Tài khoản này được đăng nhập bằng phương thức khác (ví dụ: Google)');
    }

    const isMatch = await bcrypt.compare(password, user.mat_khau_hash);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    if (!user.email_verified) {
      throw new Error('Bạn cần xác thực email trước khi đăng nhập');
    }

    // Tạo JWT
    const accessToken = generateAccessToken(user);

    return {
      user: {
        id: user.ma_nguoi_dung,
        username: user.ten_dang_nhap,
        email: user.email,
        avatar: user.anh_dai_dien,
        role: user.role,
        isGoogleUser: !!user.google_id
      },
      accessToken
    };
  }

  // 4. Đăng nhập bằng Google
  static async googleLogin(idToken) {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email_verified) {
        throw new Error('Email Google chưa được verify');
    }

    let user = await UserModel.findByEmail(email);

    if (user) {
      // Nếu user tồn tại nhưng chưa có google_id -> Cập nhật/Map google_id (Có thể cần thêm query update)
    } else {
      // Tạo user mới
      user = await UserModel.create({
        ten_dang_nhap: name,
        email,
        mat_khau_hash: null, // Không có mật khẩu vì đăng nhập qua Google
        google_id: googleId,
        anh_dai_dien: picture,
        email_verified: true // Google đã xác thực
      });
    }

    const accessToken = generateAccessToken(user);

    return {
      user: {
        id: user.ma_nguoi_dung,
        username: user.ten_dang_nhap,
        email: user.email,
        avatar: user.anh_dai_dien,
        role: user.role,
        isGoogleUser: true
      },
      accessToken
    };
  }

  // 5. Yêu cầu Quên mật khẩu
  static async forgotPassword(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Không tìm thấy tài khoản với email này');
    }

    if (!user.mat_khau_hash) {
      throw new Error('Tài khoản này được đăng ký qua Google, không thể đổi mật khẩu');
    }

    // Xóa password reset token cũ nếu có
    await AuthTokenModel.deleteByUserAndType(user.ma_nguoi_dung, 'PASSWORD_RESET');

    // Tạo token mới
    const token = generateCryptoToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 tiếng

    await AuthTokenModel.create({
      user_id: user.ma_nguoi_dung,
      token,
      type: 'PASSWORD_RESET',
      expires_at: expiresAt
    });

    // Gửi email
    await sendPasswordResetEmail(user.email, token);

    return { message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn' };
  }

  // 6. Đặt lại Mật khẩu
  static async resetPassword(token, newPassword) {
    const resetToken = await AuthTokenModel.findByTokenAndType(token, 'PASSWORD_RESET');

    if (!resetToken) {
      throw new Error('Link đổi mật khẩu không hợp lệ hoặc đã hết hạn');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await UserModel.updatePassword(resetToken.user_id, passwordHash);

    // Xóa token
    await AuthTokenModel.deleteByUserAndType(resetToken.user_id, 'PASSWORD_RESET');

    return { message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' };
  }
}

export default AuthService;
