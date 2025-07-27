// Test file to verify data loading works
import { loadGameData } from './gameDataModular';

export async function testDataLoading() {
  console.log('=== Testing Data Loading ===');
  
  try {
    console.log('Calling loadGameData()...');
    const result = await loadGameData();
    
    console.log('Result type:', typeof result);
    console.log('Result keys:', Object.keys(result));
    console.log('Provinces:', typeof result.provinces, Array.isArray(result.provinces) ? result.provinces.length : 'NOT_ARRAY');
    console.log('Nations:', typeof result.nations, Array.isArray(result.nations) ? result.nations.length : 'NOT_ARRAY');
    
    if (Array.isArray(result.provinces) && result.provinces.length > 0) {
      console.log('First province:', result.provinces[0]);
      console.log('Canadian provinces:', result.provinces.filter(p => p.country === 'Canada').map(p => `${p.id}: ${p.name}`));
    }
    
    if (Array.isArray(result.nations) && result.nations.length > 0) {
      console.log('First nation:', result.nations[0]);
      console.log('Canada nation:', result.nations.find(n => n.id === 'CAN'));
    }
    
    console.log('=== Test completed successfully ===');
    return result;
    
  } catch (error) {
    console.error('=== Test failed ===');
    console.error('Error:', error);
    throw error;
  }
}