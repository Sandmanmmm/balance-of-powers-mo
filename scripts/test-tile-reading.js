import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import geobuf from 'geobuf';
import Pbf from 'pbf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing PBF tile reading...');

async function testTileReading() {
  try {
    const tilePath = path.join(__dirname, '..', 'public', 'data', 'tiles', 'overview', '2', '1', '1.pbf');
    console.log('📂 Reading tile from:', tilePath);
    
    // Read the tile file
    const buffer = await fs.readFile(tilePath);
    console.log(`📊 Tile file size: ${buffer.length} bytes`);
    
    // Decode the PBF tile
    const pbf = new Pbf(buffer);
    const geoJSON = geobuf.decode(pbf);
    
    console.log('✅ Successfully decoded PBF tile');
    console.log('📋 Data type:', geoJSON.type);
    console.log('🗺️ Features count:', geoJSON.features.length);
    
    if (geoJSON.features.length > 0) {
      const firstFeature = geoJSON.features[0];
      console.log('🔍 First feature properties:', Object.keys(firstFeature.properties || {}));
      console.log('📐 First feature geometry type:', firstFeature.geometry?.type);
    }
    
  } catch (error) {
    console.error('❌ Tile reading failed:', error);
  }
}

testTileReading();
