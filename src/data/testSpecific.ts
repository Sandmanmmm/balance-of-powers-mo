import yaml from 'js-yaml';

export async function testSpecificFiles() {
  console.log('=== TESTING SPECIFIC FILE LOADING ===');
  
  // Test loading Canada specifically
  try {
    console.log('Loading north_america nations...');
    const northAmericaNationsRaw = await import('./regions/north_america/nations_north_america.yaml?raw');
    const northAmericaNations = yaml.load(northAmericaNationsRaw.default);
    console.log('North America nations loaded:', northAmericaNations);
    
    console.log('Loading north_america provinces...');
    const northAmericaProvincesRaw = await import('./regions/north_america/provinces_north_america.yaml?raw');
    const northAmericaProvinces = yaml.load(northAmericaProvincesRaw.default);
    console.log('North America provinces loaded:', northAmericaProvinces);
    
    console.log('Loading south_america nations...');
    const southAmericaNationsRaw = await import('./regions/south_america/nations_south_america.yaml?raw');
    const southAmericaNations = yaml.load(southAmericaNationsRaw.default);
    console.log('South America nations loaded:', southAmericaNations);
    
    return {
      northAmericaNations,
      northAmericaProvinces,
      southAmericaNations
    };
    
  } catch (error) {
    console.error('Error loading specific files:', error);
    throw error;
  }
}