import { loadWorldData } from '../data/dataLoader';

export async function testCentralAmericaData(): Promise<any> {
  try {
    console.log('Testing Central America data loading...');
    const worldData = await loadWorldData();
    
    // Check for Central American countries
    const centralAmericanCountries = ['GTM', 'BLZ', 'SLV', 'HND', 'NIC', 'CRI', 'PAN'];
    
    console.log('Checking Central American nations...');
    centralAmericanCountries.forEach(countryId => {
      const nation = worldData.nations.find(n => n.id === countryId);
      if (nation) {
        console.log(`✓ Found nation: ${nation.name} (${countryId})`);
      } else {
        console.error(`✗ Missing nation: ${countryId}`);
      }
    });
    
    // Check for Central American provinces
    console.log('Checking Central American provinces...');
    const centralAmericanProvinces = worldData.provinces.filter(p => 
      centralAmericanCountries.some(country => p.id.startsWith(country + '_'))
    );
    
    console.log(`Found ${centralAmericanProvinces.length} Central American provinces:`);
    centralAmericanProvinces.forEach(province => {
      console.log(`  - ${province.name} (${province.id}) in ${province.country}`);
    });
    
    // Check for boundaries
    console.log('Checking Central American province boundaries...');
    centralAmericanProvinces.forEach(province => {
      if (worldData.boundaries[province.id]) {
        console.log(`✓ Found boundary for: ${province.name} (${province.id})`);
      } else {
        console.error(`✗ Missing boundary for: ${province.name} (${province.id})`);
      }
    });
    
    console.log('Central America data test completed!');
    
    return {
      nations: worldData.nations.filter(n => centralAmericanCountries.includes(n.id)),
      provinces: centralAmericanProvinces,
      boundariesFound: centralAmericanProvinces.filter(p => worldData.boundaries[p.id]).length,
      totalProvinces: centralAmericanProvinces.length
    };
    
  } catch (error) {
    console.error('Central America data test failed:', error);
    throw error;
  }
}