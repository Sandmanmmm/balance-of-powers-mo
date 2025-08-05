// Test reading the generated PBF tiles
const fs = require('fs');
const path = require('path');
const geobuf = require('geobuf');
const Pbf = require('pbf').default;

console.log('🧪 Testing PBF tile reading...');

async function testTileReading() {
    const tileDir = path.join(__dirname, '..', 'public', 'data', 'tiles', 'test', '2', '1');
    const files = fs.readdirSync(tileDir);
    
    console.log(`📁 Found ${files.length} tiles to test:`);
    
    for (const file of files) {
        if (!file.endsWith('.pbf')) continue;
        
        const tilePath = path.join(tileDir, file);
        console.log(`\n🔍 Testing ${file}...`);
        
        try {
            // Read and decode tile
            const buffer = fs.readFileSync(tilePath);
            const geoJSON = geobuf.decode(new Pbf(buffer));
            
            console.log(`✅ Successfully decoded ${file}`);
            console.log(`📊 Type: ${geoJSON.type}`);
            console.log(`🗺️ Features: ${geoJSON.features?.length || 0}`);
            
            if (geoJSON.features && geoJSON.features.length > 0) {
                const feature = geoJSON.features[0];
                console.log(`🏷️ Country: ${feature.properties?.NAME || 'Unknown'}`);
                console.log(`📐 Geometry: ${feature.geometry?.type || 'Unknown'}`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to read ${file}:`, error.message);
        }
    }
    
    console.log('\n🎯 Tile reading test completed!');
}

testTileReading();
