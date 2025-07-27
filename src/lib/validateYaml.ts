import yaml from 'js-yaml';

export async function validateYamlFiles() {
  console.log('=== VALIDATING YAML FILES ===');
  
  const testFiles = [
    './regions/south_america/nations_south_america.yaml',
    './regions/south_america/provinces_south_america.yaml',
    './regions/north_america/nations_north_america.yaml',
    './regions/north_america/provinces_north_america.yaml'
  ];
  
  for (const file of testFiles) {
    try {
      console.log(`Testing ${file}...`);
      
      // Try to import the file as raw text
      const rawContent = await import(`../data/${file}?raw`);
      const content = rawContent.default;
      
      console.log(`  File loaded, length: ${content.length}`);
      
      // Try to parse the YAML
      const parsed = yaml.load(content);
      console.log(`  YAML parsed successfully`);
      
      // Check the structure
      if (parsed && typeof parsed === 'object') {
        if (parsed.nations) {
          console.log(`  Contains ${Array.isArray(parsed.nations) ? parsed.nations.length : 'non-array'} nations`);
        }
        if (parsed.provinces) {
          console.log(`  Contains ${Array.isArray(parsed.provinces) ? parsed.provinces.length : 'non-array'} provinces`);
        }
      }
      
    } catch (error) {
      console.error(`  ERROR with ${file}:`, error);
    }
  }
  
  console.log('=== VALIDATION COMPLETE ===');
}