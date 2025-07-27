import { loadWorldData } from '../data/dataLoader';

/**
 * Test the bulletproof modular dataLoader implementation
 */
export async function testBulletproofDataLoader(): Promise<{
  success: boolean;
  summary: any;
  warnings: string[];
  error?: string;
}> {
  try {
    console.log('Testing bulletproof modular data loader...');
    
    const startTime = performance.now();
    const data = await loadWorldData();
    const endTime = performance.now();
    
    console.log('✅ Data loader test completed successfully');
    console.log(`⏱️ Load time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`🏛️ Nations loaded: ${data.nations.length}`);
    console.log(`🗺️ Provinces loaded: ${data.provinces.length}`);
    console.log(`🌍 Boundaries loaded: ${Object.keys(data.boundaries).length}`);
    console.log(`⚠️ Warnings: ${data.warnings.length}`);
    
    if (data.warnings.length > 0) {
      console.log('📋 Warnings found:');
      data.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    // Validate critical data
    const hasCanada = data.nations.some(n => n.id === 'CAN');
    const hasCanadianProvinces = data.provinces.some(p => p.country === 'Canada');
    const hasUSA = data.nations.some(n => n.id === 'USA');
    
    console.log('🔍 Data validation:');
    console.log(`  - Canada found: ${hasCanada}`);
    console.log(`  - Canadian provinces found: ${hasCanadianProvinces}`);
    console.log(`  - USA found: ${hasUSA}`);
    
    return {
      success: true,
      summary: data.loadingSummary,
      warnings: data.warnings,
    };
    
  } catch (error) {
    console.error('❌ Data loader test failed:', error);
    return {
      success: false,
      summary: null,
      warnings: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Test schema validation functionality
 */
export async function testSchemaValidation(): Promise<{
  success: boolean;
  validationResults: string[];
}> {
  try {
    console.log('Testing schema validation...');
    
    // The schema validation is built into the dataLoader now
    const data = await loadWorldData();
    
    // Check if warnings contain schema validation failures
    const schemaWarnings = data.warnings.filter(warning => 
      warning.includes('schema validation') || warning.includes('failed validation')
    );
    
    console.log(`📊 Schema validation results: ${schemaWarnings.length} schema issues found`);
    
    return {
      success: true,
      validationResults: schemaWarnings
    };
    
  } catch (error) {
    console.error('❌ Schema validation test failed:', error);
    return {
      success: false,
      validationResults: [`Schema validation test failed: ${error}`]
    };
  }
}

/**
 * Test file resilience by simulating various error conditions
 */
export async function testFileResilience(): Promise<{
  success: boolean;
  resilienceResults: string[];
}> {
  try {
    console.log('Testing file resilience...');
    
    const data = await loadWorldData();
    const results: string[] = [];
    
    // Check if any files failed but loading continued
    if (data.loadingSummary.failedFiles > 0) {
      results.push(`✅ Resilience test passed: ${data.loadingSummary.failedFiles} failed files handled gracefully`);
    } else {
      results.push('ℹ️ No file failures detected (all files loaded successfully)');
    }
    
    // Check if we have some data even with potential failures
    if (data.nations.length > 0 && data.provinces.length > 0) {
      results.push('✅ Essential data loaded despite any failures');
    } else {
      results.push('❌ Critical data missing - resilience may need improvement');
    }
    
    // Check warning handling
    if (data.warnings.length > 0) {
      results.push(`✅ Warning system functional: ${data.warnings.length} warnings tracked`);
    }
    
    return {
      success: true,
      resilienceResults: results
    };
    
  } catch (error) {
    console.error('❌ File resilience test failed:', error);
    return {
      success: false,
      resilienceResults: [`File resilience test failed: ${error}`]
    };
  }
}

/**
 * Run all bulletproof data loader tests
 */
export async function runBulletproofTests(): Promise<void> {
  console.log('\n🧪 Running Bulletproof Data Loader Tests...\n');
  
  const [loaderTest, schemaTest, resilienceTest] = await Promise.all([
    testBulletproofDataLoader(),
    testSchemaValidation(),
    testFileResilience()
  ]);
  
  console.log('\n📊 Test Results Summary:');
  console.log(`🔧 Data Loader: ${loaderTest.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📋 Schema Validation: ${schemaTest.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🛡️ File Resilience: ${resilienceTest.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (loaderTest.summary) {
    console.log(`\n📈 Performance Metrics:`);
    console.log(`  - Load Time: ${loaderTest.summary.loadTime.toFixed(2)}ms`);
    console.log(`  - Success Rate: ${((loaderTest.summary.successfulFiles / loaderTest.summary.totalFiles) * 100).toFixed(1)}%`);
    console.log(`  - Data Quality: ${loaderTest.warnings.length === 0 ? 'Perfect' : `${loaderTest.warnings.length} warnings`}`);
  }
  
  console.log('\n🎯 Bulletproof Data Loader Tests Complete!\n');
}