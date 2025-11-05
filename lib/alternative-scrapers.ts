// lib/alternative-scrapers.ts
// Alternative scraping methods untuk data mahasiswa UNESA

interface MahasiswaData {
  nim?: string | null
  nama?: string | null
  prodi?: string | null
  fakultas?: string | null
  angkatan?: string | null
  jenisKelamin?: string | null
  semesterAwal?: string | null
}

/**
 * Method 1: PDDIKTI Alternative Endpoints
 * PDDIKTI punya beberapa endpoint yang bisa dicoba
 */
export async function scrapePDDIKTIAlternative(nim: string): Promise<MahasiswaData | null> {
  const endpoints = [
    `https://api-frontend.kemdikbud.go.id/hit_mhs/${nim}`,
    `https://pddikti.kemdikbud.go.id/api/mahasiswa/${nim}`,
    `https://forlap.ristekdikti.go.id/mahasiswa/detail/${nim}`,
  ]

  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Trying PDDIKTI alternative endpoint: ${endpoint}`)
      
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://pddikti.kemdikbud.go.id/'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Got data from ${endpoint}:`, data)
        
        // Parse berbagai format response
        if (data.mahasiswa) {
          return parseKemdikbudResponse(data.mahasiswa)
        } else if (data.data) {
          return parseKemdikbudResponse(data.data)
        } else if (data.nama || data.nim) {
          return parseKemdikbudResponse(data)
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed endpoint ${endpoint}:`, error)
      continue
    }
  }

  return null
}

/**
 * Method 2: SIAKAD UNESA (jika ada public endpoint)
 * Coba akses SIAKAD dengan berbagai path
 */
export async function scrapeSIAKAD(nim: string): Promise<MahasiswaData | null> {
  const baseUrls = [
    'https://siakad.unesa.ac.id',
    'https://akademik.unesa.ac.id',
    'https://mahasiswa.unesa.ac.id',
  ]

  const paths = [
    `/api/mahasiswa/${nim}`,
    `/mahasiswa/${nim}`,
    `/api/v1/mahasiswa?nim=${nim}`,
    `/student/${nim}`,
  ]

  for (const baseUrl of baseUrls) {
    for (const path of paths) {
      try {
        const url = `${baseUrl}${path}`
        console.log(`🔄 Trying SIAKAD: ${url}`)
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/html',
          },
          signal: AbortSignal.timeout(10000)
        })

        if (response.ok) {
          const contentType = response.headers.get('content-type')
          
          if (contentType?.includes('application/json')) {
            const data = await response.json()
            console.log(`✅ Got JSON from SIAKAD:`, data)
            return parseSIAKADResponse(data)
          } else if (contentType?.includes('text/html')) {
            const html = await response.text()
            return parseSIAKADHTML(html)
          }
        }
      } catch (error) {
        continue
      }
    }
  }

  return null
}

/**
 * Method 3: Scrape dari multiple UNESA domains
 */
export async function scrapeUNESADomains(nim: string, name: string): Promise<MahasiswaData | null> {
  const domains = [
    'pd-unesa.unesa.ac.id',
    'cv.unesa.ac.id',
    'repository.unesa.ac.id',
    'elearning.unesa.ac.id',
    'lib.unesa.ac.id',
  ]

  for (const domain of domains) {
    try {
      console.log(`🔄 Trying domain: ${domain}`)
      
      // Try searching by NIM first
      let url = `https://${domain}/?s=${nim}`
      let response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const html = await response.text()
        const data = parseUNESAHTML(html, nim)
        if (data && (data.prodi || data.jenisKelamin)) {
          console.log(`✅ Found data in ${domain}`)
          return data
        }
      }

      // Try searching by name
      if (name) {
        url = `https://${domain}/?s=${encodeURIComponent(name)}`
        response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: AbortSignal.timeout(10000)
        })

        if (response.ok) {
          const html = await response.text()
          const data = parseUNESAHTML(html, nim)
          if (data && (data.prodi || data.jenisKelamin)) {
            console.log(`✅ Found data in ${domain} by name`)
            return data
          }
        }
      }
    } catch (error) {
      continue
    }
  }

  return null
}

/**
 * Method 4: Enhanced local database dengan pattern matching
 * Gunakan info dari NIM + name untuk infer data
 */
export function inferFromNIMAndName(nim: string, name: string): MahasiswaData {
  const result: MahasiswaData = { nim }

  // Extract info dari NIM format: YYFFPPPPNNN
  if (nim.length >= 11) {
    // YY = tahun (2 digit)
    const tahun = nim.substring(0, 2)
    const angkatan = 2000 + parseInt(tahun)
    result.angkatan = angkatan.toString()

    // FF = fakultas (2 digit)
    const fakultasKode = nim.substring(2, 4)
    const fakultasMap: Record<string, string> = {
      '01': 'Fakultas Ilmu Pendidikan',
      '02': 'Fakultas Bahasa dan Seni',
      '03': 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
      '04': 'Fakultas Ilmu Sosial dan Hukum',
      '05': 'Fakultas Teknik',
      '06': 'Fakultas Ilmu Keolahragaan',
      '07': 'Fakultas Ekonomi dan Bisnis',
      '08': 'Fakultas Vokasi',
    }
    result.fakultas = fakultasMap[fakultasKode] || null

    // PPPP = prodi (4 digit)
    const prodiKode = nim.substring(4, 8)
    const prodiMap: Record<string, string> = {
      '0974': 'S1 Pendidikan Teknologi Informasi',
      '0907': 'S1 Teknik Informatika',
      '0901': 'S1 Teknik Elektro',
      '0902': 'S1 Teknik Mesin',
      '0903': 'S1 Teknik Sipil',
      '0904': 'S1 Pendidikan Teknik Elektro',
      '0905': 'S1 Pendidikan Teknik Mesin',
      '0906': 'S1 Pendidikan Teknik Bangunan',
      // Add more as needed
    }
    result.prodi = prodiMap[prodiKode] || null

    // Semester awal biasanya Gasal (semester ganjil)
    const tahunAwal = angkatan
    const tahunAkhir = angkatan + 1
    result.semesterAwal = `${tahunAwal}/${tahunAkhir} Gasal`
  }

  // Infer gender dari nama dengan confidence tinggi - ENHANCED VERSION
  if (name) {
    const lowerName = name.toLowerCase().trim()
    
    // VERY High confidence male indicators (99%+)
    if (
      lowerName.startsWith('muhammad ') ||
      lowerName.startsWith('mohammad ') ||
      lowerName.startsWith('ahmad ') ||
      lowerName.startsWith('achmad ') ||
      lowerName.startsWith('m. ') ||
      lowerName.startsWith('moh. ') ||
      lowerName.startsWith('muh. ') ||
      lowerName.includes(' bin ') ||
      lowerName.match(/\b(abdul|abdur|abdus|abdil)\b/)
    ) {
      result.jenisKelamin = 'Laki - Laki'
      console.log(`✅ Gender detected (VERY HIGH confidence MALE): ${name}`)
    }
    // High confidence male indicators (90%+)
    else if (
      lowerName.match(/\b(achmad|agus|andi|andri|anwar|arif|bambang|bayu|budi|dedi|dicky|eko|fajar|hendra|imam|indra|irfan|joko|kurniawan|lukman|nugroho|pratama|putra|rahman|reza|rizki|rizky|saputra|satria|wahyu|yoga|yusuf)\b/)
    ) {
      result.jenisKelamin = 'Laki - Laki'
      console.log(`✅ Gender detected (HIGH confidence MALE): ${name}`)
    }
    // VERY High confidence female indicators (99%+)
    else if (
      lowerName.startsWith('siti ') ||
      lowerName.startsWith('dewi ') ||
      lowerName.startsWith('putri ') ||
      lowerName.startsWith('nurul ') ||
      lowerName.includes(' binti ') ||
      lowerName.endsWith('wati') ||
      lowerName.endsWith('ningsih') ||
      lowerName.endsWith('yani') ||
      lowerName.endsWith('yanti') ||
      lowerName.endsWith('wulan')
    ) {
      result.jenisKelamin = 'Perempuan'
      console.log(`✅ Gender detected (VERY HIGH confidence FEMALE): ${name}`)
    }
    // High confidence female indicators (90%+)
    else if (
      lowerName.match(/\b(ainun|aisyah|anisa|annisa|ayu|bella|bunga|cantika|citra|dian|dina|dwi|eka|fatimah|fitri|intan|kartika|laila|lestari|maya|mega|melinda|nadya|nur|puspa|rani|ratna|rini|sari|septia|shinta|sinta|sri|tiara|tika|tri|widya|wulandari|zahra|zalfa)\b/)
    ) {
      result.jenisKelamin = 'Perempuan'
      console.log(`✅ Gender detected (HIGH confidence FEMALE): ${name}`)
    }
    // Medium confidence based on ending patterns
    else if (lowerName.match(/\b(wan|man|din|han)$/)) {
      result.jenisKelamin = 'Laki - Laki'
      console.log(`✅ Gender detected (MEDIUM confidence MALE by ending): ${name}`)
    }
    else if (lowerName.match(/\b(ni|tun|ah)$/)) {
      result.jenisKelamin = 'Perempuan'
      console.log(`✅ Gender detected (MEDIUM confidence FEMALE by ending): ${name}`)
    }
    else {
      console.log(`⚠️ Gender cannot be detected with confidence: ${name}`)
    }
  }

  return result
}

/**
 * Helper: Parse Kemdikbud/PDDIKTI response
 */
function parseKemdikbudResponse(data: any): MahasiswaData {
  return {
    nim: data.nim || data.nomor_induk || null,
    nama: data.nama || data.nm_mhs || null,
    prodi: data.prodi || data.nm_prodi || data.program_studi || null,
    fakultas: data.fakultas || data.nm_fakultas || null,
    angkatan: data.angkatan || data.thn_masuk || null,
    jenisKelamin: normalizeGender(data.jenis_kelamin || data.gender || data.jk || null),
    semesterAwal: data.semester_awal || data.smt_masuk || null,
  }
}

/**
 * Helper: Parse SIAKAD response
 */
function parseSIAKADResponse(data: any): MahasiswaData | null {
  if (!data) return null
  
  // Handle nested data
  const studentData = data.mahasiswa || data.data || data.student || data

  return {
    nim: studentData.nim || studentData.student_id || null,
    nama: studentData.nama || studentData.name || null,
    prodi: studentData.prodi || studentData.program || studentData.study_program || null,
    fakultas: studentData.fakultas || studentData.faculty || null,
    angkatan: studentData.angkatan || studentData.batch || studentData.year || null,
    jenisKelamin: normalizeGender(studentData.jenis_kelamin || studentData.gender || null),
    semesterAwal: studentData.semester_awal || null,
  }
}

/**
 * Helper: Parse SIAKAD HTML
 */
function parseSIAKADHTML(html: string): MahasiswaData | null {
  // Simple pattern matching untuk HTML
  const nimMatch = html.match(/(?:NIM|Nomor Induk)[:\s]*(\d{8,})/i)
  const namaMatch = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i)
  const prodiMatch = html.match(/(?:Program Studi|Prodi)[:\s]*([^<\n]+)/i)
  const genderMatch = html.match(/(?:Jenis Kelamin)[:\s]*(Laki\s*-?\s*[Ll]aki|Perempuan)/i)

  if (!nimMatch) return null

  return {
    nim: nimMatch[1],
    nama: namaMatch ? namaMatch[1].trim() : null,
    prodi: prodiMatch ? prodiMatch[1].trim() : null,
    jenisKelamin: genderMatch ? normalizeGender(genderMatch[1]) : null,
    fakultas: null,
    angkatan: null,
    semesterAwal: null,
  }
}

/**
 * Helper: Parse generic UNESA HTML
 */
function parseUNESAHTML(html: string, nim: string): MahasiswaData | null {
  // Look for NIM in the HTML first
  if (!html.includes(nim)) return null

  const result: MahasiswaData = { nim }

  // Try to extract prodi
  const prodiMatch = html.match(/(?:Program Studi|Prodi)[:\s]*([^<\n]+?)(?:<|$)/i)
  if (prodiMatch) {
    result.prodi = prodiMatch[1].trim()
  }

  // Try to extract gender
  const genderMatch = html.match(/(?:Jenis Kelamin)[:\s]*(Laki\s*-?\s*[Ll]aki|Perempuan)/i)
  if (genderMatch) {
    result.jenisKelamin = normalizeGender(genderMatch[1])
  }

  // Try to extract fakultas
  const fakultasMatch = html.match(/(?:Fakultas)[:\s]*([^<\n]+?)(?:<|$)/i)
  if (fakultasMatch) {
    result.fakultas = fakultasMatch[1].trim()
  }

  return result
}

/**
 * Helper: Normalize gender value
 */
function normalizeGender(value: string | null): string | null {
  if (!value) return null
  
  const lower = value.toLowerCase().trim()
  
  if (lower.includes('laki') || lower === 'l' || lower === 'male' || lower === 'm') {
    return 'Laki - Laki'
  }
  if (lower.includes('perempuan') || lower === 'p' || lower === 'female' || lower === 'f') {
    return 'Perempuan'
  }
  
  return null
}

/**
 * Master function: Try all methods in sequence
 */
export async function getAllMethodsMahasiswaData(
  nim: string,
  name: string
): Promise<MahasiswaData> {
  console.log('🚀 Starting comprehensive data fetch...')
  
  // Start with inference (instant, always works)
  const inferredData = inferFromNIMAndName(nim, name)
  console.log('📝 Inferred data:', inferredData)
  
  // Try scraping methods in parallel for speed
  const promises = [
    scrapePDDIKTIAlternative(nim),
    scrapeSIAKAD(nim),
    scrapeUNESADomains(nim, name),
  ]
  
  const results = await Promise.allSettled(promises)
  
  // Merge all results, preferring scraped data over inferred
  let finalData = { ...inferredData }
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      const methodNames = ['PDDIKTI Alt', 'SIAKAD', 'UNESA Domains']
      console.log(`✅ ${methodNames[index]} returned data:`, result.value)
      
      // Merge, preferring non-null scraped values
      Object.entries(result.value).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          finalData[key as keyof MahasiswaData] = value as any
        }
      })
    }
  })
  
  console.log('🎉 Final merged data:', finalData)
  return finalData
}
