#!/usr/bin/env node

/**
 * Natural Earth Validator and Processor
 * 
 * Validates downloaded Natural Earth data and enhances it with game-specific metadata
 */

const fs = require('fs').promises;
const path = require('path');

class NaturalEarthValidator {
  constructor() {
    this.boundariesDir = path.join(__dirname, '../data/boundaries');
    this.validationResults = {
      overview: { valid: 0, invalid: 0, missing: 0, errors: [] },
      detailed: { valid: 0, invalid: 0, missing: 0, errors: [] },
      ultra: { valid: 0, invalid: 0, missing: 0, errors: [] }
    };
    this.expectedCountries = [
      'USA', 'CAN', 'MEX', 'BRA', 'ARG', 'GBR', 'FRA', 'DEU', 'ITA', 'ESP',
      'RUS', 'CHN', 'IND', 'JPN', 'AUS', 'ZAF', 'EGY', 'TUR', 'SAU', 'IRN'
    ];
  }

  /**
   * Run full validation and enhancement
   */
  async run() {
    console.log('🔍 Starting Natural Earth Validation...');
    
    try {
      await this.validateStructure();
      await this.validateFiles();
      await this.enhanceWithGameData();
      await this.generateValidationReport();
      
      console.log('\n✅ Validation completed!');
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate directory structure
   */
  async validateStructure() {
    console.log('\n📁 Validating directory structure...');
    
    const levels = ['overview', 'detailed', 'ultra'];
    
    for (const level of levels) {
      const levelDir = path.join(this.boundariesDir, level);
      
      try {
        await fs.access(levelDir);
        console.log(`  ✅ ${level} directory exists`);
      } catch {
        console.error(`  ❌ ${level} directory missing`);
        await fs.mkdir(levelDir, { recursive: true });
        console.log(`  🔧 Created ${level} directory`);
      }
    }
  }

  /**
   * Validate individual country files
   */
  async validateFiles() {
    console.log('\n🌍 Validating country files...');
    
    const levels = ['overview', 'detailed', 'ultra'];
    
    for (const level of levels) {
      console.log(`\n  📊 Validating ${level} level...`);
      await this.validateLevel(level);
    }
  }

  /**
   * Validate a specific detail level
   */
  async validateLevel(level) {
    const levelDir = path.join(this.boundariesDir, level);
    
    try {
      const files = await fs.readdir(levelDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      console.log(`    Found ${jsonFiles.length} files`);
      
      for (const file of jsonFiles) {
        const country = file.replace('.json', '');
        await this.validateCountryFile(level, country, path.join(levelDir, file));
      }
      
      // Check for missing expected countries
      for (const expectedCountry of this.expectedCountries) {
        if (!jsonFiles.includes(`${expectedCountry}.json`)) {
          this.validationResults[level].missing++;
          this.validationResults[level].errors.push(`Missing: ${expectedCountry}`);
          console.log(`    ⚠️  Missing: ${expectedCountry}`);
        }
      }
      
    } catch (error) {
      console.error(`    ❌ Failed to read ${level} directory:`, error.message);
    }
  }

  /**
   * Validate individual country file
   */
  async validateCountryFile(level, country, filePath) {
    try {
      const rawData = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(rawData);
      
      // Validate GeoJSON structure
      if (!this.isValidGeoJSON(data)) {
        this.validationResults[level].invalid++;
        this.validationResults[level].errors.push(`Invalid GeoJSON: ${country}`);
        console.log(`    ❌ Invalid GeoJSON: ${country}`);
        return;
      }
      
      // Validate metadata
      if (!data.metadata) {
        data.metadata = {
          source: 'Unknown',
          level: level,
          country: country,
          generated: new Date().toISOString()
        };
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`    🔧 Added metadata: ${country}`);
      }
      
      // Validate features have proper IDs
      let modified = false;
      data.features.forEach((feature, index) => {
        if (!feature.properties) {
          feature.properties = {};
          modified = true;
        }
        if (!feature.properties.id) {
          feature.properties.id = feature.properties.ISO_A3 || country;
          modified = true;
        }
      });
      
      if (modified) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`    🔧 Fixed feature IDs: ${country}`);
      }
      
      this.validationResults[level].valid++;
      console.log(`    ✅ Valid: ${country} (${data.features.length} features)`);
      
    } catch (error) {
      this.validationResults[level].invalid++;
      this.validationResults[level].errors.push(`Parse error ${country}: ${error.message}`);
      console.log(`    ❌ Parse error: ${country} - ${error.message}`);
    }
  }

  /**
   * Check if data is valid GeoJSON
   */
  isValidGeoJSON(data) {
    if (!data || typeof data !== 'object') return false;
    if (data.type !== 'FeatureCollection') return false;
    if (!Array.isArray(data.features)) return false;
    
    return data.features.every(feature => {
      if (!feature || feature.type !== 'Feature') return false;
      if (!feature.geometry || !feature.geometry.type) return false;
      return true;
    });
  }

  /**
   * Enhance files with game-specific metadata
   */
  async enhanceWithGameData() {
    console.log('\n🎮 Enhancing with game metadata...');
    
    // Game-specific country data
    const gameCountryData = {
      'USA': {
        displayName: 'United States',
        region: 'North America',
        startingYear: 1990,
        government: 'Federal Republic',
        ideology: 'Liberal Democracy',
        gdpEstimate: 5.9e12,
        population: 248709873
      },
      'CAN': {
        displayName: 'Canada',
        region: 'North America',
        startingYear: 1990,
        government: 'Federal Parliamentary Democracy',
        ideology: 'Liberal Democracy',
        gdpEstimate: 593.3e9,
        population: 27791000
      },
      'CHN': {
        displayName: 'China',
        region: 'East Asia',
        startingYear: 1990,
        government: 'Socialist Republic',
        ideology: 'State Socialism',
        gdpEstimate: 390.3e9,
        population: 1143333000
      },
      'RUS': {
        displayName: 'Russia',
        region: 'Eastern Europe',
        startingYear: 1991,
        government: 'Federal Republic',
        ideology: 'Transitional',
        gdpEstimate: 507.1e9,
        population: 148292000
      },
      'DEU': {
        displayName: 'Germany',
        region: 'Western Europe',
        startingYear: 1990,
        government: 'Federal Republic',
        ideology: 'Liberal Democracy',
        gdpEstimate: 1.768e12,
        population: 79479000
      },
      'GBR': {
        displayName: 'United Kingdom',
        region: 'Western Europe',
        startingYear: 1990,
        government: 'Constitutional Monarchy',
        ideology: 'Liberal Democracy',
        gdpEstimate: 1.094e12,
        population: 57247000
      },
      'FRA': {
        displayName: 'France',
        region: 'Western Europe',
        startingYear: 1990,
        government: 'Semi-Presidential Republic',
        ideology: 'Liberal Democracy',
        gdpEstimate: 1.275e12,
        population: 56715000
      },
      'JPN': {
        displayName: 'Japan',
        region: 'East Asia',
        startingYear: 1990,
        government: 'Constitutional Monarchy',
        ideology: 'Liberal Democracy',
        gdpEstimate: 3.103e12,
        population: 123611000
      },
      'IND': {
        displayName: 'India',
        region: 'South Asia',
        startingYear: 1990,
        government: 'Federal Republic',
        ideology: 'Liberal Democracy',
        gdpEstimate: 326.6e9,
        population: 870133480
      }
    };
    
    const levels = ['overview', 'detailed', 'ultra'];
    
    for (const level of levels) {
      const levelDir = path.join(this.boundariesDir, level);
      
      try {
        const files = await fs.readdir(levelDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        for (const file of jsonFiles) {
          const country = file.replace('.json', '');
          const filePath = path.join(levelDir, file);
          
          if (gameCountryData[country]) {
            try {
              const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
              
              // Add game metadata
              data.gameMetadata = gameCountryData[country];
              data.metadata.enhanced = new Date().toISOString();
              
              await fs.writeFile(filePath, JSON.stringify(data, null, 2));
              console.log(`    🎮 Enhanced: ${country}`);
              
            } catch (error) {
              console.warn(`    ⚠️  Failed to enhance ${country}: ${error.message}`);
            }
          }
        }
        
      } catch (error) {
        console.error(`Failed to enhance ${level}:`, error.message);
      }
    }
  }

  /**
   * Generate validation report
   */
  async generateValidationReport() {
    console.log('\n📊 Generating validation report...');
    
    const report = {
      generated: new Date().toISOString(),
      validator_version: '1.0.0',
      levels: this.validationResults,
      summary: {
        total_valid: 0,
        total_invalid: 0,
        total_missing: 0,
        total_files: 0
      },
      recommendations: []
    };
    
    // Calculate totals
    for (const [level, results] of Object.entries(this.validationResults)) {
      report.summary.total_valid += results.valid;
      report.summary.total_invalid += results.invalid;
      report.summary.total_missing += results.missing;
      report.summary.total_files += results.valid + results.invalid;
    }
    
    // Generate recommendations
    if (report.summary.total_missing > 0) {
      report.recommendations.push('Download missing country boundary files');
    }
    if (report.summary.total_invalid > 0) {
      report.recommendations.push('Fix invalid GeoJSON files');
    }
    if (report.summary.total_valid < this.expectedCountries.length * 3) {
      report.recommendations.push('Ensure all expected countries have files at all detail levels');
    }
    
    // Write report
    const reportPath = path.join(this.boundariesDir, 'validation-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Validation report written to ${reportPath}`);
    console.log(`📈 Total valid files: ${report.summary.total_valid}`);
    console.log(`❌ Total invalid files: ${report.summary.total_invalid}`);
    console.log(`⚠️  Total missing files: ${report.summary.total_missing}`);
    
    // Display level breakdown
    for (const [level, results] of Object.entries(this.validationResults)) {
      console.log(`\n  ${level.toUpperCase()}:`);
      console.log(`    ✅ Valid: ${results.valid}`);
      console.log(`    ❌ Invalid: ${results.invalid}`);
      console.log(`    ⚠️  Missing: ${results.missing}`);
      
      if (results.errors.length > 0) {
        console.log(`    📋 Errors: ${results.errors.slice(0, 5).join(', ')}${results.errors.length > 5 ? '...' : ''}`);
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Natural Earth Validator

Usage:
  node validate-natural-earth.js [options]

Options:
  --help, -h     Show this help message

This script validates Natural Earth boundary data files
and enhances them with game-specific metadata.
    `);
    process.exit(0);
  }
  
  // Run the validator
  const validator = new NaturalEarthValidator();
  validator.run().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = { NaturalEarthValidator };