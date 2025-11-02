import { NextRequest, NextResponse } from 'next/server'
import { sendTestEmail } from '@/lib/email-service'

// Mark as dynamic route
export const dynamic = 'force-dynamic'

/**
 * POST - Send test email
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email diperlukan' },
        { status: 400 }
      )
    }

    // Send test email
    const result = await sendTestEmail(email)

    if (!result.success) {
      return NextResponse.json(
        { error: `Gagal mengirim test email: ${result.error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test email berhasil dikirim',
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
