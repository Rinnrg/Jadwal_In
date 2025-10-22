# 🔍 Browser Console Test Guide

## Cara Test Login dengan Developer Tools

### 1. Buka Website Production
Buka website production Anda di browser

### 2. Buka Developer Tools
Tekan **F12** atau **Ctrl+Shift+I**

### 3. Clear Everything
**Console tab**, ketik command ini:
```javascript
// Clear semua
localStorage.clear()
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
})
console.log("Cleared!")
```

### 4. Refresh Halaman
Tekan **Ctrl+F5** (hard refresh)

### 5. Test Login
1. Isi email & password
2. **JANGAN tutup Developer Tools!**
3. Klik Login
4. **Perhatikan tab Console** - apakah ada error?

### 6. Screenshot Errors
Jika ada error di console:
- Screenshot seluruh error message
- Expand error untuk melihat detail

---

## Yang Perlu Di-Screenshot:

### A. Tab Console (F12)
- Error messages (warna merah)
- Warning messages (warna kuning)
- Network requests yang failed

### B. Tab Network (F12)
1. Buka tab **Network**
2. Test login
3. Cari request **login** atau **auth**
4. Klik request tersebut
5. Screenshot:
   - **Headers** tab
   - **Response** tab (lihat error message)
   - **Preview** tab

### C. Tab Application (F12)
1. Buka tab **Application**
2. Sidebar → **Cookies** → pilih domain Anda
3. Screenshot daftar cookies
4. Sidebar → **Local Storage** → pilih domain Anda
5. Screenshot session data

---

## Error Messages yang Sering Muncul:

### ❌ "Failed to fetch" atau "Network Error"
**Penyebab:** API endpoint tidak bisa diakses
**Solusi:** Cek URL API, pastikan environment variables sudah di-set

### ❌ "401 Unauthorized"
**Penyebab:** Credentials salah atau password tidak match
**Solusi:** Cek email & password, cek data di database

### ❌ "500 Internal Server Error"
**Penyebab:** Database connection error
**Solusi:** Pastikan DATABASE_URL sudah di-set di Vercel

### ❌ "Prisma Client not found"
**Penyebab:** Build error, Prisma client tidak ter-generate
**Solusi:** Redeploy dengan build cache di-clear

---

## Quick Test Commands

Paste di Console untuk test:

```javascript
// 1. Cek apakah cookie ada
console.log("Cookies:", document.cookie)

// 2. Cek localStorage
console.log("LocalStorage:", localStorage.getItem("jadwalin:session:v1"))

// 3. Test API endpoint
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword'
  })
})
.then(r => r.json())
.then(d => console.log("API Response:", d))
.catch(e => console.error("API Error:", e))
```

---

## Yang Perlu Dilaporkan:

Setelah test di atas, tolong berikan info:

1. ✅ Screenshot **Console errors**
2. ✅ Screenshot **Network tab** (request login)
3. ✅ Screenshot **Cookies** di Application tab
4. ✅ Copy-paste **error message** dari console
5. ✅ **Tahapan mana yang gagal:**
   - [ ] Klik login → tidak ada respon
   - [ ] Loading → stuck loading
   - [ ] Login berhasil → tapi redirect ke login lagi
   - [ ] Dashboard muncul → tapi langsung redirect

---

Dengan informasi ini, saya bisa diagnosa masalah yang lebih spesifik! 🔍
