import { NextRequest, NextResponse } from 'next/server'
import { getGoogleUserInfo } from '@/lib/google-auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { cariNIPDosen } from '@/lib/unesa-scraper'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Helper function to extract and reconstruct full NIM from email
function extractNIMFromEmail(email: string): string | null {
  // Format email: namapertamanamakedua.22002@mhs.unesa.ac.id
  // From .22002 we extract: year(22) + sequence(002)
  // Full NIM: year(22) + faculty(05) + program(0974) + sequence(002) = 22050974002
  const emailParts = email.split('@')[0]
  const parts = emailParts.split('.')
  
  if (parts.length >= 2) {
    const nimPart = parts[1] // "22002"
    if (nimPart && /^\d{5,}$/.test(nimPart)) { // At least 5 digits
      // Extract year (first 2 digits) and sequence number (last 3 digits)
      const tahun = nimPart.substring(0, 2) // "22"
      const nomorUrut = nimPart.substring(2) // "002"
      
      // Reconstruct full NIM with default faculty and program codes
      const kodeFakultas = "05"
      const kodeProdi = "0974"
      
      return `${tahun}${kodeFakultas}${kodeProdi}${nomorUrut}` // "22050974002"
    }
  }
  
  // Check if email prefix is already a full NIM (numeric)
  if (/^\d{8,}$/.test(emailParts)) {
    return emailParts
  }
  
  return null
}

// Helper function to extract angkatan from NIM
function extractAngkatan(nim: string | null): number {
  if (!nim) return new Date().getFullYear()
  
  // Try to extract first 2 or 4 digits as year
  const firstTwoDigits = nim.substring(0, 2)
  const firstFourDigits = nim.substring(0, 4)
  
  // If NIM starts with 4 digits (2020, 2021, etc.)
  if (nim.length >= 4 && firstFourDigits >= '2000' && firstFourDigits <= '2099') {
    return parseInt(firstFourDigits)
  }
  
  // If NIM starts with 2 digits (20, 21, 22, etc.)
  if (nim.length >= 2) {
    const year = parseInt(firstTwoDigits)
    // Assume 20xx for years 00-99
    if (year >= 0 && year <= 99) {
      return 2000 + year
    }
  }
  
  return new Date().getFullYear()
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔵 Google Callback Started')
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    console.log('📥 Received params:', { code: code?.substring(0, 20) + '...', error })

    // Handle user cancellation
    if (error) {
      console.log('❌ User cancelled or error:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${error}`, request.url)
      )
    }

    if (!code) {
      console.log('❌ No authorization code received')
      return NextResponse.redirect(
        new URL('/login?error=no_code', request.url)
      )
    }

    // Get user info from Google
    console.log('🔍 Getting user info from Google...')
    const googleUser = await getGoogleUserInfo(code)
    console.log('✅ Google user info:', { email: googleUser.email, name: googleUser.name })

    if (!googleUser.email) {
      console.log('❌ No email from Google')
      return NextResponse.redirect(
        new URL('/login?error=no_email', request.url)
      )
    }

    // Find or create user in database
    console.log('🔍 Finding user in database...')
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      })
    } catch (dbError) {
      console.error('❌ Database error when finding user:', dbError)
      return NextResponse.redirect(
        new URL('/login?error=database_error', request.url)
      )
    }

    if (!user) {
      console.log('➕ Creating new user...')
      
      // Determine role based on email domain
      const isDosen = googleUser.email.endsWith('@unesa.ac.id')
      const userRole = isDosen ? 'dosen' : 'mahasiswa'
      console.log(`📧 Email domain check: ${googleUser.email} → Role: ${userRole}`)
      
      let extractedNim: string | null = null
      let extractedNip: string | null = null
      let extractedAngkatan: number | null = null
      let extractedProdi: string | null = null
      let extractedFakultas: string | null = null
      let extractedJenisKelamin: string | null = null
      let extractedSemesterAwal: string | null = null
      
      if (isDosen) {
        // For dosen, try to fetch NIP, prodi, fakultas from cv.unesa.ac.id
        console.log('👨‍🏫 User is dosen, fetching data from cv.unesa.ac.id...')
        try {
          const dosenInfo = await Promise.race([
            cariNIPDosen(googleUser.name || ''),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
          ])
          if (dosenInfo) {
            extractedNip = dosenInfo.nip
            extractedProdi = dosenInfo.prodi
            extractedFakultas = dosenInfo.fakultas
            console.log('✅ Dosen data found:')
            console.log('   - NIP:', extractedNip || 'Not found')
            console.log('   - Prodi:', extractedProdi || 'Not found')
            console.log('   - Fakultas:', extractedFakultas || 'Not found')
          } else {
            console.log('⚠️ Dosen data not found')
          }
        } catch (error) {
          console.error('❌ Error fetching dosen data (continuing without it):', error)
          // Continue without dosen data - login should not fail
        }
      } else {
        // For mahasiswa, fetch ALL data from pd-unesa.unesa.ac.id using name
        console.log('👨‍🎓 Fetching mahasiswa data from pd-unesa.unesa.ac.id...')
        try {
          const { cariDataMahasiswa } = await import('@/lib/unesa-scraper')
          const mahasiswaInfo = await Promise.race([
            cariDataMahasiswa(googleUser.name || ''),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
          ])
          
          if (mahasiswaInfo) {
            // Use data from pd-unesa (including NIM!)
            extractedNim = mahasiswaInfo.nim
            extractedProdi = mahasiswaInfo.prodi
            extractedFakultas = mahasiswaInfo.fakultas
            extractedJenisKelamin = mahasiswaInfo.jenisKelamin
            extractedSemesterAwal = mahasiswaInfo.semesterAwal
            
            // Extract angkatan from NIM if available
            if (mahasiswaInfo.angkatan) {
              extractedAngkatan = parseInt(mahasiswaInfo.angkatan)
            } else if (extractedNim) {
              extractedAngkatan = extractAngkatan(extractedNim)
            }
            
            console.log('✅ Mahasiswa data found from pd-unesa:')
            console.log('   - NIM:', extractedNim || 'Not found')
            console.log('   - Prodi:', extractedProdi || 'Not found')
            console.log('   - Fakultas:', extractedFakultas || 'Not found')
            console.log('   - Angkatan:', extractedAngkatan || 'Not found')
            console.log('   - Jenis Kelamin:', extractedJenisKelamin || 'Not found')
            console.log('   - Semester Awal:', extractedSemesterAwal || 'Not found')
          } else {
            console.log('⚠️ Data not found on pd-unesa, trying to extract NIM from email as fallback...')
            // Fallback: extract from email if pd-unesa scraping fails
            extractedNim = extractNIMFromEmail(googleUser.email)
            extractedAngkatan = extractAngkatan(extractedNim)
            console.log('   - NIM (from email):', extractedNim || 'Not found')
          }
        } catch (error) {
          console.error('❌ Error fetching mahasiswa data (continuing with fallback):', error)
          // Fallback: extract from email if error occurs
          extractedNim = extractNIMFromEmail(googleUser.email)
          extractedAngkatan = extractAngkatan(extractedNim)
          console.log('   - Using fallback NIM from email:', extractedNim)
        }
      }
      
      // Create new user (all data in User table)
      try {
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name || googleUser.email.split('@')[0],
            role: userRole,
            googleId: googleUser.googleId,
            image: googleUser.picture,
            nim: extractedNim,
            nip: extractedNip,
            angkatan: extractedAngkatan,
            prodi: extractedProdi,
            fakultas: extractedFakultas,
            avatarUrl: googleUser.picture,
            jenisKelamin: extractedJenisKelamin,
            semesterAwal: extractedSemesterAwal,
          },
        })
        console.log('✅ User created:', user.id)
      } catch (createError) {
        console.error('❌ Error creating user:', createError)
        return NextResponse.redirect(
          new URL('/login?error=user_creation_failed', request.url)
        )
      }
      console.log('   - Role:', userRole)
      console.log('   - NIM:', extractedNim || 'N/A')
      console.log('   - NIP:', extractedNip || 'N/A')
      console.log('   - Angkatan:', extractedAngkatan || 'N/A')
      console.log('   - Prodi:', extractedProdi || 'N/A')
      console.log('   - Fakultas:', extractedFakultas || 'N/A')
      console.log('   - Avatar URL:', !!googleUser.picture)
    } else if (!user.googleId) {
      console.log('🔄 Updating existing user with Google ID...')
      
      // Determine role based on email domain
      const isDosen = googleUser.email.endsWith('@unesa.ac.id')
      const userRole = isDosen ? 'dosen' : 'mahasiswa'
      
      // Extract data based on role
      let extractedNim: string | null = null
      let extractedNip: string | null = null
      let extractedAngkatan: number | null = null
      let extractedProdi: string | null = null
      let extractedFakultas: string | null = null
      let extractedJenisKelamin: string | null = null
      let extractedSemesterAwal: string | null = null
      
      if (isDosen && (!user.nip || !user.prodi || !user.fakultas)) {
        // For dosen without complete data, try to fetch from cv.unesa.ac.id
        console.log('👨‍🏫 User is dosen, fetching data from cv.unesa.ac.id...')
        try {
          const dosenInfo = await cariNIPDosen(googleUser.name || '')
          if (dosenInfo) {
            if (!user.nip) extractedNip = dosenInfo.nip
            if (!user.prodi) extractedProdi = dosenInfo.prodi
            if (!user.fakultas) extractedFakultas = dosenInfo.fakultas
            console.log('✅ Dosen data found:')
            console.log('   - NIP:', extractedNip || 'Already set')
            console.log('   - Prodi:', extractedProdi || 'Already set')
            console.log('   - Fakultas:', extractedFakultas || 'Already set')
          }
        } catch (error) {
          console.error('❌ Error fetching dosen data:', error)
        }
      } else if (!isDosen && (!user.nim || !user.prodi || !user.fakultas || !user.jenisKelamin || !user.semesterAwal)) {
        // For existing mahasiswa with missing data, fetch from pd-unesa
        console.log('👨‍🎓 Fetching mahasiswa data from pd-unesa.unesa.ac.id...')
        try {
          const { cariDataMahasiswa } = await import('@/lib/unesa-scraper')
          
          // Try to search by name first (primary method)
          let mahasiswaInfo = await cariDataMahasiswa(googleUser.name || '')
          
          // If not found by name and we have NIM, try by NIM
          if (!mahasiswaInfo && user.nim) {
            console.log('   - Name search failed, trying by NIM...')
            mahasiswaInfo = await cariDataMahasiswa(user.nim)
          }
          
          // If still not found and NIM can be extracted from email, try that
          if (!mahasiswaInfo) {
            const emailNim = extractNIMFromEmail(googleUser.email)
            if (emailNim) {
              console.log('   - Trying by email-extracted NIM as fallback...')
              mahasiswaInfo = await cariDataMahasiswa(emailNim)
            }
          }
          
          if (mahasiswaInfo) {
            if (!user.nim && mahasiswaInfo.nim) {
              extractedNim = mahasiswaInfo.nim
              extractedAngkatan = mahasiswaInfo.angkatan 
                ? parseInt(mahasiswaInfo.angkatan) 
                : extractAngkatan(mahasiswaInfo.nim)
            }
            if (!user.prodi && mahasiswaInfo.prodi) extractedProdi = mahasiswaInfo.prodi
            if (!user.fakultas && mahasiswaInfo.fakultas) extractedFakultas = mahasiswaInfo.fakultas
            if (mahasiswaInfo.jenisKelamin) extractedJenisKelamin = mahasiswaInfo.jenisKelamin
            if (mahasiswaInfo.semesterAwal) extractedSemesterAwal = mahasiswaInfo.semesterAwal
            
            console.log('✅ Mahasiswa data found from pd-unesa:')
            console.log('   - NIM:', extractedNim || 'Already set')
            console.log('   - Prodi:', extractedProdi || 'Already set')
            console.log('   - Fakultas:', extractedFakultas || 'Already set')
            console.log('   - Angkatan:', extractedAngkatan || 'Already set')
            console.log('   - Jenis Kelamin:', extractedJenisKelamin || 'Already set')
            console.log('   - Semester Awal:', extractedSemesterAwal || 'Already set')
          } else {
            console.log('⚠️ Could not find mahasiswa data on pd-unesa')
            // Last resort fallback: extract NIM from email
            if (!user.nim) {
              extractedNim = extractNIMFromEmail(googleUser.email)
              extractedAngkatan = extractAngkatan(extractedNim)
              console.log('   - Using fallback NIM from email:', extractedNim)
            }
          }
        } catch (error) {
          console.error('❌ Error fetching mahasiswa data:', error)
          // Fallback on error
          if (!user.nim) {
            extractedNim = extractNIMFromEmail(googleUser.email)
            extractedAngkatan = extractAngkatan(extractedNim)
            console.log('   - Using fallback NIM from email:', extractedNim)
          }
        }
      }
      
      // Update user with Google ID and data
      const updateData: any = {
        googleId: googleUser.googleId,
        role: userRole,
        image: googleUser.picture || user.image,
        avatarUrl: googleUser.picture,
      }
      
      if (extractedNim) {
        updateData.nim = extractedNim
        updateData.angkatan = extractedAngkatan
      }
      
      if (extractedNip) {
        updateData.nip = extractedNip
      }
      
      if (extractedProdi) {
        updateData.prodi = extractedProdi
      }
      
      if (extractedFakultas) {
        updateData.fakultas = extractedFakultas
      }
      
      if (extractedJenisKelamin) {
        updateData.jenisKelamin = extractedJenisKelamin
      }
      
      if (extractedSemesterAwal) {
        updateData.semesterAwal = extractedSemesterAwal
      }
      
      try {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        })
        console.log('✅ User updated:', user.id)
      } catch (updateError) {
        console.error('❌ Error updating user:', updateError)
        return NextResponse.redirect(
          new URL('/login?error=user_update_failed', request.url)
        )
      }
    } else {
      console.log('✅ User found:', user.id)
      
      // Determine role based on email domain
      const isDosen = googleUser.email.endsWith('@unesa.ac.id')
      const userRole = isDosen ? 'dosen' : 'mahasiswa'
      
      let needsUpdate = false
      const updateData: any = {}
      
      // Update role if email domain indicates dosen
      if (user.role !== userRole) {
        console.log(`🔄 Updating role: "${user.role}" → "${userRole}"`)
        updateData.role = userRole
        needsUpdate = true
      }
      
      // Update image if Google has newer one
      if (googleUser.picture && user.image !== googleUser.picture) {
        console.log('🖼️ Updating user image from Google...')
        updateData.image = googleUser.picture
        needsUpdate = true
      }
      
      // Update avatarUrl if Google has newer one
      if (googleUser.picture && user.avatarUrl !== googleUser.picture) {
        console.log('🖼️ Updating avatarUrl from Google...')
        updateData.avatarUrl = googleUser.picture
        needsUpdate = true
      }
      
      // Check if data needs to be updated
      const currentNim = user.nim
      const currentNip = user.nip
      const currentProdi = user.prodi
      const currentFakultas = user.fakultas
      
      const nimNeedsUpdate = !isDosen && (!currentNim || currentNim.length < 8)
      const dataDosenNeedsUpdate = isDosen && (!currentNip || !currentProdi || !currentFakultas)
      const dataMahasiswaNeedsUpdate = !isDosen && currentNim && (!currentProdi || !currentFakultas)
      
      if (nimNeedsUpdate) {
        const extractedNim = extractNIMFromEmail(googleUser.email)
        if (extractedNim) {
          console.log(`🔄 Updating NIM: "${currentNim || 'NULL'}" → "${extractedNim}"`)
          updateData.nim = extractedNim
          updateData.angkatan = extractAngkatan(extractedNim)
          needsUpdate = true
        }
      }
      
      if (dataDosenNeedsUpdate) {
        console.log('👨‍🏫 Fetching dosen data from cv.unesa.ac.id...')
        try {
          const dosenInfo = await Promise.race([
            cariNIPDosen(googleUser.name || ''),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
          ])
          if (dosenInfo) {
            if (!currentNip && dosenInfo.nip) {
              updateData.nip = dosenInfo.nip
              console.log('✅ NIP found:', dosenInfo.nip)
              needsUpdate = true
            }
            if (!currentProdi && dosenInfo.prodi) {
              updateData.prodi = dosenInfo.prodi
              console.log('✅ Prodi found:', dosenInfo.prodi)
              needsUpdate = true
            }
            if (!currentFakultas && dosenInfo.fakultas) {
              updateData.fakultas = dosenInfo.fakultas
              console.log('✅ Fakultas found:', dosenInfo.fakultas)
              needsUpdate = true
            }
          }
        } catch (error) {
          console.error('❌ Error fetching dosen data (continuing without it):', error)
          // Continue without dosen data - login should not fail
        }
      }
      
      if (dataMahasiswaNeedsUpdate) {
        console.log('👨‍🎓 Fetching mahasiswa data from pd-unesa.unesa.ac.id...')
        try {
          const { cariDataMahasiswa } = await import('@/lib/unesa-scraper')
          const mahasiswaInfo = await Promise.race([
            cariDataMahasiswa(currentNim!),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
          ])
          if (mahasiswaInfo) {
            if (!currentProdi && mahasiswaInfo.prodi) {
              updateData.prodi = mahasiswaInfo.prodi
              console.log('✅ Prodi found:', mahasiswaInfo.prodi)
              needsUpdate = true
            }
            if (!currentFakultas && mahasiswaInfo.fakultas) {
              updateData.fakultas = mahasiswaInfo.fakultas
              console.log('✅ Fakultas found:', mahasiswaInfo.fakultas)
              needsUpdate = true
            }
            if (mahasiswaInfo.jenisKelamin) {
              updateData.jenisKelamin = mahasiswaInfo.jenisKelamin
              console.log('✅ Jenis Kelamin found:', mahasiswaInfo.jenisKelamin)
              needsUpdate = true
            }
            if (mahasiswaInfo.semesterAwal) {
              updateData.semesterAwal = mahasiswaInfo.semesterAwal
              console.log('✅ Semester Awal found:', mahasiswaInfo.semesterAwal)
              needsUpdate = true
            }
          }
        } catch (error) {
          console.error('❌ Error fetching mahasiswa data (continuing without it):', error)
          // Continue without mahasiswa data - login should not fail
        }
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        try {
          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          })
          console.log('✅ User data updated')
          console.log('   - NIM:', user.nim || 'N/A')
          console.log('   - NIP:', user.nip || 'N/A')
          console.log('   - Angkatan:', user.angkatan || 'N/A')
        } catch (updateError) {
          console.error('❌ Error updating existing user data:', updateError)
          // Don't fail login, just log the error and continue
          console.log('⚠️ Continuing login without data update')
        }
      } else {
        console.log(`✅ All data already up to date`)
        console.log(`   - NIM: ${currentNim || 'N/A'}`)
        console.log(`   - NIP: ${currentNip || 'N/A'}`)
      }
    }

    // Ensure user exists before creating session
    if (!user) {
      console.log('❌ User is null after all operations')
      return NextResponse.redirect(
        new URL('/login?error=user_creation_failed', request.url)
      )
    }

    // Final verification: Log user profile details
    console.log('📊 Final User Status:')
    console.log('   - User ID:', user.id)
    console.log('   - Email:', user.email)
    console.log('   - Role:', user.role)
    console.log('   - NIM:', user.nim || 'NULL')
    console.log('   - NIP:', user.nip || 'NULL')
    console.log('   - Angkatan:', user.angkatan || 'NULL')
    console.log('   - Prodi:', user.prodi || 'NULL')
    console.log('   - Fakultas:', user.fakultas || 'NULL')
    console.log('   - Avatar URL:', user.avatarUrl ? 'SET' : 'NULL')
    console.log('   - Google ID:', user.googleId || 'NULL')

    // Create session token
    console.log('🔐 Creating session...')
    const sessionToken = randomBytes(32).toString('hex')

    // Get callback URL from cookie
    const callbackUrl = request.cookies.get('google_callback_url')?.value || '/dashboard'
    console.log('🎯 Redirecting to:', callbackUrl)

    // Create response with redirect
    const response = NextResponse.redirect(
      new URL(callbackUrl, request.url)
    )

    // Set session cookie (client-side session, not database-backed)
    console.log('🍪 Setting session cookie:', sessionToken.substring(0, 20) + '...')
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    console.log('✅ Session cookie set')

    // Set user ID cookie for session validation (non-httpOnly so client can read)
    response.cookies.set('user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    console.log('✅ User ID cookie set')
    console.log('✅ Session created')

    // Clear callback URL cookie
    response.cookies.delete('google_callback_url')

    return response
  } catch (error: any) {
    console.error('❌ Google callback error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.redirect(
      new URL(`/login?error=callback_failed&details=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}

