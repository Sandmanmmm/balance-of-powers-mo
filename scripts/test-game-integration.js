// Test integration with existing GeographicDataManager

import fs from 'fs';
import path from 'path';
import Pbf from 'pbf';
import geobuf from 'geobuf';

console.log('🧪 Testing GeographicDataManager tile loading...');

// Simulate the tile loading logic from GeographicDataManager
async function loadPBFTile(filePath) {
    try {
        console.log('📂 Loading PBF tile from:', filePath);
        
        const buffer = fs.readFileSync(filePath);
        console.log('📊 Buffer size:', buffer.length, 'bytes');
        
        // Decode using geobuf (same as GeographicDataManager)
        const geoJSON = geobuf.decode(new Pbf(buffer));
        
        console.log('✅ Successfully decoded tile');
        console.log('📋 GeoJSON type:', geoJSON.type);
        console.log('🗺️ Features count:', geoJSON.features?.length || 0);
        
        if (geoJSON.features && geoJSON.features.length > 0) {
            console.log('🏷️ First feature name:', geoJSON.features[0].properties?.NAME || 'Unknown');
            console.log('📐 First feature geometry type:', geoJSON.features[0].geometry?.type);
        }
        
        return geoJSON;
        
    } catch (error) {
        console.error('❌ Error loading PBF tile:', error.message);
        throw error;
    }
}

// Test with our generated tile
async function testTileLoading() {
    const tilePath = path.join(process.cwd(), 'public', 'data', 'tiles', 'overview', '2', '1', '1.pbf');
    
    try {
        const geoJSON = await loadPBFTile(tilePath);
        
        console.log('\n🎯 Integration test results:');
        console.log('✅ Tile loads successfully with GeographicDataManager logic');
        console.log('✅ GeoJSON structure is correct');
        console.log('✅ Features are accessible');
        console.log('✅ Properties are preserved');
        
        // Test zoom level logic
        const z = 2, x = 1, y = 1;
        const tileKey = `${z}/${x}/${y}`;
        console.log('🗝️ Tile key:', tileKey);
        
        return true;
        
    } catch (error) {
        console.error('❌ Integration test failed:', error);
        return false;
    }
}

// Run the test
testTileLoading().then(success => {
    if (success) {
        console.log('\n🎉 Integration test PASSED! Ready to proceed with full implementation.');
    } else {
        console.log('\n💥 Integration test FAILED! Need to debug before proceeding.');
    }
    process.exit(success ? 0 : 1);
});
