#!/usr/bin/env node

/**
 * Production Environment Checker
 * Validates environment variables for deployment
 */

console.log('🔍 Checking Production Environment Configuration...\n');

const requiredVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXT_PUBLIC_APP_URL',
];

let hasErrors = false;

// Check required variables
console.log('📋 Required Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = !!value;
  const icon = isSet ? '✅' : '❌';
  
  console.log(`${icon} ${varName}: ${isSet ? 'SET' : 'MISSING'}`);
  
  if (!isSet) {
    hasErrors = true;
  }
  
  // Additional validation
  if (isSet && varName === 'NEXT_PUBLIC_APP_URL') {
    if (value.includes('localhost')) {
      console.log(`   ⚠️  WARNING: Still using localhost URL in production!`);
      console.log(`   💡 Should be: https://your-domain.vercel.app`);
      hasErrors = true;
    } else if (!value.startsWith('https://')) {
      console.log(`   ⚠️  WARNING: URL should use HTTPS in production!`);
      hasErrors = true;
    } else {
      console.log(`   ✅ Valid: ${value}`);
    }
  }
});

console.log('\n📍 Auto-detected Redirect URI:');
const getRedirectUri = () => {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
  }
  if (process.env.VERCEL_URL) {
    const protocol = process.env.VERCEL_ENV === 'production' ? 'https' : 'https';
    return `${protocol}://${process.env.VERCEL_URL}/api/auth/google/callback`;
  }
  return "http://localhost:3000/api/auth/google/callback";
};

const redirectUri = getRedirectUri();
console.log(`🔗 ${redirectUri}`);

console.log('\n📝 Action Items:');
console.log('1. Copy the Redirect URI above');
console.log('2. Go to: https://console.cloud.google.com/');
console.log('3. Navigate to: APIs & Services → Credentials');
console.log('4. Edit your OAuth 2.0 Client ID');
console.log('5. Add to Authorized Redirect URIs:');
console.log(`   ${redirectUri}`);
console.log('6. Click SAVE and wait 5-10 minutes for propagation');

if (hasErrors) {
  console.log('\n❌ Environment configuration has issues!');
  console.log('Please fix the issues above before deploying.\n');
  process.exit(1);
} else {
  console.log('\n✅ Environment configuration looks good!');
  console.log('Ready for deployment.\n');
  process.exit(0);
}
