// Test to verify all European nations are loading correctly
import { loadWorldData } from '../data/dataLoader';

export async function testEuropeExpansion() {
  console.log('🇪🇺 Testing European nations expansion...');
  
  try {
    const worldData = await loadWorldData();
    
    // Check for the new European nations
    const expectedEuropeanNations = [
      'GBR', 'FRA', 'DEU', 'ITA', 'SWE', 'NOR', 'DNK', 'FIN', 'ESP', 'NLD'
    ];
    
    console.log('✅ Total nations loaded:', worldData.nations.length);
    console.log('✅ All nation IDs:', worldData.nations.map(n => n.id));
    
    const loadedEuropeanNations = worldData.nations.filter(n => 
      expectedEuropeanNations.includes(n.id)
    );
    
    console.log('✅ European nations found:', loadedEuropeanNations.map(n => `${n.id} (${n.name})`));
    console.log('✅ Missing European nations:', 
      expectedEuropeanNations.filter(id => !loadedEuropeanNations.find(n => n.id === id))
    );
    
    // Check provinces for European nations
    const europeanProvinces = worldData.provinces.filter(p => 
      ['United Kingdom', 'France', 'Germany', 'Italy', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Spain', 'Netherlands'].includes(p.country)
    );
    
    console.log('✅ European provinces loaded:', europeanProvinces.length);
    console.log('✅ Sample European provinces:', 
      europeanProvinces.slice(0, 5).map(p => `${p.id} (${p.country})`)
    );
    
    // Check boundaries
    const europeanBoundaries = Object.keys(worldData.boundaries).filter(id => 
      id.startsWith('GB_') || id.startsWith('FR_') || id.startsWith('DE_') || 
      id.startsWith('IT_') || id.startsWith('SE_') || id.startsWith('NO_') || 
      id.startsWith('DK_') || id.startsWith('FI_') || id.startsWith('ES_') || 
      id.startsWith('NL_')
    );
    
    console.log('✅ European boundaries loaded:', europeanBoundaries.length);
    console.log('✅ Sample European boundaries:', europeanBoundaries.slice(0, 5));
    
    return {
      success: true,
      nationsLoaded: loadedEuropeanNations.length,
      provincesLoaded: europeanProvinces.length,
      boundariesLoaded: europeanBoundaries.length,
      missingNations: expectedEuropeanNations.filter(id => !loadedEuropeanNations.find(n => n.id === id))
    };
    
  } catch (error) {
    console.error('❌ Error testing European expansion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}