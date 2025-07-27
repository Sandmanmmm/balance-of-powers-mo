// Debug tool to test data loading
import { loadProvincesFromYAML, loadNationsFromYAML } from './yamlLoader';

export async function debugDataLoading() {
  console.log('=== DEBUG DATA LOADING ===');
  
  try {
    console.log('Testing province loading...');
    const provinces = await loadProvincesFromYAML();
    console.log(`✓ Loaded ${provinces.length} provinces`);
    
    // Show province breakdown by country
    const countryCounts = provinces.reduce((acc, p) => {
      acc[p.country] = (acc[p.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Province counts by country:', countryCounts);
    
    // Test specific province data
    const sampleProvince = provinces.find(p => p.id === 'USA_001');
    if (sampleProvince) {
      console.log('Sample province (USA_001):', {
        id: sampleProvince.id,
        name: sampleProvince.name,
        country: sampleProvince.country,
        features: sampleProvince.features,
        hasResourceOutput: !!sampleProvince.resourceOutput
      });
    }
    
    console.log('Testing nation loading...');
    const nations = await loadNationsFromYAML();
    console.log(`✓ Loaded ${nations.length} nations`);
    
    // Show nation list
    nations.forEach(n => {
      console.log(`- ${n.id}: ${n.name} (${n.capital})`);
    });
    
    console.log('=== DATA LOADING TEST COMPLETE ===');
    
    return { provinces, nations };
  } catch (error) {
    console.error('❌ Data loading test failed:', error);
    return { provinces: [], nations: [] };
  }
}