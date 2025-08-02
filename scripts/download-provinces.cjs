#!/usr/bin/env node

/**
 * Natural Earth Province/State Boundary Downloader
 * 
 * Downloads accurate province/state boundaries from Natural Earth
 * These are the official administrative divisions used by governments
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Natural Earth Admin 1 (Provinces/States) URLs
const PROVINCE_URLS = {
  overview: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/cultural/ne_110m_admin_1_states_provinces.zip',
  detailed: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_1_states_provinces.zip',
  ultra: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_1_states_provinces.zip'
};

// Country codes to folder mapping
const COUNTRY_FOLDERS = {
  'US': 'usa',
  'CA': 'canada',
  'CN': 'china',
  'IN': 'india',
  'RU': 'russia',
  'MX': 'mexico',
  'AU': 'australia',
  'BR': 'brazil'
};

class ProvinceDownloader {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp/provinces');
    this.outputDir = path.join(__dirname, '../public/data/boundaries/provinces');
  }

  async run() {
    console.log('🏛️ Starting Province Boundary Download...');
    
    try {
      await this.setup();
      
      for (const [level, url] of Object.entries(PROVINCE_URLS)) {
        console.log(`\n📊 Processing ${level} provinces...`);
        await this.processDetailLevel(level, url);
      }
      
      console.log('\n✅ Province download completed!');
      
    } catch (error) {
      console.error('❌ Province download failed:', error.message);
      process.exit(1);
    }
  }

  async setup() {
    console.log('🔧 Setting up directories...');
    await fs.mkdir(this.tempDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async processDetailLevel(level, url) {
    const filename = `provinces_${level}.zip`;
    const zipPath = path.join(this.tempDir, filename);
    const extractPath = path.join(this.tempDir, level);
    
    // Download
    console.log(`  📥 Downloading ${url}...`);
    await this.downloadFile(url, zipPath);
    
    // Extract
    console.log(`  📦 Extracting ${filename}...`);
    await fs.mkdir(extractPath, { recursive: true });
    
    try {
      execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}' -Force"`, 
        { stdio: 'inherit' });
    } catch (error) {
      console.error(`Failed to extract ${filename}:`, error.message);
      return;
    }
    
    // Find shapefile
    const files = await fs.readdir(extractPath);
    const shpFile = files.find(f => f.endsWith('.shp'));
    
    if (!shpFile) {
      console.error(`No shapefile found in ${extractPath}`);
      return;
    }
    
    const shpPath = path.join(extractPath, shpFile);
    
    // Convert to GeoJSON
    console.log(`  🔄 Converting to GeoJSON...`);
    const geoJsonPath = path.join(extractPath, 'provinces.geojson');
    
    try {
      execSync(`ogr2ogr -f GeoJSON "${geoJsonPath}" "${shpPath}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('ogr2ogr not found. Please install GDAL or use online converter.');
      // Fallback: try with different method or skip
      return;
    }
    
    // Process the GeoJSON
    await this.processGeoJSON(geoJsonPath, level);
  }

  async processGeoJSON(geoJsonPath, level) {
    console.log(`  📊 Processing provinces for ${level}...`);
    
    const data = JSON.parse(await fs.readFile(geoJsonPath, 'utf8'));
    const countryCounts = {};
    
    // Group provinces by country
    const countryGroups = {};
    
    for (const feature of data.features) {
      const props = feature.properties;
      const countryCode = props.iso_a2 || props.adm0_a3?.substring(0, 2) || 'XX';
      const countryName = props.admin || props.sovereignt || 'Unknown';
      
      if (!countryGroups[countryCode]) {
        countryGroups[countryCode] = {
          name: countryName,
          features: []
        };
      }
      
      // Add unique ID if missing
      if (!props.id) {
        const provinceId = props.hasc_1 || props.iso_3166_2 || 
                          `${countryCode}_${countryGroups[countryCode].features.length + 1}`.padStart(3, '0');
        props.id = provinceId;
      }
      
      countryGroups[countryCode].features.push(feature);
    }
    
    // Save country-specific files
    for (const [countryCode, group] of Object.entries(countryGroups)) {
      if (group.features.length === 0) continue;
      
      const folderName = COUNTRY_FOLDERS[countryCode] || countryCode.toLowerCase();
      const countryDir = path.join(this.outputDir, folderName);
      await fs.mkdir(countryDir, { recursive: true });
      
      const featureCollection = {
        type: 'FeatureCollection',
        features: group.features
      };
      
      const outputPath = path.join(countryDir, `${level}.json`);
      await fs.writeFile(outputPath, JSON.stringify(featureCollection, null, 2));
      
      countryCounts[countryCode] = group.features.length;
      console.log(`    ✅ ${countryCode} (${group.name}): ${group.features.length} provinces → ${folderName}/${level}.json`);
    }
    
    console.log(`  📊 Total countries processed: ${Object.keys(countryCounts).length}`);
  }

  async downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(outputPath);
      
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
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
}

// Run if called directly
if (require.main === module) {
  const downloader = new ProvinceDownloader();
  downloader.run();
}

module.exports = { ProvinceDownloader };
