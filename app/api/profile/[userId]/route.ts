import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Mark as dynamic route
export const dynamic = 'force-dynamic'

// Schema untuk update user/profile (all in User table now)
const updateProfileSchema = z.object({
  name: z.string().optional(),
  nim: z.string().optional(),
  angkatan: z.number().optional(),
  prodi: z.string().optional(),
  avatarUrl: z.string().optional(),
  jenisKelamin: z.string().optional(),
  semesterAwal: z.string().optional(),
})

// GET - Get profile by userId
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // Get user data (all fields now in User table)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return profile data (all from User table now)
    const profile = {
      userId: user.id,
      nim: user.nim,
      nip: user.nip,
      angkatan: user.angkatan,
      prodi: user.prodi,
      avatarUrl: user.avatarUrl,
      jenisKelamin: user.jenisKelamin,
      semesterAwal: user.semesterAwal,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data profil' },
      { status: 500 }
    )
  }
}

// PATCH - Update profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const body = await request.json()
    console.log('PATCH /api/profile/[userId] - Received data:', body)
    
    const data = updateProfileSchema.parse(body)

    // Prepare update data for users table (all fields now in User)
    const userUpdateData: any = {}
    if (data.name !== undefined) userUpdateData.name = data.name
    if (data.nim !== undefined) userUpdateData.nim = data.nim
    if (data.angkatan !== undefined) userUpdateData.angkatan = data.angkatan
    if (data.prodi !== undefined) userUpdateData.prodi = data.prodi
    if (data.jenisKelamin !== undefined) userUpdateData.jenisKelamin = data.jenisKelamin
    if (data.semesterAwal !== undefined) userUpdateData.semesterAwal = data.semesterAwal
    if (data.avatarUrl !== undefined) {
      userUpdateData.avatarUrl = data.avatarUrl
      userUpdateData.image = data.avatarUrl // Sync to image field
    }
    
    // Update user data (all in one table now)
    console.log('Updating user with:', userUpdateData)
    const user = await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    })

    // Return profile data (all from User table)
    const profile = {
      userId: user.id,
      nim: user.nim,
      nip: user.nip,
      angkatan: user.angkatan,
      prodi: user.prodi,
      avatarUrl: user.avatarUrl,
      jenisKelamin: user.jenisKelamin,
      semesterAwal: user.semesterAwal,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        googleId: user.googleId,
      },
    }

    console.log('Profile updated successfully for user:', userId)
    return NextResponse.json({ 
      profile,
      message: 'Profile berhasil diperbarui'
    })
  } catch (error) {
    console.error('Update profile error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupdate profil' },
      { status: 500 }
    )
  }
}
