#!/usr/bin/env node

/**
 * Test Natural Earth Pipeline Components
 * 
 * Quick test to verify all pipeline components are working
 */

const fs = require('fs').promises;
const path = require('path');

async function testPipelineComponents() {
  console.log('🧪 Testing Natural Earth Pipeline Components...');
  
  const results = {
    simple_downloader: false,
    validator: false,
    complete_pipeline: false,
    file_structure: false
  };

  try {
    // Test 1: Check if scripts exist and are valid
    console.log('\n📝 Testing script files...');
    
    const scripts = [
      'simple-natural-earth.js',
      'validate-natural-earth.js',
      'natural-earth-complete.js'
    ];
    
    for (const script of scripts) {
      try {
        const scriptPath = path.join(__dirname, script);
        const content = await fs.readFile(scriptPath, 'utf8');
        
        // Basic validation
        if (content.includes('class') && content.includes('async') && content.includes('module.exports')) {
          console.log(`  ✅ ${script}: Valid`);
          if (script === 'simple-natural-earth.js') results.simple_downloader = true;
          if (script === 'validate-natural-earth.js') results.validator = true;
          if (script === 'natural-earth-complete.js') results.complete_pipeline = true;
        } else {
          console.log(`  ❌ ${script}: Invalid structure`);
        }
      } catch (error) {
        console.log(`  ❌ ${script}: Not found - ${error.message}`);
      }
    }

    // Test 2: Check directory structure
    console.log('\n📁 Testing directory structure...');
    
    const boundariesDir = path.join(__dirname, '../data/boundaries');
    const levels = ['overview', 'detailed', 'ultra'];
    
    try {
      await fs.access(boundariesDir);
      console.log(`  ✅ Boundaries directory exists`);
      
      let allLevelsExist = true;
      for (const level of levels) {
        try {
          await fs.access(path.join(boundariesDir, level));
          console.log(`    ✅ ${level} directory exists`);
        } catch {
          console.log(`    ⚠️  ${level} directory missing (will be created)`);
          allLevelsExist = false;
        }
      }
      
      results.file_structure = allLevelsExist;
      
    } catch {
      console.log(`  ⚠️  Boundaries directory missing (will be created)`);
    }

    // Test 3: Try to import modules
    console.log('\n🔧 Testing module imports...');
    
    try {
      const { SimpleNaturalEarthPipeline } = require('./simple-natural-earth.js');
      if (typeof SimpleNaturalEarthPipeline === 'function') {
        console.log('  ✅ SimpleNaturalEarthPipeline: Importable');
      }
    } catch (error) {
      console.log(`  ❌ SimpleNaturalEarthPipeline: Import failed - ${error.message}`);
    }
    
    try {
      const { NaturalEarthValidator } = require('./validate-natural-earth.js');
      if (typeof NaturalEarthValidator === 'function') {
        console.log('  ✅ NaturalEarthValidator: Importable');
      }
    } catch (error) {
      console.log(`  ❌ NaturalEarthValidator: Import failed - ${error.message}`);
    }

    // Test 4: Mock download test (without actual network calls)
    console.log('\n🌐 Testing pipeline logic...');
    
    try {
      const { SimpleNaturalEarthPipeline } = require('./simple-natural-earth.js');
      const pipeline = new SimpleNaturalEarthPipeline();
      
      // Test extractISO3 method
      const testFeature = {
        properties: {
          ISO_A3: 'USA',
          NAME: 'United States'
        }
      };
      
      const iso3 = pipeline.extractISO3(testFeature.properties);
      if (iso3 === 'USA') {
        console.log('  ✅ ISO3 extraction: Working');
      } else {
        console.log('  ❌ ISO3 extraction: Failed');
      }
      
    } catch (error) {
      console.log(`  ❌ Pipeline logic test failed: ${error.message}`);
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    for (const [test, passed] of Object.entries(results)) {
      const status = passed ? '✅' : '❌';
      const testName = test.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      console.log(`${status} ${testName}`);
    }
    
    console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Pipeline is ready to use.');
    } else {
      console.log('⚠️  Some tests failed. Check the issues above.');
    }

    // Usage instructions
    console.log('\n📖 Usage Instructions:');
    console.log('======================');
    console.log('To download Natural Earth data:');
    console.log('  node scripts/natural-earth-complete.js');
    console.log('');
    console.log('To check status:');
    console.log('  node scripts/natural-earth-complete.js status');
    console.log('');
    console.log('To run simple download only:');
    console.log('  node scripts/simple-natural-earth.js');
    console.log('');
    console.log('To validate existing data:');
    console.log('  node scripts/validate-natural-earth.js');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  testPipelineComponents();
}

module.exports = { testPipelineComponents };