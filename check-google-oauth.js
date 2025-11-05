#!/usr/bin/env node

/**
 * Google OAuth Configuration Checker
 * Membantu debug masalah Google OAuth 401 Unauthorized
 */

console.log('🔍 Google OAuth Configuration Checker\n');
console.log('=' .repeat(60));

// Expected values
const expectedDomain = 'jadwal-in.vercel.app';
const expectedClientId = '72286592451-g39hja3vnlhj1ag71ne53fv7a8off2et.apps.googleusercontent.com';
const expectedRedirectUri = `https://${expectedDomain}/api/auth/google/callback`;

console.log('\n📋 EXPECTED CONFIGURATION:\n');
console.log(`Domain: ${expectedDomain}`);
console.log(`Client ID: ${expectedClientId}`);
console.log(`Redirect URI: ${expectedRedirectUri}`);

console.log('\n' + '='.repeat(60));
console.log('\n✅ CHECKLIST - Ikuti langkah berikut:\n');

console.log('1️⃣  VERCEL ENVIRONMENT VARIABLES');
console.log('    Buka: https://vercel.com/rinnrgs-projects/jadwal-in/settings/environment-variables');
console.log('    ');
console.log('    Pastikan ada:');
console.log(`    ✓ NEXT_PUBLIC_APP_URL=https://${expectedDomain}`);
console.log(`    ✓ GOOGLE_CLIENT_ID=${expectedClientId}`);
console.log('    ✓ GOOGLE_CLIENT_SECRET=GOCSPX-...');
console.log('    ✓ DATABASE_URL=postgresql://...');
console.log('    ✓ DIRECT_URL=postgresql://...');
console.log('');

console.log('2️⃣  GOOGLE CLOUD CONSOLE');
console.log('    Buka: https://console.cloud.google.com/apis/credentials');
console.log('    ');
console.log('    Klik OAuth 2.0 Client ID Anda');
console.log('    Scroll ke "Authorized redirect URIs"');
console.log('    ');
console.log('    Harus ada:');
console.log(`    ✓ ${expectedRedirectUri}`);
console.log('    ✓ http://localhost:3000/api/auth/google/callback');
console.log('    ');
console.log('    ⚠️  PENTING:');
console.log('       - Gunakan https:// (bukan http://) untuk production');
console.log('       - TIDAK ada trailing slash / di akhir');
console.log('       - Case-sensitive, harus persis sama');
console.log('       - Klik SAVE setelah tambah');
console.log('       - Tunggu 5-10 menit untuk propagasi');
console.log('');

console.log('3️⃣  REDEPLOY VERCEL');
console.log('    Buka: https://vercel.com/rinnrgs-projects/jadwal-in');
console.log('    Tab Deployments → Klik "..." → Redeploy');
console.log('    Tunggu deployment selesai');
console.log('');

console.log('4️⃣  TEST LOGIN');
console.log('    Clear browser cache atau gunakan Incognito');
console.log(`    Buka: https://${expectedDomain}/login`);
console.log('    Klik "Login dengan Google"');
console.log('');

console.log('=' .repeat(60));
console.log('\n🎯 COMMON ERRORS:\n');

console.log('❌ Error: "redirect_uri_mismatch"');
console.log('   → Redirect URI tidak terdaftar di Google Console');
console.log('   → Atau ada typo (http vs https, trailing slash, dll)');
console.log('');

console.log('❌ Error: "401 Unauthorized"');
console.log('   → Client ID atau Secret salah');
console.log('   → Atau redirect URI tidak match');
console.log('');

console.log('❌ Error: "database_error"');
console.log('   → DATABASE_URL atau DIRECT_URL salah');
console.log('   → Sudah di-fix sebelumnya (sekarang masalah Google OAuth)');
console.log('');

console.log('=' .repeat(60));
console.log('\n📖 DOCUMENTATION:\n');
console.log('   - FIX_GOOGLE_OAUTH_ERROR.md (panduan lengkap)');
console.log('   - DEPLOYMENT.md (deployment guide)');
console.log('   - DEPLOYMENT_SUMMARY.txt (quick reference)');
console.log('');

console.log('=' .repeat(60));
console.log('\n💡 QUICK FIX:\n');
console.log('1. Buka Google Console: https://console.cloud.google.com/apis/credentials');
console.log('2. Edit OAuth Client ID');
console.log('3. Tambahkan Authorized Redirect URI:');
console.log(`   ${expectedRedirectUri}`);
console.log('4. SAVE');
console.log('5. Tunggu 5-10 menit');
console.log('6. Redeploy Vercel');
console.log('7. Test login lagi');
console.log('');

console.log('🚀 Good luck!\n');
