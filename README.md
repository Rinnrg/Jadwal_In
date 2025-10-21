# JadwalIn - Aplikasi Manajemen Jadwal Perkuliahan

Aplikasi manajemen jadwal perkuliahan dengan Prisma ORM dan PostgreSQL.

## 📋 Prerequisites

- Node.js 18.x atau lebih tinggi
- PostgreSQL database
- pnpm (package manager)

## 🚀 Setup Database dengan Prisma

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment Variables

Buat file `.env` di root project (sudah ada template `.env.example`):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Ganti dengan kredensial database PostgreSQL Anda:
- `USER`: username PostgreSQL
- `PASSWORD`: password PostgreSQL
- `HOST`: host database (default: localhost)
- `PORT`: port database (default: 5432)
- `DATABASE`: nama database (contoh: jadwalim)

### 3. Generate Prisma Client

```bash
pnpm prisma:generate
```

### 4. Push Schema ke Database

Untuk development (tanpa migration files):
```bash
pnpm prisma:push
```

Atau untuk production (dengan migration files):
```bash
pnpm prisma:migrate
```

### 5. Seed Database dengan Data Awal

```bash
pnpm prisma:seed
```

Data awal yang akan dibuat:
- **Super Admin**: 
  - Email: `gacor@unesa.ac.id`
  - Password: `gacorkang`
- Sample Kaprodi, Dosen, dan Mahasiswa
- Sample mata kuliah dan jadwal

### 6. Setup Row Level Security (RLS) di Supabase

**⚠️ PENTING untuk Supabase Users:**

Jika menggunakan Supabase, tabel akan muncul sebagai "Unrestricted" karena RLS belum aktif. Jalankan SQL berikut di Supabase SQL Editor:

**Untuk Development (Simple - Allow All):**
```sql
-- Copy isi file prisma/rls-simple.sql dan jalankan di Supabase SQL Editor
```

**Untuk Production (Keamanan Lengkap):**
```sql
-- Copy isi file prisma/rls-policies.sql dan jalankan di Supabase SQL Editor
```

Cara menjalankan:
1. Buka Supabase Dashboard
2. Klik **SQL Editor** di sidebar
3. Klik **New Query**
4. Copy-paste isi file `prisma/rls-simple.sql` atau `prisma/rls-policies.sql`
5. Klik **Run** atau tekan `Ctrl+Enter`
6. Refresh Table Editor - tabel sekarang akan menunjukkan "RLS enabled"

### 7. Jalankan Development Server

```bash
pnpm dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📊 Prisma Commands

```bash
# Generate Prisma Client
pnpm prisma:generate

# Push schema ke database (development)
pnpm prisma:push

# Create migration (production)
pnpm prisma:migrate

# Open Prisma Studio (GUI untuk database)
pnpm prisma:studio

# Seed database
pnpm prisma:seed

# Reset database (hapus semua data dan re-seed)
pnpm db:reset
```

## 🗄️ Database Schema

### Models Utama:

- **User**: Data pengguna dengan role (mahasiswa, dosen, kaprodi, super_admin)
- **Profile**: Profil detail pengguna (NIM, angkatan, kelas, dll)
- **Subject**: Mata kuliah
- **CourseOffering**: Penawaran mata kuliah per kelas
- **Assignment**: Tugas/assignment
- **Submission**: Pengumpulan tugas mahasiswa
- **Material**: Materi kuliah
- **AttendanceSession**: Sesi kehadiran
- **AttendanceRecord**: Record kehadiran per mahasiswa
- **KrsItem**: Kartu Rencana Studi
- **Grade**: Nilai mahasiswa
- **ScheduleEvent**: Event jadwal
- **Reminder**: Pengingat

## 🔐 Login & Role

### Format Email:
- **Super Admin**: `gacor@unesa.ac.id`
- **Mahasiswa**: `namaDepan.NIM@mhs.institusi.ac.id`
- **Dosen**: `namaDepan.ID@dsn.institusi.ac.id`
- **Kaprodi**: `namaDepan.ID@kpd.institusi.ac.id`

### Role Permissions:
- **super_admin**: Akses penuh ke semua fitur termasuk role management
- **kaprodi**: Manajemen mata kuliah, entry nilai, kehadiran
- **dosen**: Entry nilai, kehadiran untuk mata kuliah yang diampu
- **mahasiswa**: Akses KRS, KHS, jadwal pribadi

## 🔧 API Routes

### Authentication
- `POST /api/auth/login` - Login user
- `GET /api/auth/user?id={userId}` - Get user data

### User Management (Super Admin only)
- `GET /api/users` - Get all users
- `GET /api/users?id={userId}` - Get specific user
- `GET /api/users?role={role}` - Get users by role
- `POST /api/users` - Create new user
- `PATCH /api/users?id={userId}` - Update user
- `DELETE /api/users?id={userId}` - Delete user

## 🔄 Development Workflow

1. **Ubah Schema**: Edit `prisma/schema.prisma`
2. **Update Database**: Jalankan `pnpm prisma:push` atau `pnpm prisma:migrate`
3. **Generate Client**: Jalankan `pnpm prisma:generate`
4. **Restart Dev Server**: Restart `pnpm dev`

## 📝 Notes

- Prisma Client di-generate ke folder `src/generated/prisma`
- Seed file ada di `prisma/seed.ts`
- Prisma helper ada di `src/lib/prisma.ts`
- Super admin password di-hardcode untuk demo (ganti di production)

## 🐛 Troubleshooting

### Error: "Can't reach database server"
- Pastikan PostgreSQL berjalan
- Cek kredensial di `.env` sudah benar
- Cek database sudah dibuat

### Error: "Environment variable not found: DATABASE_URL"
- Pastikan file `.env` ada di root project
- Copy dari `.env.example` jika belum ada

### Error: "Prisma Client not found"
- Jalankan `pnpm prisma:generate`

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
