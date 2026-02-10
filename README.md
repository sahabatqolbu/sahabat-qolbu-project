# Sahabat Qolbu Project 🚀

Ekosistem digital untuk travel umroh & haji Sahabat Qolbu.

## 🧩 Struktur Project

sahabat-qolbu-project
│
├── backend # API (Node.js + Express + MySQL)
├── dashboard # Admin dashboard (Next.js / React)
├── frontend # Landing page (Next.js / React)
└── README.md


## ⚙️ Tech Stack

### Backend
- Node.js
- Express.js
- MySQL
- Drizzle ORM
- JWT Auth
- Multer (Upload file)

### Frontend & Dashboard
- React / Next.js
- Tailwind CSS
- Axios

## 🌍 Environment Variables

Buat file `.env` di folder backend:

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sahabatqolbu_db
JWT_SECRET=your_secret_key
NODE_ENV=development


## ▶️ Cara Menjalankan Project

### Backend
cd backend
npm install
npm run dev


## 📡 Endpoint API

- GET /health
- GET /api
- POST /api/auth/login
- GET /api/users
- GET /uploads/...

## 🚀 Deployment Plan

- Backend → Rumahweb (Node.js Hosting)
- Dashboard → Vercel
- Landing Page → Vercel
- Domain:
  - sahabatqolbu.com → landing page
  - dashboard.sahabatqolbu.com → dashboard
  - api.sahabatqolbu.com → backend

## 👨‍💻 Author

Sahabat Qolbu IT Team
