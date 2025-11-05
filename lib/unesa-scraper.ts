// lib/unesa-scraper.ts
// Multi-source scraper untuk mengambil data mahasiswa dan dosen
// Sources: 1) PDDIKTI API, 2) pd-unesa.unesa.ac.id, 3) Local Database, 4) Gender Detection

import { searchMahasiswaByNIM, searchMahasiswaByName, filterUNESAStudents } from './pddikti-api'
import { getProdiFromNIM, getFakultasFromNIM, getAngkatanFromNIM, validateNIM as validateNIMFormat } from './unesa-database'
import { detectGenderFromName, getGenderConfidence } from './gender-detector'

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
  jenisKelamin: string | null;
  semesterAwal: string | null;
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
    
    // Check if we were redirected to a search-data/tmp page or direct profile
    const finalUrl = response.url;
    console.log(`📍 Final URL: ${finalUrl}`);
    
    // If we're on a search results page, try to find profile links
    if (finalUrl.includes('/?s=') || html.includes('search-results') || html.includes('pencarian')) {
      console.log('📋 Detected search results page, looking for profile links...');
      
      // Pattern for profile links - more flexible
      const profileLinkPattern = /<a[^>]+href=["'](https?:\/\/pd-unesa\.unesa\.ac\.id\/[^"']+)["'][^>]*>/gi;
      const links = Array.from(html.matchAll(profileLinkPattern));
      
      if (links.length > 0) {
        console.log(`🔗 Ditemukan ${links.length} total links`);
        
        // Filter and try valid profile links
        const validLinks = links
          .map(m => m[1])
          .filter(url => 
            !url.includes('?s=') && 
            !url.includes('/page/') && 
            !url.endsWith('/') &&
            !url.includes('/category/') &&
            !url.includes('/tag/') &&
            !url.includes('#') &&
            url.length > 30 // Profile URLs are usually longer
          );
        
        console.log(`� Found ${validLinks.length} potential profile links`);
        
        for (const profileUrl of validLinks) {
          console.log(`📄 Trying profile: ${profileUrl}`);
          
          try {
            const profileResponse = await fetch(profileUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            });
            
            if (profileResponse.ok) {
              const profileHtml = await profileResponse.text();
              const mahasiswaData = parseMahasiswaHTML(profileHtml);
              
              if (mahasiswaData && mahasiswaData.nim && mahasiswaData.nim === nim) {
                console.log(`✅ Data mahasiswa ditemukan di profil: ${profileUrl}`);
                return mahasiswaData;
              } else if (mahasiswaData && mahasiswaData.nim) {
                console.log(`⚠️ Found profile but NIM doesn't match: ${mahasiswaData.nim} !== ${nim}`);
              }
            }
          } catch (err) {
            console.warn(`⚠️ Failed to fetch profile ${profileUrl}`);
            continue;
          }
        }
      }
    }
    
    // Fallback: parse search results directly
    console.log('📋 Trying to parse search results directly...');
    const directResult = parseMahasiswaHTML(html);
    
    // If we got partial data without NIM, add the searched NIM
    if (directResult && !directResult.nim) {
      console.log('📝 Adding searched NIM to partial data...');
      directResult.nim = nim;
      return directResult;
    }
    
    // If no result but we know the NIM exists in HTML, try to extract what we can
    if (!directResult && html.includes(nim)) {
      console.log('📝 NIM found in HTML but data not fully extracted, trying partial extraction...');
      const partialData = parseMahasiswaHTML(html);
      if (partialData) {
        partialData.nim = nim;
        return partialData;
      }
    }
    
    return directResult;

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
    // Debug: Log relevant parts of HTML for inspection
    console.log('🔍 Parsing HTML length:', html.length);
    
    // Extract and log table data if present
    const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/i);
    if (tableMatch) {
      console.log('📋 Found table in HTML');
      // Log a snippet of the table
      const tableSnippet = tableMatch[0].substring(0, 500);
      console.log('Table snippet:', tableSnippet);
    }
    
    // Pattern untuk NIM (berbagai format)
    const nimPatterns = [
      // HTML table patterns
      /<td[^>]*>\s*(?:NIM|Nomor Induk Mahasiswa)\s*<\/td>\s*<td[^>]*>\s*:\s*<\/td>\s*<td[^>]*>\s*(\d{8,})\s*<\/td>/i,
      /<td[^>]*>\s*(?:NIM|Nomor Induk)\s*<\/td>\s*<td[^>]*>\s*(\d{8,})\s*<\/td>/i,
      /(?:NIM|Nomor Induk)[:\s]*(\d{8,})/i,
      /\b(\d{11})\b/i, // 11 digit NIM format
    ];
    let nimMatch = null;
    for (const pattern of nimPatterns) {
      nimMatch = html.match(pattern);
      if (nimMatch && nimMatch[1]) {
        // Validate it's a proper NIM (at least 8 digits)
        if (/^\d{8,}$/.test(nimMatch[1])) {
          console.log('✅ NIM found:', nimMatch[1]);
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
      // Pattern untuk HTML table dengan tiga kolom (Label : Value)
      /<td[^>]*>\s*Program Studi\s*<\/td>\s*<td[^>]*>\s*:\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/i,
      /<td[^>]*>\s*Program Studi\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/i,
      // Pattern untuk text dengan colon
      /Program Studi\s*:?\s*([^\n<]+?)(?:\s*<|$)/i,
      /Prodi\s*:?\s*([^\n<]+?)(?:\s*<|$)/i,
      // Generic fallback
      /(?:Program Studi|Prodi)[:\s]*([^<\n]+)/i,
    ];
    let prodiMatch = null;
    for (const pattern of prodiPatterns) {
      prodiMatch = html.match(pattern);
      if (prodiMatch && prodiMatch[1]) {
        const value = prodiMatch[1].trim();
        // Filter out empty or invalid values
        if (value && value.length > 2 && !value.includes('<?') && !value.includes('?>')) {
          console.log('✅ Program Studi found:', value);
          break;
        }
      }
      prodiMatch = null;
    }
    
    // Additional debug for prodi
    if (!prodiMatch) {
      console.log('⚠️ Program Studi not found with patterns, trying broader search...');
      // Try to find common prodi names
      const commonProdiPattern = /(S1 Pendidikan Teknologi Informasi|Pendidikan Teknologi Informasi|PTI|Teknik Informatika)/i;
      const broadMatch = html.match(commonProdiPattern);
      if (broadMatch) {
        console.log('✅ Found common Prodi pattern:', broadMatch[0]);
        prodiMatch = { 1: broadMatch[0].trim() } as any;
      }
    }
    
    // Pattern untuk jenjang (could be combined with prodi)
    const jenjangPatterns = [
      /<td[^>]*>\s*Jenjang\s*<\/td>\s*<td[^>]*>\s*:\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/i,
      /<td[^>]*>\s*Jenjang\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/i,
      /Jenjang\s*:?\s*([^\n<]+?)(?:\s*<|$)/i,
    ];
    let jenjangMatch = null;
    for (const pattern of jenjangPatterns) {
      jenjangMatch = html.match(pattern);
      if (jenjangMatch && jenjangMatch[1]) {
        const value = jenjangMatch[1].trim();
        if (value && value.length > 0) {
          console.log('✅ Jenjang found:', value);
          // If prodi not found but jenjang found, we might be able to combine them
          if (!prodiMatch && value.toUpperCase().includes('S1')) {
            console.log('📝 Using Jenjang as part of Prodi info');
          }
          break;
        }
      }
      jenjangMatch = null;
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
    
    // Pattern untuk jenis kelamin
    const jenisKelaminPatterns = [
      // Pattern untuk HTML table structure
      /<td[^>]*>\s*Jenis Kelamin\s*<\/td>\s*<td[^>]*>\s*:\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/i,
      /<td[^>]*>\s*Jenis Kelamin\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/i,
      // Pattern untuk text dengan colon
      /Jenis Kelamin\s*:?\s*(Laki\s*-?\s*[Ll]aki|Perempuan)/i,
      /Gender\s*:?\s*(Laki\s*-?\s*[Ll]aki|Perempuan|Male|Female)/i,
      // Generic pattern
      /(?:Jenis Kelamin|Gender)[:\s]*([^<\n]+)/i,
    ];
    let jenisKelaminMatch = null;
    for (const pattern of jenisKelaminPatterns) {
      jenisKelaminMatch = html.match(pattern);
      if (jenisKelaminMatch && jenisKelaminMatch[1]) {
        // Normalize the value
        const value = jenisKelaminMatch[1].trim();
        if (value && (value.toLowerCase().includes('laki') || value.toLowerCase() === 'l' || value.toLowerCase() === 'male')) {
          jenisKelaminMatch[1] = 'Laki - Laki';
          console.log('✅ Jenis Kelamin found: Laki - Laki');
          break;
        } else if (value && (value.toLowerCase().includes('perempuan') || value.toLowerCase() === 'p' || value.toLowerCase() === 'female')) {
          jenisKelaminMatch[1] = 'Perempuan';
          console.log('✅ Jenis Kelamin found: Perempuan');
          break;
        }
      }
      jenisKelaminMatch = null;
    }
    
    // Additional debug logging for jenis kelamin
    if (!jenisKelaminMatch) {
      console.log('⚠️ Jenis Kelamin not found, trying broader search...');
      // Try to find any mention of Laki-laki or Perempuan in the HTML
      if (/Laki\s*-?\s*[Ll]aki/i.test(html)) {
        console.log('✅ Found "Laki-laki" in HTML');
        jenisKelaminMatch = { 1: 'Laki - Laki' } as any;
      } else if (/Perempuan/i.test(html)) {
        console.log('✅ Found "Perempuan" in HTML');
        jenisKelaminMatch = { 1: 'Perempuan' } as any;
      }
    }
    
    // Pattern untuk semester awal
    const semesterAwalPatterns = [
      // Pattern untuk HTML table dengan tiga kolom (Label : Value)
      /<td[^>]*>\s*Semester Awal\s*<\/td>\s*<td[^>]*>\s*:\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/i,
      /<td[^>]*>\s*Semester Awal\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/i,
      // Pattern untuk text dengan colon
      /Semester Awal\s*:?\s*([^\n<]+?)(?:\s*<|$)/i,
      /Periode Masuk\s*:?\s*([^\n<]+?)(?:\s*<|$)/i,
      // Pattern untuk format tahun dengan "Gasal" atau "Ganjil"
      /(\d{4}\/\d{4}\s+(?:Gasal|Ganjil|Genap))/i,
      // Generic fallback
      /(?:Semester Awal|Periode Masuk|Semester Masuk)[:\s]*([^<\n]+)/i,
    ];
    let semesterAwalMatch = null;
    for (const pattern of semesterAwalPatterns) {
      semesterAwalMatch = html.match(pattern);
      if (semesterAwalMatch && semesterAwalMatch[1]) {
        const value = semesterAwalMatch[1].trim();
        // Filter out empty or invalid values
        if (value && value.length > 4 && !value.includes('<?') && !value.includes('?>')) {
          console.log('✅ Semester Awal found:', value);
          break;
        }
      }
      semesterAwalMatch = null;
    }
    
    // Additional debug for semester awal
    if (!semesterAwalMatch) {
      console.log('⚠️ Semester Awal not found with patterns, trying broader search...');
      // Try to find year pattern like "2022/2023 Gasal"
      const yearPattern = /\b(\d{4}\/\d{4}\s+(?:Gasal|Ganjil|Genap))\b/i;
      const yearMatch = html.match(yearPattern);
      if (yearMatch) {
        console.log('✅ Found year pattern for Semester Awal:', yearMatch[1]);
        semesterAwalMatch = { 1: yearMatch[1].trim() } as any;
      }
    }
    
    // Log all found data
    console.log('📊 Parsed data summary:');
    console.log('  - NIM:', nimMatch ? nimMatch[1] : 'NOT FOUND');
    console.log('  - Nama:', namaMatch ? namaMatch[1].trim() : 'NOT FOUND');
    console.log('  - Prodi:', prodiMatch ? prodiMatch[1].trim() : 'NOT FOUND');
    console.log('  - Fakultas:', fakultasMatch ? fakultasMatch[1].trim() : 'NOT FOUND');
    console.log('  - Angkatan:', angkatanMatch ? angkatanMatch[1] : 'NOT FOUND');
    console.log('  - Status:', statusMatch ? statusMatch[1].trim() : 'NOT FOUND');
    console.log('  - Jenis Kelamin:', jenisKelaminMatch ? jenisKelaminMatch[1].trim() : 'NOT FOUND');
    console.log('  - Semester Awal:', semesterAwalMatch ? semesterAwalMatch[1].trim() : 'NOT FOUND');
    
    // Return data even if NIM not found (will be filled by caller if available)
    if (!nimMatch || !nimMatch[1]) {
      console.log(`⚠️ NIM tidak ditemukan di halaman, tetapi returning data lainnya...`);
      
      // Return partial data if we have at least some information
      if (namaMatch || prodiMatch || jenisKelaminMatch || semesterAwalMatch) {
        console.log(`✅ Returning partial data without NIM`);
        return {
          nim: null, // Will be filled by caller
          nama: namaMatch ? namaMatch[1].trim() : null,
          prodi: prodiMatch ? prodiMatch[1].trim() : null,
          fakultas: fakultasMatch ? fakultasMatch[1].trim() : null,
          angkatan: angkatanMatch ? angkatanMatch[1] : null,
          status: statusMatch ? statusMatch[1].trim() : null,
          jenisKelamin: jenisKelaminMatch ? jenisKelaminMatch[1].trim() : null,
          semesterAwal: semesterAwalMatch ? semesterAwalMatch[1].trim() : null,
        };
      }
      
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
      jenisKelamin: jenisKelaminMatch ? jenisKelaminMatch[1].trim() : null,
      semesterAwal: semesterAwalMatch ? semesterAwalMatch[1].trim() : null,
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

/**
 * Multi-source mahasiswa data fetcher
 * Strategy: 1) PDDIKTI API, 2) pd-unesa scraper, 3) Local DB + Gender detection
 * @param identifier - NIM or name
 * @param name - Optional name for gender detection
 * @returns MahasiswaInfo with combined data from multiple sources
 */
export async function getMahasiswaDataMultiSource(
  identifier: string,
  name?: string
): Promise<MahasiswaInfo | null> {
  console.log(`🎯 [MULTI-SOURCE] Starting data fetch for: ${identifier}`)
  
  let result: MahasiswaInfo | null = null
  const isNIM = /^\d{8,}$/.test(identifier)
  
  // Source 1: Try PDDIKTI API first (most reliable)
  try {
    console.log(`🔄 [MULTI-SOURCE] Trying PDDIKTI API...`)
    
    if (isNIM) {
      const pddiktiData = await searchMahasiswaByNIM(identifier)
      if (pddiktiData) {
        console.log(`✅ [MULTI-SOURCE] Found data from PDDIKTI`)
        result = {
          nim: pddiktiData.nim,
          nama: pddiktiData.nama,
          prodi: pddiktiData.prodi,
          fakultas: pddiktiData.fakultas,
          angkatan: pddiktiData.tanggal_masuk ? pddiktiData.tanggal_masuk.substring(0, 4) : null,
          status: pddiktiData.status,
          jenisKelamin: null, // Will be filled by gender detection
          semesterAwal: pddiktiData.tanggal_masuk || null,
        }
      }
    } else if (name) {
      const pddiktiResults = await searchMahasiswaByName(name)
      const unesaStudents = filterUNESAStudents(pddiktiResults)
      
      if (unesaStudents.length > 0) {
        const pddiktiData = unesaStudents[0]
        console.log(`✅ [MULTI-SOURCE] Found data from PDDIKTI by name`)
        result = {
          nim: pddiktiData.nim,
          nama: pddiktiData.nama,
          prodi: pddiktiData.prodi,
          fakultas: pddiktiData.fakultas,
          angkatan: pddiktiData.tanggal_masuk ? pddiktiData.tanggal_masuk.substring(0, 4) : null,
          status: pddiktiData.status,
          jenisKelamin: null,
          semesterAwal: pddiktiData.tanggal_masuk || null,
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ [MULTI-SOURCE] PDDIKTI API failed:`, error)
  }
  
  // Source 2: Try pd-unesa scraper if PDDIKTI failed or data incomplete
  if (!result || !result.jenisKelamin || !result.semesterAwal) {
    try {
      console.log(`🔄 [MULTI-SOURCE] Trying pd-unesa scraper...`)
      const pdUnesaData = await cariDataMahasiswa(identifier)
      
      if (pdUnesaData) {
        console.log(`✅ [MULTI-SOURCE] Found data from pd-unesa`)
        
        if (!result) {
          result = pdUnesaData
        } else {
          // Merge data - prefer pd-unesa for specific fields
          if (pdUnesaData.jenisKelamin) result.jenisKelamin = pdUnesaData.jenisKelamin
          if (pdUnesaData.semesterAwal) result.semesterAwal = pdUnesaData.semesterAwal
          if (pdUnesaData.prodi && !result.prodi) result.prodi = pdUnesaData.prodi
          if (pdUnesaData.fakultas && !result.fakultas) result.fakultas = pdUnesaData.fakultas
        }
      }
    } catch (error) {
      console.warn(`⚠️ [MULTI-SOURCE] pd-unesa scraper failed:`, error)
    }
  }
  
  // Source 3: Use local database for prodi/fakultas if still missing
  if (result && result.nim && (!result.prodi || !result.fakultas)) {
    console.log(`🔄 [MULTI-SOURCE] Using local database for prodi/fakultas...`)
    
    const prodiInfo = getProdiFromNIM(result.nim)
    const fakultasInfo = getFakultasFromNIM(result.nim)
    
    if (prodiInfo && !result.prodi) {
      result.prodi = `${prodiInfo.jenjang} ${prodiInfo.nama}`
      console.log(`✅ [MULTI-SOURCE] Prodi from local DB: ${result.prodi}`)
    }
    
    if (fakultasInfo && !result.fakultas) {
      result.fakultas = fakultasInfo.nama
      console.log(`✅ [MULTI-SOURCE] Fakultas from local DB: ${result.fakultas}`)
    }
  }
  
  // Source 4: Gender detection from name if still missing (LOWERED THRESHOLD)
  if (result && !result.jenisKelamin) {
    const nameForDetection = result.nama || name
    if (nameForDetection) {
      console.log(`🔄 [MULTI-SOURCE] Detecting gender from name: "${nameForDetection}"`)
      const detectedGender = detectGenderFromName(nameForDetection)
      const confidence = getGenderConfidence(nameForDetection)
      
      // Lowered threshold from 50% to 30% for better coverage
      if (detectedGender && confidence >= 30) {
        result.jenisKelamin = detectedGender
        console.log(`✅ [MULTI-SOURCE] Gender detected: ${detectedGender} (confidence: ${confidence}%)`)
      } else if (detectedGender) {
        // Even if confidence is low, still use it as last resort
        result.jenisKelamin = detectedGender
        console.log(`⚠️ [MULTI-SOURCE] Gender detected with LOW confidence: ${detectedGender} (${confidence}%)`)
      } else {
        console.log(`❌ [MULTI-SOURCE] Could not detect gender from name: "${nameForDetection}"`)
      }
    }
  }
  
  // Fill angkatan from NIM if missing
  if (result && result.nim && !result.angkatan) {
    const angkatan = getAngkatanFromNIM(result.nim)
    if (angkatan) {
      result.angkatan = angkatan.toString()
      console.log(`✅ [MULTI-SOURCE] Angkatan from NIM: ${result.angkatan}`)
    }
  }
  
  // Source 5: Try alternative scraping methods if still incomplete (especially gender!)
  if (!result || !result.jenisKelamin || !result.prodi || !result.semesterAwal) {
    console.log(`🔄 [MULTI-SOURCE] Data still incomplete, trying alternative scraping methods...`)
    console.log(`   Missing: ${!result?.jenisKelamin ? 'jenisKelamin ' : ''}${!result?.prodi ? 'prodi ' : ''}${!result?.semesterAwal ? 'semesterAwal' : ''}`)
    
    try {
      const { getAllMethodsMahasiswaData } = await import('./alternative-scrapers')
      const altData = await getAllMethodsMahasiswaData(identifier, name || result?.nama || '')
      
      if (altData) {
        console.log(`✅ [MULTI-SOURCE] Got data from alternative methods:`, altData)
        
        if (!result) {
          result = {
            nim: altData.nim || null,
            nama: altData.nama || null,
            prodi: altData.prodi || null,
            fakultas: altData.fakultas || null,
            angkatan: altData.angkatan || null,
            status: null,
            jenisKelamin: altData.jenisKelamin || null,
            semesterAwal: altData.semesterAwal || null,
          }
        } else {
          // Merge with existing result - prefer alternative data if current is null
          if (altData.jenisKelamin && !result.jenisKelamin) {
            result.jenisKelamin = altData.jenisKelamin
            console.log(`   ✅ Added jenisKelamin from alt methods: ${altData.jenisKelamin}`)
          }
          if (altData.prodi && !result.prodi) {
            result.prodi = altData.prodi
            console.log(`   ✅ Added prodi from alt methods: ${altData.prodi}`)
          }
          if (altData.fakultas && !result.fakultas) {
            result.fakultas = altData.fakultas
            console.log(`   ✅ Added fakultas from alt methods: ${altData.fakultas}`)
          }
          if (altData.semesterAwal && !result.semesterAwal) {
            result.semesterAwal = altData.semesterAwal
            console.log(`   ✅ Added semesterAwal from alt methods: ${altData.semesterAwal}`)
          }
          if (altData.angkatan && !result.angkatan) {
            result.angkatan = altData.angkatan
            console.log(`   ✅ Added angkatan from alt methods: ${altData.angkatan}`)
          }
        }
      } else {
        console.log(`⚠️ [MULTI-SOURCE] Alternative methods returned no data`)
      }
    } catch (error) {
      console.warn(`⚠️ [MULTI-SOURCE] Alternative methods failed:`, error)
    }
  } else {
    console.log(`✅ [MULTI-SOURCE] All data complete, skipping alternative methods`)
  }
  
  if (result) {
    console.log(`🎉 [MULTI-SOURCE] Final result:`, {
      nim: result.nim,
      nama: result.nama,
      prodi: result.prodi,
      fakultas: result.fakultas,
      angkatan: result.angkatan,
      jenisKelamin: result.jenisKelamin,
      semesterAwal: result.semesterAwal,
    })
  } else {
    console.log(`❌ [MULTI-SOURCE] No data found from any source`)
  }
  
  return result
}
