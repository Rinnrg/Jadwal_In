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

    // Get user data (now includes nim, nip, angkatan, prodi, avatarUrl)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profil: true, // Optional extra info (kelas, bio, website)
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return combined profile data for backward compatibility
    const profile = {
      userId: user.id,
      nim: user.nim,
      nip: user.nip,
      angkatan: user.angkatan,
      prodi: user.prodi,
      avatarUrl: user.avatarUrl,
      kelas: user.profil?.kelas || null,
      bio: user.profil?.bio || null,
      website: user.profil?.website || null,
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

    // Prepare update data for users table (nim, nip, angkatan, prodi, avatarUrl)
    const userUpdateData: any = {}
    if (data.name !== undefined) userUpdateData.name = data.name
    if (data.nim !== undefined) userUpdateData.nim = data.nim
    if (data.angkatan !== undefined) userUpdateData.angkatan = data.angkatan
    if (data.prodi !== undefined) userUpdateData.prodi = data.prodi
    if (data.avatarUrl !== undefined) {
      userUpdateData.avatarUrl = data.avatarUrl
      userUpdateData.image = data.avatarUrl // Sync to image field
    }
    
    // Update user data
    console.log('Updating user with:', userUpdateData)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
      include: {
        profil: true,
      },
    })

    // Prepare update data for profiles table (kelas, bio, website only)
    const profileUpdateData: any = {}
    if (data.kelas !== undefined) profileUpdateData.kelas = data.kelas
    if (data.bio !== undefined) profileUpdateData.bio = data.bio
    if (data.website !== undefined) profileUpdateData.website = data.website

    // Update or create profile if needed
    if (Object.keys(profileUpdateData).length > 0) {
      if (!updatedUser.profil) {
        // Create profile if it doesn't exist
        console.log('Creating new profile for user:', userId)
        await prisma.profile.create({
          data: {
            userId,
            ...profileUpdateData,
          },
        })
      } else {
        // Update existing profile
        console.log('Updating existing profile for user:', userId)
        await prisma.profile.update({
          where: { userId },
          data: profileUpdateData,
        })
      }
    }

    // Fetch updated data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profil: true,
      },
    })

    // Return combined profile for backward compatibility
    const profile = {
      userId: user!.id,
      nim: user!.nim,
      nip: user!.nip,
      angkatan: user!.angkatan,
      prodi: user!.prodi,
      avatarUrl: user!.avatarUrl,
      kelas: user!.profil?.kelas || null,
      bio: user!.profil?.bio || null,
      website: user!.profil?.website || null,
      user: {
        id: user!.id,
        name: user!.name,
        email: user!.email,
        role: user!.role,
        image: user!.image,
        googleId: user!.googleId,
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
