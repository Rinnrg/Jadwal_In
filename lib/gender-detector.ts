// lib/gender-detector.ts
// Gender detection dari nama Indonesia

// Nama-nama umum laki-laki Indonesia
const MALE_NAMES = new Set([
  'ahmad', 'muhammad', 'agus', 'budi', 'andi', 'dedi', 'hendra', 'rudi', 'joko',
  'sugeng', 'bambang', 'wahyu', 'imam', 'irwan', 'yudi', 'rizki', 'reza', 'fahmi',
  'dimas', 'arif', 'eko', 'aditya', 'bayu', 'doni', 'fajar', 'gilang', 'hadi',
  'indra', 'yanto', 'rifki', 'rizal', 'rama', 'yoga', 'zaki', 'farhan', 'hanif',
  'ilham', 'kevin', 'lukman', 'nanda', 'rangga', 'ryan', 'taufik', 'wildan',
  'aan', 'abidin', 'adam', 'adrian', 'akbar', 'alam', 'alif', 'alvin', 'amin',
  'ananda', 'andika', 'angga', 'anton', 'anwar', 'ardi', 'aria', 'arman', 'asep',
  'aziz', 'daffa', 'danang', 'danu', 'darma', 'dava', 'david', 'denny', 'dhika',
  'fikri', 'firman', 'galang', 'galih', 'gibran', 'hafiz', 'hakim', 'haris',
  'hartono', 'hasan', 'hendri', 'herman', 'herwin', 'huda', 'husin', 'ibrahim',
  'ikhsan', 'irfan', 'ismail', 'jefri', 'johan', 'jordan', 'jundi', 'junaid',
  'kamal', 'khairul', 'kurnia', 'mahendra', 'malik', 'maruf', 'maulana', 'memet',
  'misbach', 'nabil', 'naufal', 'nico', 'nugroho', 'pangestu', 'pratama', 'putra',
  'radit', 'rafli', 'rahmat', 'raja', 'ramadhan', 'rasyid', 'rendra', 'ridwan',
  'risky', 'roni', 'salim', 'satria', 'septian', 'sigit', 'sofyan', 'sultan',
  'sumarno', 'surya', 'syahrul', 'syaiful', 'tegar', 'tommy', 'tri', 'umar',
  'usman', 'vino', 'wawan', 'wisnu', 'yayan', 'yusuf', 'zidan', 'alfian',
])

// Nama-nama umum perempuan Indonesia
const FEMALE_NAMES = new Set([
  'siti', 'nur', 'nurul', 'dewi', 'lina', 'ratna', 'wati', 'ningsih', 'yuni',
  'sri', 'rina', 'fitri', 'maya', 'diah', 'ayu', 'indah', 'putri', 'widya',
  'anggun', 'bella', 'cantika', 'dina', 'elsa', 'fani', 'gita', 'hani', 'ika',
  'julia', 'kartika', 'laila', 'mila', 'nadia', 'oktavia', 'pratiwi', 'qonita',
  'rahma', 'salma', 'tania', 'utami', 'vina', 'wulan', 'yesi', 'zahra', 'zulfa',
  'adelia', 'alya', 'amanda', 'amelia', 'anisa', 'annisa', 'azzahra', 'chairani',
  'citra', 'della', 'devi', 'diana', 'dinda', 'dini', 'dyah', 'elin', 'erna',
  'farah', 'fatimah', 'feby', 'fera', 'fira', 'fitria', 'gusti', 'hana', 'hasna',
  'helmi', 'hesti', 'hilda', 'ilma', 'intan', 'irma', 'isna', 'jasmine', 'kania',
  'khansa', 'kinanti', 'lestari', 'lisna', 'luna', 'maharani', 'mardiana', 'melati',
  'nadya', 'naila', 'naomi', 'natasya', 'nina', 'nisa', 'novita', 'nurlita',
  'olivia', 'permata', 'puspita', 'rachel', 'rahayu', 'rahmawati', 'rania', 'retno',
  'ria', 'rini', 'risma', 'riska', 'safira', 'salsabila', 'sarah', 'selviana',
  'shinta', 'silvia', 'syifa', 'tiara', 'tika', 'tri', 'ulfa', 'umi', 'vera',
  'wahyuni', 'winda', 'windy', 'yasmin', 'yenni', 'yolanda', 'yulia', 'zahwa',
])

// Suffix yang sering menandakan gender
const MALE_SUFFIXES = new Set([
  'wan', 'man', 'din', 'yanto', 'yan', 'ton', 'budi', 'anto'
])

const FEMALE_SUFFIXES = new Set([
  'wati', 'ningsih', 'yani', 'yanti', 'ati', 'ita', 'tun', 'sari', 'ni', 'tika'
])

/**
 * Detect gender from Indonesian name
 * @param fullName - Full name to analyze
 * @returns 'Laki - Laki' | 'Perempuan' | null
 */
export function detectGenderFromName(fullName: string): 'Laki - Laki' | 'Perempuan' | null {
  if (!fullName || typeof fullName !== 'string') return null
  
  const name = fullName.toLowerCase().trim()
  const words = name.split(/\s+/)
  
  let maleScore = 0
  let femaleScore = 0
  
  // Check each word in the name
  for (const word of words) {
    // Check if word is in male names set
    if (MALE_NAMES.has(word)) {
      maleScore += 2
    }
    
    // Check if word is in female names set
    if (FEMALE_NAMES.has(word)) {
      femaleScore += 2
    }
    
    // Check suffixes
    for (const suffix of MALE_SUFFIXES) {
      if (word.endsWith(suffix)) {
        maleScore += 1
        break
      }
    }
    
    for (const suffix of FEMALE_SUFFIXES) {
      if (word.endsWith(suffix)) {
        femaleScore += 1
        break
      }
    }
  }
  
  // Special patterns
  // Common female prefixes
  if (name.startsWith('siti ') || name.startsWith('dewi ') || name.startsWith('putri ')) {
    femaleScore += 2
  }
  
  // Common male prefixes
  if (name.startsWith('muhammad ') || name.startsWith('ahmad ')) {
    maleScore += 2
  }
  
  // Determine gender based on score
  if (maleScore > femaleScore) {
    return 'Laki - Laki'
  } else if (femaleScore > maleScore) {
    return 'Perempuan'
  }
  
  // If equal or no match, return null (uncertain)
  return null
}

/**
 * Get gender confidence level
 * @param fullName - Full name to analyze
 * @returns Confidence percentage (0-100)
 */
export function getGenderConfidence(fullName: string): number {
  if (!fullName || typeof fullName !== 'string') return 0
  
  const name = fullName.toLowerCase().trim()
  const words = name.split(/\s+/)
  
  let maleScore = 0
  let femaleScore = 0
  let totalMatches = 0
  
  for (const word of words) {
    if (MALE_NAMES.has(word)) {
      maleScore += 2
      totalMatches += 2
    }
    if (FEMALE_NAMES.has(word)) {
      femaleScore += 2
      totalMatches += 2
    }
  }
  
  const totalScore = maleScore + femaleScore
  if (totalScore === 0) return 0
  
  const maxScore = Math.max(maleScore, femaleScore)
  const confidence = (maxScore / (words.length * 2)) * 100
  
  return Math.min(confidence, 100)
}
