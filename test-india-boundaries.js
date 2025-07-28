// Quick test to validate India boundary polygons
const fs = require('fs');
const path = require('path');

try {
  const indiaPath = path.join(__dirname, 'src/data/regions/superpowers/province-boundaries_india.json');
  const indiaData = JSON.parse(fs.readFileSync(indiaPath, 'utf8'));
  
  console.log('🇮🇳 INDIA BOUNDARY VALIDATION REPORT');
  console.log('=====================================');
  
  const provinces = Object.keys(indiaData);
  console.log(`Total provinces: ${provinces.length}`);
  
  let polygonProvinces = 0;
  let rectangularProvinces = 0;
  
  provinces.forEach(provinceId => {
    const boundary = indiaData[provinceId];
    if (boundary?.geometry?.coordinates?.[0]) {
      const coords = boundary.geometry.coordinates[0];
      
      // Check if it's a simple rectangle (4 corners)
      if (coords.length === 5) {
        rectangularProvinces++;
        console.log(`⚠️  ${provinceId} (${boundary.properties.name}) still rectangular`);
      } else {
        polygonProvinces++;
        console.log(`✅ ${provinceId} (${boundary.properties.name}) proper polygon: ${coords.length} points`);
      }
    }
  });
  
  console.log('\nSUMMARY:');
  console.log(`✅ Proper polygons: ${polygonProvinces}`);
  console.log(`⚠️  Rectangular: ${rectangularProvinces}`);
  console.log(`🎯 Conversion rate: ${Math.round((polygonProvinces / provinces.length) * 100)}%`);
  
  // Test a few specific provinces
  const testProvinces = ['IND_MH', 'IND_UP', 'IND_KA', 'IND_GJ'];
  console.log('\nSAMPLE VALIDATION:');
  testProvinces.forEach(id => {
    const boundary = indiaData[id];
    if (boundary) {
      const coords = boundary.geometry.coordinates[0];
      console.log(`${id}: ${coords.length} coordinates - ${coords.length > 5 ? 'GOOD' : 'NEEDS_WORK'}`);
    }
  });
  
} catch (error) {
  console.error('❌ Error validating boundaries:', error.message);
}