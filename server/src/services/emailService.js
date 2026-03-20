import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Bỏ qua lỗi SSL certificate trong môi trường dev
  },
});

export const sendVerificationEmail = async (to, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"SpeakAI" <${process.env.EMAIL_FROM}>`,
    to: to,
    subject: 'Xác thực tài khoản của bạn',
    html: `
      <h2>Chào mừng bạn đến với SpeakAI</h2>
      <p>Vui lòng click vào link bên dưới để xác thực địa chỉ email của bạn:</p>
      <a href="${url}">${url}</a>
      <p>Link này sẽ hết hạn sau 24h.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (to, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"SpeakAI" <${process.env.EMAIL_FROM}>`,
    to: to,
    subject: 'Đặt lại mật khẩu',
    html: `
      <h2>Yêu cầu đặt lại mật khẩu</h2>
      <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng click vào link bên dưới để tạo mật khẩu mới:</p>
      <a href="${url}">${url}</a>
      <p>Link này sẽ hết hạn sau 1 tiếng. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
