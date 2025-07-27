import { testSouthAmericaData } from '../lib/testSouthAmerica';

export async function testAllSouthAmericaData() {
  try {
    console.log('=== Testing South America Data ===');
    const results = await testSouthAmericaData();
    
    console.log('\n=== South America Test Results ===');
    console.log(`Nations loaded: ${results.nations.length}`);
    console.log(`Provinces loaded: ${results.provinces.length}`);
    console.log(`Boundaries found: ${results.boundariesFound}/${results.totalProvinces}`);
    
    console.log('\n=== Nations Details ===');
    results.nations.forEach((nation: any) => {
      console.log(`- ${nation.name} (${nation.id}): GDP $${nation.economy.gdp}M, Capital: ${nation.capital}`);
    });
    
    console.log('\n=== Provinces by Country ===');
    const provincesByCountry = results.provinces.reduce((acc: any, province: any) => {
      if (!acc[province.country]) {
        acc[province.country] = [];
      }
      acc[province.country].push(province);
      return acc;
    }, {});
    
    Object.entries(provincesByCountry).forEach(([country, provinces]: [string, any]) => {
      console.log(`${country}: ${provinces.length} provinces`);
      provinces.forEach((province: any) => {
        console.log(`  - ${province.name} (${province.id}): Pop ${province.population.total}`);
      });
    });
    
    return results;
  } catch (error) {
    console.error('Failed to test South America data:', error);
    throw error;
  }
}