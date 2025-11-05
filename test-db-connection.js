require('dotenv').config();
const { PrismaClient } = require('./src/generated/prisma');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✓' : 'Not set ✗');
  console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set ✓' : 'Not set ✗');
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
  
  try {
    console.log('\n🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connection successful!\n');
    
    console.log('📊 Testing query...');
    const userCount = await prisma.user.count();
    console.log(`✅ Query successful! Found ${userCount} users\n`);
    
    console.log('🎉 Database is working correctly!');
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code || 'N/A');
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
