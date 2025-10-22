/**
 * Utility functions untuk extract data mahasiswa dari email dan NIM
 */

/**
 * Extract angkatan dari email mahasiswa
 * Format email: nama.22025@mhs.unesa.ac.id
 * Returns: 2022 (full year)
 */
export function extractAngkatanFromEmail(email: string): number | null {
  const match = email.match(/\.(\d{2})(\d{3})@mhs\.unesa\.ac\.id/)
  if (match) {
    const tahun2Digit = match[1]
    // Convert 22 -> 2022, 23 -> 2023, etc
    const fullYear = 2000 + parseInt(tahun2Digit)
    return fullYear
  }
  return null
}

/**
 * Extract angkatan dari NIM
 * Format NIM: 22050974025 (tahun)(fakultas)(prodi)(nomor)
 * Returns: 2022 (full year)
 */
export function extractAngkatanFromNIM(nim: string): number | null {
  if (!nim || nim.length < 2) return null
  
  const tahun2Digit = nim.substring(0, 2)
  const fullYear = 2000 + parseInt(tahun2Digit)
  
  if (fullYear < 2000 || fullYear > 2050) return null
  
  return fullYear
}

/**
 * Extract kelas dari NIM berdasarkan nomor urut
 * Format NIM: 22050974025 (tahun)(fakultas)(prodi)(nomor urut)
 * Nomor urut 001-040 = Kelas A
 * Nomor urut 041-080 = Kelas B
 * Nomor urut 081-120 = Kelas C
 * dst.
 */
export function extractKelasFromNIM(nim: string): string {
  if (!nim || nim.length < 11) return "A"
  
  // Ambil 3 digit terakhir sebagai nomor urut
  const nomorUrut = parseInt(nim.substring(8, 11))
  
  if (isNaN(nomorUrut)) return "A"
  
  // Hitung kelas berdasarkan nomor urut (setiap 40 mahasiswa = 1 kelas)
  const kelasIndex = Math.floor((nomorUrut - 1) / 40)
  const kelas = String.fromCharCode(65 + kelasIndex) // 65 = 'A'
  
  return kelas
}

/**
 * Get student info from email and NIM
 */
export function getStudentInfoFromData(email: string, nim?: string): {
  angkatan: number
  kelas: string
} {
  let angkatan = new Date().getFullYear()
  let kelas = "A"
  
  // Try to extract from NIM first (more reliable)
  if (nim) {
    const angkatanFromNIM = extractAngkatanFromNIM(nim)
    if (angkatanFromNIM) {
      angkatan = angkatanFromNIM
    }
    kelas = extractKelasFromNIM(nim)
  } else if (email) {
    // Fallback to email
    const angkatanFromEmail = extractAngkatanFromEmail(email)
    if (angkatanFromEmail) {
      angkatan = angkatanFromEmail
    }
  }
  
  return { angkatan, kelas }
}
