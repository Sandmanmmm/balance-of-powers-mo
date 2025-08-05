import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import geobuf from 'geobuf';
import Pbf from 'pbf';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Simple PBF tile generator starting...');

class SimpleTileGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'public', 'data', 'tiles');
    this.boundaryDir = path.join(__dirname, '..', 'public', 'data', 'boundaries');
  }

  async generateTestTiles() {
    console.log('📂 Creating output directory...');
    await this.ensureDirectoryExists(this.outputDir);
    
    console.log('📋 Loading USA boundary data...');
    const usaData = await this.loadBoundaryFile(
      path.join(this.boundaryDir, 'overview', 'USA.json')
    );
    
    if (!usaData) {
      console.error('❌ Failed to load USA data');
      return;
    }
    
    console.log(`✅ Loaded USA data with ${usaData.features.length} features`);
    
    // Generate a single test tile
    console.log('🗂️ Generating test tile...');
    await this.generateSingleTile(usaData, 'overview', 2, 1, 1);
    
    console.log('✅ Test tile generation complete!');
  }

  async loadBoundaryFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (data.type === 'FeatureCollection') {
        return data;
      } else {
        console.error('❌ Invalid data format');
        return null;
      }
    } catch (error) {
      console.error(`❌ Failed to load ${filePath}:`, error.message);
      return null;
    }
  }

  async generateSingleTile(geoJSON, levelName, z, x, y) {
    console.log(`🎯 Generating tile ${levelName}/${z}/${x}/${y}...`);
    
    try {
      // Debug the input data
      console.log('🔍 Input GeoJSON:', {
        type: geoJSON.type,
        featuresCount: geoJSON.features.length,
        firstFeature: geoJSON.features[0] ? {
          type: geoJSON.features[0].type,
          geometryType: geoJSON.features[0].geometry?.type,
          propertiesKeys: Object.keys(geoJSON.features[0].properties || {}).slice(0, 5)
        } : 'none'
      });
      
      // Encode using geobuf - correct approach
      console.log('📦 Encoding with geobuf...');
      
      // geobuf.encode returns a Uint8Array buffer directly
      const encodedBuffer = geobuf.encode(geoJSON, new Pbf());
      const buffer = Buffer.from(encodedBuffer);
      
      console.log(`💾 Encoded buffer size: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(1)}KB)`);
      
      if (buffer.length === 0) {
        console.error('⚠️ Warning: Buffer is empty after encoding');
        return;
      }
      
      // Save the buffer
      await this.saveTileBuffer(buffer, levelName, z, x, y);
      
    } catch (error) {
      console.error(`❌ Failed to generate tile: ${error.message}`);
      console.error('Stack trace:', error.stack);
    }
  }

  async saveTileBuffer(buffer, levelName, z, x, y) {
    // Create directory structure
    const tileDir = path.join(this.outputDir, levelName, z.toString(), x.toString());
    await this.ensureDirectoryExists(tileDir);
    
    const tilePath = path.join(tileDir, `${y}.pbf`);
    await fs.writeFile(tilePath, buffer);
    
    console.log(`✅ Saved tile to: ${tilePath} (${buffer.length} bytes)`);
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

async function main() {
  try {
    console.log('🎯 Starting simple tile generation...');
    const generator = new SimpleTileGenerator();
    await generator.generateTestTiles();
    console.log('🎉 All done!');
  } catch (error) {
    console.error('❌ Generation failed:', error);
  }
}

main();
