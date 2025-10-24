import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { z } from 'zod'

// Mark as dynamic route
export const dynamic = 'force-dynamic'

// Schema untuk update profile
const updateProfileSchema = z.object({
  name: z.string().optional(),
  nim: z.string().optional(),
  angkatan: z.number().optional(),
  kelas: z.string().optional(),
  prodi: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().optional(),
  avatarUrl: z.string().optional(),
})

// GET - Get profile by userId
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
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

    // First, check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      console.error('User not found:', userId)
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update user's name and image if provided
    const userUpdateData: any = {}
    if (data.name !== undefined) userUpdateData.name = data.name
    if (data.avatarUrl !== undefined) userUpdateData.image = data.avatarUrl
    
    if (Object.keys(userUpdateData).length > 0) {
      console.log('Updating user with:', userUpdateData)
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      })
    }

    // Check if profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    })

    let profile

    if (!existingProfile) {
      // Create profile if it doesn't exist
      console.log('Creating new profile for user:', userId)
      profile = await prisma.profile.create({
        data: {
          userId,
          angkatan: data.angkatan || new Date().getFullYear(),
          kelas: data.kelas || 'A',
          ...(data.nim !== undefined && { nim: data.nim }),
          ...(data.prodi !== undefined && { prodi: data.prodi }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.website !== undefined && { website: data.website }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
              googleId: true,
            },
          },
        },
      })
    } else {
      // Update existing profile
      console.log('Updating existing profile for user:', userId)
      profile = await prisma.profile.update({
        where: { userId },
        data: {
          ...(data.nim !== undefined && { nim: data.nim }),
          ...(data.angkatan !== undefined && { angkatan: data.angkatan }),
          ...(data.kelas !== undefined && { kelas: data.kelas }),
          ...(data.prodi !== undefined && { prodi: data.prodi }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.website !== undefined && { website: data.website }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
              googleId: true,
            },
          },
        },
      })
    }

    console.log('Profile updated successfully:', profile.id)
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
