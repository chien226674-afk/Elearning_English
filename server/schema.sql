-- Initialize Database Auth Schema
-- This script contains queries to setup the auth schema. Execute this in your postgres environment.

-- 1. Create User Table
CREATE TABLE IF NOT EXISTS nguoi_dung (
  ma_nguoi_dung UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ten_dang_nhap VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mat_khau_hash VARCHAR(255),
  anh_dai_dien VARCHAR(255),
  cap_do INT DEFAULT 1,
  diem_kinh_nghiem_hien_tai INT DEFAULT 0,
  ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Auth specific extensions
  google_id VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  mo_ta TEXT,
  role VARCHAR(20) DEFAULT 'USER' -- USER, ADMIN
);

-- 2. Create Auth Tokens Table
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL, -- 'EMAIL_VERIFICATION' or 'PASSWORD_RESET'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Categories Table
CREATE TABLE IF NOT EXISTS danh_muc (
  ma_danh_muc UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ten_danh_muc VARCHAR(100) NOT NULL UNIQUE,
  mo_ta TEXT,
  ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Lessons Table
CREATE TABLE IF NOT EXISTS bai_hoc (
  ma_bai_hoc UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_danh_muc UUID REFERENCES danh_muc(ma_danh_muc) ON DELETE SET NULL,
  tieu_de VARCHAR(255) NOT NULL,
  mo_ta TEXT,
  thoi_luong_phut INT,
  do_kho VARCHAR(50), -- 'CƠ BẢN', 'TRUNG CẤP', 'NÂNG CAO'
  mau_the_hien_thi VARCHAR(50), -- 'orange', 'blue', 'green', 'purple'
  ten_icon VARCHAR(100),
  trang_thai_hoat_dong BOOLEAN DEFAULT true,
  ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 4. Bảng BaiTapTuVung (Vocabulary Exercises)
-- Những từ vựng cụ thể cần học trong một bài học
CREATE TABLE bai_tap_tu_vung (
    ma_tu_vung UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_bai_hoc UUID REFERENCES bai_hoc(ma_bai_hoc) ON DELETE CASCADE,
    tu_tieng_anh VARCHAR(255) NOT NULL,
    nghia_tieng_viet VARCHAR(255) NOT NULL,
    thu_tu_hien_thi INT, -- Thứ tự từ xuất hiện trong bài
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 5. Bảng BaiTapCau (Sentence Exercises)
-- Những câu giao tiếp/luyện nói cần học trong một bài học
CREATE TABLE bai_tap_cau (
    ma_bai_tap_cau UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_bai_hoc UUID REFERENCES bai_hoc(ma_bai_hoc) ON DELETE CASCADE,
    cau_tieng_anh TEXT NOT NULL,
    cau_tieng_viet TEXT NOT NULL,
    thu_tu_hien_thi INT, -- Thứ tự câu trong bài
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 6. Create Progress Tracking Table
CREATE TABLE IF NOT EXISTS tien_trinh_hoc_tap (
  ma_tien_trinh UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_nguoi_dung UUID NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
  ma_bai_hoc UUID NOT NULL REFERENCES bai_hoc(ma_bai_hoc) ON DELETE CASCADE,
  diem_so INT NOT NULL, -- vd: 85
  diem_kn_thu_duoc INT NOT NULL,
  ngay_hoan_thanh TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ma_nguoi_dung, ma_bai_hoc)
);

-- 7. Bảng TuPhatAmSai (User Mistakes)
-- Theo dõi những từ vựng người dùng hay phát âm sai (từ WrongWordsCard)
CREATE TABLE tu_phat_am_sai (
    ma_tu_sai UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_nguoi_dung UUID REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
    tu_vung VARCHAR(100) NOT NULL,
    so_lan_sai INT DEFAULT 1, -- Số lần phát âm sai
    ngay_luyen_tap_cuoi TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 8. Bảng DanhSachThanhTuu (Achievements Catalog)
-- Danh sách các huy hiệu/badget có trong hệ thống
CREATE TABLE danh_sach_thanh_tuu (
    ma_thanh_tuu UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_thanh_tuu VARCHAR(100) NOT NULL,
    mo_ta TEXT,
    ten_icon VARCHAR(100), -- Vd: tên icon Lucide hoặc URL hình ảnh
    phan_thuong_kn INT DEFAULT 0,
    image_url TEXT, -- ảnh (nếu không dùng ten_icon)
    loai_dieu_kien VARCHAR(50), --Vd: 'streak', 'avg_score', 'total_completed'
    gia_tri INT -- Vd: 7, 80, 10
);
-- 9. Bảng ThanhTuuNguoiDung (User Achievements)
-- Mapping user đã đạt được huy hiệu nào
CREATE TABLE thanh_tuu_nguoi_dung (
    ma_nguoi_dung UUID REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
    ma_thanh_tuu UUID REFERENCES danh_sach_thanh_tuu(ma_thanh_tuu) ON DELETE CASCADE,
    ngay_dat_duoc TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ma_nguoi_dung, ma_thanh_tuu)
);
-- 10. Bảng CaiDatNguoiDung (User Settings)
-- Lưu cài đặt hệ thống của từng người dùng
CREATE TABLE cai_dat_nguoi_dung (
    ma_cai_dat UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_nguoi_dung UUID UNIQUE REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
    che_do_phan_hoi_ai VARCHAR(50), -- ai_feedback_mode
    kieu_giong_doc VARCHAR(20),     -- accent
    toc_do_am_thanh FLOAT DEFAULT 1.0, -- audio_speed
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);