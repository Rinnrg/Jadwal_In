# Email/Password Authentication

## Overview
Sistem autentikasi email/password telah diimplementasikan dengan fitur keamanan menggunakan bcrypt untuk hashing password.

## API Endpoints

### 1. Login - POST `/api/auth/login`
Login dengan email dan password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "mahasiswa",
    "image": "https://..."
  }
}
```

**Response (Error):**
```json
{
  "error": "Password salah"
}
```

**Features:**
- ✅ Session cookie otomatis di-set (30 hari)
- ✅ Support bcrypt hashed passwords
- ✅ Backward compatible dengan plain text passwords
- ✅ Special handling untuk super_admin (hardcoded password)
- ✅ Database retry logic untuk connection stability

---

### 2. Register - POST `/api/auth/register`
Membuat user baru (untuk admin).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "mahasiswa" // optional: mahasiswa, dosen, kaprodi, super_admin
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User berhasil dibuat",
  "user": {
    "id": "user-id",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "mahasiswa",
    "image": null
  }
}
```

**Response (Error):**
```json
{
  "error": "Email sudah terdaftar"
}
```

**Features:**
- ✅ Password otomatis di-hash dengan bcrypt
- ✅ Email validation
- ✅ Password minimal 6 karakter
- ✅ Check duplicate email

---

## Login Flow

### Email/Password Login:
1. User input email & password di form login
2. Submit form → POST ke `/api/auth/login`
3. API verify credentials:
   - Find user by email
   - Verify password (bcrypt atau plain text)
4. Jika valid:
   - Create session token
   - Save session ke database
   - Set `session_token` cookie
   - Return user data
5. Frontend:
   - Save user ke Zustand store
   - Redirect ke dashboard

### Google OAuth Login:
1. User klik "Lanjutkan dengan Google"
2. Redirect ke Google OAuth
3. Callback ke `/api/auth/google/callback`
4. Create/update user & session
5. Set cookie & redirect ke dashboard

---

## Security Features

### Password Hashing
- Menggunakan bcrypt dengan salt rounds = 10
- Backward compatible dengan password lama (plain text)
- Auto-detect hash format ($2a$, $2b$, $2y$)

### Session Management
- Session token: 32 bytes random hex
- Stored in database (Session table)
- Cookie: HttpOnly, Secure (production), SameSite=Lax
- Expires: 30 days

### Protected Routes
- Middleware check cookies (`session_token` atau `jadwalin-auth`)
- Protected component fetch user data from session
- Redirect ke `/login` jika tidak authenticated

---

## Usage Examples

### Login with Email/Password
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})

const data = await response.json()
if (data.success) {
  // Login berhasil, session cookie sudah di-set
  setSession(data.user)
  router.push('/dashboard')
}
```

### Create New User (Admin)
```typescript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'securepass123',
    name: 'New User',
    role: 'mahasiswa'
  })
})

const data = await response.json()
if (data.success) {
  console.log('User created:', data.user)
}
```

---

## Utilities (`lib/auth.ts`)

### Hash Password
```typescript
import { hashPassword } from '@/lib/auth'

const hashed = await hashPassword('mypassword')
// Returns: $2a$10$...
```

### Verify Password
```typescript
import { verifyPassword } from '@/lib/auth'

const isValid = await verifyPassword('mypassword', hashedPassword)
// Returns: true/false
```

### Generate Random Password
```typescript
import { generatePassword } from '@/lib/auth'

const randomPass = generatePassword(12)
// Returns: random 12-char password
```

---

## Migration Notes

### Existing Users
- Users dengan plain text passwords tetap bisa login
- API otomatis detect format password
- Recommended: Migrate semua passwords ke bcrypt

### Super Admin
- Hardcoded password: `gacorkang`
- Tidak perlu hash, checked as plain text
- Role: `super_admin`

---

## TODO / Future Improvements

- [ ] Password reset flow (forgot password)
- [ ] Email verification
- [ ] 2FA (Two-Factor Authentication)
- [ ] Password strength requirements
- [ ] Rate limiting untuk login attempts
- [ ] Audit log untuk login activity
- [ ] Batch migrate existing passwords to bcrypt

---

## Testing

### Test Login
1. Buka halaman login
2. Input email & password
3. Klik "Masuk"
4. Verify redirect ke dashboard
5. Check cookie `session_token` di browser DevTools

### Test Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User",
    "role": "mahasiswa"
  }'
```
