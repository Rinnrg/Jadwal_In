// app/api/profile/fetch-nip/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cariNIPDosen } from '@/lib/unesa-scraper'

export const dynamic = 'force-dynamic'

/**
 * API endpoint untuk mengambil NIP dosen dari cv.unesa.ac.id
 * dan update ke database
 * 
 * POST /api/profile/fetch-nip
 * Body: { userId: string, namaLengkap?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, namaLengkap } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is dosen
    if (user.role !== 'dosen') {
      return NextResponse.json(
        { error: 'User is not a dosen' },
        { status: 403 }
      )
    }

    // Check if NIP already exists
    if (user.nip) {
      return NextResponse.json({
        success: true,
        message: 'NIP already exists',
        nip: user.nip,
        source: 'database',
      })
    }

    // Use provided name or user's name from database
    const searchName = namaLengkap || user.name
    
    console.log(`🔍 Fetching NIP for: ${searchName}`)

    // Fetch NIP from cv.unesa.ac.id
    const dosenInfo = await cariNIPDosen(searchName)

    if (!dosenInfo || !dosenInfo.nip) {
      return NextResponse.json({
        success: false,
        message: 'NIP not found on cv.unesa.ac.id',
        searchedName: searchName,
      }, { status: 404 })
    }

    // Update user with NIP
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        nip: dosenInfo.nip,
      },
    })

    console.log(`✅ NIP updated for user ${userId}: ${dosenInfo.nip}`)

    return NextResponse.json({
      success: true,
      message: 'NIP successfully fetched and updated',
      nip: dosenInfo.nip,
      dosenInfo: {
        nama: dosenInfo.nama,
        nidn: dosenInfo.nidn,
        email: dosenInfo.email,
      },
      source: 'cv.unesa.ac.id',
    })

  } catch (error: any) {
    console.error('❌ Error fetching NIP:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch NIP',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint untuk check NIP status
 * GET /api/profile/fetch-nip?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      nim: user.nim || null,
      nip: user.nip || null,
      angkatan: user.angkatan || null,
      prodi: user.prodi || null,
      hasNIP: !!user.nip,
      hasNIM: !!user.nim,
    })

  } catch (error: any) {
    console.error('❌ Error checking NIP:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check NIP',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
