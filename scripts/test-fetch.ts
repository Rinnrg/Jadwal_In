/**
 * Simple test to check what HTML we're getting from pd-unesa
 */

async function testFetch() {
  const nim = '22050974025';
  const searchUrl = `https://pd-unesa.unesa.ac.id/?s=${nim}`;
  
  console.log('Fetching:', searchUrl);
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    const html = await response.text();
    
    console.log('\n=== HTML Length:', html.length);
    
    // Look for links
    const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    const links = Array.from(html.matchAll(linkPattern));
    
    console.log('\n=== Found', links.length, 'links');
    console.log('\nFirst 20 links:');
    links.slice(0, 20).forEach((match, i) => {
      console.log(`${i + 1}. ${match[1]}`);
    });
    
    // Look for specific text patterns
    console.log('\n=== Looking for key text:');
    console.log('Contains "22050974025":', html.includes('22050974025'));
    console.log('Contains "RINO RAIHAN":', html.toUpperCase().includes('RINO RAIHAN'));
    console.log('Contains "Biodata Mahasiswa":', html.includes('Biodata Mahasiswa'));
    console.log('Contains "Program Studi":', html.includes('Program Studi'));
    
    // Save a snippet
    const snippet = html.substring(0, 2000);
    console.log('\n=== First 2000 chars of HTML:');
    console.log(snippet);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testFetch();
