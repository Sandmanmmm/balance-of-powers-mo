import { loadWorldData, debugAvailableFiles } from '../data/dataLoader';

export async function testModularLoader() {
  console.log('=== Testing Modular Data Loader ===');
  
  try {
    // First show what files are available
    console.log('\n--- Available Files ---');
    debugAvailableFiles();
    
    // Try to load data
    console.log('\n--- Loading World Data ---');
    const worldData = await loadWorldData();
    
    console.log('\n--- Results ---');
    console.log(`Nations loaded: ${worldData.nations.length}`);
    console.log(`Provinces loaded: ${worldData.provinces.length}`);
    console.log(`Boundaries loaded: ${Object.keys(worldData.boundaries).length}`);
    
    if (worldData.nations.length > 0) {
      console.log('\nNations:');
      worldData.nations.forEach(nation => {
        console.log(`  ${nation.id}: ${nation.name} (Leader: ${nation.government?.leader || 'Unknown'})`);
      });
    }
    
    if (worldData.provinces.length > 0) {
      console.log('\nFirst 10 Provinces:');
      worldData.provinces.slice(0, 10).forEach(province => {
        console.log(`  ${province.id}: ${province.name} (${province.country})`);
      });
    }
    
    // Check for Canada specifically
    const canada = worldData.nations.find(n => n.id === 'CAN');
    const canadianProvinces = worldData.provinces.filter(p => p.country === 'Canada');
    
    console.log(`\nCanada check: ${canada ? '✓ Found' : '❌ Not found'}`);
    console.log(`Canadian provinces: ${canadianProvinces.length}`);
    
    return {
      success: true,
      nations: worldData.nations.length,
      provinces: worldData.provinces.length,
      boundaries: Object.keys(worldData.boundaries).length,
      canada: !!canada,
      canadianProvinces: canadianProvinces.length
    };
    
  } catch (error) {
    console.error('=== MODULAR LOADER FAILED ===');
    console.error(error);
    return {
      success: false,
      error: error.message || String(error)
    };
  }
}