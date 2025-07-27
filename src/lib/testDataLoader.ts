import { loadWorldData, debugAvailableFiles } from '../data/dataLoader';

export async function testDataLoading() {
  console.log('TestDataLoader: Running comprehensive data loading test...');
  
  try {
    // Show what files are detected
    debugAvailableFiles();
    
    // Load the actual data
    const worldData = await loadWorldData();
    
    console.log('TestDataLoader: World data loaded successfully:', {
      nations: worldData.nations.length,
      provinces: worldData.provinces.length,
      boundaries: Object.keys(worldData.boundaries).length
    });
    
    // Test specific data
    const canada = worldData.nations.find(n => n.id === 'CAN');
    const mexico = worldData.nations.find(n => n.id === 'MEX');
    const cuba = worldData.nations.find(n => n.id === 'CUB');
    const jamaica = worldData.nations.find(n => n.id === 'JAM');
    
    console.log('TestDataLoader: Nation test results:', {
      canadaFound: !!canada,
      mexicoFound: !!mexico,
      cubaFound: !!cuba,
      jamaicaFound: !!jamaica,
      canadaName: canada?.name,
      mexicoName: mexico?.name,
      cubaName: cuba?.name,
      jamaicaName: jamaica?.name
    });
    
    // Test provinces
    const canadianProvinces = worldData.provinces.filter(p => p.country === 'Canada');
    const mexicanProvinces = worldData.provinces.filter(p => p.country === 'Mexico');
    const caribbeanProvinces = worldData.provinces.filter(p => 
      ['Cuba', 'Jamaica', 'Haiti', 'Dominican Republic', 'Trinidad and Tobago', 'Barbados', 'The Bahamas', 'Puerto Rico', 'Grenada', 'Saint Lucia', 'Saint Vincent and the Grenadines'].includes(p.country)
    );
    
    console.log('TestDataLoader: Province test results:', {
      canadianProvinces: canadianProvinces.length,
      mexicanProvinces: mexicanProvinces.length,
      caribbeanProvinces: caribbeanProvinces.length,
      totalProvinces: worldData.provinces.length,
      canadianProvinceNames: canadianProvinces.map(p => p.name),
      mexicanProvinceNames: mexicanProvinces.map(p => p.name),
      caribbeanProvinceNames: caribbeanProvinces.map(p => `${p.name} (${p.country})`)
    });
    
    // Test boundaries
    const canBoundaries = Object.keys(worldData.boundaries).filter(id => id.startsWith('CAN_'));
    const mexBoundaries = Object.keys(worldData.boundaries).filter(id => id.startsWith('MEX_'));
    const caribbeanBoundaries = Object.keys(worldData.boundaries).filter(id => 
      id.startsWith('CUB_') || id.startsWith('JAM_') || id.startsWith('HTI_') || 
      id.startsWith('DOM_') || id.startsWith('TTO_') || id.startsWith('BRB_') || 
      id.startsWith('BSB_') || id.startsWith('PRI_') || id.startsWith('GRD_') || 
      id.startsWith('LCA_') || id.startsWith('VCT_')
    );
    
    console.log('TestDataLoader: Boundary test results:', {
      canadianBoundaries: canBoundaries.length,
      mexicanBoundaries: mexBoundaries.length,
      caribbeanBoundaries: caribbeanBoundaries.length,
      totalBoundaryFeatures: Object.keys(worldData.boundaries).length,
      boundaryIds: Object.keys(worldData.boundaries)
    });
    
    return worldData;
    
  } catch (error) {
    console.error('TestDataLoader: Failed to load world data:', error);
    throw error;
  }
}