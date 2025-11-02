// lib/unesa-scraper.ts
// Scraper untuk mengambil data dari cv.unesa.ac.id dan pd-unesa.unesa.ac.id

interface DosenInfo {
  nip: string | null;
  nama: string | null;
  nidn: string | null;
  jabatan: string | null;
  email: string | null;
  prodi: string | null;
  fakultas: string | null;
}

interface MahasiswaInfo {
  nim: string | null;
  nama: string | null;
  prodi: string | null;
  fakultas: string | null;
  angkatan: string | null;
  status: string | null;
}

/**
 * Scrape NIP dosen dari cv.unesa.ac.id berdasarkan nama
 * @param namaLengkap - Nama lengkap dosen yang akan dicari
 * @returns DosenInfo object atau null jika tidak ditemukan
 */
export async function scrapeNIPDosen(namaLengkap: string): Promise<DosenInfo | null> {
  try {
    console.log(`🔍 Mencari NIP untuk dosen: ${namaLengkap}`);
    
    // Encode nama untuk URL
    const searchQuery = encodeURIComponent(namaLengkap);
    const searchUrl = `https://cv.unesa.ac.id/?s=${searchQuery}`;
    
    console.log(`📡 Fetching URL: ${searchUrl}`);
    
    // Fetch halaman pencarian
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    
    // Parse HTML untuk mencari informasi dosen
    // Mencari pattern NIP di halaman
    const nipPattern = /(?:NIP[:\s]+)?(\d{18})/gi;
    const nipMatches = html.match(nipPattern);
    
    if (!nipMatches || nipMatches.length === 0) {
      console.log(`⚠️ NIP tidak ditemukan untuk ${namaLengkap}`);
      
      // Coba cari link profil dosen
      const profileLinkPattern = /<a[^>]+href=["'](https?:\/\/cv\.unesa\.ac\.id\/[^"']+)["'][^>]*>/gi;
      const links = Array.from(html.matchAll(profileLinkPattern));
      
      if (links.length > 0) {
        console.log(`🔗 Ditemukan ${links.length} link profil, mencoba fetch detail...`);
        
        // Ambil profil pertama yang cocok
        for (const linkMatch of links) {
          const profileUrl = linkMatch[1];
          console.log(`📄 Checking profile: ${profileUrl}`);
          
          const profileResponse = await fetch(profileUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });
          
          if (profileResponse.ok) {
            const profileHtml = await profileResponse.text();
            const profileNipMatches = profileHtml.match(nipPattern);
            
            if (profileNipMatches && profileNipMatches.length > 0) {
              // Extract NIP (18 digit number)
              const nipMatch = profileNipMatches[0].match(/\d{18}/);
              if (nipMatch) {
                const nip = nipMatch[0];
                console.log(`✅ NIP ditemukan di profil: ${nip}`);
                
                // Extract additional info
                const namaPattern = /<h1[^>]*>([^<]+)<\/h1>/i;
                const namaMatch = profileHtml.match(namaPattern);
                
                const nidnPattern = /NIDN[:\s]+(\d+)/i;
                const nidnMatch = profileHtml.match(nidnPattern);
                
                const emailPattern = /([a-zA-Z0-9._%+-]+@unesa\.ac\.id)/i;
                const emailMatch = profileHtml.match(emailPattern);
                
                // Extract prodi dan fakultas
                const prodiPattern = /(?:Program Studi|Prodi)[:\s]*([^<\n]+)/i;
                const prodiMatch = profileHtml.match(prodiPattern);
                
                const fakultasPattern = /(?:Fakultas)[:\s]*([^<\n]+)/i;
                const fakultasMatch = profileHtml.match(fakultasPattern);
                
                return {
                  nip,
                  nama: namaMatch ? namaMatch[1].trim() : namaLengkap,
                  nidn: nidnMatch ? nidnMatch[1] : null,
                  jabatan: null,
                  email: emailMatch ? emailMatch[1] : null,
                  prodi: prodiMatch ? prodiMatch[1].trim() : null,
                  fakultas: fakultasMatch ? fakultasMatch[1].trim() : null,
                };
              }
            }
          }
        }
      }
      
      return null;
    }

    // Extract NIP (18 digit number)
    const nipMatch = nipMatches[0].match(/\d{18}/);
    if (!nipMatch) {
      console.log(`⚠️ Format NIP tidak valid`);
      return null;
    }

    const nip = nipMatch[0];
    console.log(`✅ NIP ditemukan: ${nip}`);

    // Try to extract additional information
    const namaPattern = /<h[1-3][^>]*>([^<]*${namaLengkap.split(' ')[0]}[^<]*)<\/h[1-3]>/i;
    const namaMatch = html.match(namaPattern);
    
    const nidnPattern = /NIDN[:\s]+(\d+)/i;
    const nidnMatch = html.match(nidnPattern);
    
    const emailPattern = /([a-zA-Z0-9._%+-]+@unesa\.ac\.id)/i;
    const emailMatch = html.match(emailPattern);
    
    // Extract prodi dan fakultas
    const prodiPattern = /(?:Program Studi|Prodi)[:\s]*([^<\n]+)/i;
    const prodiMatch = html.match(prodiPattern);
    
    const fakultasPattern = /(?:Fakultas)[:\s]*([^<\n]+)/i;
    const fakultasMatch = html.match(fakultasPattern);

    return {
      nip,
      nama: namaMatch ? namaMatch[1].trim() : namaLengkap,
      nidn: nidnMatch ? nidnMatch[1] : null,
      jabatan: null,
      email: emailMatch ? emailMatch[1] : null,
      prodi: prodiMatch ? prodiMatch[1].trim() : null,
      fakultas: fakultasMatch ? fakultasMatch[1].trim() : null,
    };

  } catch (error) {
    console.error('❌ Error scraping NIP dosen:', error);
    return null;
  }
}

/**
 * Cari NIP dosen dengan berbagai variasi nama
 * @param namaLengkap - Nama lengkap dosen
 * @returns DosenInfo object atau null jika tidak ditemukan
 */
export async function cariNIPDosen(namaLengkap: string): Promise<DosenInfo | null> {
  console.log(`🔎 Memulai pencarian NIP untuk: ${namaLengkap}`);
  
  // Coba pencarian dengan nama lengkap
  let result = await scrapeNIPDosen(namaLengkap);
  if (result) return result;

  // Jika tidak ditemukan, coba dengan variasi nama
  const namaParts = namaLengkap.split(' ').filter(part => part.length > 0);
  
  if (namaParts.length >= 2) {
    // Coba hanya nama depan dan nama belakang
    const namaDepanBelakang = `${namaParts[0]} ${namaParts[namaParts.length - 1]}`;
    console.log(`🔄 Mencoba variasi: ${namaDepanBelakang}`);
    result = await scrapeNIPDosen(namaDepanBelakang);
    if (result) return result;

    // Coba hanya nama depan
    console.log(`🔄 Mencoba hanya nama depan: ${namaParts[0]}`);
    result = await scrapeNIPDosen(namaParts[0]);
    if (result) return result;
  }

  console.log(`❌ NIP tidak ditemukan setelah semua variasi percobaan`);
  return null;
}

/**
 * Validasi format NIP (18 digit)
 * @param nip - NIP yang akan divalidasi
 * @returns boolean
 */
export function validateNIP(nip: string): boolean {
  return /^\d{18}$/.test(nip);
}

/**
 * Scrape data mahasiswa dari pd-unesa.unesa.ac.id berdasarkan nama
 * @param namaLengkap - Nama lengkap mahasiswa
 * @returns MahasiswaInfo object atau null jika tidak ditemukan
 */
export async function scrapeDataMahasiswaByNama(namaLengkap: string): Promise<MahasiswaInfo | null> {
  try {
    console.log(`🔍 Mencari data mahasiswa untuk nama: ${namaLengkap}`);
    
    // Encode nama untuk URL
    const searchQuery = encodeURIComponent(namaLengkap);
    const searchUrl = `https://pd-unesa.unesa.ac.id/?s=${searchQuery}`;
    
    console.log(`📡 Fetching URL: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    
    // Try to find profile link in search results
    const profileLinkPattern = /<a[^>]+href=["'](https?:\/\/pd-unesa\.unesa\.ac\.id\/[^"']+)["'][^>]*>/gi;
    const links = Array.from(html.matchAll(profileLinkPattern));
    
    if (links.length > 0) {
      console.log(`� Ditemukan ${links.length} link profil mahasiswa`);
      
      // Try first profile link
      for (const linkMatch of links) {
        const profileUrl = linkMatch[1];
        
        // Skip generic pages
        if (profileUrl.includes('?s=') || profileUrl.includes('/page/')) {
          continue;
        }
        
        console.log(`📄 Checking profile: ${profileUrl}`);
        
        const profileResponse = await fetch(profileUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        
        if (profileResponse.ok) {
          const profileHtml = await profileResponse.text();
          const mahasiswaData = parseMahasiswaHTML(profileHtml);
          
          if (mahasiswaData && mahasiswaData.nim) {
            console.log(`✅ Data mahasiswa ditemukan di profil`);
            return mahasiswaData;
          }
        }
      }
    }
    
    // If no profile link found, try to parse search results directly
    return parseMahasiswaHTML(html);

  } catch (error) {
    console.error('❌ Error scraping data mahasiswa:', error);
    return null;
  }
}

/**
 * Scrape data mahasiswa dari pd-unesa.unesa.ac.id berdasarkan NIM
 * @param nim - NIM mahasiswa
 * @returns MahasiswaInfo object atau null jika tidak ditemukan
 */
export async function scrapeDataMahasiswa(nim: string): Promise<MahasiswaInfo | null> {
  try {
    console.log(`🔍 Mencari data mahasiswa untuk NIM: ${nim}`);
    
    // URL pencarian di pd-unesa
    const searchUrl = `https://pd-unesa.unesa.ac.id/?s=${nim}`;
    
    console.log(`📡 Fetching URL: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    return parseMahasiswaHTML(html);

  } catch (error) {
    console.error('❌ Error scraping data mahasiswa:', error);
    return null;
  }
}

/**
 * Parse HTML untuk extract data mahasiswa
 * @param html - HTML content
 * @returns MahasiswaInfo object atau null
 */
function parseMahasiswaHTML(html: string): MahasiswaInfo | null {
  try {
    // Pattern untuk NIM (berbagai format)
    const nimPatterns = [
      /(?:NIM|Nomor Induk)[:\s]*(\d{8,})/i,
      /<td[^>]*>NIM<\/td>\s*<td[^>]*>(\d{8,})<\/td>/i,
      /\b(\d{11})\b/i, // 11 digit NIM format
    ];
    let nimMatch = null;
    for (const pattern of nimPatterns) {
      nimMatch = html.match(pattern);
      if (nimMatch && nimMatch[1]) {
        // Validate it's a proper NIM (at least 8 digits)
        if (/^\d{8,}$/.test(nimMatch[1])) {
          break;
        }
      }
      nimMatch = null;
    }
    
    // Pattern untuk nama
    const namaPatterns = [
      /<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i,
      /(?:Nama|Name)[:\s]*([^<\n]+)/i,
      /<td[^>]*>Nama<\/td>\s*<td[^>]*>([^<]+)<\/td>/i,
    ];
    let namaMatch = null;
    for (const pattern of namaPatterns) {
      namaMatch = html.match(pattern);
      if (namaMatch) break;
    }
    
    // Pattern untuk prodi
    const prodiPatterns = [
      /(?:Program Studi|Prodi|Program)[:\s]*([^<\n]+)/i,
      /<td[^>]*>Program Studi<\/td>\s*<td[^>]*>([^<]+)<\/td>/i,
      /<td[^>]*>Prodi<\/td>\s*<td[^>]*>([^<]+)<\/td>/i,
    ];
    let prodiMatch = null;
    for (const pattern of prodiPatterns) {
      prodiMatch = html.match(pattern);
      if (prodiMatch) break;
    }
    
    // Pattern untuk fakultas
    const fakultasPatterns = [
      /(?:Fakultas)[:\s]*([^<\n]+)/i,
      /<td[^>]*>Fakultas<\/td>\s*<td[^>]*>([^<]+)<\/td>/i,
    ];
    let fakultasMatch = null;
    for (const pattern of fakultasPatterns) {
      fakultasMatch = html.match(pattern);
      if (fakultasMatch) break;
    }
    
    // Pattern untuk angkatan
    const angkatanPatterns = [
      /(?:Angkatan|Tahun Masuk)[:\s]*(\d{4})/i,
      /<td[^>]*>Angkatan<\/td>\s*<td[^>]*>(\d{4})<\/td>/i,
    ];
    let angkatanMatch = null;
    for (const pattern of angkatanPatterns) {
      angkatanMatch = html.match(pattern);
      if (angkatanMatch) break;
    }
    
    // Pattern untuk status
    const statusPatterns = [
      /(?:Status)[:\s]*([^<\n]+)/i,
      /<td[^>]*>Status<\/td>\s*<td[^>]*>([^<]+)<\/td>/i,
    ];
    let statusMatch = null;
    for (const pattern of statusPatterns) {
      statusMatch = html.match(pattern);
      if (statusMatch) break;
    }
    
    // Jika tidak ada NIM yang ditemukan, return null
    if (!nimMatch || !nimMatch[1]) {
      console.log(`⚠️ NIM tidak ditemukan di halaman`);
      return null;
    }
    
    console.log(`✅ Data mahasiswa ditemukan dengan NIM: ${nimMatch[1]}`);
    
    return {
      nim: nimMatch[1],
      nama: namaMatch ? namaMatch[1].trim() : null,
      prodi: prodiMatch ? prodiMatch[1].trim() : null,
      fakultas: fakultasMatch ? fakultasMatch[1].trim() : null,
      angkatan: angkatanMatch ? angkatanMatch[1] : null,
      status: statusMatch ? statusMatch[1].trim() : 'Aktif',
    };
    
  } catch (error) {
    console.error('❌ Error parsing mahasiswa HTML:', error);
    return null;
  }
}

/**
 * Cari data mahasiswa dengan berbagai metode
 * @param identifier - Bisa berupa nama lengkap atau NIM
 * @returns MahasiswaInfo object atau null jika tidak ditemukan
 */
export async function cariDataMahasiswa(identifier: string): Promise<MahasiswaInfo | null> {
  console.log(`🔎 Memulai pencarian data mahasiswa: ${identifier}`);
  
  // Check if identifier is a NIM (all digits, at least 8 characters)
  const isNIM = /^\d{8,}$/.test(identifier);
  
  let result: MahasiswaInfo | null = null;
  
  if (isNIM) {
    // Search by NIM
    console.log('📝 Searching by NIM...');
    result = await scrapeDataMahasiswa(identifier);
  } else {
    // Search by name
    console.log('📝 Searching by name...');
    result = await scrapeDataMahasiswaByNama(identifier);
    
    // If not found, try with variations
    if (!result) {
      const namaParts = identifier.split(' ').filter(part => part.length > 0);
      
      if (namaParts.length >= 2) {
        // Try first and last name only
        const namaDepanBelakang = `${namaParts[0]} ${namaParts[namaParts.length - 1]}`;
        console.log(`🔄 Mencoba variasi: ${namaDepanBelakang}`);
        result = await scrapeDataMahasiswaByNama(namaDepanBelakang);
      }
    }
  }
  
  if (!result) {
    console.log(`❌ Data mahasiswa tidak ditemukan untuk: ${identifier}`);
  }
  
  return result;
}

/**
 * Validasi format NIM (minimal 8 digit)
 * @param nim - NIM yang akan divalidasi
 * @returns boolean
 */
export function validateNIM(nim: string): boolean {
  return /^\d{8,}$/.test(nim);
}
