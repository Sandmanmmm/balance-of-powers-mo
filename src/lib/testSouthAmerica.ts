import { loadWorldData } from '../data/dataLoader';

export async function testSouthAmericaData(): Promise<any> {
  try {
    console.log('Testing South America data loading...');
    const worldData = await loadWorldData();
    
    // Check for South American countries
    const southAmericanCountries = ['BRA', 'ARG', 'COL', 'PER', 'VEN', 'CHL', 'ECU', 'BOL', 'PRY', 'URY', 'GUY', 'SUR', 'GUF'];
    
    console.log('Checking South American nations...');
    southAmericanCountries.forEach(countryId => {
      const nation = worldData.nations.find(n => n.id === countryId);
      if (nation) {
        console.log(`✓ Found nation: ${nation.name} (${countryId})`);
      } else {
        console.error(`✗ Missing nation: ${countryId}`);
      }
    });
    
    // Check for South American provinces by province ID patterns
    console.log('Checking South American provinces...');
    const southAmericanProvinces = worldData.provinces.filter(p => 
      p.id.startsWith('5') || p.id.startsWith('6') // 5xxx and 6xxx ranges for South America
    );
    
    console.log(`Found ${southAmericanProvinces.length} South American provinces:`);
    southAmericanProvinces.forEach(province => {
      console.log(`  - ${province.name} (${province.id}) in ${province.country}`);
    });
    
    // Check for boundaries
    console.log('Checking South American province boundaries...');
    southAmericanProvinces.forEach(province => {
      if (worldData.boundaries[province.id]) {
        console.log(`✓ Found boundary for: ${province.name} (${province.id})`);
      } else {
        console.error(`✗ Missing boundary for: ${province.name} (${province.id})`);
      }
    });
    
    console.log('South America data test completed!');
    
    return {
      nations: worldData.nations.filter(n => southAmericanCountries.includes(n.id)),
      provinces: southAmericanProvinces,
      boundariesFound: southAmericanProvinces.filter(p => worldData.boundaries[p.id]).length,
      totalProvinces: southAmericanProvinces.length
    };
    
  } catch (error) {
    console.error('South America data test failed:', error);
    throw error;
  }
}