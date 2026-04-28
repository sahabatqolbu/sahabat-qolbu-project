# Codebase Review: Sahabat Qolbu Project

## 1. Arsitektur & Struktur Kode
- **Modularitas**: Kode terbagi dengan baik antara `backend`, `frontend`, dan `dashboard`. Penggunaan Next.js 16 (Dashboard/Frontend) dan Express 5 (Backend) menunjukkan penggunaan teknologi terbaru.
- **Database (Drizzle ORM)**: Definisi schema sangat detail dan mencakup hampir semua aspek bisnis travel Umrah/Haji. Penggunaan `mysqlTable` dan index yang tepat dalam `schema.js` sangat baik untuk performa.
- **Security**:
    - Penggunaan `helmet` dan `cors` di backend sudah tepat.
    - Implementasi OTP dan JWT untuk autentikasi multi-role menunjukkan standar keamanan yang baik.
    - Input validation menggunakan `Zod` (berdasarkan package.json) sangat direkomendasikan dan sudah terpasang.

## 2. Poin Plus (Kelebihan)
- **Tech Stack Modern**: Tailwind 4, React 19, dan Next.js 16. Ini memastikan aplikasi akan relevan dalam waktu lama.
- **Scale-Ready**: Perancangan schema database yang sangat komprehensif (master data, package detail, transaction tracking).

## 3. Saran Perbaikan (Optimasi)
- **Upload Storage**: Saat ini menggunakan `public/uploads` (local). Untuk scalability, pertimbangkan integrasi S3-compatible storage (seperti DigitalOcean Spaces atau AWS S3) agar storage tidak membebani server web.
- **Next.js Build Memory**: Next.js 16 cukup "haus" RAM saat build. Jika RAM server terbatas, proses build sebaiknya dilakukan di CI/CD (GitHub Actions) dan hanya hasil build-nya yang dideploy ke server.
- **Error Logging**: Pastikan `logger` di backend mengekspor log ke file atau service external (seperti Sentry) agar mudah di-debug di production.

---

# Minimum Server Requirements

Karena project ini menjalankan **3 aplikasi aktif** (2 Next.js & 1 Node.js API), berikut kebutuhannya:

## 1. Hosting/Server (Minimum)
- **CPU**: Minimal 2 Core (Rekomendasi 4 Core jika proses build dilakukan di server).
- **RAM**: Minimal 4GB RAM.
- **Storage**: 40GB SSD/NVMe (Tergantung banyaknya upload foto/dokumen jamaah).
- **OS**: Linux (Ubuntu 22.04 LTS atau 24.04 LTS sangat disarankan).

## 2. Software Stack
- **Node.js**: v20.x atau v22.x (LTS).
- **Database**: MySQL 8.0+.
- **Process Manager**: PM2 (Wajib untuk menjaga aplikasi tetap running di background).
- **Reverse Proxy**: Nginx (Untuk SSL/HTTPS dan pembagian domain/subdomain).

## 3. Rekomendasi Deployment
- **API (Backend)**: subdomain (misal: `api.sahabatqolbu.com`)
- **Dashboard**: subdomain (misal: `admin.sahabatqolbu.com`)
- **Frontend**: main domain (misal: `sahabatqolbu.com`)

> [!IMPORTANT]
> Jika menggunakan **Shared Hosting**, pastikan hosting tersebut mendukung: Node.js Selector, SSH Access, dan memiliki RAM minimal 2GB (ini sangat mepet). Penggunaan VPS (seperti DigitalOcean, Linode, atau Vultr) jauh lebih direkomendasikan untuk stabilitas.
