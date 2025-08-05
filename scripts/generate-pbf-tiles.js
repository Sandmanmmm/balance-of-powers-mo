const fs = require('fs/promises');
const path = require('path');
const geobuf = require('geobuf');
const Pbf = require('pbf');
const turf = require('@turf/turf');

const __dirname = __dirname;

// Manual tile utility functions (simplified replacement for tilebelt)
const tileUtils = {
  pointToTile: (lon, lat, zoom) => {
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lon + 180) / 360) * n);
    const y = Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n);
    return [x, y, zoom];
  },
  
  tileToBBOX: ([x, y, z]) => {
    const n = Math.pow(2, z);
    const lonMin = (x / n) * 360 - 180;
    const lonMax = ((x + 1) / n) * 360 - 180;
    const latMin = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
    const latMax = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    return [lonMin, latMin, lonMax, latMax];
  }
};

class BalanceOfPowersTileGenerator {
  constructor() {
    this.zoomLevels = {
      overview: [0, 3],      // Country level (0-3)
      detailed: [4, 7],      // Province level (4-7)
      ultra: [8, 10]         // Sub-province detail (8-10)
    };
    this.tileSize = 256;
    this.outputDir = path.join(__dirname, '..', 'public', 'data', 'tiles');
    this.boundaryDir = path.join(__dirname, '..', 'public', 'data', 'boundaries');
  }

  async generateAllTiles() {
    console.log('🚀 Starting Balance of Powers PBF tile generation...');
    
    try {
      // Ensure output directory exists
      await this.ensureDirectoryExists(this.outputDir);
      
      // Step 1: Load and merge all regional boundary data
      console.log('📂 Loading boundary data...');
      const regions = await this.loadAllRegions();
      
      if (regions.length === 0) {
        console.warn('⚠️ No boundary data found. Make sure boundary files exist in public/data/boundaries/');
        return;
      }

      console.log(`📊 Loaded ${regions.length} boundary datasets`);
      const mergedGeoJSON = this.mergeRegionsIntoGeoJSON(regions);
      
      console.log(`🗺️ Merged GeoJSON contains ${mergedGeoJSON.features.length} features`);
      
      // Step 2: Enhance with game-specific properties
      console.log('🎮 Enhancing with game-specific data...');
      const enhancedGeoJSON = await this.enhanceWithGameData(mergedGeoJSON);
      
      // Step 3: Generate tiles for each zoom level
      for (const [levelName, zoomRange] of Object.entries(this.zoomLevels)) {
        console.log(`🗂️ Generating ${levelName} tiles for zoom levels ${zoomRange[0]}-${zoomRange[1]}...`);
        await this.generateTilesForLevel(enhancedGeoJSON, levelName, zoomRange);
      }
      
      // Step 4: Generate metadata for quick lookups
      console.log('📝 Generating tile metadata...');
      await this.generateTileMetadata();
      
      console.log('✅ PBF tile generation complete!');
      
    } catch (error) {
      console.error('❌ PBF tile generation failed:', error);
      throw error;
    }
  }

  async loadAllRegions() {
    const regions = [];
    
    // Define boundary files to process (using ISO 3-letter codes)
    const boundaryFiles = [
      // Overview level files - Major countries/regions
      { level: 'overview', file: 'USA.json' },
      { level: 'overview', file: 'CAN.json' },
      { level: 'overview', file: 'CHN.json' },
      { level: 'overview', file: 'IND.json' },
      { level: 'overview', file: 'RUS.json' },
      { level: 'overview', file: 'MEX.json' },
      { level: 'overview', file: 'DEU.json' },
      { level: 'overview', file: 'FRA.json' },
      { level: 'overview', file: 'GBR.json' },
      { level: 'overview', file: 'JPN.json' },
      { level: 'overview', file: 'BRA.json' },
      { level: 'overview', file: 'AUS.json' },
      
      // Detailed level files - Major countries with province data
      { level: 'detailed', file: 'USA.json' },
      { level: 'detailed', file: 'CAN.json' },
      { level: 'detailed', file: 'CHN.json' },
      { level: 'detailed', file: 'RUS.json' },
      { level: 'detailed', file: 'IND.json' },
      { level: 'detailed', file: 'DEU.json' },
      { level: 'detailed', file: 'FRA.json' },
      { level: 'detailed', file: 'GBR.json' },
    ];
    
    for (const { level, file } of boundaryFiles) {
      try {
        const filePath = path.join(this.boundaryDir, level, file);
        const data = await this.loadBoundaryFile(filePath);
        
        if (data && data.features && Array.isArray(data.features)) {
          console.log(`✅ Loaded ${data.features.length} features from ${level}/${file}`);
          regions.push({
            level,
            file,
            data
          });
        } else {
          console.warn(`⚠️ Invalid data structure in ${level}/${file}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load ${level}/${file}: ${error.message}`);
      }
    }
    
    return regions;
  }

  async loadBoundaryFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Handle different data formats
      if (data.type === 'FeatureCollection') {
        return data;
      } else if (typeof data === 'object' && !Array.isArray(data)) {
        // Convert Record<string, Feature> to FeatureCollection
        const features = Object.values(data).filter(feature => 
          feature && feature.type === 'Feature'
        );
        
        return {
          type: 'FeatureCollection',
          features
        };
      } else {
        throw new Error(`Unsupported data format in ${filePath}`);
      }
    } catch (error) {
      console.warn(`Failed to load boundary file ${filePath}: ${error.message}`);
      return null;
    }
  }

  mergeRegionsIntoGeoJSON(regions) {
    const allFeatures = [];
    
    // Collect all features from all regions
    regions.forEach(region => {
      if (region.data && region.data.features) {
        region.data.features.forEach(feature => {
          // Add metadata about source
          if (!feature.properties) {
            feature.properties = {};
          }
          feature.properties._sourceLevel = region.level;
          feature.properties._sourceFile = region.file;
          
          allFeatures.push(feature);
        });
      }
    });
    
    console.log(`🔗 Merged ${allFeatures.length} features from ${regions.length} regions`);
    
    return {
      type: 'FeatureCollection',
      features: allFeatures
    };
  }

  async enhanceWithGameData(geoJSON) {
    // For now, just add basic game-specific metadata
    // This can be expanded later to include YAML data integration
    
    const enhancedFeatures = geoJSON.features.map(feature => {
      const enhanced = {
        ...feature,
        properties: {
          ...feature.properties,
          // Add game-specific metadata
          gameData: {
            tileGenerated: new Date().toISOString(),
            version: '1.0.0',
            // Placeholder for future enhancements
            resourceMask: this.encodeResourceBitmap(feature.properties),
            infrastructureLevels: this.encodeInfrastructure(feature.properties),
            economicData: this.encodeEconomicData(feature.properties),
            militaryValue: this.calculateMilitaryValue(feature.properties)
          }
        }
      };
      
      return enhanced;
    });
    
    console.log(`🎮 Enhanced ${enhancedFeatures.length} features with game data`);
    
    return {
      type: 'FeatureCollection',
      features: enhancedFeatures
    };
  }

  // Placeholder functions for game data encoding
  encodeResourceBitmap(properties) {
    // Encode resource deposits as a bitmap
    const resources = properties.resourceDeposits || {};
    return Object.keys(resources).length; // Simplified for now
  }

  encodeInfrastructure(properties) {
    // Encode infrastructure levels
    const infrastructure = properties.infrastructure || {};
    return {
      roads: infrastructure.roads || 0,
      internet: infrastructure.internet || 0,
      power: infrastructure.powerGrid || 0
    };
  }

  encodeEconomicData(properties) {
    // Encode economic metrics
    const economy = properties.economy || {};
    return {
      gdp: economy.gdp || 0,
      gdpPerCapita: economy.gdpPerCapita || 0
    };
  }

  calculateMilitaryValue(properties) {
    // Calculate military strength value
    const military = properties.military || {};
    return military.fortificationLevel || 0;
  }

  async generateTilesForLevel(geoJSON, levelName, zoomRange) {
    let totalTiles = 0;
    
    for (let z = zoomRange[0]; z <= zoomRange[1]; z++) {
      console.log(`  📐 Processing zoom level ${z}...`);
      
      // Calculate bounding box of all features
      const bounds = turf.bbox(geoJSON);
      console.log(`  📏 Bounds: [${bounds.join(', ')}]`);
      
      // Get all tiles that intersect with the data bounds
      const tiles = this.getTilesForBounds(bounds, z);
      console.log(`  🗂️ Generated ${tiles.length} tiles for zoom ${z}`);
      
      for (const tile of tiles) {
        const tileData = this.extractTileData(geoJSON, tile, z);
        
        if (tileData.features.length > 0) {
          await this.encodePBFTile(tileData, tile, levelName);
          totalTiles++;
        }
      }
    }
    
    console.log(`✅ Generated ${totalTiles} tiles for ${levelName} level`);
  }

  getTilesForBounds(bounds, zoom) {
    // Convert bounds to tile coordinates using manual utilities
    const minTile = tileUtils.pointToTile(bounds[0], bounds[1], zoom);
    const maxTile = tileUtils.pointToTile(bounds[2], bounds[3], zoom);
    
    const tiles = [];
    
    // Generate all tiles in the bounding rectangle
    for (let x = minTile[0]; x <= maxTile[0]; x++) {
      for (let y = minTile[1]; y <= maxTile[1]; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }
    
    return tiles;
  }

  extractTileData(geoJSON, tile, zoom) {
    // Get tile bounding box using manual utilities
    const tileBbox = tileUtils.tileToBBOX([tile.x, tile.y, tile.z]);
    
    // Create a polygon for the tile bounds
    const tilePoly = turf.bboxPolygon(tileBbox);
    
    // Find features that intersect with this tile
    const intersectingFeatures = geoJSON.features.filter(feature => {
      try {
        // Check if feature intersects with tile
        return turf.booleanIntersects(feature, tilePoly);
      } catch (error) {
        // If intersection check fails, include the feature to be safe
        console.warn(`⚠️ Intersection check failed for feature ${feature.properties?.id || 'unknown'}: ${error.message}`);
        return true;
      }
    });
    
    // Apply level-of-detail simplification based on zoom
    const simplifiedFeatures = intersectingFeatures.map(feature => {
      return this.simplifyFeatureForZoom(feature, zoom);
    });
    
    return {
      type: 'FeatureCollection',
      features: simplifiedFeatures
    };
  }

  simplifyFeatureForZoom(feature, zoom) {
    // Apply geometry simplification based on zoom level
    try {
      if (zoom < 4) {
        // High simplification for overview levels
        const tolerance = 0.1;
        return turf.simplify(feature, { tolerance, highQuality: false });
      } else if (zoom < 8) {
        // Medium simplification for detailed levels
        const tolerance = 0.01;
        return turf.simplify(feature, { tolerance, highQuality: true });
      } else {
        // No simplification for ultra detail levels
        return feature;
      }
    } catch (error) {
      console.warn(`⚠️ Simplification failed for feature: ${error.message}`);
      return feature; // Return original if simplification fails
    }
  }

  async encodePBFTile(tileData, tile, levelName) {
    try {
      // Encode using geobuf (corrected pattern from successful test)
      const pbfData = geobuf.encode(tileData, new Pbf());
      const buffer = Buffer.from(pbfData);
      
      // Create directory structure: levelName/z/x/y.pbf
      const tileDir = path.join(this.outputDir, levelName, tile.z.toString(), tile.x.toString());
      await this.ensureDirectoryExists(tileDir);
      
      const tilePath = path.join(tileDir, `${tile.y}.pbf`);
      await fs.writeFile(tilePath, buffer);
      
      // Log progress for significant tiles
      if (tileData.features.length > 0) {
        console.log(`    💾 Saved tile ${tile.z}/${tile.x}/${tile.y}.pbf (${tileData.features.length} features, ${(buffer.length / 1024).toFixed(1)}KB)`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to encode tile ${tile.z}/${tile.x}/${tile.y}: ${error.message}`);
    }
  }

  async generateTileMetadata() {
    const metadata = {
      generated: new Date().toISOString(),
      version: '1.0.0',
      tileFormat: 'pbf',
      encoding: 'geobuf',
      zoomLevels: this.zoomLevels,
      tileSize: this.tileSize,
      bounds: [-180, -90, 180, 90], // World bounds
      layers: ['boundaries', 'provinces', 'countries'],
      description: 'Balance of Powers PBF tiles for geographic data rendering'
    };
    
    const metadataPath = path.join(this.outputDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`📝 Generated metadata: ${metadataPath}`);
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Main function started');
  try {
    console.log('📦 Creating generator instance...');
    const generator = new BalanceOfPowersTileGenerator();
    console.log('🔄 Starting tile generation...');
    await generator.generateAllTiles();
    console.log('✅ Tile generation completed successfully');
  } catch (error) {
    console.error('❌ Tile generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly (CommonJS compatible)
if (require.main === module) {
  console.log('🎯 Script executed directly, starting main...');
  main();
}

module.exports = BalanceOfPowersTileGenerator;
