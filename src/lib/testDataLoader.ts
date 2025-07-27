import { loadWorldData, debugAvailableFiles } from '../data/dataLoader';

export async function testDataLoading(): Promise<void> {
  console.log('=== Testing Modular Data Loader ===');
  
  try {
    // First debug available files
    console.log('1. Debugging available files...');
    debugAvailableFiles();
    
    // Then try to load the data
    console.log('2. Loading world data...');
    const data = await loadWorldData();
    
    console.log('3. Results:');
    console.log(`- Nations loaded: ${data.nations.length}`);
    console.log(`- Provinces loaded: ${data.provinces.length}`);
    console.log(`- Boundaries loaded: ${Object.keys(data.boundaries).length}`);
    
    // Check for Canada specifically
    const canada = data.nations.find(n => n.id === 'CAN');
    if (canada) {
      console.log('✓ Canada found:', canada.name);
    } else {
      console.error('✗ Canada not found!');
    }
    
    // Check for Canadian provinces
    const canadianProvinces = data.provinces.filter(p => p.country === 'Canada');
    console.log(`✓ Canadian provinces: ${canadianProvinces.length}`);
    canadianProvinces.forEach(p => console.log(`  - ${p.id}: ${p.name}`));
    
    // Check for US states
    const usStates = data.provinces.filter(p => p.country === 'United States');
    console.log(`✓ US states: ${usStates.length}`);
    if (usStates.length > 0) {
      console.log(`  First 10: ${usStates.slice(0, 10).map(p => p.name).join(', ')}`);
      console.log(`  Total expected: 50 states + DC = 51`);
    }
    
    // Check USA nation
    const usa = data.nations.find(n => n.id === 'USA');
    if (usa) {
      console.log('✓ USA found:', usa.name);
    } else {
      console.error('✗ USA not found!');
    }
    
    console.log('=== Data Loading Test Complete ===');
    
  } catch (error) {
    console.error('=== Data Loading Test Failed ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
  }
}