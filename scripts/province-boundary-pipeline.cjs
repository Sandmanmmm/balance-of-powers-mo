#!/usr/bin/env node

/**
 * Province Boundary Data Pipeline
 * 
 * Downloads and processes province/state boundary data from multiple sources:
 * 1. Natural Earth (primary source)
 * 2. OpenStreetMap Nominatim (backup)
 * 3. GADM (Global Administrative Areas) (alternative)
 * 
 * Creates separate province files in /data/boundaries/provinces/{country}/{level}.json
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Data sources for province boundaries
const DATA_SOURCES = {
  // Natural Earth - Most reliable for consistent global data
  naturalEarth: {
    overview: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/cultural/ne_110m_admin_1_states_provinces.zip',
    detailed: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_1_states_provinces.zip',
    ultra: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_1_states_provinces.zip'
  },
  
  // GADM - Very detailed administrative boundaries
  gadm: {
    baseUrl: 'https://geodata.ucdavis.edu/gadm/gadm4.1/json/',
    // Format: gadm41_{ISO3}_1.json for level 1 (states/provinces)
    // Example: gadm41_USA_1.json, gadm41_CAN_1.json
  },
  
  // OpenStreetMap Overpass API - Real-time data but requires more processing
  overpass: {
    baseUrl: 'https://overpass-api.de/api/interpreter',
    // Custom queries needed for each country
  }
};

// Country code mappings for different sources
const COUNTRY_MAPPINGS = {
  'USA': { gadm: 'USA', osm: 'United States', folder: 'usa' },
  'CAN': { gadm: 'CAN', osm: 'Canada', folder: 'canada' },
  'CHN': { gadm: 'CHN', osm: 'China', folder: 'china' },
  'IND': { gadm: 'IND', osm: 'India', folder: 'india' },
  'RUS': { gadm: 'RUS', osm: 'Russia', folder: 'russia' },
  'MEX': { gadm: 'MEX', osm: 'Mexico', folder: 'mexico' },
  'DEU': { gadm: 'DEU', osm: 'Germany', folder: 'europe_west' },
  'FRA': { gadm: 'FRA', osm: 'France', folder: 'europe_west' },
  'GBR': { gadm: 'GBR', osm: 'United Kingdom', folder: 'europe_west' },
  'ITA': { gadm: 'ITA', osm: 'Italy', folder: 'europe_west' },
  'ESP': { gadm: 'ESP', osm: 'Spain', folder: 'europe_west' },
  'POL': { gadm: 'POL', osm: 'Poland', folder: 'europe_east' },
  'CZE': { gadm: 'CZE', osm: 'Czech Republic', folder: 'europe_east' },
  'HUN': { gadm: 'HUN', osm: 'Hungary', folder: 'europe_east' }
};

class ProvinceBoundaryPipeline {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp/provinces');
    this.outputDir = path.join(__dirname, '../public/data/boundaries/provinces');
    this.stats = {
      downloaded: 0,
      processed: 0,
      errors: [],
      startTime: Date.now()
    };
  }

  /**
   * Main pipeline execution
   */
  async run() {
    console.log('🏛️  Starting Province Boundary Data Pipeline...');
    
    try {
      await this.setupDirectories();
      
      // Try Natural Earth first (most reliable)
      console.log('\n📥 Attempting Natural Earth download...');
      const neSuccess = await this.downloadFromNaturalEarth();
      
      if (!neSuccess) {
        console.log('\n📥 Natural Earth failed, trying GADM...');
        await this.downloadFromGADM();
      }
      
      await this.generateSummary();
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error);
      throw error;
    }
  }

  /**
   * Setup required directories
   */
  async setupDirectories() {
    const dirs = [
      this.tempDir,
      this.outputDir,
      ...Object.values(COUNTRY_MAPPINGS).map(c => path.join(this.outputDir, c.folder))
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    console.log(`📁 Created ${dirs.length} directories`);
  }

  /**
   * Download province data from Natural Earth
   */
  async downloadFromNaturalEarth() {
    const levels = ['overview', 'detailed', 'ultra'];
    let success = false;
    
    for (const level of levels) {
      try {
        console.log(`  📥 Downloading Natural Earth ${level} provinces...`);
        
        const url = DATA_SOURCES.naturalEarth[level];
        const zipFile = await this.downloadFile(url, `ne_${level}_provinces.zip`);
        const shapeFile = await this.extractShapefile(zipFile);
        const geoJsonFile = await this.convertToGeoJSON(shapeFile, `ne_${level}_provinces`);
        
        await this.processNaturalEarthProvinces(geoJsonFile, level);
        
        this.stats.downloaded++;
        success = true;
        
      } catch (error) {
        console.error(`  ❌ Failed to process ${level}:`, error.message);
        this.stats.errors.push(`Natural Earth ${level}: ${error.message}`);
      }
    }
    
    return success;
  }

  /**
   * Download province data from GADM
   */
  async downloadFromGADM() {
    console.log('  📥 Downloading from GADM...');
    
    const countries = Object.keys(COUNTRY_MAPPINGS);
    const promises = countries.map(iso3 => this.downloadGADMCountry(iso3));
    
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    console.log(`  ✅ GADM: ${successful}/${countries.length} countries processed`);
    
    return successful > 0;
  }

  /**
   * Download GADM data for a specific country
   */
  async downloadGADMCountry(iso3) {
    try {
      const mapping = COUNTRY_MAPPINGS[iso3];
      const url = `${DATA_SOURCES.gadm.baseUrl}gadm41_${mapping.gadm}_1.json`;
      
      console.log(`    📥 Downloading ${iso3} from GADM...`);
      
      const response = await this.fetchWithRetry(url);
      const data = await response.json();
      
      // Convert GADM format to our format
      const processedData = {
        type: 'FeatureCollection',
        metadata: {
          source: 'GADM',
          country: iso3,
          generated: new Date().toISOString()
        },
        features: data.features.map((feature, index) => ({
          ...feature,
          properties: {
            ...feature.properties,
            id: `${iso3}_${String(index + 1).padStart(3, '0')}`,
            name: feature.properties.NAME_1 || feature.properties.name,
            country: iso3
          }
        }))
      };
      
      // Write to all detail levels (including low quality)
      const levels = ['low', 'overview', 'detailed', 'ultra'];
      for (const level of levels) {
        let processedData = {
          type: 'FeatureCollection',
          metadata: {
            source: 'GADM',
            country: iso3,
            level: level,
            generated: new Date().toISOString()
          },
          features: data.features.map((feature, index) => {
            let processedFeature = {
              ...feature,
              properties: {
                ...feature.properties,
                id: `${iso3}_${String(index + 1).padStart(3, '0')}`,
                name: feature.properties.NAME_1 || feature.properties.name,
                country: iso3
              }
            };
            
            // For low quality, simplify the geometry significantly
            if (level === 'low' && feature.geometry && feature.geometry.coordinates) {
              // Simplify geometry for low quality
              processedFeature.geometry = this.simplifyGeometry(feature.geometry, 0.02);
            }
            
            return processedFeature;
          })
        };
        
        const outputPath = path.join(this.outputDir, mapping.folder, `${level}.json`);
        await fs.writeFile(outputPath, JSON.stringify(processedData, null, 2));
      }
      
      console.log(`    ✅ ${iso3}: ${processedData.features.length} provinces saved`);
      this.stats.processed++;
      
    } catch (error) {
      console.error(`    ❌ Failed to download ${iso3}:`, error.message);
      this.stats.errors.push(`GADM ${iso3}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process Natural Earth province data into separate country files
   */
  async processNaturalEarthProvinces(geoJsonPath, level) {
    console.log(`    🔄 Processing Natural Earth provinces for ${level}...`);
    
    const data = JSON.parse(await fs.readFile(geoJsonPath, 'utf8'));
    const provincesByCountry = new Map();
    
    // Group provinces by country using multiple possible fields
    for (const feature of data.features) {
      let iso3 = feature.properties.iso_3166_1 || 
                 feature.properties.adm0_a3 || 
                 feature.properties.ISO_3166_1 ||
                 feature.properties.ADM0_A3;
      
      if (!iso3 || iso3 === 'undefined' || iso3 === '-99' || iso3.length !== 3) {
        continue;
      }
      
      iso3 = iso3.toUpperCase();
      
      // Skip if we don't have a mapping for this country
      if (!COUNTRY_MAPPINGS[iso3]) {
        continue;
      }
      
      if (!provincesByCountry.has(iso3)) {
        provincesByCountry.set(iso3, []);
      }
      
      // Ensure proper ID and naming
      feature.properties.id = feature.properties.id || 
        feature.properties.gns_id || 
        `${iso3}_${String(provincesByCountry.get(iso3).length + 1).padStart(3, '0')}`;
        
      feature.properties.name = feature.properties.name || 
        feature.properties.NAME || 
        feature.properties.name_en ||
        `Province ${provincesByCountry.get(iso3).length + 1}`;
        
      feature.properties.country = iso3;
      
      provincesByCountry.get(iso3).push(feature);
    }
    
    // Write separate province files for each country
    for (const [iso3, provinces] of provincesByCountry) {
      const mapping = COUNTRY_MAPPINGS[iso3];
      
      // Generate data for all detail levels
      const levels = ['low', 'overview', 'detailed', 'ultra'];
      for (const detailLevel of levels) {
        let processedProvinces = provinces.map(province => {
          let processedProvince = { ...province };
          
          // For low quality, simplify the geometry
          if (detailLevel === 'low' && province.geometry) {
            processedProvince.geometry = this.simplifyGeometry(province.geometry, 0.02);
          }
          
          return processedProvince;
        });
        
        const outputPath = path.join(this.outputDir, mapping.folder, `${detailLevel}.json`);
        
        const countryData = {
          type: 'FeatureCollection',
          metadata: {
            source: 'Natural Earth',
            level: detailLevel,
            country: iso3,
            provinces: processedProvinces.length,
            generated: new Date().toISOString()
          },
          features: processedProvinces
        };
        
        await fs.writeFile(outputPath, JSON.stringify(countryData, null, 2));
      }
      
      console.log(`      ✅ ${iso3} (${mapping.folder}): ${provinces.length} provinces (all levels)`);
    }
    
    this.stats.processed++;
  }

  /**
   * Download a file with progress
   */
  async downloadFile(url, filename) {
    const filePath = path.join(this.tempDir, filename);
    
    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(filePath);
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve(filePath);
        });
        
        file.on('error', reject);
      }).on('error', reject);
    });
  }

  /**
   * Fetch with retry logic
   */
  async fetchWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        console.log(`    ⏳ Retry ${i + 1}/${maxRetries} for ${url}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  /**
   * Extract shapefile from zip
   */
  async extractShapefile(zipPath) {
    const extractDir = zipPath.replace('.zip', '');
    await fs.mkdir(extractDir, { recursive: true });
    
    try {
      execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`, { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`Failed to extract ${zipPath}: ${error.message}`);
    }
    
    // Find the .shp file
    const files = await fs.readdir(extractDir);
    const shpFile = files.find(f => f.endsWith('.shp'));
    
    if (!shpFile) {
      throw new Error(`No .shp file found in ${extractDir}`);
    }
    
    return path.join(extractDir, shpFile);
  }

  /**
   * Convert shapefile to GeoJSON using ogr2ogr
   */
  async convertToGeoJSON(shapefilePath, outputName) {
    const outputPath = path.join(this.tempDir, `${outputName}.json`);
    
    try {
      // Try using ogr2ogr (part of GDAL)
      execSync(`ogr2ogr -f GeoJSON "${outputPath}" "${shapefilePath}"`, { stdio: 'inherit' });
      return outputPath;
    } catch (error) {
      console.log('    ⚠️  ogr2ogr not available, trying alternative method...');
      
      // Fallback: try using Node.js shapefile library if available
      try {
        const shapefile = require('shapefile');
        const features = [];
        
        await shapefile.read(shapefilePath)
          .then(collection => {
            const geoJson = {
              type: 'FeatureCollection',
              features: collection.features
            };
            
            return fs.writeFile(outputPath, JSON.stringify(geoJson, null, 2));
          });
          
        return outputPath;
      } catch (shapeError) {
        throw new Error(`Failed to convert shapefile: ${error.message}. Try installing GDAL or shapefile npm package.`);
      }
    }
  }

  /**
   * Simplify geometry for low quality output
   * Reduces coordinate precision and point count more conservatively
   */
  simplifyGeometry(geometry, tolerance = 0.05) {
    if (!geometry || !geometry.coordinates) return geometry;
    
    const simplifyCoordinates = (coords, isRing = false) => {
      if (!Array.isArray(coords)) return coords;
      
      // If this is a coordinate pair [lng, lat]
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        return [
          Math.round(coords[0] / tolerance) * tolerance,
          Math.round(coords[1] / tolerance) * tolerance
        ];
      }
      
      // If this is an array of coordinates, simplify each one
      let simplified = coords.map(coord => simplifyCoordinates(coord, isRing));
      
      // For rings (polygons), reduce point count more conservatively
      if (isRing && simplified.length > 20) {
        const step = Math.max(1, Math.floor(simplified.length / 15)); // Keep more points
        const reduced = [];
        for (let i = 0; i < simplified.length; i += step) {
          reduced.push(simplified[i]);
        }
        // Ensure ring is closed
        if (reduced.length > 0 && 
            (reduced[0][0] !== reduced[reduced.length - 1][0] || 
             reduced[0][1] !== reduced[reduced.length - 1][1])) {
          reduced.push(reduced[0]);
        }
        simplified = reduced;
      }
      
      return simplified;
    };
    
    let simplifiedGeometry = { ...geometry };
    
    switch (geometry.type) {
      case 'Polygon':
        simplifiedGeometry.coordinates = geometry.coordinates.map(ring => 
          simplifyCoordinates(ring, true)
        );
        break;
      case 'MultiPolygon':
        simplifiedGeometry.coordinates = geometry.coordinates.map(polygon =>
          polygon.map(ring => simplifyCoordinates(ring, true))
        );
        break;
      case 'LineString':
        simplifiedGeometry.coordinates = simplifyCoordinates(geometry.coordinates);
        break;
      case 'MultiLineString':
        simplifiedGeometry.coordinates = geometry.coordinates.map(line =>
          simplifyCoordinates(line)
        );
        break;
      case 'Point':
        simplifiedGeometry.coordinates = simplifyCoordinates(geometry.coordinates);
        break;
      case 'MultiPoint':
        simplifiedGeometry.coordinates = geometry.coordinates.map(point =>
          simplifyCoordinates(point)
        );
        break;
      default:
        return geometry;
    }
    
    return simplifiedGeometry;
  }

  /**
   * Generate processing summary
   */
  async generateSummary() {
    const elapsed = Date.now() - this.stats.startTime;
    
    console.log('\n📊 Province Boundary Pipeline Summary:');
    console.log(`   ⏱️  Total time: ${(elapsed / 1000).toFixed(1)}s`);
    console.log(`   📥 Files downloaded: ${this.stats.downloaded}`);
    console.log(`   🔄 Countries processed: ${this.stats.processed}`);
    console.log(`   ❌ Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      this.stats.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    // List generated files
    console.log('\n📁 Generated province files:');
    for (const [iso3, mapping] of Object.entries(COUNTRY_MAPPINGS)) {
      const folderPath = path.join(this.outputDir, mapping.folder);
      try {
        const files = await fs.readdir(folderPath);
        if (files.length > 0) {
          console.log(`   ✅ ${iso3} (${mapping.folder}): ${files.join(', ')}`);
        }
      } catch (error) {
        console.log(`   ❌ ${iso3} (${mapping.folder}): No files generated`);
      }
    }
  }
}

// Run the pipeline if called directly
if (require.main === module) {
  const pipeline = new ProvinceBoundaryPipeline();
  pipeline.run().catch(console.error);
}

module.exports = ProvinceBoundaryPipeline;
