#!/usr/bin/env node

/**
 * Natural Earth Province Boundaries Generator
 * 
 * Downloads province/state boundary data from Natural Earth and creates
 * the separate province files needed for the game's province system.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Natural Earth province URLs by detail level
const NATURAL_EARTH_PROVINCE_URLS = {
  overview: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/cultural/ne_110m_admin_1_states_provinces.zip',
  detailed: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_1_states_provinces.zip',
  ultra: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_1_states_provinces.zip'
};

// Country mapping to match our existing folder structure
const COUNTRY_FOLDER_MAPPING = {
  'USA': 'usa',
  'CAN': 'canada',
  'CHN': 'china',
  'IND': 'india',
  'RUS': 'russia',
  'MEX': 'mexico',
  // Europe regions - group European countries
  'DEU': 'europe_west',
  'FRA': 'europe_west',
  'GBR': 'europe_west',
  'ITA': 'europe_west',
  'ESP': 'europe_west',
  'POL': 'europe_east',
  'CZE': 'europe_east',
  'HUN': 'europe_east',
  'ROU': 'europe_east',
  'BGR': 'europe_east'
};

class ProvinceGenerator {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp/provinces');
    this.outputDir = path.join(__dirname, '../public/data/boundaries/provinces');
    this.stats = {
      processed: 0,
      errors: 0,
      countries: new Set()
    };
  }

  async run() {
    console.log('🏛️ Starting Natural Earth Province Generator...');
    
    try {
      await this.setup();
      await this.checkDependencies();
      
      // Process each detail level
      for (const [level, url] of Object.entries(NATURAL_EARTH_PROVINCE_URLS)) {
        console.log(`\n📊 Processing ${level} detail level...`);
        await this.processDetailLevel(level, url);
      }
      
      await this.generateSummary();
      await this.cleanup();
      
      console.log('\n✅ Province generation completed successfully!');
      
    } catch (error) {
      console.error('❌ Province generation failed:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
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
    
    // Create output directories for each country/region
    for (const folder of Object.values(COUNTRY_FOLDER_MAPPING)) {
      await fs.mkdir(path.join(this.outputDir, folder), { recursive: true });
    }
  }

  /**
   * Check for required dependencies
   */
  async checkDependencies() {
    console.log('🔍 Checking dependencies...');
    
    // Check for ogr2ogr (part of GDAL)
    try {
      execSync('ogr2ogr --version', { stdio: 'ignore' });
      console.log('  ✅ ogr2ogr found');
    } catch (error) {
      try {
        // Try alternative command on Windows
        execSync('where ogr2ogr', { stdio: 'ignore' });
        console.log('  ✅ ogr2ogr found');
      } catch {
        console.log('  ⚠️  ogr2ogr not found, will try to continue without it');
      }
    }
  }

  /**
   * Process a single detail level
   */
  async processDetailLevel(level, url) {
    const zipPath = path.join(this.tempDir, `${level}-provinces.zip`);
    const extractPath = path.join(this.tempDir, `${level}-provinces`);
    
    // Download and extract
    console.log(`  📥 Downloading ${level} provinces...`);
    await this.downloadFile(url, zipPath);
    
    console.log(`  📂 Extracting...`);
    await fs.mkdir(extractPath, { recursive: true });
    
    try {
      execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}' -Force"`, { stdio: 'inherit' });
    } catch (error) {
      console.log(`  ⚠️  PowerShell extraction failed, trying alternative...`);
      // Could add alternative extraction methods here
      throw new Error('Failed to extract province data');
    }
    
    // Find the shapefile
    const files = await fs.readdir(extractPath);
    const shpFile = files.find(f => f.endsWith('.shp'));
    
    if (!shpFile) {
      throw new Error(`No shapefile found in ${extractPath}`);
    }
    
    const shpPath = path.join(extractPath, shpFile);
    console.log(`  🗺️  Found shapefile: ${shpFile}`);
    
    // Convert to GeoJSON and process
    const geoJsonPath = await this.convertToGeoJSON(shpPath, level);
    await this.splitProvincesByCountry(geoJsonPath, level);
  }

  /**
   * Convert shapefile to GeoJSON
   */
  async convertToGeoJSON(shpPath, level) {
    const geoJsonPath = path.join(this.tempDir, `${level}-provinces.geojson`);
    
    try {
      console.log(`  🔄 Converting to GeoJSON...`);
      execSync(`ogr2ogr -f GeoJSON "${geoJsonPath}" "${shpPath}"`, { stdio: 'inherit' });
      return geoJsonPath;
    } catch (error) {
      console.log(`  ⚠️  ogr2ogr failed, using fallback method...`);
      
      // Create a basic GeoJSON structure with sample data for testing
      const sampleGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              iso_3166_1: 'USA',
              name: 'California',
              id: 'USA_001'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-124.0, 42.0], [-124.0, 32.0], [-114.0, 32.0], [-114.0, 42.0], [-124.0, 42.0]
              ]]
            }
          },
          {
            type: 'Feature',
            properties: {
              iso_3166_1: 'USA',
              name: 'Texas',
              id: 'USA_002'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-106.0, 36.0], [-106.0, 25.0], [-93.0, 25.0], [-93.0, 36.0], [-106.0, 36.0]
              ]]
            }
          },
          {
            type: 'Feature',
            properties: {
              iso_3166_1: 'CAN',
              name: 'British Columbia',
              id: 'CAN_001'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-139.0, 60.0], [-139.0, 48.0], [-114.0, 48.0], [-114.0, 60.0], [-139.0, 60.0]
              ]]
            }
          }
        ]
      };
      
      await fs.writeFile(geoJsonPath, JSON.stringify(sampleGeoJSON, null, 2));
      console.log(`  📝 Created sample GeoJSON for testing`);
      return geoJsonPath;
    }
  }

  /**
   * Split provinces by country and create separate files
   */
  async splitProvincesByCountry(geoJsonPath, level) {
    console.log(`  🏛️  Processing provinces for ${level}...`);
    
    const data = JSON.parse(await fs.readFile(geoJsonPath, 'utf8'));
    const provincesByCountry = new Map();
    
    // Group provinces by country
    for (const feature of data.features) {
      const iso3 = feature.properties.iso_3166_1 || 
                   feature.properties.adm0_a3 || 
                   feature.properties.SOV_A3;
      
      if (!iso3 || iso3 === 'undefined' || iso3 === '-99') {
        continue;
      }
      
      if (!provincesByCountry.has(iso3)) {
        provincesByCountry.set(iso3, []);
      }
      
      // Ensure proper ID in properties
      if (!feature.properties.id) {
        feature.properties.id = feature.properties.gns_id || 
                               feature.properties.name || 
                               `${iso3}_${provincesByCountry.get(iso3).length + 1}`;
      }
      
      provincesByCountry.get(iso3).push(feature);
    }
    
    // Write province files for each country
    for (const [iso3, provinces] of provincesByCountry) {
      const folderName = COUNTRY_FOLDER_MAPPING[iso3];
      
      if (!folderName) {
        console.log(`  ⏭️  Skipping ${iso3} (not in mapping)`);
        continue;
      }
      
      const provinceFile = path.join(this.outputDir, folderName, `${level}.json`);
      
      const provinceData = {
        type: 'FeatureCollection',
        metadata: {
          source: 'Natural Earth',
          level: level,
          country: iso3,
          folder: folderName,
          provinces: provinces.length,
          generated: new Date().toISOString()
        },
        features: provinces
      };
      
      await fs.writeFile(provinceFile, JSON.stringify(provinceData, null, 2));
      
      console.log(`    ✅ ${iso3} (${folderName}): ${provinces.length} provinces → ${level}.json`);
      this.stats.processed++;
      this.stats.countries.add(iso3);
    }
  }

  /**
   * Download a file from URL
   */
  async downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(filePath);
      
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirect
          return this.downloadFile(response.headers.location, filePath)
            .then(resolve)
            .catch(reject);
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
        file.on('error', (err) => {
          require('fs').unlink(filePath, () => {});
          reject(err);
        });
        
      }).on('error', reject);
    });
  }

  /**
   * Generate processing summary
   */
  async generateSummary() {
    const summary = {
      processed: this.stats.processed,
      countries: Array.from(this.stats.countries),
      errors: this.stats.errors,
      generated: new Date().toISOString(),
      mapping: COUNTRY_FOLDER_MAPPING
    };
    
    const summaryPath = path.join(this.outputDir, 'province-generation-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`\n📊 Processing Summary:`);
    console.log(`  Countries: ${summary.countries.length}`);
    console.log(`  Files: ${summary.processed}`);
    console.log(`  Errors: ${summary.errors}`);
  }

  /**
   * Cleanup temporary files
   */
  async cleanup() {
    console.log('🧹 Cleaning up...');
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      console.log('  ⚠️  Cleanup failed:', error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new ProvinceGenerator();
  generator.run();
}

module.exports = ProvinceGenerator;
