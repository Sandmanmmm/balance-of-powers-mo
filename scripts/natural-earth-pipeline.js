#!/usr/bin/env node

/**
 * Natural Earth Data Download and Processing Pipeline
 * 
 * This script downloads real geographical boundary data from Natural Earth
 * and processes it into the format needed by the Balance of Powers game.
 * 
 * Features:
 * - Downloads multiple detail levels (overview, detailed, ultra)
 * - Processes shapefiles to GeoJSON
 * - Splits by country using ISO_A3 codes
 * - Validates and cleans data
 * - Creates proper directory structure
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Natural Earth download URLs by detail level
const NATURAL_EARTH_URLS = {
  overview: {
    countries: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/cultural/ne_110m_admin_0_countries.zip',
    provinces: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/cultural/ne_110m_admin_1_states_provinces.zip'
  },
  detailed: {
    countries: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_0_countries.zip',
    provinces: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_1_states_provinces.zip'
  },
  ultra: {
    countries: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_0_countries.zip',
    provinces: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_1_states_provinces.zip'
  }
};

class NaturalEarthPipeline {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp/natural-earth');
    this.outputDir = path.join(__dirname, '../data/boundaries');
    this.downloadedFiles = new Set();
    this.processedCountries = new Set();
  }

  /**
   * Main pipeline execution
   */
  async run() {
    console.log('🌍 Starting Natural Earth Data Pipeline...');
    
    try {
      await this.setup();
      await this.checkDependencies();
      
      // Process each detail level
      for (const [level, urls] of Object.entries(NATURAL_EARTH_URLS)) {
        console.log(`\n📊 Processing ${level} detail level...`);
        await this.processDetailLevel(level, urls);
      }
      
      await this.generateSummary();
      await this.cleanup();
      
      console.log('\n✅ Natural Earth Pipeline completed successfully!');
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Setup directories and environment
   */
  async setup() {
    console.log('🔧 Setting up directories...');
    
    // Create temp directory
    await fs.mkdir(this.tempDir, { recursive: true });
    
    // Create output directories for each detail level
    for (const level of ['overview', 'detailed', 'ultra']) {
      await fs.mkdir(path.join(this.outputDir, level), { recursive: true });
    }
  }

  /**
   * Check for required dependencies
   */
  async checkDependencies() {
    console.log('🔍 Checking dependencies...');
    
    const dependencies = ['ogr2ogr', 'unzip'];
    
    for (const dep of dependencies) {
      try {
        execSync(`which ${dep}`, { stdio: 'ignore' });
        console.log(`  ✅ ${dep} found`);
      } catch (error) {
        console.error(`  ❌ ${dep} not found`);
        throw new Error(`Missing dependency: ${dep}. Please install GDAL tools.`);
      }
    }
  }

  /**
   * Process a single detail level
   */
  async processDetailLevel(level, urls) {
    // Download and process countries
    console.log(`  📥 Downloading ${level} countries...`);
    const countriesFile = await this.downloadAndExtract(urls.countries, `${level}-countries`);
    const countriesGeoJSON = await this.convertToGeoJSON(countriesFile, 'countries');
    await this.splitCountriesByNation(countriesGeoJSON, level);
    
    // Download and process provinces
    console.log(`  📥 Downloading ${level} provinces...`);
    const provincesFile = await this.downloadAndExtract(urls.provinces, `${level}-provinces`);
    const provincesGeoJSON = await this.convertToGeoJSON(provincesFile, 'provinces');
    await this.splitProvincesByCountry(provincesGeoJSON, level);
  }

  /**
   * Download and extract a ZIP file
   */
  async downloadAndExtract(url, name) {
    const zipPath = path.join(this.tempDir, `${name}.zip`);
    const extractPath = path.join(this.tempDir, name);
    
    if (!this.downloadedFiles.has(zipPath)) {
      console.log(`    📦 Downloading ${url}...`);
      await this.downloadFile(url, zipPath);
      this.downloadedFiles.add(zipPath);
    }
    
    // Extract if not already extracted
    try {
      await fs.access(extractPath);
    } catch {
      console.log(`    📂 Extracting ${zipPath}...`);
      await fs.mkdir(extractPath, { recursive: true });
      execSync(`unzip -q "${zipPath}" -d "${extractPath}"`);
    }
    
    // Find the shapefile
    const files = await fs.readdir(extractPath);
    const shpFile = files.find(f => f.endsWith('.shp'));
    
    if (!shpFile) {
      throw new Error(`No shapefile found in ${extractPath}`);
    }
    
    return path.join(extractPath, shpFile);
  }

  /**
   * Download a file from URL
   */
  async downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(outputPath);
      
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirect
          return this.downloadFile(response.headers.location, outputPath)
            .then(resolve)
            .catch(reject);
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
        file.on('error', reject);
      }).on('error', reject);
    });
  }

  /**
   * Convert shapefile to GeoJSON
   */
  async convertToGeoJSON(shpPath, type) {
    const geoJsonPath = shpPath.replace('.shp', '.geojson');
    
    try {
      await fs.access(geoJsonPath);
      console.log(`    ♻️  Using existing GeoJSON: ${geoJsonPath}`);
    } catch {
      console.log(`    🔄 Converting ${shpPath} to GeoJSON...`);
      
      // Use ogr2ogr to convert shapefile to GeoJSON
      const cmd = `ogr2ogr -f GeoJSON "${geoJsonPath}" "${shpPath}"`;
      execSync(cmd, { stdio: 'inherit' });
    }
    
    return geoJsonPath;
  }

  /**
   * Split countries GeoJSON by nation using ISO_A3 codes
   */
  async splitCountriesByNation(geoJsonPath, level) {
    console.log(`    🌎 Processing countries for ${level}...`);
    
    const data = JSON.parse(await fs.readFile(geoJsonPath, 'utf8'));
    
    for (const feature of data.features) {
      const iso3 = feature.properties.ISO_A3 || feature.properties.ADM0_A3;
      
      if (!iso3 || iso3 === 'undefined' || iso3 === '-99') {
        console.warn(`    ⚠️  Skipping feature with no valid ISO_A3: ${feature.properties.NAME}`);
        continue;
      }
      
      // Create country GeoJSON
      const countryData = {
        type: 'FeatureCollection',
        metadata: {
          source: 'Natural Earth',
          level: level,
          country: iso3,
          generated: new Date().toISOString()
        },
        features: [feature]
      };
      
      // Ensure proper ID in properties
      feature.properties.id = feature.properties.id || iso3;
      
      const outputPath = path.join(this.outputDir, level, `${iso3}.json`);
      await fs.writeFile(outputPath, JSON.stringify(countryData, null, 2));
      
      this.processedCountries.add(iso3);
      console.log(`      ✅ ${iso3}: ${feature.properties.NAME}`);
    }
  }

  /**
   * Split provinces GeoJSON by country
   */
  async splitProvincesByCountry(geoJsonPath, level) {
    console.log(`    🏛️  Processing provinces for ${level}...`);
    
    const data = JSON.parse(await fs.readFile(geoJsonPath, 'utf8'));
    const provincesByCountry = new Map();
    
    // Group provinces by country
    for (const feature of data.features) {
      const iso3 = feature.properties.iso_3166_1 || feature.properties.adm0_a3;
      
      if (!iso3 || iso3 === 'undefined' || iso3 === '-99') {
        continue;
      }
      
      if (!provincesByCountry.has(iso3)) {
        provincesByCountry.set(iso3, []);
      }
      
      // Ensure proper ID in properties
      feature.properties.id = feature.properties.id || 
        feature.properties.gns_id || 
        feature.properties.name || 
        `province_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      provincesByCountry.get(iso3).push(feature);
    }
    
    // Write provinces for each country
    for (const [iso3, provinces] of provincesByCountry) {
      const countryFile = path.join(this.outputDir, level, `${iso3}.json`);
      
      try {
        // Load existing country file
        const existingData = JSON.parse(await fs.readFile(countryFile, 'utf8'));
        
        // Add provinces to the existing country data
        existingData.features.push(...provinces);
        
        // Update metadata
        existingData.metadata.provinces = provinces.length;
        existingData.metadata.updated = new Date().toISOString();
        
        await fs.writeFile(countryFile, JSON.stringify(existingData, null, 2));
        
        console.log(`      ✅ ${iso3}: Added ${provinces.length} provinces`);
        
      } catch (error) {
        // Country file doesn't exist, create new
        const countryData = {
          type: 'FeatureCollection',
          metadata: {
            source: 'Natural Earth',
            level: level,
            country: iso3,
            provinces: provinces.length,
            generated: new Date().toISOString()
          },
          features: provinces
        };
        
        await fs.writeFile(countryFile, JSON.stringify(countryData, null, 2));
        console.log(`      ✅ ${iso3}: Created with ${provinces.length} provinces`);
      }
    }
  }

  /**
   * Generate processing summary
   */
  async generateSummary() {
    console.log('\n📊 Generating summary...');
    
    const summary = {
      generated: new Date().toISOString(),
      pipeline_version: '1.0.0',
      source: 'Natural Earth',
      countries: Array.from(this.processedCountries).sort(),
      levels: {},
      total_files: 0
    };
    
    // Count files per level
    for (const level of ['overview', 'detailed', 'ultra']) {
      try {
        const levelDir = path.join(this.outputDir, level);
        const files = await fs.readdir(levelDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        summary.levels[level] = {
          files: jsonFiles.length,
          countries: jsonFiles.map(f => f.replace('.json', ''))
        };
        
        summary.total_files += jsonFiles.length;
        
      } catch (error) {
        summary.levels[level] = { files: 0, countries: [], error: error.message };
      }
    }
    
    // Write summary
    const summaryPath = path.join(this.outputDir, 'natural-earth-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`✅ Summary written to ${summaryPath}`);
    console.log(`📈 Total countries processed: ${this.processedCountries.size}`);
    console.log(`📁 Total files generated: ${summary.total_files}`);
  }

  /**
   * Cleanup temporary files
   */
  async cleanup() {
    console.log('🧹 Cleaning up temporary files...');
    
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.warn('⚠️  Cleanup failed:', error.message);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Natural Earth Data Pipeline

Usage:
  node natural-earth-pipeline.js [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Enable verbose logging
  --keep-temp    Keep temporary files after processing

Dependencies:
  - ogr2ogr (GDAL tools)
  - unzip

This script downloads and processes Natural Earth boundary data
for use in the Balance of Powers game.
    `);
    process.exit(0);
  }
  
  // Run the pipeline
  const pipeline = new NaturalEarthPipeline();
  pipeline.run().catch(error => {
    console.error('Pipeline failed:', error);
    process.exit(1);
  });
}

module.exports = { NaturalEarthPipeline };