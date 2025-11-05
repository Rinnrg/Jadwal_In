// lib/pddikti-api.ts
// API Client untuk PDDIKTI (PDDikti Kemdikbud)

export interface PDDIKTIMahasiswa {
  nama: string
  nim: string
  prodi: string
  fakultas: string
  perguruan_tinggi: string
  jenjang: string
  status: string
  tanggal_masuk?: string
  semester?: string
}

/**
 * Search mahasiswa by NIM via PDDIKTI API
 * @param nim - NIM mahasiswa
 * @returns PDDIKTIMahasiswa atau null
 */
export async function searchMahasiswaByNIM(nim: string): Promise<PDDIKTIMahasiswa | null> {
  try {
    console.log(`🔍 [PDDIKTI] Searching mahasiswa by NIM: ${nim}`)
    
    // PDDIKTI API endpoint
    const apiUrl = `https://api-frontend.kemdikbud.go.id/hit_mhs/${nim}`
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      console.warn(`⚠️ [PDDIKTI] HTTP Error: ${response.status}`)
      return null
    }

    const data = await response.json()
    console.log(`✅ [PDDIKTI] Response received:`, data)
    
    // Parse response
    if (data && data.mahasiswa) {
      const mhs = data.mahasiswa[0] // Get first result
      
      if (mhs) {
        return {
          nama: mhs.text || mhs.nama || '',
          nim: mhs.nim || nim,
          prodi: mhs.nama_prodi || mhs.prodi || '',
          fakultas: mhs.nama_fakultas || mhs.fakultas || '',
          perguruan_tinggi: mhs.nama_pt || mhs.perguruan_tinggi || 'Universitas Negeri Surabaya',
          jenjang: mhs.nama_jenjang_pendidikan || mhs.jenjang || 'S1',
          status: mhs.status_mahasiswa || 'Aktif',
          tanggal_masuk: mhs.periode_masuk || mhs.tanggal_masuk,
          semester: mhs.semester,
        }
      }
    }
    
    console.log(`⚠️ [PDDIKTI] No mahasiswa data found in response`)
    return null
  } catch (error) {
    console.error('❌ [PDDIKTI] Error searching mahasiswa:', error)
    return null
  }
}

/**
 * Search mahasiswa by name via PDDIKTI API
 * @param name - Nama mahasiswa
 * @param limit - Maximum results
 * @returns Array of PDDIKTIMahasiswa
 */
export async function searchMahasiswaByName(
  name: string,
  limit: number = 10
): Promise<PDDIKTIMahasiswa[]> {
  try {
    console.log(`🔍 [PDDIKTI] Searching mahasiswa by name: ${name}`)
    
    const encodedName = encodeURIComponent(name)
    const apiUrl = `https://api-frontend.kemdikbud.go.id/search/mahasiswa/${encodedName}`
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      console.warn(`⚠️ [PDDIKTI] HTTP Error: ${response.status}`)
      return []
    }

    const data = await response.json()
    console.log(`✅ [PDDIKTI] Found ${data?.mahasiswa?.length || 0} results`)
    
    if (data && data.mahasiswa && Array.isArray(data.mahasiswa)) {
      return data.mahasiswa.slice(0, limit).map((mhs: any) => ({
        nama: mhs.text || mhs.nama || '',
        nim: mhs.nim || '',
        prodi: mhs.nama_prodi || mhs.prodi || '',
        fakultas: mhs.nama_fakultas || mhs.fakultas || '',
        perguruan_tinggi: mhs.nama_pt || 'Universitas Negeri Surabaya',
        jenjang: mhs.nama_jenjang_pendidikan || 'S1',
        status: mhs.status_mahasiswa || 'Aktif',
        tanggal_masuk: mhs.periode_masuk,
        semester: mhs.semester,
      }))
    }
    
    return []
  } catch (error) {
    console.error('❌ [PDDIKTI] Error searching mahasiswa by name:', error)
    return []
  }
}

/**
 * Filter results to only UNESA students
 * @param results - Array of search results
 * @returns Filtered array
 */
export function filterUNESAStudents(results: PDDIKTIMahasiswa[]): PDDIKTIMahasiswa[] {
  return results.filter(
    (mhs) =>
      mhs.perguruan_tinggi?.toLowerCase().includes('unesa') ||
      mhs.perguruan_tinggi?.toLowerCase().includes('universitas negeri surabaya')
  )
}
