import { NextRequest, NextResponse } from 'next/server'
import { sendTestEmail } from '@/lib/email-service'

// Mark as dynamic route
export const dynamic = 'force-dynamic'

/**
 * POST - Send test email to verify email configuration
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, fromEmail, accessToken } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email diperlukan' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    console.log(`📧 Sending test email to: ${email}`)
    console.log(`📧 From email: ${fromEmail || email}`)

    // Send test email menggunakan Google Auth email
    const result = await sendTestEmail(email, fromEmail, accessToken)

    if (!result.success) {
      return NextResponse.json(
        { 
          error: `Gagal mengirim email: ${result.error}`,
          details: 'Email dikirim menggunakan akun Google yang sedang login. Pastikan Anda sudah login dengan Google.'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Email test berhasil dikirim dari ${fromEmail || email}! Silakan cek inbox Anda.`,
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { 
        error: 'Terjadi kesalahan server',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
