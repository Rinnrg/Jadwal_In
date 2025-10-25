# Layout Components

## FloatingNotifications

Komponen untuk menampilkan notifikasi floating toast ketika ada update baru.

### Features:
- 🔔 Auto-detect badge changes
- 📱 Mobile responsive
- 🎨 Dark mode support
- 🚀 Action buttons untuk quick navigation
- ⏱️ Auto-dismiss setelah 6 detik
- 👆 Manual close dengan button X

### Notification Types:

#### 1. KRS (Mata Kuliah Baru)
```
📚 Mata Kuliah Baru Tersedia
3 mata kuliah baru telah ditambahkan ke KRS
[Lihat KRS]
```

#### 2. Asynchronous (Materi/Tugas Baru)
```
📝 Konten Pembelajaran Baru
5 materi/tugas baru telah ditambahkan
[Buka Asynchronous]
```

#### 3. Jadwal (Jadwal Diperbarui)
```
📅 Jadwal Disinkronisasi
Jadwal kuliah telah diperbarui
[Lihat Jadwal]
```

#### 4. KHS (Nilai Diupdate)
```
🎓 Nilai Sudah Diupdate
4 nilai baru tersedia di KHS
[Cek Nilai]
```

#### 5. Reminder (Pengingat)
```
⏰ Pengingat Akan Datang
Ada 2 jadwal dalam 30 menit ke depan
[Lihat Pengingat]
```

### Usage:

Component ini sudah otomatis di-render di `app/(authenticated)/layout.tsx`:

```tsx
import { FloatingNotifications } from "@/components/layout/FloatingNotifications"
import { Toaster } from "sonner"

<FloatingNotifications />
<Toaster />
```

### Testing:

Di browser console (F12):

```javascript
const userId = JSON.parse(localStorage.getItem('jadwalin:session:v1'))?.state?.session?.id

// Test all notifications
notificationTest.simulateAll(userId)

// Test individual
notificationTest.simulateKRS(userId, 3)
notificationTest.simulateAsync(userId, 5)
notificationTest.simulateSchedule(userId, 2)
notificationTest.simulateKHS(userId, 4)
notificationTest.simulateReminder(userId, 1)

// Clear all
notificationTest.clearAll(userId)

// Show state
notificationTest.showState(userId)
```

## NotificationManager

Background service untuk tracking dan update notification badges.

### Auto-Check Intervals:
- Reminders: Every 1 minute
- KRS, KHS, Asynchronous, Jadwal: Every 5 minutes

### Usage:

```tsx
import { NotificationManager } from "@/components/layout/NotificationManager"

<NotificationManager />
```

## Integration

Kedua komponen sudah terintegrasi di authenticated layout:

```tsx
// app/(authenticated)/layout.tsx
<HydrationGuard>
  <Protected>
    <NotificationManager />      {/* Background checker */}
    <FloatingNotifications />    {/* Toast display */}
    <Toaster />                  {/* Toast container */}
    {/* ... rest of layout */}
  </Protected>
</HydrationGuard>
```

## Customization

### Change duration:
```tsx
// FloatingNotifications.tsx
toast(notification.title, {
  duration: 6000, // Change this (milliseconds)
  ...
})
```

### Change position:
```tsx
position: "top-right", // top-left, top-center, bottom-left, etc
```

### Change check intervals:
```tsx
// useNotificationManager.ts
const reminderInterval = setInterval(checkReminders, 60 * 1000) // 1 min
const generalInterval = setInterval(..., 5 * 60 * 1000) // 5 min
```
