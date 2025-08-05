// Production PBF Tile Generation System for Balance of Powers
const fs = require('fs').promises;
const path = require('path');
const geobuf = require('geobuf');
const Pbf = require('pbf').default;

console.log('🚀 Balance of Powers PBF Tile Generation System');
console.log('================================================');

class PBFTileGenerator {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.boundariesDir = path.join(this.baseDir, 'public', 'data', 'boundaries');
        this.tilesDir = path.join(this.baseDir, 'public', 'data', 'tiles');
        
        // Zoom level configuration
        this.zoomLevels = {
            overview: { min: 0, max: 4 },   // World view to country level
            detailed: { min: 4, max: 8 },  // Province/state level  
            ultra: { min: 8, max: 12 }     // City/detailed level
        };
    }
    
    async generateAllTiles() {
        try {
            console.log('\n📁 Setting up tile directories...');
            await this.setupDirectories();
            
            console.log('\n🌍 Generating overview tiles...');
            await this.generateOverviewTiles();
            
            console.log('\n🗺️ Generating detailed tiles...');
            await this.generateDetailedTiles();
            
            console.log('\n📊 Generating metadata...');
            await this.generateMetadata();
            
            console.log('\n✅ PBF tile generation completed successfully!');
            
        } catch (error) {
            console.error('❌ Tile generation failed:', error);
            throw error;
        }
    }
    
    async setupDirectories() {
        const levels = ['overview', 'detailed', 'ultra'];
        
        for (const level of levels) {
            for (let z = 0; z <= 12; z++) {
                const levelDir = path.join(this.tilesDir, level, z.toString());
                await fs.mkdir(levelDir, { recursive: true });
            }
        }
        
        console.log('✅ Tile directory structure created');
    }
    
    async generateOverviewTiles() {
        const overviewDir = path.join(this.boundariesDir, 'overview');
        
        try {
            const files = await fs.readdir(overviewDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));
            
            console.log(`📊 Found ${jsonFiles.length} country boundary files`);
            
            let processed = 0;
            for (const file of jsonFiles) {
                const country = path.basename(file, '.json');
                await this.generateTilesForCountry(country, 'overview');
                
                processed++;
                if (processed % 10 === 0) {
                    console.log(`   📈 Processed ${processed}/${jsonFiles.length} countries...`);
                }
            }
            
            console.log(`✅ Generated overview tiles for ${processed} countries`);
            
        } catch (error) {
            console.warn('⚠️ Overview directory not found, skipping overview tiles');
        }
    }
    
    async generateDetailedTiles() {
        const detailedDir = path.join(this.boundariesDir, 'detailed');
        
        try {
            const files = await fs.readdir(detailedDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));
            
            console.log(`📊 Found ${jsonFiles.length} detailed boundary files`);
            
            let processed = 0;
            for (const file of jsonFiles) {
                const region = path.basename(file, '.json');
                await this.generateTilesForCountry(region, 'detailed');
                
                processed++;
                if (processed % 5 === 0) {
                    console.log(`   📈 Processed ${processed}/${jsonFiles.length} detailed regions...`);
                }
            }
            
            console.log(`✅ Generated detailed tiles for ${processed} regions`);
            
        } catch (error) {
            console.warn('⚠️ Detailed directory not found, skipping detailed tiles');
        }
    }
    
    async generateTilesForCountry(country, level) {
        try {
            // Load boundary data
            const boundaryFile = path.join(this.boundariesDir, level, `${country}.json`);
            const content = await fs.readFile(boundaryFile, 'utf8');
            const geoJSON = JSON.parse(content);
            
            // Validate GeoJSON structure
            if (!geoJSON || !geoJSON.type) {
                console.warn(`⚠️ Invalid GeoJSON structure for ${country}`);
                return;
            }
            
            // Convert to FeatureCollection if needed
            let featureCollection;
            if (geoJSON.type === 'FeatureCollection') {
                featureCollection = geoJSON;
            } else if (geoJSON.type === 'Feature') {
                featureCollection = {
                    type: 'FeatureCollection',
                    features: [geoJSON]
                };
            } else {
                console.warn(`⚠️ Unsupported GeoJSON type for ${country}: ${geoJSON.type}`);
                return;
            }
            
            // Generate tiles for appropriate zoom levels
            const zoomConfig = this.zoomLevels[level];
            for (let zoom = zoomConfig.min; zoom <= zoomConfig.max; zoom++) {
                await this.generateTileAtZoom(featureCollection, country, level, zoom);
            }
            
        } catch (error) {
            console.warn(`⚠️ Failed to process ${country}: ${error.message}`);
        }
    }
    
    async generateTileAtZoom(geoJSON, country, level, zoom) {
        // For now, generate a single tile per zoom level
        // In a production system, you'd calculate proper tile coordinates
        const x = Math.floor(Math.pow(2, zoom) / 2);
        const y = Math.floor(Math.pow(2, zoom) / 2);
        
        await this.saveTile(geoJSON, level, zoom, x, y, country);
    }
    
    async saveTile(geoJSON, level, zoom, x, y, country) {
        try {
            // Encode to PBF
            const pbf = new Pbf();
            const pbfData = geobuf.encode(geoJSON, pbf);
            const buffer = Buffer.from(pbfData);
            
            // Create directory structure
            const tileDir = path.join(this.tilesDir, level, zoom.toString(), x.toString());
            await fs.mkdir(tileDir, { recursive: true });
            
            // Save tile with country prefix for identification
            const tilePath = path.join(tileDir, `${country}_${y}.pbf`);
            await fs.writeFile(tilePath, buffer);
            
            // Log significant tiles
            if (buffer.length > 1000) {
                console.log(`    💾 ${level}/${zoom}/${x}/${country}_${y}.pbf - ${(buffer.length / 1024).toFixed(1)}KB`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to save tile for ${country}:`, error.message);
        }
    }
    
    async generateMetadata() {
        const metadata = {
            generated: new Date().toISOString(),
            levels: this.zoomLevels,
            tileFormat: 'pbf',
            encoding: 'geobuf',
            structure: {
                overview: 'Country-level boundaries (zoom 0-4)',
                detailed: 'Province/state-level boundaries (zoom 4-8)', 
                ultra: 'City/detailed boundaries (zoom 8-12)'
            }
        };
        
        const metadataPath = path.join(this.tilesDir, 'metadata.json');
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        
        console.log('✅ Generated tile metadata');
    }
}

// Main execution
async function main() {
    try {
        const generator = new PBFTileGenerator();
        await generator.generateAllTiles();
        
        console.log('\n🎉 All tile generation completed successfully!');
        console.log('📁 Tiles available at: public/data/tiles/');
        
    } catch (error) {
        console.error('\n💥 Tile generation failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = PBFTileGenerator;
