# 🧧 Lì Xì Lucky Draw — Tết Bính Ngọ 2026

**Ứng dụng quay thưởng lì xì nội bộ VNPAY** — React 19 + Vite 7 + Tailwind CSS 4 + Supabase

> ⏳ Chương trình kết thúc ngày **01/03/2026**. Lì xì sẽ chuyển qua Ví VNPAY sau khi kết thúc.

---

## 📋 Tính năng

### 👤 Nhân viên
| Tính năng | Mô tả |
|-----------|--------|
| 🔐 Đăng nhập OTP | Email `@vnpay.vn` → nhận OTP 6 số → xác thực (hết hạn sau 5 phút) |
| 🎰 Quay thưởng | Slot machine animation, rút thăm từ prize pool cố định |
| 🎁 1 lần duy nhất | Mỗi người chỉ quay **1 lần trong toàn chương trình** |
| 📱 Nhập SĐT VNPAY | Nhập số điện thoại App VNPAY để nhận lì xì sau 01/03/2026 |
| 📋 Lịch sử | Xem lịch sử quay 30 ngày gần nhất + thống kê tổng nhận |

### 👑 Admin
| Tính năng | Mô tả |
|-----------|--------|
| 👥 Quản lý nhân viên | Xem danh sách, tìm kiếm, xem trạng thái login/quay |
| 📤 Import Excel | Nhập danh sách nhân viên từ file `.xlsx/.xls` (có preview trước) |
| 🔄 Reset lượt quay | Reset lượt quay hôm nay hoặc xóa toàn bộ lịch sử của nhân viên |
| 👑↔👤 Phân quyền | Nâng/hạ quyền Admin ↔ Staff |
| ❌ Xóa user | Xóa hoàn toàn tài khoản + lịch sử quay |
| 📥 Xuất CSV | Export danh sách nhân viên + thống kê (bao gồm SĐT VNPAY) |
| 📊 Thống kê | Dashboard: tổng lượt quay, tổng đã phát, prize pool còn lại |

---

## 🏆 Cơ cấu giải thưởng

Prize pool **cố định 50 phần quà**, rút random không hoàn lại:

| Giải | Số lượng | Tổng giá trị |
|------|----------|-------------|
| 👑 **JACKPOT** — 456.789đ | 3 phần | 1.370.367đ |
| 💎 **Kim Cương** — 123.456đ | 5 phần | 617.280đ |
| 🔥 **Phát Lộc** — 86.868đ | 8 phần | 694.944đ |
| 🎯 **Lộc Phát** — 68.686đ | 10 phần | 686.860đ |
| 🍀 **May Mắn** — 22.222đ | 24 phần | 533.328đ |
| **Tổng** | **50 phần** | **~3.9 triệu đồng** |

> Hết prize pool → Admin cần liên hệ reset hoặc bổ sung thêm.

---

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

# Chạy dev server
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

### 3. Tùy chỉnh Email Template (tùy chọn)

1. Vào **Authentication** → **Email Templates**
2. Chỉnh template **Magic Link / OTP**:

```html
<h2>🧧 Lì Xì Lucky Draw - Mã OTP</h2>
<p>Xin chào,</p>
<p>Mã xác thực của bạn là: <strong>{{ .Token }}</strong></p>
<p>Mã có hiệu lực trong 5 phút.</p>
<p>Chúc Mừng Năm Mới 2026! 🎊</p>
```

### 4. Thêm Admin đầu tiên

Sau khi tạo schema, thêm admin đầu tiên bằng SQL:

```sql
INSERT INTO public.employees (email, full_name, department, role)
VALUES ('admin@vnpay.vn', 'Admin User', 'IT', 'admin');
```

---

## 🏗 Database Schema

### `employees`
- `id` (uuid PK), `auth_user_id` (FK → auth.users), `email` (unique), `full_name`, `department`, `employee_code`, `role` (admin/staff), `last_login_at`, `created_at`

### `lucky_draw_results`
- `id` (bigint PK), `user_id` (FK), `email`, `amount`, `phone_number`, `draw_date` (unique per user), `created_at`

### `prize_pool`
- `id` (bigint PK), `amount`, `total_qty`, `remaining_qty`

### `audit_logs`
- `id` (bigint PK), `actor_user_id`, `action`, `payload_json`, `created_at`

**RLS**: Tất cả bảng đều bật Row Level Security. Staff chỉ đọc/ghi data của mình, Admin có full access qua các hàm `SECURITY DEFINER`.

### Stored Functions (RPC)
| Function | Mô tả |
|----------|--------|
| `spin_lucky_draw()` | Thực hiện quay, rút từ prize pool, lưu kết quả |
| `get_my_today_result()` | Lấy kết quả quay hôm nay của user hiện tại |
| `get_my_history(days_back)` | Lịch sử quay của user |
| `save_my_phone(phone)` | Lưu SĐT VNPAY để nhận lì xì |
| `admin_list_employees()` | Danh sách nhân viên (admin only) |
| `admin_get_spin_stats()` | Thống kê quay theo từng nhân viên |
| `admin_get_history(target_email)` | Lịch sử quay của nhân viên bất kỳ |
| `admin_reset_spin(target_email, target_date?)` | Reset lượt quay |
| `admin_update_role(target_id, new_role)` | Đổi quyền nhân viên |
| `admin_delete_user(target_id)` | Xóa hoàn toàn user |

---

## 📁 Cấu trúc dự án

```
src/
├── components/
│   └── AppLayout.jsx       # Layout chính (header + tabs điều hướng)
├── context/
│   └── AuthContext.jsx     # Quản lý auth session + thông tin employee
├── lib/
│   ├── supabase.js         # Supabase client
│   └── utils.js            # Utilities (formatCurrency, date, validation, PRIZE_LIST)
├── pages/
│   ├── LoginPage.jsx       # Đăng nhập OTP
│   ├── LuckyDrawPage.jsx   # Màn hình quay thưởng + nhập SĐT
│   ├── HistoryPage.jsx     # Lịch sử cá nhân + thống kê
│   └── AdminPage.jsx       # Quản lý nhân viên (Admin only)
├── App.jsx                 # Root component + routing
├── main.jsx                # Entry point
└── index.css               # Tailwind + theme CSS (màu Tết)
```

---

## 🌐 Deploy

### Vercel (khuyến nghị)

```bash
npm install -g vercel
vercel
```

Thêm environment variables trong Vercel Dashboard.

### Netlify

```bash
npm run build
# Drag & drop thư mục dist/ lên Netlify
# Thêm redirect: /* → /index.html (status 200) cho SPA routing
```

### Firebase Hosting

```bash
npm run build
npm install -g firebase-tools
firebase init hosting   # public: dist, SPA: Yes
firebase deploy
```

---

## 🔒 Bảo mật

- ✅ Email domain enforce (`@vnpay.vn`) — client + server validation
- ✅ Row Level Security (RLS) trên tất cả bảng
- ✅ Spin function chạy server-side `SECURITY DEFINER` (chống gian lận client)
- ✅ Prize pool tracking server-side — không thể rút quá số lượng
- ✅ Không expose service role key
- ✅ UNIQUE constraint ngăn quay trùng (1 lần/người toàn chương trình)
- ✅ Số điện thoại validate regex trước khi lưu

---

## 🛠 Tech Stack

| Thành phần | Công nghệ |
|-----------|-----------|
| Framework | React 19 |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| Routing | React Router DOM 7 |
| Backend / Auth / DB | Supabase |
| Excel import/export | SheetJS (xlsx) |
