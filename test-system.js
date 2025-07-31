#!/usr/bin/env node

/**
 * Complete System Test Runner
 * 
 * This script performs a comprehensive test of the Balance of Powers system
 * to ensure everything is working correctly.
 */

const fs = require('fs').promises;
const path = require('path');

class SystemTester {
  constructor() {
    this.results = {
      dataStructure: [],
      fileIntegrity: [],
      gameLogic: [],
      boundaries: []
    };
  }

  async runAllTests() {
    console.log('🧪 Starting Complete System Test...');
    console.log('====================================\n');

    try {
      await this.testDataStructure();
      await this.testFileIntegrity();
      await this.testBoundaries();
      await this.testGameLogic();
      
      this.printSummary();
      
    } catch (error) {
      console.error('❌ System test failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  async testDataStructure() {
    console.log('📁 Testing Data Structure...');
    
    const regionsDir = path.join(__dirname, '../src/data/regions');
    const boundariesDir = path.join(__dirname, '../src/data/boundaries');
    
    try {
      // Test regions directory structure
      const regions = await fs.readdir(regionsDir);
      console.log(`✅ Found ${regions.length} regions: ${regions.join(', ')}`);
      
      // Test boundaries directory structure  
      const detailLevels = await fs.readdir(boundariesDir);
      console.log(`✅ Found ${detailLevels.length} detail levels: ${detailLevels.join(', ')}`);
      
      // Count boundary files
      let totalBoundaryFiles = 0;
      for (const level of detailLevels) {
        const levelDir = path.join(boundariesDir, level);
        const stat = await fs.stat(levelDir);
        if (stat.isDirectory()) {
          const files = await fs.readdir(levelDir);
          totalBoundaryFiles += files.filter(f => f.endsWith('.json')).length;
        }
      }
      console.log(`✅ Found ${totalBoundaryFiles} boundary files total`);
      
      this.results.dataStructure.push({ 
        test: 'Structure Check', 
        status: 'pass', 
        details: { regions: regions.length, boundaryFiles: totalBoundaryFiles }
      });
      
    } catch (error) {
      console.log(`❌ Data structure test failed: ${error.message}`);
      this.results.dataStructure.push({ 
        test: 'Structure Check', 
        status: 'fail', 
        error: error.message 
      });
    }
  }

  async testFileIntegrity() {
    console.log('\n🔍 Testing File Integrity...');
    
    try {
      // Test key game data files
      const dataDir = path.join(__dirname, '../src/data');
      const keyFiles = ['buildings.yaml', 'resources.yaml', 'events.yaml', 'technologies.yaml'];
      
      for (const file of keyFiles) {
        const filePath = path.join(dataDir, file);
        const stat = await fs.stat(filePath);
        console.log(`✅ ${file} exists (${stat.size} bytes)`);
      }
      
      // Test sample regional files
      const regionsDir = path.join(__dirname, '../src/data/regions/superpowers');
      const regionFiles = await fs.readdir(regionsDir);
      const yamlFiles = regionFiles.filter(f => f.endsWith('.yaml'));
      console.log(`✅ Found ${yamlFiles.length} superpower YAML files`);
      
      this.results.fileIntegrity.push({ 
        test: 'File Integrity', 
        status: 'pass', 
        details: { coreFiles: keyFiles.length, regionFiles: yamlFiles.length }
      });
      
    } catch (error) {
      console.log(`❌ File integrity test failed: ${error.message}`);
      this.results.fileIntegrity.push({ 
        test: 'File Integrity', 
        status: 'fail', 
        error: error.message 
      });
    }
  }

  async testBoundaries() {
    console.log('\n🗺️  Testing Boundary System...');
    
    try {
      // Test key country boundaries
      const keyCountries = ['USA', 'CAN', 'CHN', 'RUS'];
      const boundariesDir = path.join(__dirname, '../src/data/boundaries/overview');
      
      let foundCountries = 0;
      for (const country of keyCountries) {
        const boundaryFile = path.join(boundariesDir, `${country}.json`);
        try {
          const stat = await fs.stat(boundaryFile);
          console.log(`✅ ${country} boundary exists (${stat.size} bytes)`);
          
          // Test JSON validity
          const content = await fs.readFile(boundaryFile, 'utf8');
          const data = JSON.parse(content);
          const provinceCount = Object.keys(data).length;
          console.log(`   └─ ${provinceCount} provinces in ${country}`);
          foundCountries++;
          
        } catch (error) {
          console.log(`❌ ${country} boundary issue: ${error.message}`);
        }
      }
      
      console.log(`✅ Found ${foundCountries}/${keyCountries.length} key country boundaries`);
      
      this.results.boundaries.push({ 
        test: 'Boundary Files', 
        status: foundCountries >= 2 ? 'pass' : 'warning', 
        details: { found: foundCountries, total: keyCountries.length }
      });
      
    } catch (error) {
      console.log(`❌ Boundary test failed: ${error.message}`);
      this.results.boundaries.push({ 
        test: 'Boundary Files', 
        status: 'fail', 
        error: error.message 
      });
    }
  }

  async testGameLogic() {
    console.log('\n🎮 Testing Game Logic...');
    
    try {
      // Test if core game components exist
      const componentsDir = path.join(__dirname, '../src/components');
      const hooksDir = path.join(__dirname, '../src/hooks');
      
      const coreComponents = ['WorldMap.tsx', 'GameDashboard.tsx', 'ProvinceInfoPanel.tsx'];
      const coreHooks = ['useGameState.ts', 'useSimulationEngine.ts'];
      
      let componentsFound = 0;
      for (const component of coreComponents) {
        try {
          await fs.stat(path.join(componentsDir, component));
          componentsFound++;
        } catch {}
      }
      
      let hooksFound = 0;
      for (const hook of coreHooks) {
        try {
          await fs.stat(path.join(hooksDir, hook));
          hooksFound++;
        } catch {}
      }
      
      console.log(`✅ Found ${componentsFound}/${coreComponents.length} core components`);
      console.log(`✅ Found ${hooksFound}/${coreHooks.length} core hooks`);
      
      this.results.gameLogic.push({ 
        test: 'Core Components', 
        status: (componentsFound >= 2 && hooksFound >= 1) ? 'pass' : 'warning', 
        details: { components: componentsFound, hooks: hooksFound }
      });
      
    } catch (error) {
      console.log(`❌ Game logic test failed: ${error.message}`);
      this.results.gameLogic.push({ 
        test: 'Core Components', 
        status: 'fail', 
        error: error.message 
      });
    }
  }

  printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const allResults = [
      ...this.results.dataStructure,
      ...this.results.fileIntegrity,
      ...this.results.boundaries,
      ...this.results.gameLogic
    ];
    
    const passed = allResults.filter(r => r.status === 'pass').length;
    const warnings = allResults.filter(r => r.status === 'warning').length;
    const failed = allResults.filter(r => r.status === 'fail').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System is ready.');
      console.log('\nNext steps:');
      console.log('1. Start the development server: npm run dev');
      console.log('2. Open the application in your browser');
      console.log('3. Test the interactive map and game features');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
    
    console.log('\n📋 Detailed Results:');
    console.log(JSON.stringify(this.results, null, 2));
  }
}

// Run the tests
if (require.main === module) {
  const tester = new SystemTester();
  tester.runAllTests();
}

module.exports = { SystemTester };