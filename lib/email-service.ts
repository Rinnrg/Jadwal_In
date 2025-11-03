/**
 * Email Service untuk mengirim email reminder dengan ICS calendar attachment
 * 
 * NOTE: Untuk development, konfigurasi ini menggunakan nodemailer dengan Gmail.
 * Untuk production, Anda bisa menggunakan service seperti SendGrid, AWS SES, dll.
 */

import nodemailer from 'nodemailer'

// Email configuration
const EMAIL_CONFIG = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Set di .env.local
    pass: process.env.EMAIL_PASSWORD || 'your-app-password', // Google App Password
  },
}

/**
 * Generate ICS calendar file content
 */
function generateICS(reminder: {
  title: string
  dueUTC: number
  description?: string
}): string {
  const startDate = new Date(reminder.dueUTC)
  const endDate = new Date(reminder.dueUTC + 60 * 60 * 1000) // 1 hour later

  // Format date to ICS format: YYYYMMDDTHHMMSSZ
  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Jadwal.In//Reminder//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${Date.now()}@jadwalin.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${reminder.title}
DESCRIPTION:${reminder.description || 'Pengingat dari Jadwal.In'}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT30M
DESCRIPTION:Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`

  return icsContent
}

/**
 * Send email reminder with ICS attachment
 */
export async function sendReminderEmail({
  to,
  reminder,
  userName,
}: {
  to: string
  reminder: {
    id: string
    title: string
    dueUTC: number
    relatedSubjectName?: string
  }
  userName: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport(EMAIL_CONFIG)

    // Generate ICS content
    const icsContent = generateICS({
      title: reminder.title,
      dueUTC: reminder.dueUTC,
      description: reminder.relatedSubjectName 
        ? `Pengingat untuk: ${reminder.relatedSubjectName}` 
        : 'Pengingat dari Jadwal.In',
    })

    // Format date untuk email body
    const dueDate = new Date(reminder.dueUTC)
    const formattedDate = dueDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    // Email HTML body
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .reminder-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .reminder-title { font-size: 20px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
    .reminder-date { font-size: 16px; color: #666; margin-bottom: 5px; }
    .reminder-subject { font-size: 14px; color: #888; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
    .icon { font-size: 48px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">📅</div>
      <h1>Pengingat dari Jadwal.In</h1>
    </div>
    <div class="content">
      <p>Halo <strong>${userName}</strong>,</p>
      <p>Anda memiliki pengingat yang akan datang:</p>
      
      <div class="reminder-box">
        <div class="reminder-title">⏰ ${reminder.title}</div>
        <div class="reminder-date">📆 ${formattedDate}</div>
        ${reminder.relatedSubjectName ? `<div class="reminder-subject">📚 ${reminder.relatedSubjectName}</div>` : ''}
      </div>
      
      <p>Pengingat ini telah ditambahkan ke kalender Anda sebagai file ICS terlampir. Anda dapat membukanya dengan aplikasi kalender favorit Anda (Google Calendar, Outlook, Apple Calendar, dll.)</p>
      
      <p>Jangan lupa untuk mempersiapkan diri!</p>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reminders" class="button">Lihat Semua Pengingat</a>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
        Email ini dikirim secara otomatis karena Anda mengaktifkan fitur "Kirim email" pada pengingat Anda.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Jadwal.In - Sistem Manajemen Jadwal Akademik</p>
      <p>Jika Anda memiliki pertanyaan, silakan hubungi administrator.</p>
    </div>
  </div>
</body>
</html>
    `

    // Send email
    const info = await transporter.sendMail({
      from: `"Jadwal.In" <${EMAIL_CONFIG.auth.user}>`,
      to,
      subject: `⏰ Pengingat: ${reminder.title}`,
      html: htmlBody,
      attachments: [
        {
          filename: 'reminder.ics',
          content: icsContent,
          contentType: 'text/calendar',
        },
      ],
    })

    console.log('✅ Email sent:', info.messageId)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send test email to verify configuration
 */
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport(EMAIL_CONFIG)

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; text-align: center; }
    .content { background: #ffffff; padding: 20px; border: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Test Email Berhasil!</h1>
    </div>
    <div class="content">
      <p>Konfigurasi email Jadwal.In berfungsi dengan baik.</p>
      <p>Anda akan menerima email pengingat saat reminder aktif dengan opsi "Kirim email" diaktifkan.</p>
    </div>
  </div>
</body>
</html>
    `

    await transporter.sendMail({
      from: `"Jadwal.In" <${EMAIL_CONFIG.auth.user}>`,
      to,
      subject: '✅ Test Email - Jadwal.In',
      html: htmlBody,
    })

    return { success: true }
  } catch (error) {
    console.error('❌ Error sending test email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
