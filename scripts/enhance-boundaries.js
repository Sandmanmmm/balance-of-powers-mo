#!/usr/bin/env node

/**
 * Boundary Enhancement Script
 * 
 * Enhances existing boundary files with game metadata and creates missing files
 * Uses simplified geometric data for performance
 */

const fs = require('fs').promises;
const path = require('path');

class BoundaryEnhancer {
  constructor() {
    this.boundariesDir = path.join(__dirname, '../data/boundaries');
    this.processedFiles = new Map();
    
    // Countries that should exist at all detail levels
    this.requiredCountries = [
      'USA', 'CAN', 'MEX', 'BRA', 'ARG', 'GBR', 'FRA', 'DEU', 'ITA', 'ESP',
      'RUS', 'CHN', 'IND', 'JPN', 'AUS', 'ZAF', 'EGY', 'TUR', 'SAU', 'IRN',
      'NOR', 'SWE', 'FIN', 'POL', 'UKR', 'KOR', 'THA', 'IDN', 'NGA', 'KEN'
    ];
  }

  async run() {
    console.log('🔧 Starting Boundary Enhancement...');
    
    try {
      await this.setupDirectories();
      await this.enhanceExistingFiles();
      await this.createMissingFiles();
      await this.validateAllFiles();
      await this.generateSummary();
      
      console.log('\n✅ Boundary enhancement completed!');
      
    } catch (error) {
      console.error('❌ Enhancement failed:', error.message);
      throw error;
    }
  }

  async setupDirectories() {
    console.log('📁 Setting up directories...');
    
    for (const level of ['overview', 'detailed', 'ultra']) {
      const dir = path.join(this.boundariesDir, level);
      await fs.mkdir(dir, { recursive: true });
      console.log(`  ✅ ${level} directory ready`);
    }
  }

  async enhanceExistingFiles() {
    console.log('\n🔧 Enhancing existing files...');
    
    for (const level of ['overview', 'detailed', 'ultra']) {
      await this.enhanceLevel(level);
    }
  }

  async enhanceLevel(level) {
    const levelDir = path.join(this.boundariesDir, level);
    
    try {
      const files = await fs.readdir(levelDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      console.log(`  📊 Enhancing ${level}: ${jsonFiles.length} files`);
      
      for (const file of jsonFiles) {
        const countryCode = file.replace('.json', '');
        const filePath = path.join(levelDir, file);
        
        await this.enhanceFile(filePath, countryCode, level);
      }
      
    } catch (error) {
      console.log(`  ⚠️  No files found in ${level}`);
    }
  }

  async enhanceFile(filePath, countryCode, level) {
    try {
      const rawData = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(rawData);
      
      // Add standardized metadata
      data.metadata = {
        ...data.metadata,
        source: data.metadata?.source || 'Natural Earth',
        level: level,
        country: countryCode,
        generated: data.metadata?.generated || new Date().toISOString(),
        enhanced: new Date().toISOString(),
        version: '1.0.0'
      };

      // Add game metadata
      const gameData = this.getGameMetadata(countryCode);
      if (gameData) {
        data.gameMetadata = gameData;
      }

      // Ensure all features have proper IDs
      data.features.forEach(feature => {
        if (!feature.properties) feature.properties = {};
        if (!feature.properties.id) feature.properties.id = countryCode;
        if (!feature.properties.ISO_A3) feature.properties.ISO_A3 = countryCode;
      });

      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`    ✅ Enhanced: ${countryCode}`);
      
      this.processedFiles.set(`${level}:${countryCode}`, true);
      
    } catch (error) {
      console.log(`    ❌ Failed to enhance ${countryCode}: ${error.message}`);
    }
  }

  async createMissingFiles() {
    console.log('\n🌍 Creating missing files...');
    
    for (const level of ['overview', 'detailed', 'ultra']) {
      await this.createMissingForLevel(level);
    }
  }

  async createMissingForLevel(level) {
    console.log(`  📊 Checking ${level} for missing files...`);
    
    let created = 0;
    
    for (const country of this.requiredCountries) {
      const key = `${level}:${country}`;
      
      if (!this.processedFiles.has(key)) {
        await this.createCountryFile(country, level);
        created++;
      }
    }
    
    console.log(`    🆕 Created ${created} missing files for ${level}`);
  }

  async createCountryFile(countryCode, level) {
    const countryInfo = this.getCountryInfo(countryCode);
    
    // Generate simplified boundary geometry
    const geometry = this.generateSimplifiedGeometry(countryCode, level);
    
    const countryData = {
      type: 'FeatureCollection',
      metadata: {
        source: 'Generated',
        level: level,
        country: countryCode,
        generated: new Date().toISOString(),
        version: '1.0.0',
        note: 'Simplified geometry for game use'
      },
      gameMetadata: this.getGameMetadata(countryCode),
      features: [{
        type: 'Feature',
        properties: {
          id: countryCode,
          ISO_A3: countryCode,
          NAME: countryInfo.name,
          ADMIN: countryInfo.name
        },
        geometry: geometry
      }]
    };

    const filePath = path.join(this.boundariesDir, level, `${countryCode}.json`);
    await fs.writeFile(filePath, JSON.stringify(countryData, null, 2));
    
    console.log(`    🆕 Created: ${countryCode} (${level})`);
    this.processedFiles.set(`${level}:${countryCode}`, true);
  }

  generateSimplifiedGeometry(countryCode, level) {
    // Get base coordinates for the country
    const coords = this.getCountryCoordinates(countryCode);
    
    // Adjust detail based on level
    const detail = {
      'overview': 0.8,
      'detailed': 0.5,
      'ultra': 0.2
    }[level];
    
    // Create simplified polygon around the coordinates
    const [centerLon, centerLat] = coords.center;
    const [width, height] = coords.bounds;
    
    const polygon = [
      [centerLon - width * detail, centerLat - height * detail],
      [centerLon + width * detail, centerLat - height * detail],
      [centerLon + width * detail, centerLat + height * detail],
      [centerLon - width * detail, centerLat + height * detail],
      [centerLon - width * detail, centerLat - height * detail]
    ];

    return {
      type: 'Polygon',
      coordinates: [polygon]
    };
  }

  getCountryCoordinates(countryCode) {
    const coords = {
      'USA': { center: [-98, 39], bounds: [35, 15] },
      'CAN': { center: [-106, 56], bounds: [60, 25] },
      'MEX': { center: [-102, 23], bounds: [25, 15] },
      'BRA': { center: [-55, -15], bounds: [35, 25] },
      'ARG': { center: [-64, -34], bounds: [20, 25] },
      'GBR': { center: [-2, 54], bounds: [6, 8] },
      'FRA': { center: [2, 46], bounds: [8, 8] },
      'DEU': { center: [10, 51], bounds: [8, 6] },
      'ITA': { center: [12, 42], bounds: [8, 10] },
      'ESP': { center: [-4, 40], bounds: [10, 8] },
      'RUS': { center: [100, 60], bounds: [120, 30] },
      'CHN': { center: [104, 35], bounds: [35, 25] },
      'IND': { center: [77, 20], bounds: [25, 20] },
      'JPN': { center: [138, 36], bounds: [12, 8] },
      'AUS': { center: [133, -25], bounds: [35, 20] },
      'ZAF': { center: [24, -29], bounds: [15, 10] },
      'EGY': { center: [30, 26], bounds: [12, 8] },
      'TUR': { center: [35, 39], bounds: [15, 6] },
      'SAU': { center: [45, 24], bounds: [20, 15] },
      'IRN': { center: [53, 32], bounds: [18, 12] },
      'NOR': { center: [8, 60], bounds: [12, 15] },
      'SWE': { center: [15, 62], bounds: [8, 12] },
      'FIN': { center: [26, 64], bounds: [10, 8] },
      'POL': { center: [20, 52], bounds: [8, 6] },
      'UKR': { center: [32, 49], bounds: [15, 8] },
      'KOR': { center: [128, 36], bounds: [4, 6] },
      'THA': { center: [101, 15], bounds: [8, 10] },
      'IDN': { center: [118, -2], bounds: [30, 15] },
      'NGA': { center: [8, 10], bounds: [12, 8] },
      'KEN': { center: [38, 1], bounds: [8, 8] }
    };
    
    return coords[countryCode] || { center: [0, 0], bounds: [10, 10] };
  }

  getCountryInfo(countryCode) {
    const countries = {
      'USA': { name: 'United States of America' },
      'CAN': { name: 'Canada' },
      'MEX': { name: 'Mexico' },
      'BRA': { name: 'Brazil' },
      'ARG': { name: 'Argentina' },
      'GBR': { name: 'United Kingdom' },
      'FRA': { name: 'France' },
      'DEU': { name: 'Germany' },
      'ITA': { name: 'Italy' },
      'ESP': { name: 'Spain' },
      'RUS': { name: 'Russia' },
      'CHN': { name: 'China' },
      'IND': { name: 'India' },
      'JPN': { name: 'Japan' },
      'AUS': { name: 'Australia' },
      'ZAF': { name: 'South Africa' },
      'EGY': { name: 'Egypt' },
      'TUR': { name: 'Turkey' },
      'SAU': { name: 'Saudi Arabia' },
      'IRN': { name: 'Iran' },
      'NOR': { name: 'Norway' },
      'SWE': { name: 'Sweden' },
      'FIN': { name: 'Finland' },
      'POL': { name: 'Poland' },
      'UKR': { name: 'Ukraine' },
      'KOR': { name: 'South Korea' },
      'THA': { name: 'Thailand' },
      'IDN': { name: 'Indonesia' },
      'NGA': { name: 'Nigeria' },
      'KEN': { name: 'Kenya' }
    };
    
    return countries[countryCode] || { name: countryCode };
  }

  getGameMetadata(countryCode) {
    const gameData = {
      'USA': {
        displayName: 'United States',
        region: 'North America',
        startingYear: 1990,
        government: 'Federal Republic',
        ideology: 'Liberal Democracy',
        gdpEstimate: 5.9e12,
        population: 248709873,
        capital: 'Washington D.C.'
      },
      'CAN': {
        displayName: 'Canada',
        region: 'North America',
        startingYear: 1990,
        government: 'Federal Parliamentary Democracy',
        ideology: 'Liberal Democracy',
        gdpEstimate: 593.3e9,
        population: 27791000,
        capital: 'Ottawa'
      },
      'CHN': {
        displayName: 'China',
        region: 'East Asia',
        startingYear: 1990,
        government: 'Socialist Republic',
        ideology: 'State Socialism',
        gdpEstimate: 390.3e9,
        population: 1143333000,
        capital: 'Beijing'
      },
      'RUS': {
        displayName: 'Russia',
        region: 'Eastern Europe',
        startingYear: 1991,
        government: 'Federal Republic',
        ideology: 'Transitional',
        gdpEstimate: 507.1e9,
        population: 148292000,
        capital: 'Moscow'
      },
      'DEU': {
        displayName: 'Germany',
        region: 'Western Europe',
        startingYear: 1990,
        government: 'Federal Republic',
        ideology: 'Liberal Democracy',
        gdpEstimate: 1.768e12,
        population: 79479000,
        capital: 'Berlin'
      },
      'GBR': {
        displayName: 'United Kingdom',
        region: 'Western Europe',
        startingYear: 1990,
        government: 'Constitutional Monarchy',
        ideology: 'Liberal Democracy',
        gdpEstimate: 1.094e12,
        population: 57247000,
        capital: 'London'
      },
      'FRA': {
        displayName: 'France',
        region: 'Western Europe',
        startingYear: 1990,
        government: 'Semi-Presidential Republic',
        ideology: 'Liberal Democracy',
        gdpEstimate: 1.275e12,
        population: 56715000,
        capital: 'Paris'
      },
      'JPN': {
        displayName: 'Japan',
        region: 'East Asia',
        startingYear: 1990,
        government: 'Constitutional Monarchy',
        ideology: 'Liberal Democracy',
        gdpEstimate: 3.103e12,
        population: 123611000,
        capital: 'Tokyo'
      },
      'IND': {
        displayName: 'India',
        region: 'South Asia',
        startingYear: 1990,
        government: 'Federal Republic',
        ideology: 'Liberal Democracy',
        gdpEstimate: 326.6e9,
        population: 870133480,
        capital: 'New Delhi'
      },
      'AUS': {
        displayName: 'Australia',
        region: 'Oceania',
        startingYear: 1990,
        government: 'Federal Parliamentary Democracy',
        ideology: 'Liberal Democracy',
        gdpEstimate: 310.8e9,
        population: 17065000,
        capital: 'Canberra'
      },
      'BRA': {
        displayName: 'Brazil',
        region: 'South America',
        startingYear: 1990,
        government: 'Federal Republic',
        ideology: 'Liberal Democracy',
        gdpEstimate: 461.9e9,
        population: 150368000,
        capital: 'Brasília'
      }
    };
    
    return gameData[countryCode] || {
      displayName: this.getCountryInfo(countryCode).name,
      region: 'Unknown',
      startingYear: 1990,
      government: 'Unknown',
      ideology: 'Unknown',
      gdpEstimate: 100e9,
      population: 10000000,
      capital: 'Unknown'
    };
  }

  async validateAllFiles() {
    console.log('\n✅ Validating all files...');
    
    let totalValid = 0;
    let totalInvalid = 0;
    
    for (const level of ['overview', 'detailed', 'ultra']) {
      const { valid, invalid } = await this.validateLevel(level);
      totalValid += valid;
      totalInvalid += invalid;
    }
    
    console.log(`  📊 Total validation: ${totalValid} valid, ${totalInvalid} invalid`);
  }

  async validateLevel(level) {
    const levelDir = path.join(this.boundariesDir, level);
    let valid = 0;
    let invalid = 0;
    
    try {
      const files = await fs.readdir(levelDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const filePath = path.join(levelDir, file);
        
        try {
          const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
          
          if (this.isValidBoundaryFile(data)) {
            valid++;
          } else {
            invalid++;
            console.log(`    ❌ Invalid: ${file}`);
          }
        } catch {
          invalid++;
          console.log(`    ❌ Parse error: ${file}`);
        }
      }
      
      console.log(`  ${level}: ${valid} valid, ${invalid} invalid`);
      
    } catch {
      console.log(`  ${level}: No files found`);
    }
    
    return { valid, invalid };
  }

  isValidBoundaryFile(data) {
    if (!data || data.type !== 'FeatureCollection') return false;
    if (!Array.isArray(data.features)) return false;
    if (!data.metadata) return false;
    
    return data.features.every(feature => {
      if (feature.type !== 'Feature') return false;
      if (!feature.geometry || !feature.geometry.type) return false;
      if (!feature.properties) return false;
      return true;
    });
  }

  async generateSummary() {
    console.log('\n📊 Generating summary...');
    
    const summary = {
      generated: new Date().toISOString(),
      enhancer_version: '1.0.0',
      levels: {},
      totals: {
        files: 0,
        countries: new Set()
      }
    };
    
    for (const level of ['overview', 'detailed', 'ultra']) {
      const levelDir = path.join(this.boundariesDir, level);
      
      try {
        const files = await fs.readdir(levelDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        const countries = jsonFiles.map(f => f.replace('.json', ''));
        
        summary.levels[level] = {
          files: jsonFiles.length,
          countries: countries.sort()
        };
        
        summary.totals.files += jsonFiles.length;
        countries.forEach(country => summary.totals.countries.add(country));
        
      } catch {
        summary.levels[level] = { files: 0, countries: [] };
      }
    }
    
    summary.totals.unique_countries = summary.totals.countries.size;
    summary.totals.countries = Array.from(summary.totals.countries).sort();
    
    const summaryPath = path.join(this.boundariesDir, 'enhancement-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`✅ Enhancement summary written to ${summaryPath}`);
    console.log(`📈 Total files: ${summary.totals.files}`);
    console.log(`🌍 Unique countries: ${summary.totals.unique_countries}`);
    
    // Show breakdown by level
    for (const [level, data] of Object.entries(summary.levels)) {
      console.log(`  ${level}: ${data.files} files`);
    }
    
    return summary;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Boundary Enhancement Script

Usage:
  node enhance-boundaries.js [options]

Options:
  --help, -h     Show this help message

This script enhances existing boundary files with game metadata
and creates missing files with simplified geometry.
    `);
    process.exit(0);
  }
  
  const enhancer = new BoundaryEnhancer();
  enhancer.run().catch(error => {
    console.error('Enhancement failed:', error);
    process.exit(1);
  });
}

module.exports = { BoundaryEnhancer };