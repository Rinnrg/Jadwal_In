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

    // Extract NIM from email
    const extractedNim = extractNIMFromEmail(email)
    
    // Check if NIM needs to be updated (null or too short)
    const needsNimUpdate = !user.nim || user.nim.length < 8
    
    // Check if other data needs to be updated
    const needsDataUpdate = !user.jenisKelamin || !user.prodi || !user.semesterAwal
    
    // Use existing NIM if available, otherwise extract from email
    const nimToUse = user.nim && user.nim.length >= 8 ? user.nim : extractedNim
    
    if (!nimToUse) {
      return NextResponse.json(
        { error: 'Cannot extract NIM from email' },
        { status: 400 }
      )
    }

    // Always try to fetch additional data using multi-source strategy if data is missing
    let mahasiswaInfo = null
    if (needsDataUpdate || needsNimUpdate) {
      try {
        const { getMahasiswaDataMultiSource } = await import('@/lib/unesa-scraper')
        console.log('🔍 Fetching data using multi-source strategy for NIM:', nimToUse)
        mahasiswaInfo = await getMahasiswaDataMultiSource(nimToUse, user.name)
        console.log('✅ Fetched mahasiswa info from multi-source:', mahasiswaInfo)
        
        if (mahasiswaInfo) {
          console.log('📊 Mahasiswa data details:')
          console.log('  - Jenis Kelamin:', mahasiswaInfo.jenisKelamin)
          console.log('  - Prodi:', mahasiswaInfo.prodi)
          console.log('  - Fakultas:', mahasiswaInfo.fakultas)
          console.log('  - Semester Awal:', mahasiswaInfo.semesterAwal)
          console.log('  - Angkatan:', mahasiswaInfo.angkatan)
        }
      } catch (scrapeError) {
        console.warn('⚠️ Failed to fetch data from pd-unesa:', scrapeError)
        // Continue without scraping data
      }
    } else {
      // Data is complete, no need to fetch
      console.log('✅ All data already complete, skipping pd-unesa fetch')
      return NextResponse.json({
        success: true,
        updated: false,
        nim: user.nim,
        jenisKelamin: user.jenisKelamin,
        prodi: user.prodi,
        semesterAwal: user.semesterAwal,
        angkatan: user.angkatan,
        message: 'Data already complete'
      })
    }

    // Prepare update data
    const updateData: any = {}
    
    // Update NIM if needed
    if (needsNimUpdate && nimToUse) {
      updateData.nim = nimToUse
      updateData.angkatan = extractAngkatan(nimToUse)
      console.log('📝 Updating NIM:', nimToUse, 'Angkatan:', updateData.angkatan)
    }
    
    // Update other fields from scraper if available and needed
    if (mahasiswaInfo) {
      if (mahasiswaInfo.prodi && !user.prodi) {
        updateData.prodi = mahasiswaInfo.prodi
        console.log('📝 Updating Prodi:', mahasiswaInfo.prodi)
      }
      if (mahasiswaInfo.jenisKelamin && !user.jenisKelamin) {
        updateData.jenisKelamin = mahasiswaInfo.jenisKelamin
        console.log('📝 Updating Jenis Kelamin:', mahasiswaInfo.jenisKelamin)
      }
      if (mahasiswaInfo.semesterAwal && !user.semesterAwal) {
        updateData.semesterAwal = mahasiswaInfo.semesterAwal
        console.log('📝 Updating Semester Awal:', mahasiswaInfo.semesterAwal)
      }
      if (mahasiswaInfo.angkatan && !user.angkatan) {
        // Convert angkatan from string to number
        const angkatanNum = typeof mahasiswaInfo.angkatan === 'string' 
          ? parseInt(mahasiswaInfo.angkatan) 
          : mahasiswaInfo.angkatan
        updateData.angkatan = angkatanNum
        console.log('📝 Updating Angkatan from mahasiswa info:', angkatanNum)
      }
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      console.log('⚠️ No new data to update')
      return NextResponse.json({
        success: true,
        updated: false,
        nim: user.nim,
        jenisKelamin: user.jenisKelamin,
        prodi: user.prodi,
        semesterAwal: user.semesterAwal,
        angkatan: user.angkatan,
        message: 'No data to update'
      })
    }

    console.log('💾 Updating user with data:', updateData)

    // Update user with new data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      updated: true,
      nim: updatedUser.nim,
      angkatan: updatedUser.angkatan,
      jenisKelamin: updatedUser.jenisKelamin,
      semesterAwal: updatedUser.semesterAwal,
      prodi: updatedUser.prodi,
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
