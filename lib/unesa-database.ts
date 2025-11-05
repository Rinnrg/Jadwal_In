// lib/unesa-database.ts
// Database mapping lokal untuk kode fakultas dan prodi UNESA

export interface ProdiInfo {
  kode: string
  nama: string
  jenjang: string
  fakultas: string
  fakultasKode: string
}

export interface FakultasInfo {
  kode: string
  nama: string
}

// Mapping Fakultas UNESA
export const FAKULTAS_MAP: Record<string, FakultasInfo> = {
  '01': { kode: '01', nama: 'Fakultas Ilmu Pendidikan' },
  '02': { kode: '02', nama: 'Fakultas Bahasa dan Seni' },
  '03': { kode: '03', nama: 'Fakultas Matematika dan Ilmu Pengetahuan Alam' },
  '04': { kode: '04', nama: 'Fakultas Ilmu Sosial dan Hukum' },
  '05': { kode: '05', nama: 'Fakultas Teknik' },
  '06': { kode: '06', nama: 'Fakultas Ilmu Keolahragaan' },
  '07': { kode: '07', nama: 'Fakultas Ekonomi dan Bisnis' },
  '08': { kode: '08', nama: 'Fakultas Vokasi' },
}

// Mapping Program Studi UNESA (partial - bisa ditambahkan sesuai kebutuhan)
export const PRODI_MAP: Record<string, ProdiInfo> = {
  // Fakultas Teknik (05)
  '0974': {
    kode: '0974',
    nama: 'Pendidikan Teknologi Informasi',
    jenjang: 'S1',
    fakultas: 'Fakultas Teknik',
    fakultasKode: '05'
  },
  '0901': {
    kode: '0901',
    nama: 'Teknik Elektro',
    jenjang: 'S1',
    fakultas: 'Fakultas Teknik',
    fakultasKode: '05'
  },
  '0902': {
    kode: '0902',
    nama: 'Teknik Mesin',
    jenjang: 'S1',
    fakultas: 'Fakultas Teknik',
    fakultasKode: '05'
  },
  '0903': {
    kode: '0903',
    nama: 'Teknik Sipil',
    jenjang: 'S1',
    fakultas: 'Fakultas Teknik',
    fakultasKode: '05'
  },
  '0904': {
    kode: '0904',
    nama: 'Pendidikan Teknik Elektro',
    jenjang: 'S1',
    fakultas: 'Fakultas Teknik',
    fakultasKode: '05'
  },
  '0905': {
    kode: '0905',
    nama: 'Pendidikan Teknik Mesin',
    jenjang: 'S1',
    fakultas: 'Fakultas Teknik',
    fakultasKode: '05'
  },
  '0906': {
    kode: '0906',
    nama: 'Pendidikan Teknik Bangunan',
    jenjang: 'S1',
    fakultas: 'Fakultas Teknik',
    fakultasKode: '05'
  },
  '0907': {
    kode: '0907',
    nama: 'Teknik Informatika',
    jenjang: 'S1',
    fakultas: 'Fakultas Teknik',
    fakultasKode: '05'
  },
  
  // Fakultas Ekonomi dan Bisnis (07)
  '0701': {
    kode: '0701',
    nama: 'Pendidikan Ekonomi',
    jenjang: 'S1',
    fakultas: 'Fakultas Ekonomi dan Bisnis',
    fakultasKode: '07'
  },
  '0702': {
    kode: '0702',
    nama: 'Pendidikan Akuntansi',
    jenjang: 'S1',
    fakultas: 'Fakultas Ekonomi dan Bisnis',
    fakultasKode: '07'
  },
  '0703': {
    kode: '0703',
    nama: 'Manajemen',
    jenjang: 'S1',
    fakultas: 'Fakultas Ekonomi dan Bisnis',
    fakultasKode: '07'
  },
  '0704': {
    kode: '0704',
    nama: 'Akuntansi',
    jenjang: 'S1',
    fakultas: 'Fakultas Ekonomi dan Bisnis',
    fakultasKode: '07'
  },
  
  // Fakultas MIPA (03)
  '0301': {
    kode: '0301',
    nama: 'Pendidikan Matematika',
    jenjang: 'S1',
    fakultas: 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
    fakultasKode: '03'
  },
  '0302': {
    kode: '0302',
    nama: 'Pendidikan Fisika',
    jenjang: 'S1',
    fakultas: 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
    fakultasKode: '03'
  },
  '0303': {
    kode: '0303',
    nama: 'Pendidikan Biologi',
    jenjang: 'S1',
    fakultas: 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
    fakultasKode: '03'
  },
  '0304': {
    kode: '0304',
    nama: 'Pendidikan Kimia',
    jenjang: 'S1',
    fakultas: 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
    fakultasKode: '03'
  },
  '0305': {
    kode: '0305',
    nama: 'Matematika',
    jenjang: 'S1',
    fakultas: 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
    fakultasKode: '03'
  },
  '0306': {
    kode: '0306',
    nama: 'Biologi',
    jenjang: 'S1',
    fakultas: 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
    fakultasKode: '03'
  },
  
  // Fakultas Ilmu Sosial dan Hukum (04)
  '0401': {
    kode: '0401',
    nama: 'Pendidikan Geografi',
    jenjang: 'S1',
    fakultas: 'Fakultas Ilmu Sosial dan Hukum',
    fakultasKode: '04'
  },
  '0402': {
    kode: '0402',
    nama: 'Pendidikan Sejarah',
    jenjang: 'S1',
    fakultas: 'Fakultas Ilmu Sosial dan Hukum',
    fakultasKode: '04'
  },
  '0403': {
    kode: '0403',
    nama: 'Ilmu Hukum',
    jenjang: 'S1',
    fakultas: 'Fakultas Ilmu Sosial dan Hukum',
    fakultasKode: '04'
  },
  
  // Fakultas Bahasa dan Seni (02)
  '0201': {
    kode: '0201',
    nama: 'Pendidikan Bahasa dan Sastra Indonesia',
    jenjang: 'S1',
    fakultas: 'Fakultas Bahasa dan Seni',
    fakultasKode: '02'
  },
  '0202': {
    kode: '0202',
    nama: 'Pendidikan Bahasa Inggris',
    jenjang: 'S1',
    fakultas: 'Fakultas Bahasa dan Seni',
    fakultasKode: '02'
  },
  '0203': {
    kode: '0203',
    nama: 'Sastra Indonesia',
    jenjang: 'S1',
    fakultas: 'Fakultas Bahasa dan Seni',
    fakultasKode: '02'
  },
  '0204': {
    kode: '0204',
    nama: 'Sastra Inggris',
    jenjang: 'S1',
    fakultas: 'Fakultas Bahasa dan Seni',
    fakultasKode: '02'
  },
  '0205': {
    kode: '0205',
    nama: 'Pendidikan Seni Rupa',
    jenjang: 'S1',
    fakultas: 'Fakultas Bahasa dan Seni',
    fakultasKode: '02'
  },
  '0206': {
    kode: '0206',
    nama: 'Pendidikan Seni Musik',
    jenjang: 'S1',
    fakultas: 'Fakultas Bahasa dan Seni',
    fakultasKode: '02'
  },
  
  // Fakultas Ilmu Keolahragaan (06)
  '0601': {
    kode: '0601',
    nama: 'Pendidikan Jasmani, Kesehatan dan Rekreasi',
    jenjang: 'S1',
    fakultas: 'Fakultas Ilmu Keolahragaan',
    fakultasKode: '06'
  },
  '0602': {
    kode: '0602',
    nama: 'Ilmu Keolahragaan',
    jenjang: 'S1',
    fakultas: 'Fakultas Ilmu Keolahragaan',
    fakultasKode: '06'
  },
  
  // Fakultas Ilmu Pendidikan (01)
  '0101': {
    kode: '0101',
    nama: 'Teknologi Pendidikan',
    jenjang: 'S1',
    fakultas: 'Fakultas Ilmu Pendidikan',
    fakultasKode: '01'
  },
  '0102': {
    kode: '0102',
    nama: 'Pendidikan Luar Sekolah',
    jenjang: 'S1',
    fakultas: 'Fakultas Ilmu Pendidikan',
    fakultasKode: '01'
  },
  '0103': {
    kode: '0103',
    nama: 'Bimbingan dan Konseling',
    jenjang: 'S1',
    fakultas: 'Fakultas Ilmu Pendidikan',
    fakultasKode: '01'
  },
  '0104': {
    kode: '0104',
    nama: 'Psikologi',
    jenjang: 'S1',
    fakultas: 'Fakultas Ilmu Pendidikan',
    fakultasKode: '01'
  },
  '0105': {
    kode: '0105',
    nama: 'Pendidikan Guru Sekolah Dasar',
    jenjang: 'S1',
    fakultas: 'Fakultas Ilmu Pendidikan',
    fakultasKode: '01'
  },
  '0106': {
    kode: '0106',
    nama: 'Pendidikan Guru Pendidikan Anak Usia Dini',
    jenjang: 'S1',
    fakultas: 'Fakultas Ilmu Pendidikan',
    fakultasKode: '01'
  },
}

/**
 * Get program studi info from NIM
 * @param nim - NIM mahasiswa (format: YYFFPPPPNNN)
 * @returns ProdiInfo atau null
 */
export function getProdiFromNIM(nim: string): ProdiInfo | null {
  if (!nim || nim.length < 8) return null
  
  const kodeProdi = nim.substring(4, 8)
  return PRODI_MAP[kodeProdi] || null
}

/**
 * Get fakultas info from NIM
 * @param nim - NIM mahasiswa (format: YYFFPPPPNNN)
 * @returns FakultasInfo atau null
 */
export function getFakultasFromNIM(nim: string): FakultasInfo | null {
  if (!nim || nim.length < 4) return null
  
  const kodeFakultas = nim.substring(2, 4)
  return FAKULTAS_MAP[kodeFakultas] || null
}

/**
 * Get angkatan from NIM
 * @param nim - NIM mahasiswa (format: YYFFPPPPNNN)
 * @returns Angkatan (tahun penuh)
 */
export function getAngkatanFromNIM(nim: string): number | null {
  if (!nim || nim.length < 2) return null
  
  const yearPrefix = nim.substring(0, 2)
  const year = parseInt(yearPrefix)
  
  if (isNaN(year) || year < 0 || year > 99) return null
  
  // Convert to full year (22 -> 2022, 20 -> 2020)
  return 2000 + year
}

/**
 * Extract NIM from email format UNESA
 * @param email - Email format: nama.nimshort@mhs.unesa.ac.id
 * @returns Full NIM atau null
 */
export function extractNIMFromEmail(email: string): string | null {
  const emailParts = email.split('@')[0]
  const parts = emailParts.split('.')
  
  if (parts.length >= 2) {
    const nimPart = parts[1] // "22002"
    if (nimPart && /^\d{5,}$/.test(nimPart)) {
      const tahun = nimPart.substring(0, 2) // "22"
      const nomorUrut = nimPart.substring(2) // "002"
      
      // Try to guess fakultas and prodi from context or use default
      // For now, we'll need additional info or API call
      // Return partial NIM
      return nimPart // Return short NIM, will be completed by API
    }
  }
  
  return null
}

/**
 * Validate NIM format UNESA
 * @param nim - NIM to validate
 * @returns boolean
 */
export function validateNIM(nim: string): boolean {
  // UNESA NIM format: YYFFPPPPNNN (11 digits)
  // YY = tahun (00-99)
  // FF = fakultas (01-08)
  // PPPP = prodi (4 digits)
  // NNN = nomor urut (3 digits)
  return /^\d{11}$/.test(nim)
}
