# JadwalIn — Sistem Manajemen Jadwal Akademik (Next.js + Prisma + Supabase)

[![Status](https://img.shields.io/badge/Status-Active-brightgreen)](#)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)](#)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **Jadwal Gak Pernah Telat, Reminder Selalu Ingat.**  
> Jadwal, KRS, kehadiran, hingga nilai — semua aman dalam satu platform terintegrasi.

Aplikasi manajemen jadwal perkuliahan dengan **Next.js + Tailwind CSS**, **Prisma ORM**, dan **PostgreSQL (Supabase)**. Mendukung multi-role (Mahasiswa, Dosen, Kaprodi, Super Admin) dengan alur kerja yang sederhana dan aman.

---

## ✨ Fitur Utama

1. **Manajemen Jadwal & Mata Kuliah** — jadwal pribadi, penawaran mata kuliah, dan saran slot.
2. **KRS / KHS** — ambil/lepaskan mata kuliah, lihat nilai & ekspor.
3. **Kehadiran** — sesi presensi & rekap kehadiran real-time.
4. **Tugas & Materi** — unggah materi, pengumpulan tugas, dan penilaian.
5. **Pengingat (Reminders)** — notifikasi perkuliahan & tenggat dengan **Email + ICS Calendar** 📧
6. **Multi-Role Access** — dashboard dan perizinan sesuai peran.
7. **Responsif & Siap Produksi** — arsitektur modern, cocok untuk Vercel.

> 📧 **[Setup Email Reminder →](docs/EMAIL_SETUP.md)** - Panduan lengkap mengaktifkan fitur email dengan file ICS

---

## 🧱 Tech Stack

| Kategori   | Teknologi                                                                 |
|------------|----------------------------------------------------------------------------|
| Frontend   | Next.js (App Router), React                                               |
| Styling    | Tailwind CSS                                                              |
| ORM        | Prisma                                                                    |
| Database   | PostgreSQL (Supabase)                                                     |
| Deploy     | Vercel                                                                    |

---

## 📋 Prasyarat

- Node.js 18.x atau lebih baru
- pnpm (disarankan) / npm / yarn
- Akun **Supabase** & project aktif (Postgres)

---

## ⚙️ Konfigurasi & Jalankan (Quick Start)

```bash
# 1) Clone & masuk ke folder
git clone <repo-url>
cd jadwalin

# 2) Install
pnpm install

# 3) Buat .env dari template
cp .env.example .env
# lalu isi variabel di bawah

# 4) Generate Prisma Client
pnpm prisma:generate

# 5) Inisialisasi DB (dev)
pnpm prisma:push
# atau buat migration (prod)
# pnpm prisma:migrate

# 6) (Opsional) Seed data awal
pnpm prisma:seed

# 7) Jalanin dev server
pnpm dev
# http://localhost:3000
