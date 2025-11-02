/**
 * Konfigurasi Program Studi (Prodi) di UNESA
 * 
 * Struktur: Fakultas Teknik → Jurusan Teknik Informatika → 3 Prodi
 */

export const FAKULTAS_TEKNIK = "Teknik"
export const JURUSAN_TEKNIK_INFORMATIKA = "Teknik Informatika"

/**
 * List Program Studi (Prodi) di Jurusan Teknik Informatika
 */
export const PRODI_LIST = [
  {
    kode: "PTI",
    nama: "S1 Pendidikan Teknologi Informasi",
    namaPendek: "PTI",
    jurusan: JURUSAN_TEKNIK_INFORMATIKA,
    fakultas: FAKULTAS_TEKNIK,
  },
  {
    kode: "TI",
    nama: "S1 Teknik Informatika",
    namaPendek: "TI",
    jurusan: JURUSAN_TEKNIK_INFORMATIKA,
    fakultas: FAKULTAS_TEKNIK,
  },
  {
    kode: "SI",
    nama: "S1 Sistem Informasi",
    namaPendek: "SI",
    jurusan: JURUSAN_TEKNIK_INFORMATIKA,
    fakultas: FAKULTAS_TEKNIK,
  },
] as const

/**
 * Get prodi names for dropdown/select options
 */
export const PRODI_OPTIONS = PRODI_LIST.map(p => ({
  value: p.nama,
  label: `${p.nama} (${p.namaPendek})`,
  kode: p.kode,
}))

/**
 * Validate if prodi exists
 */
export function isValidProdi(prodi: string): boolean {
  return PRODI_LIST.some(p => p.nama === prodi)
}

/**
 * Get prodi by name
 */
export function getProdiByName(nama: string) {
  return PRODI_LIST.find(p => p.nama === nama)
}

/**
 * Get prodi by kode
 */
export function getProdiByKode(kode: string) {
  return PRODI_LIST.find(p => p.kode === kode)
}

// Export prodi names for easy access
export const PRODI_PTI = "S1 Pendidikan Teknologi Informasi"
export const PRODI_TI = "S1 Teknik Informatika"
export const PRODI_SI = "S1 Sistem Informasi"
