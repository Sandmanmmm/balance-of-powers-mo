// Test the glob patterns directly
export async function testGlobPatterns() {
  console.log('=== TESTING GLOB PATTERNS ===');
  
  // Test patterns that should match our files
  const patterns = [
    './nations_*.yaml',
    './regions/*/nations_*.yaml',
    './provinces_*.yaml', 
    './regions/*/provinces_*.yaml',
    './province-boundaries_*.json',
    './regions/*/province-boundaries_*.json'
  ];
  
  for (const pattern of patterns) {
    console.log(`Testing pattern: ${pattern}`);
    
    try {
      // Note: We need to import this from the same directory as dataLoader.ts
      const modules = import.meta.glob(pattern, { as: 'raw' });
      console.log(`  Found ${Object.keys(modules).length} files:`);
      Object.keys(modules).forEach(path => console.log(`    ${path}`));
    } catch (error) {
      console.error(`  Error with pattern ${pattern}:`, error);
    }
  }
  
  console.log('=== GLOB PATTERN TEST COMPLETE ===');
}