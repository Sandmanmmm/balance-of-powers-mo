import { debugAvailableFiles, loadWorldData } from '../data/dataLoader';

export async function testModularDataLoading() {
  console.log('=== DEBUGGING MODULAR DATA LOADER ===');
  
  // First, debug what files are detected
  debugAvailableFiles();
  
  // Then try to load the data
  try {
    console.log('Attempting to load world data...');
    const worldData = await loadWorldData();
    
    console.log('=== LOAD RESULTS ===');
    console.log('Nations loaded:', worldData.nations.length);
    console.log('Nations:', worldData.nations.map(n => `${n.id}: ${n.name}`));
    
    console.log('Provinces loaded:', worldData.provinces.length);
    console.log('First 10 provinces:');
    worldData.provinces.slice(0, 10).forEach(p => {
      console.log(`  ${p.id}: ${p.name} (${p.country})`);
    });
    
    console.log('Boundary keys loaded:', Object.keys(worldData.boundaries).length);
    console.log('Boundary keys:', Object.keys(worldData.boundaries).slice(0, 10));
    
    return worldData;
  } catch (error) {
    console.error('ERROR loading world data:', error);
    throw error;
  }
}