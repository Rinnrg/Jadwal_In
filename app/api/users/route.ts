import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Mark as dynamic route
export const dynamic = 'force-dynamic'

// Schema untuk mahasiswa
const createMahasiswaSchema = z.object({
  name: z.string().min(3),
  nomorHp: z.string().min(10),
  tanggalLahir: z.string(),
  tempatLahir: z.string().min(2),
  angkatan: z.number().min(2000).max(2100),
  role: z.literal('mahasiswa'),
})

// Schema untuk staff (dosen, kaprodi, super_admin)
const createStaffSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['dosen', 'kaprodi', 'super_admin']),
  prodi: z.string().optional(),
})

const createUserSchema = z.union([
  createMahasiswaSchema,
  createStaffSchema,
])

const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['mahasiswa', 'dosen', 'kaprodi', 'super_admin']).optional(),
  nim: z.string().length(11).optional(),
  angkatan: z.number().min(2000).max(2100).optional(),
  prodi: z.string().optional().nullable(),
})

// GET - Get all users or specific user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('id')
    const role = request.nextUrl.searchParams.get('role')

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ user })
    }

    const where = role ? { role: role as any } : {}
    const users = await prisma.user.findMany({
      where,
      
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data users' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateRandomPassword(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function generateEmailFromName(name: string, angkatan: number, nomorUrut: string): string {
  // Ambil 2 kata pertama dari nama
  const words = name.trim().split(/\s+/)
  const firstTwoWords = words.slice(0, 2).join('').toLowerCase()
  
  // Hapus karakter non-alphanumeric
  const cleanName = firstTwoWords.replace(/[^a-z0-9]/g, '')
  
  // Ambil 2 digit terakhir dari tahun angkatan
  const tahunAngkatan = angkatan.toString().slice(-2)
  
  // Format: (nama).(tahun angkatan)(nomor urut)@mhs.unesa.ac.id
  // Contoh: rinoraihan.22025@mhs.unesa.ac.id
  return `${cleanName}.${tahunAngkatan}${nomorUrut}@mhs.unesa.ac.id`
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createUserSchema.parse(body)

    if (data.role === 'mahasiswa') {
      // Handle mahasiswa creation with auto-generated email and password
      const mahasiswaData = data as z.infer<typeof createMahasiswaSchema>

      // Format NIM: (angkatan)(05)(0974)(nomor urut)
      const tahunAngkatan = mahasiswaData.angkatan.toString().slice(-2)
      const kodeFakultas = '05'
      const kodeProdi = '0974'

      // Cari nomor urut terakhir untuk angkatan yang sama
      const lastStudent = await prisma.user.findFirst({
        where: {
          angkatan: mahasiswaData.angkatan,
          nim: {
            startsWith: `${tahunAngkatan}${kodeFakultas}${kodeProdi}`,
          },
        },
        orderBy: {
          nim: 'desc',
        },
      })

      let nomorUrut = 1
      if (lastStudent && lastStudent.nim) {
        const lastUrut = parseInt(lastStudent.nim.slice(-3))
        nomorUrut = lastUrut + 1
      }

      const nomorUrutFormatted = nomorUrut.toString().padStart(3, '0')
      const nim = `${tahunAngkatan}${kodeFakultas}${kodeProdi}${nomorUrutFormatted}`

      // Generate email dari nama, angkatan, dan nomor urut
      const email = generateEmailFromName(mahasiswaData.name, mahasiswaData.angkatan, nomorUrutFormatted)

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar. Coba dengan nama yang berbeda.' },
          { status: 400 }
        )
      }

      // Generate random password
      const password = generateRandomPassword(8)

      // Create user dengan profile
      const user = await prisma.user.create({
        data: {
          name: mahasiswaData.name,
          email,
          password,
          role: 'mahasiswa',
          nim,
          angkatan: mahasiswaData.angkatan,
          prodi: 'S1 Pendidikan Teknologi Informasi',
        },
      })

      return NextResponse.json({ 
        user,
        credentials: {
          email,
          password,
          nim,
        }
      }, { status: 201 })

    } else {
      // Handle staff (dosen, kaprodi, super_admin) creation
      const staffData = data as z.infer<typeof createStaffSchema>

      // Validate prodi for kaprodi role
      if (staffData.role === 'kaprodi' && !staffData.prodi) {
        return NextResponse.json(
          { error: 'Prodi wajib diisi untuk role Kaprodi' },
          { status: 400 }
        )
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: staffData.email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar' },
          { status: 400 }
        )
      }

      const user = await prisma.user.create({
        data: {
          name: staffData.name,
          email: staffData.email,
          password: staffData.password,
          role: staffData.role,
          prodi: staffData.prodi || null, // Save prodi to user table
          nip: staffData.nip || null,
          phoneNumber: staffData.phoneNumber || null,
        },
      })

      return NextResponse.json({ user }, { status: 201 })
    }
  } catch (error) {
    console.error('Create user error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat user' },
      { status: 500 }
    )
  }
}

// PATCH - Update user
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Check if NIM is being changed and if it's already taken
    if (data.nim && data.nim !== existingUser.nim) {
      const nimTaken = await prisma.user.findFirst({
        where: { 
          nim: data.nim,
          NOT: { id: userId }  // Exclude current user
        },
      })

      if (nimTaken) {
        return NextResponse.json(
          { error: 'NIM sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Update user and profile in transaction
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.password && { password: data.password }),
        ...(data.role && { role: data.role }),
        ...(data.prodi !== undefined && { prodi: data.prodi }), // Allow setting prodi to null
        ...(data.nim && { nim: data.nim }),
        ...(data.angkatan && { angkatan: data.angkatan }),
      },
      
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Update user error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupdate user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deleting super admin
    if (user.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Super Admin tidak dapat dihapus' },
        { status: 403 }
      )
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ message: 'User berhasil dihapus' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus user' },
      { status: 500 }
    )
  }
}
