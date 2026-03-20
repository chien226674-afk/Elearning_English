-- Sample Data for Lessons and Categories
-- Execute this after running schema.sql

-- 1. Insert Categories
INSERT INTO danh_muc (ten_danh_muc, mo_ta) VALUES 
('Giao tiếp hằng ngày', 'Học cách giao tiếp trong các tình huống cơ bản.'),
('Tiếng Anh du lịch', 'Từ vựng và mẫu câu hữu ích khi đi du lịch.'),
('Tiếng Anh công sở', 'Kỹ năng giao tiếp chuyên nghiệp trong môi trường làm việc.'),
('Ngữ pháp', 'Củng cố nền tảng ngữ pháp tiếng Anh.');

-- 2. Insert Lessons
-- Category: Giao tiếp hằng ngày
INSERT INTO bai_hoc (ma_danh_muc, tieu_de, mo_ta, thoi_luong_phut, do_kho, mau_the_hien_thi, ten_icon)
SELECT ma_danh_muc, 'Chào hỏi cơ bản', 'Học cách chào hỏi và bắt đầu cuộc trò chuyện một cách tự nhiên.', 5, 'CƠ BẢN', 'orange', 'MessageCircle'
FROM danh_muc WHERE ten_danh_muc = 'Giao tiếp hằng ngày';

INSERT INTO bai_hoc (ma_danh_muc, tieu_de, mo_ta, thoi_luong_phut, do_kho, mau_the_hien_thi, ten_icon)
SELECT ma_danh_muc, 'Giới thiệu bản thân', 'Luyện cách nói tên, tuổi và nghề nghiệp của bạn.', 6, 'CƠ BẢN', 'orange', 'User'
FROM danh_muc WHERE ten_danh_muc = 'Giao tiếp hằng ngày';

-- Category: Tiếng Anh du lịch
INSERT INTO bai_hoc (ma_danh_muc, tieu_de, mo_ta, thoi_luong_phut, do_kho, mau_the_hien_thi, ten_icon)
SELECT ma_danh_muc, 'Làm thủ tục tại sân bay', 'Nắm vững từ vựng cần thiết để kiểm tra hành lý.', 10, 'TRUNG CẤP', 'blue', 'Plane'
FROM danh_muc WHERE ten_danh_muc = 'Tiếng Anh du lịch';

INSERT INTO bai_hoc (ma_danh_muc, tieu_de, mo_ta, thoi_luong_phut, do_kho, mau_the_hien_thi, ten_icon)
SELECT ma_danh_muc, 'Hỏi đường', 'Học cách hỏi và hiểu hướng dẫn chỉ đường.', 8, 'CƠ BẢN', 'green', 'Map'
FROM danh_muc WHERE ten_danh_muc = 'Tiếng Anh du lịch';

-- Category: Tiếng Anh công sở
INSERT INTO bai_hoc (ma_danh_muc, tieu_de, mo_ta, thoi_luong_phut, do_kho, mau_the_hien_thi, ten_icon)
SELECT ma_danh_muc, 'Chuẩn bị phỏng vấn xin việc', 'Thực hành trả lời câu hỏi phỏng vấn phổ biến.', 15, 'NÂNG CAO', 'purple', 'Briefcase'
FROM danh_muc WHERE ten_danh_muc = 'Tiếng Anh công sở';
