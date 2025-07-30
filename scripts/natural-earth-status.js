#!/usr/bin/env node

/**
 * Natural Earth Pipeline Status Reporter
 * 
 * Validates and reports on the current state of boundary data
 */

const fs = require('fs').promises;
const path = require('path');

class NaturalEarthStatus {
  constructor() {
    this.boundariesDir = path.join(__dirname, '../data/boundaries');
    this.results = {
      overview: { files: [], valid: 0, invalid: 0, errors: [] },
      detailed: { files: [], valid: 0, invalid: 0, errors: [] },
      ultra: { files: [], valid: 0, invalid: 0, errors: [] }
    };
  }

  async run() {
    console.log('🔍 Natural Earth Pipeline Status Report');
    console.log('======================================');
    
    try {
      await this.checkDirectoryStructure();
      await this.validateAllLevels();
      await this.generateReport();
      
      console.log('\n✅ Status report completed!');
      
    } catch (error) {
      console.error('❌ Status check failed:', error.message);
      throw error;
    }
  }

  async checkDirectoryStructure() {
    console.log('\n📁 Directory Structure Check');
    console.log('----------------------------');
    
    const levels = ['overview', 'detailed', 'ultra'];
    
    for (const level of levels) {
      const levelDir = path.join(this.boundariesDir, level);
      
      try {
        await fs.access(levelDir);
        const files = await fs.readdir(levelDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        console.log(`✅ ${level}: ${jsonFiles.length} files`);
        this.results[level].files = jsonFiles;
        
      } catch (error) {
        console.log(`❌ ${level}: Directory missing or inaccessible`);
        this.results[level].errors.push(`Directory missing: ${error.message}`);
      }
    }
  }

  async validateAllLevels() {
    console.log('\n🔍 File Validation');
    console.log('------------------');
    
    for (const level of ['overview', 'detailed', 'ultra']) {
      if (this.results[level].files.length > 0) {
        await this.validateLevel(level);
      }
    }
  }

  async validateLevel(level) {
    console.log(`\n📊 Validating ${level.toUpperCase()} level:`);
    
    const levelDir = path.join(this.boundariesDir, level);
    
    for (const file of this.results[level].files) {
      const filePath = path.join(levelDir, file);
      const country = file.replace('.json', '');
      
      try {
        const rawData = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(rawData);
        
        const validation = this.validateBoundaryFile(data, country);
        
        if (validation.valid) {
          this.results[level].valid++;
          console.log(`  ✅ ${country}: Valid (${data.features?.length || 0} features)`);
        } else {
          this.results[level].invalid++;
          this.results[level].errors.push(`${country}: ${validation.error}`);
          console.log(`  ❌ ${country}: ${validation.error}`);
        }
        
      } catch (error) {
        this.results[level].invalid++;
        this.results[level].errors.push(`${country}: Parse error - ${error.message}`);
        console.log(`  ❌ ${country}: Parse error - ${error.message}`);
      }
    }
    
    console.log(`  📈 Summary: ${this.results[level].valid} valid, ${this.results[level].invalid} invalid`);
  }

  validateBoundaryFile(data, country) {
    // Check basic GeoJSON structure
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Not a valid JSON object' };
    }
    
    if (data.type !== 'FeatureCollection') {
      return { valid: false, error: 'Not a FeatureCollection' };
    }
    
    if (!Array.isArray(data.features)) {
      return { valid: false, error: 'No features array' };
    }
    
    if (data.features.length === 0) {
      return { valid: false, error: 'Empty features array' };
    }
    
    // Check metadata
    if (!data.metadata) {
      return { valid: false, error: 'Missing metadata' };
    }
    
    if (!data.metadata.country || data.metadata.country !== country) {
      return { valid: false, error: 'Metadata country mismatch' };
    }
    
    // Check features
    for (let i = 0; i < data.features.length; i++) {
      const feature = data.features[i];
      
      if (feature.type !== 'Feature') {
        return { valid: false, error: `Feature ${i}: Not a Feature type` };
      }
      
      if (!feature.geometry || !feature.geometry.type) {
        return { valid: false, error: `Feature ${i}: Missing or invalid geometry` };
      }
      
      if (!feature.properties) {
        return { valid: false, error: `Feature ${i}: Missing properties` };
      }
      
      if (!feature.properties.ISO_A3 || feature.properties.ISO_A3 !== country) {
        return { valid: false, error: `Feature ${i}: Missing or invalid ISO_A3` };
      }
    }
    
    return { valid: true };
  }

  async generateReport() {
    console.log('\n📊 Final Status Report');
    console.log('======================');
    
    let totalFiles = 0;
    let totalValid = 0;
    let totalInvalid = 0;
    const allCountries = new Set();
    
    // Calculate totals
    for (const [level, results] of Object.entries(this.results)) {
      totalFiles += results.files.length;
      totalValid += results.valid;
      totalInvalid += results.invalid;
      
      results.files.forEach(file => {
        const country = file.replace('.json', '');
        allCountries.add(country);
      });
    }
    
    // Display summary
    console.log(`📁 Total Files: ${totalFiles}`);
    console.log(`✅ Valid Files: ${totalValid}`);
    console.log(`❌ Invalid Files: ${totalInvalid}`);
    console.log(`🌍 Unique Countries: ${allCountries.size}`);
    
    // Level breakdown
    console.log('\n📊 Level Breakdown:');
    for (const [level, results] of Object.entries(this.results)) {
      console.log(`  ${level.toUpperCase()}:`);
      console.log(`    📁 Files: ${results.files.length}`);
      console.log(`    ✅ Valid: ${results.valid}`);
      console.log(`    ❌ Invalid: ${results.invalid}`);
      
      if (results.errors.length > 0) {
        console.log(`    🚨 Errors: ${results.errors.slice(0, 3).join(', ')}${results.errors.length > 3 ? '...' : ''}`);
      }
    }
    
    // Countries per level
    console.log('\n🌍 Countries Available:');
    const countriesByLevel = {};
    
    for (const [level, results] of Object.entries(this.results)) {
      countriesByLevel[level] = results.files.map(f => f.replace('.json', '')).sort();
      console.log(`  ${level.toUpperCase()}: ${countriesByLevel[level].join(', ')}`);
    }
    
    // Completeness check
    console.log('\n🔍 Completeness Analysis:');
    const expectedCountries = ['USA', 'CAN', 'MEX', 'CHN', 'RUS', 'IND', 'DEU', 'FRA', 'GBR', 'JPN'];
    
    for (const country of expectedCountries) {
      const levels = [];
      if (countriesByLevel.overview.includes(country)) levels.push('overview');
      if (countriesByLevel.detailed.includes(country)) levels.push('detailed');
      if (countriesByLevel.ultra.includes(country)) levels.push('ultra');
      
      const status = levels.length === 3 ? '✅' : levels.length > 0 ? '⚠️' : '❌';
      console.log(`  ${status} ${country}: ${levels.join(', ') || 'Missing'}`);
    }
    
    // Generate recommendations
    console.log('\n💡 Recommendations:');
    
    if (totalInvalid > 0) {
      console.log('  🔧 Fix invalid boundary files');
    }
    
    if (allCountries.size < 20) {
      console.log('  📈 Add more countries for global coverage');
    }
    
    const missingUltra = expectedCountries.filter(c => !countriesByLevel.ultra.includes(c));
    if (missingUltra.length > 0) {
      console.log(`  🔬 Add ultra detail for: ${missingUltra.join(', ')}`);
    }
    
    if (totalValid === totalFiles && totalFiles > 0) {
      console.log('  🎉 All files are valid! System ready for production.');
    }
    
    // Write JSON report
    const report = {
      generated: new Date().toISOString(),
      summary: {
        total_files: totalFiles,
        valid_files: totalValid,
        invalid_files: totalInvalid,
        unique_countries: allCountries.size
      },
      levels: this.results,
      countries_by_level: countriesByLevel,
      completeness: expectedCountries.map(country => ({
        country,
        levels: Object.keys(countriesByLevel).filter(level => 
          countriesByLevel[level].includes(country)
        )
      }))
    };
    
    const reportPath = path.join(this.boundariesDir, 'status-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n💾 Detailed report saved: ${reportPath}`);
  }

  // Quick status check without full validation
  async quickStatus() {
    console.log('⚡ Quick Natural Earth Status');
    console.log('============================');
    
    const levels = ['overview', 'detailed', 'ultra'];
    
    for (const level of levels) {
      const levelDir = path.join(this.boundariesDir, level);
      
      try {
        const files = await fs.readdir(levelDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        const countries = jsonFiles.map(f => f.replace('.json', '')).sort();
        
        console.log(`${level.toUpperCase()}: ${jsonFiles.length} files`);
        console.log(`  Countries: ${countries.slice(0, 10).join(', ')}${countries.length > 10 ? '...' : ''}`);
        
      } catch {
        console.log(`${level.toUpperCase()}: No data`);
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Natural Earth Status Reporter

Usage:
  node natural-earth-status.js [command] [options]

Commands:
  status      Full validation and status report (default)
  quick       Quick file count summary
  
Options:
  --help, -h  Show this help message

This script validates and reports on Natural Earth boundary data.
    `);
    process.exit(0);
  }
  
  const reporter = new NaturalEarthStatus();
  
  if (args.includes('quick')) {
    reporter.quickStatus().catch(error => {
      console.error('Quick status failed:', error);
      process.exit(1);
    });
  } else {
    reporter.run().catch(error => {
      console.error('Status report failed:', error);
      process.exit(1);
    });
  }
}

module.exports = { NaturalEarthStatus };