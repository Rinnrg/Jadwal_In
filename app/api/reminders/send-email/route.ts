import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendReminderEmail } from '@/lib/email-service'

// Mark as dynamic route
export const dynamic = 'force-dynamic'

/**
 * POST - Send reminder email
 * Body: { reminderId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { reminderId } = await request.json()

    if (!reminderId) {
      return NextResponse.json(
        { error: 'Reminder ID diperlukan' },
        { status: 400 }
      )
    }

    // Get reminder with user and subject info
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
      include: {
        pengguna: true,
        matakuliah: true,
      },
    })

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if reminder has sendEmail enabled
    if (!reminder.sendEmail) {
      return NextResponse.json(
        { error: 'Reminder tidak memiliki opsi kirim email' },
        { status: 400 }
      )
    }

    // Check if reminder is active
    if (!reminder.isActive) {
      return NextResponse.json(
        { error: 'Reminder tidak aktif' },
        { status: 400 }
      )
    }

    // Send email
    const result = await sendReminderEmail({
      to: reminder.pengguna.email,
      reminder: {
        id: reminder.id,
        title: reminder.title,
        dueUTC: Number(reminder.dueUTC),
        relatedSubjectName: reminder.matakuliah 
          ? `${reminder.matakuliah.kode} - ${reminder.matakuliah.nama}`
          : undefined,
      },
      userName: reminder.pengguna.name,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: `Gagal mengirim email: ${result.error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email berhasil dikirim',
    })
  } catch (error) {
    console.error('Error sending reminder email:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

/**
 * GET - Check and send emails for upcoming reminders
 * This endpoint should be called by a cron job
 */
export async function GET(request: NextRequest) {
  try {
    const now = Date.now()
    const oneHourFromNow = now + (60 * 60 * 1000) // 1 hour from now

    // Find all active reminders with sendEmail enabled that are due within 1 hour
    const upcomingReminders = await prisma.reminder.findMany({
      where: {
        isActive: true,
        sendEmail: true,
        dueUTC: {
          gte: BigInt(now),
          lte: BigInt(oneHourFromNow),
        },
      },
      include: {
        pengguna: true,
        matakuliah: true,
      },
    })

    console.log(`📧 Found ${upcomingReminders.length} reminders to send emails for`)

    const results = {
      total: upcomingReminders.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Send emails for each reminder
    for (const reminder of upcomingReminders) {
      try {
        const result = await sendReminderEmail({
          to: reminder.pengguna.email,
          reminder: {
            id: reminder.id,
            title: reminder.title,
            dueUTC: Number(reminder.dueUTC),
            relatedSubjectName: reminder.matakuliah
              ? `${reminder.matakuliah.kode} - ${reminder.matakuliah.nama}`
              : undefined,
          },
          userName: reminder.pengguna.name,
        })

        if (result.success) {
          results.sent++
          console.log(`✅ Email sent for reminder: ${reminder.title}`)
        } else {
          results.failed++
          results.errors.push(`${reminder.title}: ${result.error}`)
          console.error(`❌ Failed to send email for reminder: ${reminder.title}`)
        }
      } catch (error) {
        results.failed++
        results.errors.push(`${reminder.title}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.error(`❌ Error sending email for reminder ${reminder.title}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.total} reminders`,
      results,
    })
  } catch (error) {
    console.error('Error in send-email cron job:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
