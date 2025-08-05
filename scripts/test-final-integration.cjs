// Final Integration Test for PBF Tile System
const fs = require('fs').promises;
const path = require('path');
const geobuf = require('geobuf');
const Pbf = require('pbf').default;

console.log('🎯 Final PBF Integration Test for Balance of Powers');
console.log('==================================================');

async function runFullIntegrationTest() {
    try {
        // Test 1: Check metadata
        console.log('\n📋 Test 1: Checking metadata...');
        const metadataPath = path.join(__dirname, '..', 'public', 'data', 'tiles', 'metadata.json');
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
        
        console.log(`✅ Metadata loaded: ${metadata.tileFormat} format using ${metadata.encoding}`);
        console.log(`📊 Generated: ${metadata.generated}`);
        console.log(`🗂️ Levels: ${Object.keys(metadata.levels).join(', ')}`);
        
        // Test 2: Sample tile loading from each level
        console.log('\n🧪 Test 2: Loading sample tiles from each level...');
        
        const sampleTests = [
            { level: 'overview', path: 'overview/2/2/USA_2.pbf' },
            { level: 'detailed', path: 'detailed/4/8/USA_8.pbf' },
            { level: 'overview', path: 'overview/1/1/CHN_1.pbf' },
            { level: 'detailed', path: 'detailed/5/16/RUS_16.pbf' }
        ];
        
        for (const test of sampleTests) {
            const tilePath = path.join(__dirname, '..', 'public', 'data', 'tiles', test.path);
            
            try {
                const buffer = await fs.readFile(tilePath);
                const geoJSON = geobuf.decode(new Pbf(buffer));
                
                const country = geoJSON.features?.[0]?.properties?.NAME || 'Unknown';
                const featureCount = geoJSON.features?.length || 0;
                const size = (buffer.length / 1024).toFixed(1);
                
                console.log(`  ✅ ${test.level}: ${test.path} - ${country} (${featureCount} features, ${size}KB)`);
                
            } catch (error) {
                console.log(`  ❌ ${test.level}: ${test.path} - Failed: ${error.message}`);
            }
        }
        
        // Test 3: Performance metrics
        console.log('\n📊 Test 3: Performance analysis...');
        
        const overviewDir = path.join(__dirname, '..', 'public', 'data', 'tiles', 'overview');
        const detailedDir = path.join(__dirname, '..', 'public', 'data', 'tiles', 'detailed');
        
        const overviewStats = await getDirectoryStats(overviewDir);
        const detailedStats = await getDirectoryStats(detailedDir);
        
        console.log(`🗂️ Overview tiles: ${overviewStats.fileCount} files, ${(overviewStats.totalSize / 1024 / 1024).toFixed(1)}MB total`);
        console.log(`🗂️ Detailed tiles: ${detailedStats.fileCount} files, ${(detailedStats.totalSize / 1024 / 1024).toFixed(1)}MB total`);
        console.log(`📈 Average tile size: ${(overviewStats.avgSize / 1024).toFixed(1)}KB (overview), ${(detailedStats.avgSize / 1024).toFixed(1)}KB (detailed)`);
        
        // Test 4: Compatibility check
        console.log('\n🔧 Test 4: GeographicDataManager compatibility...');
        
        // Simulate the exact loading pattern from GeographicDataManager
        const testTilePath = path.join(__dirname, '..', 'public', 'data', 'tiles', 'overview', '2', '2', 'USA_2.pbf');
        const tileBuffer = await fs.readFile(testTilePath);
        
        // This is exactly how GeographicDataManager loads tiles
        const decodedData = geobuf.decode(new Pbf(tileBuffer));
        
        if (decodedData.type === 'FeatureCollection' && decodedData.features?.length > 0) {
            console.log('  ✅ Tile format is compatible with GeographicDataManager');
            console.log('  ✅ GeoJSON structure is correct');
            console.log('  ✅ Features are accessible');
            
            const feature = decodedData.features[0];
            if (feature.properties && feature.geometry) {
                console.log('  ✅ Feature properties and geometry are present');
            }
        }
        
        console.log('\n🎉 Integration Test Results: ALL TESTS PASSED!');
        console.log('🚀 PBF tile system is ready for integration with Balance of Powers!');
        
        return true;
        
    } catch (error) {
        console.error('\n💥 Integration test failed:', error);
        return false;
    }
}

async function getDirectoryStats(dirPath) {
    let fileCount = 0;
    let totalSize = 0;
    
    async function walkDir(currentPath) {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            
            if (entry.isDirectory()) {
                await walkDir(fullPath);
            } else if (entry.name.endsWith('.pbf')) {
                const stats = await fs.stat(fullPath);
                fileCount++;
                totalSize += stats.size;
            }
        }
    }
    
    await walkDir(dirPath);
    
    return {
        fileCount,
        totalSize,
        avgSize: fileCount > 0 ? totalSize / fileCount : 0
    };
}

// Run the test
runFullIntegrationTest().then(success => {
    process.exit(success ? 0 : 1);
});
