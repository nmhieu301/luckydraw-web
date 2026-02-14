# 🧧 Lì Xì Lucky Draw - Tết Bính Ngọ 2026

**Ứng dụng quay thưởng may mắn nội bộ VNPAY** — React + Tailwind CSS + Supabase

## 🚀 Chạy Local

### Yêu cầu
- Node.js 18+
- Tài khoản Supabase (đã tạo project)

### Cài đặt

```bash
# Clone & install
npm install

# Copy file env mẫu
cp .env.example .env
# Sửa .env với Supabase URL và Anon Key

# Chạy dev
npm run dev
```

Mở trình duyệt tại **http://localhost:5173**

### Biến môi trường (`.env`)

| Biến | Mô tả |
|------|--------|
| `VITE_SUPABASE_URL` | URL dự án Supabase (vd: `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Anon/Public API key |
| `VITE_APP_BASE_URL` | URL ứng dụng (vd: `http://localhost:5173`) |

---

## 🔧 Cấu hình Supabase

### 1. Cấu hình Auth Email/OTP

1. Vào **Supabase Dashboard** → **Authentication** → **Providers**
2. Bật **Email** provider
3. Trong **Email Auth** settings:
   - ✅ Enable Email Signup
   - ✅ Enable Email OTP Login
   - Đặt OTP expiry: **300** giây (5 phút)

### 2. Cấu hình SMTP (bắt buộc để gửi OTP thật)

1. Vào **Project Settings** → **Authentication** → **SMTP Settings**
2. Bật **Custom SMTP**
3. Điền thông tin SMTP server:
   - **Host**: SMTP server (vd: `smtp.gmail.com`)
   - **Port**: `587` (TLS) hoặc `465` (SSL)
   - **Username**: Email gửi
   - **Password**: App password
   - **Sender name**: `VNPAY Lucky Draw`
   - **Sender email**: email gửi

### 3. Tùy chỉnh Email Template (tuỳ chọn)

1. Vào **Authentication** → **Email Templates**
2. Chỉnh template **Magic Link / OTP**:

```html
<h2>🧧 Lì Xì Lucky Draw - Mã OTP</h2>
<p>Xin chào,</p>
<p>Mã xác thực của bạn là: <strong>{{ .Token }}</strong></p>
<p>Mã có hiệu lực trong 5 phút.</p>
<p>Chúc Mừng Năm Mới 2026! 🎊</p>
```

### 4. Thêm nhân viên Admin

Sau khi tạo schema, thêm admin đầu tiên bằng SQL:

```sql
INSERT INTO public.employees (email, full_name, department, role)
VALUES ('admin@vnpay.vn', 'Admin User', 'IT', 'admin');
```

---

## 📋 Tính năng

| Tính năng | Mô tả |
|-----------|--------|
| 🔐 Đăng nhập OTP | Email `@vnpay.vn` → gửi OTP → xác thực |
| 🎰 Quay thưởng | Slot machine animation, weighted random (10k–500k) |
| ⏰ 1 lần/ngày | Enforce bằng DB unique constraint + server function |
| 📋 Lịch sử | Xem 30 ngày gần nhất |
| 👥 Admin: Quản lý NV | Import Excel, tìm kiếm, xem thống kê |
| 🔄 Admin: Reset quay | Reset lượt quay của nhân viên |
| 📥 Admin: Export CSV | Xuất danh sách nhân viên + thống kê |

### Mệnh giá & Tỷ lệ

| Giải | Tỷ lệ |
|------|--------|
| 10.000đ | 35% |
| 20.000đ | 25% |
| 50.000đ | 20% |
| 100.000đ | 12% |
| 200.000đ | 6% |
| 500.000đ | 2% |

---

## 🏗 Database Schema

### `employees`
- `id` (uuid PK), `auth_user_id` (FK → auth.users), `email` (unique), `full_name`, `department`, `employee_code`, `role` (admin/staff), `last_login_at`, `created_at`

### `lucky_draw_results`
- `id` (bigint PK), `user_id` (FK), `email`, `amount`, `draw_date` (unique per user per day), `created_at`

### `audit_logs`
- `id` (bigint PK), `actor_user_id`, `action`, `payload_json`, `created_at`

**RLS**: Tất cả bảng đều bật Row Level Security. Staff chỉ đọc/ghi data của mình, Admin có full access.

---

## 🌐 Deploy

### Vercel

```bash
npm install -g vercel
vercel
```

Thêm environment variables trong Vercel Dashboard.

### Firebase Hosting

```bash
npm run build
npm install -g firebase-tools
firebase init hosting   # public: dist, SPA: Yes
firebase deploy
```

### Netlify

```bash
npm run build
# Drag & drop thư mục dist/ lên Netlify
```

---

## 📁 Cấu trúc dự án

```
src/
├── components/
│   └── AppLayout.jsx      # Layout chính (header + tabs)
├── context/
│   └── AuthContext.jsx     # Quản lý auth session + employee
├── lib/
│   ├── supabase.js         # Supabase client
│   └── utils.js            # Utilities (format, validation)
├── pages/
│   ├── LoginPage.jsx       # Đăng nhập OTP
│   ├── LuckyDrawPage.jsx   # Quay thưởng
│   ├── HistoryPage.jsx     # Lịch sử cá nhân
│   └── AdminPage.jsx       # Quản lý nhân viên
├── App.jsx                 # Root component
├── main.jsx                # Entry point
└── index.css               # Tailwind + theme CSS
```

---

## 🔒 Bảo mật

- ✅ Email domain enforce (`@vnpay.vn`) — client + server validation
- ✅ RLS trên tất cả bảng
- ✅ Server-side spin function (chống gian lận)
- ✅ Không expose service role key
- ✅ UNIQUE constraint ngăn quay trùng ngày
