import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Find user (NIM and angkatan are in User model, not Profile)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if NIM needs to be updated (null or too short)
    const needsUpdate = !user.nim || user.nim.length < 8

    if (!needsUpdate) {
      return NextResponse.json({
        success: true,
        updated: false,
        nim: user.nim,
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

    // Try to fetch additional data from pd-unesa.unesa.ac.id
    let mahasiswaInfo = null
    try {
      const { cariDataMahasiswa } = await import('@/lib/unesa-scraper')
      mahasiswaInfo = await cariDataMahasiswa(extractedNim)
      console.log('Fetched mahasiswa info from pd-unesa:', mahasiswaInfo)
    } catch (scrapeError) {
      console.warn('Failed to fetch data from pd-unesa:', scrapeError)
      // Continue without scraping data
    }

    // Update user with extracted NIM, angkatan, and additional data if available (all in User table now)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nim: extractedNim,
        angkatan: extractAngkatan(extractedNim),
        ...(mahasiswaInfo?.prodi && { prodi: mahasiswaInfo.prodi }),
        ...(mahasiswaInfo?.fakultas && { fakultas: mahasiswaInfo.fakultas }),
        ...(mahasiswaInfo?.jenisKelamin && { jenisKelamin: mahasiswaInfo.jenisKelamin }),
        ...(mahasiswaInfo?.semesterAwal && { semesterAwal: mahasiswaInfo.semesterAwal }),
      }
    })

    return NextResponse.json({
      success: true,
      updated: true,
      nim: updatedUser.nim,
      angkatan: updatedUser.angkatan,
      jenisKelamin: updatedUser.jenisKelamin,
      semesterAwal: updatedUser.semesterAwal,
      prodi: updatedUser.prodi,
      fakultas: updatedUser.fakultas,
      message: mahasiswaInfo 
        ? 'NIM updated successfully with data from pd-unesa' 
        : 'NIM updated successfully'
    })

  } catch (error) {
    console.error('Error syncing NIM:', error)
    return NextResponse.json(
      { error: 'Failed to sync NIM' },
      { status: 500 }
    )
  }
}
