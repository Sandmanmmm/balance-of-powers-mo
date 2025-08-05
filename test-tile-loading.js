// Test script to verify PBF tile loading is working
const { geographicDataManager } = require('./src/managers/GeographicDataManager.ts');

async function testTileLoading() {
  console.log('=== Testing PBF Tile Loading ===');
  
  try {
    // Test loading a tile that should exist
    const tileKey = 'overview_0_0'; // This should map to multiple country tiles
    const detailLevel = 'overview';
    
    console.log(`Testing tile loading for: ${tileKey} at ${detailLevel}`);
    
    const result = await geographicDataManager.loadTile(detailLevel, tileKey);
    
    console.log(`✅ Successfully loaded tile!`);
    console.log(`Features count: ${result.features.length}`);
    
    if (result.features.length > 0) {
      console.log(`First feature:`, result.features[0]);
    }
    
  } catch (error) {
    console.error(`❌ Failed to load tile:`, error);
  }
}

testTileLoading();
