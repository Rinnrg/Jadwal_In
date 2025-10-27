import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EKTMCardWithTilt } from "@/src/components/profile/EKTMCardWithTilt"

interface PageProps {
  params: {
    nim: string
  }
}

// Helper functions
function getFakultasFromNIM(nim: string): string {
  if (!nim || nim.length < 4) return "-"
  const kodeFakultas = nim.substring(2, 4)
  
  const fakultasMap: Record<string, string> = {
    "05": "Fakultas Teknik",
  }
  
  return fakultasMap[kodeFakultas] || "-"
}

function getProdiFromNIM(nim: string): string {
  if (!nim || nim.length < 8) return "-"
  const kodeProdi = nim.substring(4, 8)
  
  const prodiMap: Record<string, string> = {
    "0974": "S1 Pendidikan Teknologi Informasi",
  }
  
  return prodiMap[kodeProdi] || "-"
}

export default async function EKTMPublicPage({ params }: PageProps) {
  const { nim } = params

  console.log('[E-KTM] Searching for NIM:', nim)

  // Find profile by NIM (works for both regular and Google Auth users)
  // Also try to find by userId if NIM format looks like a UUID (for Google Auth users)
  const isUUID = nim.length > 20 || nim.includes('-')
  
  const profile = await prisma.profile.findFirst({
    where: isUUID 
      ? { userId: nim } // If it looks like UUID, search by userId
      : { 
          OR: [
            { nim: nim },    // First try exact NIM match
            { userId: nim }, // Also try userId for Google Auth users (fallback)
          ]
        },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          googleId: true,
        },
      },
    },
  })

  console.log('[E-KTM] Profile search result:', {
    found: !!profile,
    searchType: isUUID ? 'userId' : 'nim',
    searchedValue: nim,
    nim: profile?.nim,
    userId: profile?.userId,
    userName: profile?.user.name,
    userEmail: profile?.user.email,
    isGoogleAuth: !!profile?.user.googleId,
  })

  // If not found, show 404
  if (!profile) {
    console.log('[E-KTM] No user found, showing 404')
    console.log('[E-KTM] Debug: Checking all profiles with similar NIM...')
    
    // Debug: Check if there are any profiles with NIM containing this value
    const allProfiles = await prisma.profile.findMany({
      where: {
        OR: [
          { nim: { contains: nim } },
          { nim: { startsWith: nim } },
          { nim: { endsWith: nim } },
          { userId: nim }, // Also try userId
        ]
      },
      select: {
        nim: true,
        userId: true,
        user: {
          select: {
            email: true,
            googleId: true,
          }
        }
      },
      take: 5,
    })
    console.log('[E-KTM] Similar NIMs found:', allProfiles)
    
    notFound()
  }

  // Use NIM from profile, or fallback to userId if NIM is not set (Google Auth users)
  const displayNIM = profile.nim || profile.userId.slice(0, 12) // Use first 12 chars of userId as fallback

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-950">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Kartu Tanda Mahasiswa
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Universitas Negeri Surabaya
          </p>
        </div>

        {/* E-KTM Card */}
        <div className="w-full scale-90 sm:scale-100">
          <EKTMCardWithTilt
            name={profile.user.name}
            nim={displayNIM}
            fakultas={getFakultasFromNIM(displayNIM)}
            programStudi={getProdiFromNIM(displayNIM)}
            avatarUrl={profile.avatarUrl || undefined}
            userId={profile.userId} // Pass userId for QR code generation
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            design by gacor
          </p>
        </div>
      </div>
    </div>
  )
}
