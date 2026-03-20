import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      user_id: user.ma_nguoi_dung,
      username: user.ten_dang_nhap,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const generateCryptoToken = () => {
    return uuidv4();
}
