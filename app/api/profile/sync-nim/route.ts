import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// Helper function to extract and reconstruct full NIM from email
function extractNIMFromEmail(email: string): string | null {
  const emailParts = email.split('@')[0]
  const parts = emailParts.split('.')
  
  if (parts.length >= 2) {
    const nimPart = parts[1]
    if (nimPart && /^\d{5,}$/.test(nimPart)) {
      const tahun = nimPart.substring(0, 2)
      const nomorUrut = nimPart.substring(2)
      const kodeFakultas = "05"
      const kodeProdi = "0974"
      return `${tahun}${kodeFakultas}${kodeProdi}${nomorUrut}`
    }
  }
  
  if (/^\d{8,}$/.test(emailParts)) {
    return emailParts
  }
  
  return null
}

// Helper function to extract angkatan from NIM
function extractAngkatan(nim: string | null): number {
  if (!nim) return new Date().getFullYear()
  
  const firstTwoDigits = nim.substring(0, 2)
  const firstFourDigits = nim.substring(0, 4)
  
  if (nim.length >= 4 && firstFourDigits >= '2000' && firstFourDigits <= '2099') {
    return parseInt(firstFourDigits)
  }
  
  if (nim.length >= 2) {
    const year = parseInt(firstTwoDigits)
    if (year >= 0 && year <= 99) {
      return 2000 + year
    }
  }
  
  return new Date().getFullYear()
}

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      )
    }

    // Find user profile
    const profile = await prisma.profile.findUnique({
      where: { userId }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if NIM needs to be updated (null or too short)
    const needsUpdate = !profile.nim || profile.nim.length < 8

    if (!needsUpdate) {
      return NextResponse.json({
        success: true,
        updated: false,
        nim: profile.nim,
        message: 'NIM already valid'
      })
    }

    // Extract NIM from email
    const extractedNim = extractNIMFromEmail(email)

    if (!extractedNim) {
      return NextResponse.json(
        { error: 'Cannot extract NIM from email' },
        { status: 400 }
      )
    }

    // Update profile with extracted NIM
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        nim: extractedNim,
        angkatan: extractAngkatan(extractedNim)
      }
    })

    return NextResponse.json({
      success: true,
      updated: true,
      nim: updatedProfile.nim,
      angkatan: updatedProfile.angkatan,
      message: 'NIM updated successfully'
    })

  } catch (error) {
    console.error('Error syncing NIM:', error)
    return NextResponse.json(
      { error: 'Failed to sync NIM' },
      { status: 500 }
    )
  }
}
