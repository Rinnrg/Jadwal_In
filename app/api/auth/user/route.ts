import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark as dynamic to avoid static generation error
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params or headers
    const userId = request.nextUrl.searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
        prodi: user.prodi,
        nim: user.nim,
        nip: user.nip,
        angkatan: user.angkatan,
        fakultas: user.fakultas,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        website: user.website,
        jenisKelamin: user.jenisKelamin,
        semesterAwal: user.semesterAwal,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data user' },
      { status: 500 }
    )
  }
}
