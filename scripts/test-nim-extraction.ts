/**
 * Script to test NIM extraction from email
 * This helps verify the logic works correctly before deploying
 */

// Helper function to extract and reconstruct full NIM from email
function extractNIMFromEmail(email: string): string | null {
  // Format email: namapertamanamakedua.22002@mhs.unesa.ac.id
  // From .22002 we extract: year(22) + sequence(002)
  // Full NIM: year(22) + faculty(05) + program(0974) + sequence(002) = 22050974002
  const emailParts = email.split('@')[0]
  const parts = emailParts.split('.')
  
  if (parts.length >= 2) {
    const nimPart = parts[1] // "22002"
    if (nimPart && /^\d{5,}$/.test(nimPart)) { // At least 5 digits
      // Extract year (first 2 digits) and sequence number (last 3 digits)
      const tahun = nimPart.substring(0, 2) // "22"
      const nomorUrut = nimPart.substring(2) // "002"
      
      // Reconstruct full NIM with default faculty and program codes
      const kodeFakultas = "05"
      const kodeProdi = "0974"
      
      return `${tahun}${kodeFakultas}${kodeProdi}${nomorUrut}` // "22050974002"
    }
  }
  
  // Check if email prefix is already a full NIM (numeric)
  if (/^\d{8,}$/.test(emailParts)) {
    return emailParts
  }
  
  return null
}

// Helper function to extract angkatan from NIM
function extractAngkatan(nim: string | null): number {
  if (!nim) return new Date().getFullYear()
  
  // Try to extract first 2 or 4 digits as year
  const firstTwoDigits = nim.substring(0, 2)
  const firstFourDigits = nim.substring(0, 4)
  
  // If NIM starts with 4 digits (2020, 2021, etc.)
  if (nim.length >= 4 && firstFourDigits >= '2000' && firstFourDigits <= '2099') {
    return parseInt(firstFourDigits)
  }
  
  // If NIM starts with 2 digits (20, 21, 22, etc.)
  if (nim.length >= 2) {
    const year = parseInt(firstTwoDigits)
    // Assume 20xx for years 00-99
    if (year >= 0 && year <= 99) {
      return 2000 + year
    }
  }
  
  return new Date().getFullYear()
}

// Test cases
const testEmails = [
  'noviaputri.22039@mhs.unesa.ac.id',
  'rinoraihan.22025@mhs.unesa.ac.id',
  'rakategar.22019@mhs.unesa.ac.id',
  'johndoe.23001@mhs.unesa.ac.id',
  'janedoe.21500@mhs.unesa.ac.id',
  'test.20999@mhs.unesa.ac.id',
  'invalidformat@mhs.unesa.ac.id', // Should fail
  'nonim.abc@mhs.unesa.ac.id', // Should fail
]

console.log('🧪 Testing NIM Extraction from Email\n')
console.log('=' .repeat(80))

testEmails.forEach((email, index) => {
  const nim = extractNIMFromEmail(email)
  const angkatan = nim ? extractAngkatan(nim) : null
  
  console.log(`\n${index + 1}. Email: ${email}`)
  console.log(`   Extracted NIM: ${nim || '❌ FAILED'}`)
  
  if (nim) {
    console.log(`   Length: ${nim.length} digits`)
    console.log(`   Angkatan: ${angkatan}`)
    console.log(`   Faculty Code: ${nim.substring(2, 4)} (05 = Fakultas Teknik)`)
    console.log(`   Program Code: ${nim.substring(4, 8)} (0974 = S1 PTI)`)
    console.log(`   Status: ✅ VALID`)
  } else {
    console.log(`   Status: ❌ INVALID (Cannot extract NIM)`)
  }
})

console.log('\n' + '='.repeat(80))
console.log('\n📝 Summary:')
console.log(`Total tests: ${testEmails.length}`)
console.log(`Successful: ${testEmails.filter(e => extractNIMFromEmail(e)).length}`)
console.log(`Failed: ${testEmails.filter(e => !extractNIMFromEmail(e)).length}`)

console.log('\n✅ Expected format: nama.XXXXX@mhs.unesa.ac.id')
console.log('   Where XXXXX is at least 5 digits (e.g., 22039)')
console.log('   Result will be: YY + 05 + 0974 + XXX = 11 digit NIM')
console.log('   Example: 22039 → 22050974039')
