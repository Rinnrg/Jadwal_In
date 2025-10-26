/**
 * Test script to verify upload directory permissions
 * Run this with: node scripts/test-upload-permissions.js
 */

const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const pdfsDir = path.join(uploadsDir, 'pdfs');

console.log('🔍 Checking upload directories...\n');

// Check if directories exist
console.log('📁 Directory existence:');
console.log(`  uploads: ${fs.existsSync(uploadsDir) ? '✅ exists' : '❌ missing'}`);
console.log(`  uploads/images: ${fs.existsSync(imagesDir) ? '✅ exists' : '❌ missing'}`);
console.log(`  uploads/pdfs: ${fs.existsSync(pdfsDir) ? '✅ exists' : '❌ missing'}`);

// Test write permissions
console.log('\n✍️ Testing write permissions:');

const testFile = path.join(imagesDir, 'test-write.txt');
try {
  fs.writeFileSync(testFile, 'test content', { mode: 0o666 });
  console.log('  ✅ Write permission OK');
  
  // Clean up test file
  fs.unlinkSync(testFile);
  console.log('  ✅ Delete permission OK');
} catch (error) {
  console.error('  ❌ Write/Delete permission FAILED:', error.message);
}

// List current files
console.log('\n📄 Current files in uploads/images:');
try {
  const imageFiles = fs.readdirSync(imagesDir);
  if (imageFiles.length === 0) {
    console.log('  (empty)');
  } else {
    imageFiles.forEach(file => {
      const stats = fs.statSync(path.join(imagesDir, file));
      console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
  }
} catch (error) {
  console.error('  ❌ Cannot list files:', error.message);
}

console.log('\n📄 Current files in uploads/pdfs:');
try {
  const pdfFiles = fs.readdirSync(pdfsDir);
  if (pdfFiles.length === 0) {
    console.log('  (empty)');
  } else {
    pdfFiles.forEach(file => {
      const stats = fs.statSync(path.join(pdfsDir, file));
      console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
  }
} catch (error) {
  console.error('  ❌ Cannot list files:', error.message);
}

console.log('\n✅ Upload directory check complete!');
