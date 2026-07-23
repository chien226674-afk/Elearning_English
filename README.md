# 🇬🇧 Elearning English Platform

Một nền tảng học tiếng Anh toàn diện tích hợp AI thông minh, giúp người dùng luyện tập phát âm, nghe và giao tiếp với các công nghệ lõi tiên tiến nhất. Dự án được cấu trúc theo dạng Monorepo bao gồm cả Frontend và Backend.

---

## 🚀 Công nghệ sử dụng (Tech Stack)

### 🎨 Frontend (Client)
- **Framework:** React 19 (với Vite)
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS + Radix UI
- **Routing:** React Router DOM
- **Forms & Validation:** React Hook Form + Zod
- **Biểu đồ:** Recharts
- **Triển khai (Deployment):** [Vercel](https://vercel.com/)

### ⚙️ Backend (Server)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (dùng `pg`)
- **Bảo mật & Quản lý mạng:** Helmet, Express Rate Limit, CORS, JWT
- **Lưu trữ ảnh:** Cloudinary + Multer
- **Gửi Email:** Nodemailer
- **Triển khai (Deployment):** [Render](https://render.com/)

### 🧠 Trí tuệ Nhân tạo (AI & Speech Stack)
- **Nhận dạng giọng nói (Speech-to-Text):** OpenAI Whisper
- **Chấm điểm & Đánh giá phát âm:** Groq (Llama 3)
- **Đọc tiếng Anh (Text-to-Speech):** ElevenLabs

### 🗄 Cơ sở dữ liệu
- **Hệ quản trị:** PostgreSQL (Quản lý qua [Supabase](https://supabase.com/))

---

## 📁 Cấu trúc thư mục (Monorepo)

```text
Elearning_English/
├── client/                 # Mã nguồn Frontend (React/Vite)
│   ├── src/                # Logic UI, components, pages
│   ├── vercel.json         # Cấu hình routing cho Vercel SPA
│   └── vite.config.ts      # Cấu hình Vite (hỗ trợ đọc .env từ thư mục gốc)
├── server/                 # Mã nguồn Backend (Node.js/Express)
│   ├── src/                # API controllers, models, routes, services
│   ├── schema.sql          # File khởi tạo cấu trúc Database
│   ├── seed_data.sql       # File khởi tạo dữ liệu mẫu
│   └── .npmrc              # Cấu hình bỏ qua xung đột peer-dependencies khi deploy
├── .env                    # Biến môi trường chung cho cả Client & Server (Cần tự tạo)
└── .env.example            # File mẫu chứa các biến môi trường cần thiết
```

---

## 🛠 Hướng dẫn cài đặt tại Local (Môi trường phát triển)

### 1. Chuẩn bị
- Đảm bảo đã cài đặt Node.js (phiên bản 18+).
- Đảm bảo có PostgreSQL chạy local hoặc có chuỗi kết nối tới Supabase.

### 2. Cài đặt các gói phụ thuộc (Dependencies)
```bash
# Cài đặt cho Backend
cd server
npm install

# Cài đặt cho Frontend
cd ../client
npm install
```

### 3. Cấu hình biến môi trường
- Copy file `.env.example` thành `.env` nằm tại thư mục gốc của dự án (`Elearning_English/`).
- Điền đầy đủ thông tin vào các biến (API Keys, Database URL, JWT Secret, Google Client ID,...).

### 4. Khởi chạy dự án
Mở 2 terminal để chạy song song:

**Terminal 1 (Khởi chạy Backend):**
```bash
cd server
npm run dev
# Server sẽ chạy tại http://localhost:5000
```

**Terminal 2 (Khởi chạy Frontend):**
```bash
cd client
npm run dev
# Frontend sẽ chạy tại http://localhost:5173
```

---

## ☁️ Hướng dẫn Triển khai (Deployment)

Dự án đã được thiết lập sẵn các file cấu hình tối ưu để triển khai lên Cloud.

### Bước 1: Khởi tạo Database (Supabase)
1. Tạo dự án trên [Supabase](https://supabase.com/).
2. Mở **SQL Editor** và chạy lần lượt nội dung trong `server/schema.sql` và `server/seed_data.sql`.
3. Lấy chuỗi **Connection Pooling** trong mục *Database Settings*. Cập nhật vào biến `DATABASE_URL` trong file `.env`. (Lưu ý: Nếu mật khẩu có chứa ký tự `@`, hãy mã hóa thành `%40`).

### Bước 2: Deploy Backend (Render)
1. Tạo một *Web Service* mới trên [Render](https://render.com/), liên kết với GitHub.
2. Cấu hình:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Cài đặt các biến môi trường (Environment Variables) sao chép từ file `.env`. (Đặc biệt lưu ý `NODE_ENV=production` để kích hoạt SSL kết nối Database).
4. Deploy và lưu lại URL được Render cấp.

### Bước 3: Deploy Frontend (Vercel)
1. Thêm dự án mới trên [Vercel](https://vercel.com/), chọn thư mục gốc là `client`.
2. Vercel sẽ tự nhận diện Vite (Build Command: `npm run build`, Output Directory: `dist`).
3. Cài đặt biến môi trường:
   - `VITE_API_URL`: URL Backend mà Render cấp ở Bước 2.
   - `VITE_GOOGLE_CLIENT_ID`: ID Google OAuth của bạn.
4. Triển khai và nhận URL Production.

### Bước 4: Đồng bộ hoá
- Quay lại trang quản lý của Render (Backend), cập nhật biến `CLIENT_URL` thành URL Production của Vercel và bấm **Restart/Deploy lại**. Điều này giúp CORS mở cửa cho Frontend kết nối.
- Thêm URL của Vercel vào danh sách *Authorized JavaScript origins* trên hệ thống **Google Cloud Console** để tính năng đăng nhập hoạt động.

---

## 🛡 Vấn đề Bảo mật & Hiệu năng
- Đã tích hợp `helmet` và `express-rate-limit` để chặn các đợt tấn công HTTP/DDoS.
- Khóa CORS nghiêm ngặt, chỉ cho phép request từ `CLIENT_URL`.
- Tự động bỏ qua lỗi xung đột `peer-dependencies` thông qua file `.npmrc` để đảm bảo hệ thống CI/CD trên Render chạy thông suốt.
- Quản lý định tuyến SPA (Single Page Application) hoàn chỉnh trên Vercel thông qua `vercel.json` để không bị lỗi 404 khi người dùng F5 tải lại trang.

---
*Dự án đã sẵn sàng cho môi trường Production!* 🚀