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

  // Find user by NIM in profile
  const profile = await prisma.profile.findFirst({
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

  // If not found in profile, try to find by email format
  if (!profile) {
    // Try to find user by email that contains the NIM pattern
    const nimPattern = nim.substring(2) // Remove year prefix for email matching
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

    if (!user) {
      notFound()
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              E-KTM Digital
            </h1>
            <p className="text-sm text-gray-600">
              Kartu Tanda Mahasiswa Elektronik
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <EKTMCard
              name={user.name}
              nim={nim}
              fakultas={getFakultasFromNIM(nim)}
              programStudi={getProdiFromNIM(nim)}
              avatarUrl={user.profile?.avatarUrl || undefined}
            />
          </div>

          <div className="text-center mt-6 text-sm text-gray-600">
            <p>Universitas Negeri Surabaya</p>
            <p className="text-xs mt-1">Dokumen resmi mahasiswa aktif</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            E-KTM Digital
          </h1>
          <p className="text-sm text-gray-600">
            Kartu Tanda Mahasiswa Elektronik
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <EKTMCard
            name={profile.user.name}
            nim={nim}
            fakultas={getFakultasFromNIM(nim)}
            programStudi={getProdiFromNIM(nim)}
            avatarUrl={profile.avatarUrl || undefined}
          />
        </div>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Universitas Negeri Surabaya</p>
          <p className="text-xs mt-1">Dokumen resmi mahasiswa aktif</p>
        </div>
      </div>
    </div>
  )
}
