/**
 * Test script untuk memeriksa scraper pd-unesa
 * Run dengan: npx tsx scripts/test-scraper.ts
 */

import { cariDataMahasiswa } from '../lib/unesa-scraper';

async function testScraper() {
  console.log('=== Testing UNESA Scraper ===\n');
  
  // Test dengan NIM
  const testNIM = '22050974025'; // Rino Raihan Gumilang
  
  console.log(`Testing dengan NIM: ${testNIM}\n`);
  
  try {
    const result = await cariDataMahasiswa(testNIM);
    
    console.log('\n=== HASIL ===');
    if (result) {
      console.log('✅ Data berhasil diambil:');
      console.log(JSON.stringify(result, null, 2));
      
      // Check for missing fields
      const missingFields = [];
      if (!result.prodi) missingFields.push('prodi');
      if (!result.jenisKelamin) missingFields.push('jenisKelamin');
      if (!result.semesterAwal) missingFields.push('semesterAwal');
      
      if (missingFields.length > 0) {
        console.log('\n⚠️ Field yang masih kosong:', missingFields.join(', '));
      } else {
        console.log('\n✅ Semua field terisi dengan lengkap!');
      }
    } else {
      console.log('❌ Gagal mengambil data');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testScraper();
