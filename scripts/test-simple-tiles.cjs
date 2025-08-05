// Simple PBF tile generation test script
const fs = require('fs/promises');
const path = require('path');
const geobuf = require('geobuf');
const Pbf = require('pbf').default;

console.log('🚀 Starting simple PBF tile generation test...');

async function generateSimpleTiles() {
    try {
        // Load a few test countries
        const testCountries = ['USA', 'CAN', 'MEX', 'GBR', 'FRA'];
        
        for (const country of testCountries) {
            console.log(`\n🌍 Processing ${country}...`);
            
            const boundaryPath = path.join(__dirname, '..', 'public', 'data', 'boundaries', 'overview', `${country}.json`);
            
            // Check if file exists
            try {
                await fs.access(boundaryPath);
            } catch (error) {
                console.log(`⚠️ Skipping ${country} - file not found`);
                continue;
            }
            
            // Load boundary data
            const content = await fs.readFile(boundaryPath, 'utf8');
            const geoJSON = JSON.parse(content);
            
            console.log(`📊 Loaded ${country} with ${geoJSON.features?.length || 'unknown'} features`);
            
            // Create a simple tile at zoom level 2
            const z = 2, x = 1, y = 1;
            
            // Encode to PBF
            const pbf = new Pbf();
            const pbfData = geobuf.encode(geoJSON, pbf);
            const buffer = Buffer.from(pbfData);
            
            // Save tile
            const tileDir = path.join(__dirname, '..', 'public', 'data', 'tiles', 'test', z.toString(), x.toString());
            await fs.mkdir(tileDir, { recursive: true });
            
            const tilePath = path.join(tileDir, `${country}_${y}.pbf`);
            await fs.writeFile(tilePath, buffer);
            
            console.log(`✅ Generated tile for ${country}: ${(buffer.length / 1024).toFixed(1)}KB`);
        }
        
        console.log('\n🎉 Simple tile generation completed!');
        
    } catch (error) {
        console.error('❌ Error during tile generation:', error);
    }
}

// Run the test
generateSimpleTiles();
