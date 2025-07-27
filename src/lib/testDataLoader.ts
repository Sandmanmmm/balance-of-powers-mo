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
    
    console.log('TestDataLoader: Nation test results:', {
      canadaFound: !!canada,
      mexicoFound: !!mexico,
      canadaName: canada?.name,
      mexicoName: mexico?.name
    });
    
    // Test provinces
    const canadianProvinces = worldData.provinces.filter(p => p.country === 'Canada');
    const mexicanProvinces = worldData.provinces.filter(p => p.country === 'Mexico');
    
    console.log('TestDataLoader: Province test results:', {
      canadianProvinces: canadianProvinces.length,
      mexicanProvinces: mexicanProvinces.length,
      totalProvinces: worldData.provinces.length,
      canadianProvinceNames: canadianProvinces.map(p => p.name),
      mexicanProvinceNames: mexicanProvinces.map(p => p.name)
    });
    
    // Test boundaries
    const canBoundaries = Object.keys(worldData.boundaries).filter(id => id.startsWith('CAN_'));
    const mexBoundaries = Object.keys(worldData.boundaries).filter(id => id.startsWith('MEX_'));
    
    console.log('TestDataLoader: Boundary test results:', {
      canadianBoundaries: canBoundaries.length,
      mexicanBoundaries: mexBoundaries.length,
      totalBoundaryFeatures: Object.keys(worldData.boundaries).length,
      boundaryIds: Object.keys(worldData.boundaries)
    });
    
    return worldData;
    
  } catch (error) {
    console.error('TestDataLoader: Failed to load world data:', error);
    throw error;
  }
}