#!/usr/bin/env node

/**
 * Simplified Natural Earth Download Pipeline
 * 
 * Downloads pre-processed GeoJSON files from Natural Earth's web interface
 * instead of dealing with shapefiles and GDAL dependencies.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Natural Earth GeoJSON download URLs
const GEOJSON_URLS = {
  overview: {
    countries: 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
    // Alternative: 'https://cdn.jsdelivr.net/npm/world-atlas@3/countries-110m.json'
  },
  detailed: {
    countries: 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
  },
  ultra: {
    countries: 'https://raw.githubusercontent.com/datasets/geo-admin-boundaries/master/countries.geojson',
  }
};

// Backup URLs for more comprehensive data
const ALTERNATIVE_URLS = {
  'world-atlas-countries': 'https://cdn.jsdelivr.net/npm/world-atlas@3/countries-50m.json',
  'world-atlas-detailed': 'https://cdn.jsdelivr.net/npm/world-atlas@3/countries-10m.json',
  'natural-earth-admin0': 'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/50m/cultural/ne_50m_admin_0_countries.geojson'
};

class SimpleNaturalEarthPipeline {
  constructor() {
    this.outputDir = path.join(__dirname, '../data/boundaries');
    this.downloadedFiles = new Map();
    this.processedCountries = new Set();
  }

  /**
   * Main pipeline execution
   */
  async run() {
    console.log('🌍 Starting Simplified Natural Earth Pipeline...');
    
    try {
      await this.setup();
      
      // Try different data sources
      await this.downloadWorldAtlasData();
      await this.downloadNaturalEarthData();
      
      await this.generateSummary();
      
      console.log('\n✅ Simplified Natural Earth Pipeline completed!');
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Setup directories
   */
  async setup() {
    console.log('🔧 Setting up directories...');
    
    // Create output directories for each detail level
    for (const level of ['overview', 'detailed', 'ultra']) {
      await fs.mkdir(path.join(this.outputDir, level), { recursive: true });
    }
  }

  /**
   * Download World Atlas data (TopoJSON format)
   */
  async downloadWorldAtlasData() {
    console.log('\n📊 Downloading World Atlas data...');
    
    const sources = [
      { url: 'https://cdn.jsdelivr.net/npm/world-atlas@3/countries-110m.json', level: 'overview' },
      { url: 'https://cdn.jsdelivr.net/npm/world-atlas@3/countries-50m.json', level: 'detailed' },
      { url: 'https://cdn.jsdelivr.net/npm/world-atlas@3/countries-10m.json', level: 'ultra' }
    ];

    for (const source of sources) {
      try {
        console.log(`  📥 Downloading ${source.level} data...`);
        const data = await this.downloadJSON(source.url);
        
        // Convert TopoJSON to GeoJSON if needed
        const geoJsonData = this.ensureGeoJSON(data);
        
        // Process and split by country
        await this.splitCountriesByISO(geoJsonData, source.level, 'World Atlas');
        
      } catch (error) {
        console.warn(`  ⚠️  Failed to download ${source.level}: ${error.message}`);
      }
    }
  }

  /**
   * Download Natural Earth GeoJSON data
   */
  async downloadNaturalEarthData() {
    console.log('\n📊 Downloading Natural Earth data...');
    
    const sources = [
      { 
        url: 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson', 
        level: 'overview',
        name: 'D3 Gallery World'
      },
      { 
        url: 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson', 
        level: 'detailed',
        name: 'Geo Countries'
      },
      {
        url: 'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/50m/cultural/ne_50m_admin_0_countries.geojson',
        level: 'ultra',
        name: 'Natural Earth 50m'
      }
    ];

    for (const source of sources) {
      try {
        console.log(`  📥 Downloading ${source.name} (${source.level})...`);
        const data = await this.downloadJSON(source.url);
        
        // Ensure it's valid GeoJSON
        const geoJsonData = this.ensureGeoJSON(data);
        
        // Process and split by country
        await this.splitCountriesByISO(geoJsonData, source.level, source.name);
        
      } catch (error) {
        console.warn(`  ⚠️  Failed to download ${source.name}: ${error.message}`);
      }
    }
  }

  /**
   * Download JSON data from URL
   */
  async downloadJSON(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirect
          return this.downloadJSON(response.headers.location)
            .then(resolve)
            .catch(reject);
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Invalid JSON: ${error.message}`));
          }
        });
        
      }).on('error', reject);
    });
  }

  /**
   * Ensure data is in GeoJSON format (convert from TopoJSON if needed)
   */
  ensureGeoJSON(data) {
    // If it's already GeoJSON FeatureCollection, return as-is
    if (data.type === 'FeatureCollection') {
      return data;
    }
    
    // If it's TopoJSON, try to convert
    if (data.type === 'Topology' && data.objects) {
      console.log('    🔄 Converting TopoJSON to GeoJSON...');
      
      // Simple TopoJSON to GeoJSON conversion
      // For a more robust solution, you'd use the topojson library
      const features = [];
      
      for (const [key, object] of Object.entries(data.objects)) {
        if (object.type === 'GeometryCollection') {
          for (const geometry of object.geometries) {
            const feature = {
              type: 'Feature',
              properties: geometry.properties || {},
              geometry: this.convertTopoGeometry(geometry, data.arcs)
            };
            features.push(feature);
          }
        }
      }
      
      return {
        type: 'FeatureCollection',
        features
      };
    }
    
    // If it's a single Feature, wrap in FeatureCollection
    if (data.type === 'Feature') {
      return {
        type: 'FeatureCollection',
        features: [data]
      };
    }
    
    throw new Error('Unsupported data format - not GeoJSON or TopoJSON');
  }

  /**
   * Basic TopoJSON geometry conversion (simplified)
   */
  convertTopoGeometry(geometry, arcs) {
    // This is a very basic conversion - for production use topojson library
    if (geometry.type === 'Polygon') {
      return {
        type: 'Polygon',
        coordinates: geometry.arcs.map(ring => 
          ring.map(arcIndex => {
            const arc = arcs[Math.abs(arcIndex)];
            return arcIndex < 0 ? arc.slice().reverse() : arc;
          }).flat()
        )
      };
    }
    
    if (geometry.type === 'MultiPolygon') {
      return {
        type: 'MultiPolygon',
        coordinates: geometry.arcs.map(polygon =>
          polygon.map(ring =>
            ring.map(arcIndex => {
              const arc = arcs[Math.abs(arcIndex)];
              return arcIndex < 0 ? arc.slice().reverse() : arc;
            }).flat()
          )
        )
      };
    }
    
    // For other geometry types, return as-is and hope for the best
    return geometry;
  }

  /**
   * Split countries by ISO code and save individual files
   */
  async splitCountriesByISO(geoJsonData, level, sourceName) {
    console.log(`    🌎 Processing countries for ${level} (${sourceName})...`);
    
    if (!geoJsonData.features || !Array.isArray(geoJsonData.features)) {
      throw new Error('Invalid GeoJSON: no features array found');
    }
    
    let processedCount = 0;
    
    for (const feature of geoJsonData.features) {
      // Try multiple property names for ISO code
      const iso3 = this.extractISO3(feature.properties);
      
      if (!iso3) {
        console.warn(`    ⚠️  Skipping feature with no ISO code: ${JSON.stringify(feature.properties).substring(0, 100)}...`);
        continue;
      }
      
      // Create country GeoJSON
      const countryData = {
        type: 'FeatureCollection',
        metadata: {
          source: sourceName,
          level: level,
          country: iso3,
          generated: new Date().toISOString(),
          properties_available: Object.keys(feature.properties)
        },
        features: [feature]
      };
      
      // Ensure proper ID in properties
      feature.properties.id = feature.properties.id || iso3;
      
      const outputPath = path.join(this.outputDir, level, `${iso3}.json`);
      
      try {
        // Check if file already exists and merge if needed
        try {
          const existingData = JSON.parse(await fs.readFile(outputPath, 'utf8'));
          // If we have better data source, potentially replace
          if (sourceName.includes('Natural Earth') || level === 'ultra') {
            existingData.features = [feature];
            existingData.metadata.source = sourceName;
            existingData.metadata.updated = new Date().toISOString();
          }
          await fs.writeFile(outputPath, JSON.stringify(existingData, null, 2));
        } catch {
          // File doesn't exist, create new
          await fs.writeFile(outputPath, JSON.stringify(countryData, null, 2));
        }
        
        this.processedCountries.add(iso3);
        processedCount++;
        
        const countryName = feature.properties.NAME || feature.properties.name || feature.properties.NAME_EN || iso3;
        console.log(`      ✅ ${iso3}: ${countryName}`);
        
      } catch (error) {
        console.warn(`    ⚠️  Failed to save ${iso3}: ${error.message}`);
      }
    }
    
    console.log(`    📊 Processed ${processedCount} countries from ${sourceName}`);
  }

  /**
   * Extract ISO3 code from feature properties
   */
  extractISO3(properties) {
    if (!properties) return null;
    
    // Try various property names for ISO3 code
    const possibleFields = [
      'ISO_A3', 'iso_a3', 'ISO3', 'iso3', 
      'ADM0_A3', 'adm0_a3', 'SOV_A3', 'sov_a3',
      'ISO3166_1_Alpha_3', 'iso3166_1_alpha_3',
      'alpha3', 'Alpha3', 'ALPHA3'
    ];
    
    for (const field of possibleFields) {
      const value = properties[field];
      if (value && typeof value === 'string' && value.length === 3 && value !== '-99' && value !== 'undefined') {
        return value.toUpperCase();
      }
    }
    
    // Special handling for some common cases
    if (properties.NAME === 'United States of America' || properties.name === 'United States') {
      return 'USA';
    }
    if (properties.NAME === 'United Kingdom' || properties.name === 'United Kingdom') {
      return 'GBR';
    }
    
    return null;
  }

  /**
   * Generate processing summary
   */
  async generateSummary() {
    console.log('\n📊 Generating summary...');
    
    const summary = {
      generated: new Date().toISOString(),
      pipeline_version: '1.0.0-simple',
      source: 'Multiple (World Atlas, Natural Earth GitHub)',
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
    const summaryPath = path.join(this.outputDir, 'download-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`✅ Summary written to ${summaryPath}`);
    console.log(`📈 Total countries processed: ${this.processedCountries.size}`);
    console.log(`📁 Total files generated: ${summary.total_files}`);
    
    // Log sample of processed countries
    const sampleCountries = Array.from(this.processedCountries).slice(0, 10);
    console.log(`📋 Sample countries: ${sampleCountries.join(', ')}${this.processedCountries.size > 10 ? '...' : ''}`);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Simplified Natural Earth Pipeline

Usage:
  node simple-natural-earth.js [options]

Options:
  --help, -h     Show this help message

This script downloads GeoJSON boundary data from various sources
and processes it for use in the Balance of Powers game.

No external dependencies required (no GDAL/ogr2ogr needed).
    `);
    process.exit(0);
  }
  
  // Run the pipeline
  const pipeline = new SimpleNaturalEarthPipeline();
  pipeline.run().catch(error => {
    console.error('Pipeline failed:', error);
    process.exit(1);
  });
}

module.exports = { SimpleNaturalEarthPipeline };