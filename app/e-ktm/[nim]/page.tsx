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

  // Find user by NIM (works for both regular and Google Auth users)
  // Also try to find by ID if NIM format looks like a UUID (for Google Auth users)
  const isUUID = nim.length > 20 || nim.includes('-')
  
  const user = await prisma.user.findFirst({
    where: isUUID 
      ? { id: nim } // If it looks like UUID, search by ID
      : { 
          OR: [
            { nim: nim },    // First try exact NIM match
            { id: nim }, // Also try ID for Google Auth users (fallback)
          ]
        },
    include: {
      profil: true,  // Include profile for kelas, bio, etc.
    },
  })

  console.log('[E-KTM] User search result:', {
    found: !!user,
    searchType: isUUID ? 'id' : 'nim',
    searchedValue: nim,
    nim: user?.nim,
    userId: user?.id,
    userName: user?.name,
    userEmail: user?.email,
    isGoogleAuth: !!user?.googleId,
  })

  // If not found, show 404
  if (!user) {
    console.log('[E-KTM] No user found, showing 404')
    console.log('[E-KTM] Debug: Checking all users with similar NIM...')
    
    // Debug: Check if there are any users with NIM containing this value
    const allUsers = await prisma.user.findMany({
      where: {
        OR: [
          { nim: { contains: nim } },
          { nim: { startsWith: nim } },
          { nim: { endsWith: nim } },
          { id: nim }, // Also try ID
        ]
      },
      select: {
        nim: true,
        id: true,
        email: true,
        googleId: true,
      },
      take: 5,
    })
    console.log('[E-KTM] Similar NIMs found:', allUsers)
    
    notFound()
  }

  // Use NIM from user, or fallback to ID if NIM is not set (Google Auth users)
  const displayNIM = user.nim || user.id.slice(0, 12) // Use first 12 chars of ID as fallback

  // Get avatar URL: prioritize user.avatarUrl, fallback to user.image (for Google Auth)
  const avatarUrl = user.avatarUrl || user.image || undefined

  console.log('[E-KTM] Avatar URL:', avatarUrl ? 'Found' : 'Not found')

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
            name={user.name}
            nim={displayNIM}
            fakultas={getFakultasFromNIM(displayNIM)}
            programStudi={getProdiFromNIM(displayNIM)}
            avatarUrl={avatarUrl}
            userId={user.id} // Pass userId for QR code generation
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
