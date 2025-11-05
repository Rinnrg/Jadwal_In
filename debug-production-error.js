#!/usr/bin/env node

/**
 * Debug Production Database Error
 * Decode error dari URL dan kasih solusi
 */

const errorUrl = process.argv[2];

if (!errorUrl) {
  console.log('❌ Usage: node debug-production-error.js "<URL_with_error>"');
  console.log('\nContoh:');
  console.log('node debug-production-error.js "https://jadwal-in.vercel.app/login?error=database_error&details=Invalid..."');
  process.exit(1);
}

console.log('🔍 Analyzing Production Error...\n');

try {
  const url = new URL(errorUrl);
  const error = url.searchParams.get('error');
  const details = url.searchParams.get('details');
  
  console.log('📋 Error Type:', error || 'Unknown');
  console.log('📝 Error Details:\n');
  
  if (details) {
    const decoded = decodeURIComponent(details);
    console.log(decoded);
    console.log('\n' + '='.repeat(60));
    
    // Analyze error
    if (decoded.includes("Can't reach")) {
      console.log('\n🔴 PROBLEM: Database Connection Failed');
      console.log('\n💡 POSSIBLE CAUSES:');
      console.log('   1. DATABASE_URL di Vercel salah atau tidak diset');
      console.log('   2. Supabase database sedang down');
      console.log('   3. Connection timeout (network issue)');
      console.log('   4. Wrong region atau connection string');
      
      console.log('\n✅ SOLUTIONS:');
      console.log('\n   1️⃣ Cek Vercel Environment Variables:');
      console.log('      → Vercel Dashboard → Settings → Environment Variables');
      console.log('      → Pastikan DATABASE_URL dan DIRECT_URL ada');
      console.log('      → Pastikan tidak ada typo atau spasi');
      
      console.log('\n   2️⃣ Verifikasi Connection String dari Supabase:');
      console.log('      → Buka Supabase Dashboard');
      console.log('      → Project Settings → Database');
      console.log('      → Copy "Connection Pooling" string untuk DATABASE_URL');
      console.log('      → Copy "Direct Connection" string untuk DIRECT_URL');
      
      console.log('\n   3️⃣ Format Connection String yang BENAR:');
      console.log('      DATABASE_URL:');
      console.log('      postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true');
      console.log('\n      DIRECT_URL:');
      console.log('      postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres');
      console.log('      ⚠️  Port berbeda: 6543 vs 5432!');
      
      console.log('\n   4️⃣ Test Connection di Local:');
      console.log('      → Copy connection string dari Vercel env vars ke .env local');
      console.log('      → Run: node test-db-connection.js');
      console.log('      → Jika berhasil, berarti connection string benar');
      console.log('      → Jika gagal, berarti connection string salah');
      
      console.log('\n   5️⃣ Setelah Update Environment Variables:');
      console.log('      → Vercel Dashboard → Deployments');
      console.log('      → Klik "..." → Redeploy');
      console.log('      → Tunggu deployment selesai');
      console.log('      → Test login lagi');
      
    } else if (decoded.includes('Invalid')) {
      console.log('\n🔴 PROBLEM: Invalid Prisma Invocation');
      console.log('\n💡 Kemungkinan besar: Connection string format salah');
      console.log('   atau database tidak accessible');
      
    } else if (decoded.includes('timeout')) {
      console.log('\n🔴 PROBLEM: Connection Timeout');
      console.log('\n💡 Supabase mungkin sedang slow atau down');
      console.log('   Cek status: https://status.supabase.com/');
      
    } else {
      console.log('\n🔴 PROBLEM: Unknown Database Error');
      console.log('\n💡 Check Vercel function logs untuk detail lengkap');
    }
    
  } else {
    console.log('No error details found in URL');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 QUICK CHECKLIST:');
  console.log('   [ ] DATABASE_URL ada di Vercel env vars');
  console.log('   [ ] DIRECT_URL ada di Vercel env vars');
  console.log('   [ ] Connection strings dari Supabase Dashboard (bukan copas dari .env local)');
  console.log('   [ ] Port DATABASE_URL = 6543 (pooler)');
  console.log('   [ ] Port DIRECT_URL = 5432 (direct)');
  console.log('   [ ] Sudah redeploy setelah update env vars');
  console.log('   [ ] Supabase project masih aktif (tidak paused)');
  
  console.log('\n📖 Docs: DEPLOYMENT.md');
  console.log('🆘 Jika masih error, check Vercel Function Logs\n');
  
} catch (err) {
  console.error('❌ Error parsing URL:', err.message);
  console.log('\n💡 Copy full URL dari browser (termasuk https://...)');
}
