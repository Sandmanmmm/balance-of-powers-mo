/**
 * Quick test to verify Eastern Europe files are loading
 */

import { loadWorldData } from '../data/dataLoader';

export async function testEuropeEastLoading(): Promise<void> {
  try {
    console.log('🇪🇺 Testing Eastern Europe data loading...');
    
    const worldData = await loadWorldData();
    
    // Check for Eastern European nations
    const easternEuropeNations = [
      'POL', 'CZE', 'SVK', 'HUN', 'ROU', 'BGR', 'SRB', 'HRV', 'SVN', 
      'BIH', 'MNE', 'MKD', 'ALB', 'UKR', 'BLR', 'LTU', 'LVA', 'EST', 'MDA'
    ];
    
    const foundNations = easternEuropeNations.filter(id => 
      worldData.nations.some(n => n.id === id)
    );
    
    console.log(`  🏛️ Eastern European nations found: ${foundNations.length}/${easternEuropeNations.length}`);
    console.log(`  📋 Found nations: ${foundNations.join(', ')}`);
    
    if (foundNations.length === 0) {
      console.warn('  ⚠️ No Eastern European nations loaded!');
    }
    
    // Check for Eastern European provinces
    const easternEuropeCountries = [
      'Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria',
      'Serbia', 'Croatia', 'Slovenia', 'Bosnia and Herzegovina', 'Montenegro',
      'North Macedonia', 'Albania', 'Ukraine', 'Belarus', 'Lithuania', 'Latvia',
      'Estonia', 'Moldova'
    ];
    
    const foundProvinces = worldData.provinces.filter(p => 
      easternEuropeCountries.includes(p.country)
    );
    
    console.log(`  🗺️ Eastern European provinces found: ${foundProvinces.length}`);
    
    if (foundProvinces.length > 0) {
      const sampleProvinces = foundProvinces.slice(0, 5).map(p => `${p.name} (${p.country})`);
      console.log(`  📍 Sample provinces: ${sampleProvinces.join(', ')}`);
    } else {
      console.warn('  ⚠️ No Eastern European provinces loaded!');
    }
    
    // Check specific countries
    const poland = worldData.nations.find(n => n.id === 'POL');
    if (poland) {
      console.log(`  🇵🇱 Poland loaded: ${poland.name}, Leader: ${poland.government?.leader}`);
    }
    
    const ukraine = worldData.nations.find(n => n.id === 'UKR');
    if (ukraine) {
      console.log(`  🇺🇦 Ukraine loaded: ${ukraine.name}, Leader: ${ukraine.government?.leader}`);
    }
    
    console.log('🇪🇺 Eastern Europe test completed!');
    
  } catch (error) {
    console.error('❌ Eastern Europe test failed:', error);
  }
}