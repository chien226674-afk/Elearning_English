import { verifyAccessToken } from '../utils/token.js';

export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Không có token xác thực' });
    }

    const token = authHeader.split(' ')[1];
    
    // Decode and attach user info to req object
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Lỗi xác thực token:', error.message);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

export const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      return res.status(403).json({ message: 'Truy cập bị từ chối. Chỉ Admin mới có quyền truy cập.' });
    }
  });
};
