import { loadWorldData } from '../data/dataLoader';

export async function testCaribbeanData() {
  console.log('Testing Caribbean data loading...');
  
  try {
    const worldData = await loadWorldData();
    
    // Check for Caribbean nations
    const caribbeanNations = [
      'CUB', 'JAM', 'HTI', 'DOM', 'TTO', 
      'BRB', 'BSB', 'PRI', 'GRD', 'LCA', 'VCT'
    ];
    
    const foundNations = caribbeanNations.map(id => {
      const nation = worldData.nations.find(n => n.id === id);
      return { id, found: !!nation, name: nation?.name };
    });
    
    console.log('Caribbean Nations Test:', foundNations);
    
    // Check for Caribbean provinces
    const caribbeanProvinces = worldData.provinces.filter(p => 
      ['Cuba', 'Jamaica', 'Haiti', 'Dominican Republic', 'Trinidad and Tobago', 
       'Barbados', 'The Bahamas', 'Puerto Rico', 'Grenada', 'Saint Lucia', 
       'Saint Vincent and the Grenadines'].includes(p.country)
    );
    
    console.log('Caribbean Provinces Test:', {
      count: caribbeanProvinces.length,
      provinces: caribbeanProvinces.map(p => `${p.name} (${p.country})`)
    });
    
    // Check for Caribbean boundaries
    const caribbeanBoundaryIds = [
      'CUB_001', 'CUB_002', 'JAM_001', 'JAM_002', 'HTI_001', 'HTI_002',
      'DOM_001', 'DOM_002', 'TTO_001', 'TTO_002', 'BRB_001', 'BRB_002',
      'BSB_001', 'BSB_002', 'PRI_001', 'PRI_002', 'GRD_001', 'LCA_001', 'VCT_001'
    ];
    
    const foundBoundaries = caribbeanBoundaryIds.map(id => {
      const boundary = worldData.boundaries[id];
      return { id, found: !!boundary };
    });
    
    console.log('Caribbean Boundaries Test:', foundBoundaries);
    
    return {
      nationsLoaded: foundNations.filter(n => n.found).length,
      provincesLoaded: caribbeanProvinces.length,
      boundariesLoaded: foundBoundaries.filter(b => b.found).length,
      totalExpected: { nations: 11, provinces: 19, boundaries: 19 }
    };
    
  } catch (error) {
    console.error('Error testing Caribbean data:', error);
    throw error;
  }
}