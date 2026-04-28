# Kelola Staff - Dokumentasi Fitur

## Overview
Fitur Kelola Staff telah berhasil dibuat dan terintegrasi penuh dengan sistem Sahabat Qolbu. Fitur ini memungkinkan admin untuk mengelola akun staff (karyawan) yang memiliki akses ke sistem.

## 📁 Struktur File

### Backend
```
backend/src/
├── controllers/staffController.js     # Controller CRUD staff
└── routes/api.js                       # API routes (8 endpoints)
```

### Frontend (Dashboard)
```
dashboard/src/
├── services/staffService.ts           # Service API calls
├── app/(dashboard)/admin/staff/
│   ├── page.tsx                       # Halaman daftar staff
│   ├── create/
│   │   └── page.tsx                   # Halaman tambah staff
│   └── [id]/
│       ├── page.tsx                   # Halaman detail staff
│       └── edit/
│           └── page.tsx               # Halaman edit staff
└── lib/menu-config.ts                 # Menu sidebar (updated)
```

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/staff` | Get all staff (paginated) | ADMIN |
| GET | `/api/admin/staff/stats` | Get staff statistics | ADMIN |
| GET | `/api/admin/staff/:id` | Get staff by ID | ADMIN |
| POST | `/api/admin/staff` | Create new staff | ADMIN |
| PUT | `/api/admin/staff/:id` | Update staff | ADMIN |
| PATCH | `/api/admin/staff/:id/toggle` | Toggle active status | ADMIN |
| DELETE | `/api/admin/staff/:id` | Delete staff | ADMIN |
| POST | `/api/admin/staff/:id/reset-password` | Reset password | ADMIN |

## ✨ Fitur Utama

### 1. Daftar Staff (`/admin/staff`)
- ✅ Tabel dengan pagination
- ✅ Search by nama, email, telepon
- ✅ Filter by status (aktif/nonaktif)
- ✅ Sorting by columns
- ✅ Statistics cards (total, aktif, nonaktif, login 30 hari)
- ✅ Quick actions: Edit, Toggle Status, Reset Password, Delete

### 2. Tambah Staff (`/admin/staff/create`)
- ✅ Form dengan validasi Zod
- ✅ Auto-generate secure password (12 chars)
- ✅ Send credentials email automatically
- ✅ Show password in success dialog (one-time only)
- ✅ Copy to clipboard feature

### 3. Edit Staff (`/admin/staff/[id]/edit`)
- ✅ Pre-populated form
- ✅ Update nama, telepon, status
- ✅ Email tidak bisa diubah (disabled)
- ✅ Validation with react-hook-form

### 4. Detail Staff (`/admin/staff/[id]`)
- ✅ Complete staff information
- ✅ Contact info (email, phone)
- ✅ Account status & last login
- ✅ Timestamps (created, updated)
- ✅ Quick actions
- ✅ Reset password with email notification

### 5. Security Features
- ✅ Rate limiting on all endpoints
- ✅ Input validation with Zod
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Secure password generation (crypto)
- ✅ Activity logging
- ✅ Email notifications
- ✅ Self-deletion prevention

## 🎨 UI Components

### Statistics Cards
1. **Total Staff** - Total jumlah staff
2. **Staff Aktif** - Jumlah staff dengan status aktif
3. **Staff Nonaktif** - Jumlah staff dengan status nonaktif
4. **Login 30 Hari** - Jumlah staff yang login dalam 30 hari terakhir

### Table Features
- Responsive design
- Loading states
- Empty states
- Pagination
- Sortable columns
- Row actions (dropdown menu)

### Dialogs
- Delete confirmation
- Reset password confirmation
- View new password (with copy button)
- Success notifications

## 📱 Navigation

Menu "Kelola Staff" telah ditambahkan ke sidebar Admin:
- Icon: Briefcase
- Position: Setelah "Kelola User", sebelum "Paket Umrah"
- Role: ADMIN only

## 🔒 Security Considerations

### Password Management
- Password di-generate otomatis (12 karakter, kombinasi huruf, angka, simbol)
- Menggunakan crypto.randomInt() untuk keamanan
- Password dikirim ke email staff
- Admin bisa reset password kapan saja
- Password baru ditampilkan sekali saja

### Access Control
- Hanya ADMIN yang bisa mengakses
- Tidak bisa menghapus akun sendiri
- Semua actions dilog untuk audit trail

### Validation
- Email harus unique dan valid format
- Nama minimal 2 karakter
- Validasi di frontend (Zod + react-hook-form)
- Validasi di backend (Zod middleware)

## 🚀 Cara Penggunaan

### Menambah Staff Baru
1. Klik menu "Kelola Staff" di sidebar
2. Klik tombol "Tambah Staff"
3. Isi form (Nama, Email, Telepon - opsional)
4. Klik "Buat Staff"
5. Password akan ditampilkan (simpan dengan aman!)
6. Password juga otomatis dikirim ke email staff

### Mengedit Staff
1. Di halaman daftar staff, klik icon "..." pada row staff
2. Pilih "Edit"
3. Ubah data yang diinginkan
4. Klik "Simpan Perubahan"

### Menonaktifkan Staff
1. Di halaman detail atau daftar staff
2. Klik toggle status atau "Nonaktifkan"
3. Konfirmasi aksi
4. Staff tidak bisa login lagi

### Reset Password
1. Di halaman detail atau daftar staff
2. Klik "Reset Password"
3. Konfirmasi aksi
4. Password baru akan ditampilkan (copy ke clipboard)
5. Password juga dikirim ke email staff

### Menghapus Staff
1. Di halaman detail atau daftar staff
2. Klik "Hapus" (button merah)
3. Konfirmasi penghapusan
4. Data staff akan dihapus permanen

## 📊 Database Schema

Staff menggunakan tabel `users` dengan role = 'STAFF':

```sql
users:
- id (PK)
- email (unique)
- password (hashed)
- fullName
- phone
- role = 'STAFF'
- isActive
- isEmailVerified
- lastLogin
- createdAt
- updatedAt
```

## 🔧 Troubleshooting

### Staff tidak menerima email
- Cek konfigurasi SMTP di `.env`
- Cek spam/junk folder email
- Cek logs di server

### Tidak bisa login setelah dibuat
- Pastikan status "Aktif"
- Pastikan password benar (case-sensitive)
- Cek email verification (jika required)

### Error 403 Forbidden
- Pastikan user login sebagai ADMIN
- Cek JWT token valid
- Refresh halaman dan login ulang

## 📋 Todo List Integration

Fitur ini sudah terintegrasi dengan:
- ✅ Authentication system (JWT)
- ✅ Authorization middleware (role-based)
- ✅ Rate limiting
- ✅ Email service
- ✅ Logging system
- ✅ Toast notifications
- ✅ Query caching (React Query)

## 🎯 Next Improvements (Opsional)

1. **Bulk Actions** - Hapus/aktifkan multiple staff sekaligus
2. **Export Data** - Export daftar staff ke Excel/PDF
3. **Staff Permissions** - Role-based permissions (read-only, editor, etc)
4. **Activity Log** - Riwayat aktivitas per staff
5. **Department Management** - Kelompokkan staff by department
6. **Staff Performance** - Track metrics & KPIs

## 📝 Catatan Penting

- Staff yang dihapus **tidak bisa dikembalikan**
- Reset password akan **logout** staff dari semua device
- Email staff **tidak bisa diubah** setelah dibuat
- Setiap aksi di-log untuk keamanan

---

**Fitur sudah siap digunakan! 🎉**
