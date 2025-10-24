import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EKTMCard } from "@/components/profile/EKTMCard"

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

  // First, try to find user by NIM in profile
  let profile = await prisma.profile.findFirst({
    where: { nim },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  console.log('[E-KTM] Profile found by NIM:', profile ? 'Yes' : 'No')

  // If not found, try to find by email pattern (for Google Auth users)
  if (!profile) {
    console.log('[E-KTM] Trying to find by email pattern')
    
    // Extract NIM pattern from the full NIM (remove year prefix for email matching)
    const nimPattern = nim.substring(2) // e.g., "22050974025" -> "050974025"
    
    // Try to find user by email that contains the NIM pattern
    const user = await prisma.user.findFirst({
      where: {
        email: {
          contains: nimPattern,
        },
        role: "mahasiswa",
      },
      include: {
        profile: true,
      },
    })

    console.log('[E-KTM] User by email found:', user ? 'Yes' : 'No')

    if (user) {
      // Create a temporary profile object for display
      profile = {
        nim: nim,
        avatarUrl: user.profile?.avatarUrl || null,
        user: {
          name: user.name,
          email: user.email,
        },
      } as any
    }
  }

  // If still not found, show 404
  if (!profile) {
    console.log('[E-KTM] No user found, showing 404')
    notFound()
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/BG_E-KTM.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f0f9ff', // fallback color
      }}
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-md">
            E-KTM Digital
          </h1>
          <p className="text-sm text-gray-700 drop-shadow">
            Kartu Tanda Mahasiswa Elektronik
          </p>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <EKTMCard
            name={profile.user.name}
            nim={nim}
            fakultas={getFakultasFromNIM(nim)}
            programStudi={getProdiFromNIM(nim)}
            avatarUrl={profile.avatarUrl || undefined}
          />
        </div>

        <div className="text-center mt-6 text-sm text-gray-700 drop-shadow">
          <p className="font-semibold">Universitas Negeri Surabaya</p>
          <p className="text-xs mt-1">Dokumen resmi mahasiswa aktif</p>
        </div>
      </div>
    </div>
  )
}
