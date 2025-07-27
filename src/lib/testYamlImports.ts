import yaml from 'js-yaml';

export async function testYamlImports() {
  console.log('=== Testing YAML Import Patterns ===');
  
  try {
    // Test the glob patterns directly
    const testNationModules = import.meta.glob([
      '../data/nations_*.yaml',
      '../data/regions/**/nations_*.yaml',
      '../data/regions/*/nations_*.yaml'
    ], { as: 'raw' });

    const testProvinceModules = import.meta.glob([
      '../data/provinces_*.yaml', 
      '../data/regions/**/provinces_*.yaml',
      '../data/regions/*/provinces_*.yaml'
    ], { as: 'raw' });

    const testBoundaryModules = import.meta.glob([
      '../data/province-boundaries_*.json',
      '../data/regions/**/province-boundaries_*.json',
      '../data/regions/*/province-boundaries_*.json'
    ]);

    console.log('Nation module paths found:', Object.keys(testNationModules));
    console.log('Province module paths found:', Object.keys(testProvinceModules));
    console.log('Boundary module paths found:', Object.keys(testBoundaryModules));

    // Try to load one of each type
    if (Object.keys(testNationModules).length > 0) {
      const firstNationPath = Object.keys(testNationModules)[0];
      console.log(`\nTesting first nation file: ${firstNationPath}`);
      
      try {
        const nationRaw = await testNationModules[firstNationPath]();
        console.log('Raw content length:', nationRaw.length);
        
        const parsed = yaml.load(nationRaw);
        console.log('Parsed structure:', typeof parsed, Array.isArray(parsed) ? 'Array' : 'Object');
        
        if (parsed && typeof parsed === 'object' && parsed.nations) {
          console.log('Nations found:', Object.keys(parsed.nations));
        }
      } catch (error) {
        console.error('Failed to load/parse nation file:', error);
      }
    }

    if (Object.keys(testProvinceModules).length > 0) {
      const firstProvincePath = Object.keys(testProvinceModules)[0];
      console.log(`\nTesting first province file: ${firstProvincePath}`);
      
      try {
        const provinceRaw = await testProvinceModules[firstProvincePath]();
        console.log('Raw content length:', provinceRaw.length);
        
        const parsed = yaml.load(provinceRaw);
        console.log('Parsed structure:', typeof parsed, Array.isArray(parsed) ? 'Array' : 'Object');
        
        if (parsed && typeof parsed === 'object' && parsed.provinces) {
          const provinceKeys = Object.keys(parsed.provinces);
          console.log('First 5 provinces found:', provinceKeys.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to load/parse province file:', error);
      }
    }

    return {
      success: true,
      nationFiles: Object.keys(testNationModules).length,
      provinceFiles: Object.keys(testProvinceModules).length,
      boundaryFiles: Object.keys(testBoundaryModules).length
    };

  } catch (error) {
    console.error('YAML import test failed:', error);
    return {
      success: false,
      error: error.message || String(error)
    };
  }
}