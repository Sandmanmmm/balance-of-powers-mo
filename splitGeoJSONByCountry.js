#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Splits a GeoJSON file by country into separate files
 * Usage: node splitGeoJSONByCountry.js <input-file> <detail-level>
 * Example: node splitGeoJSONByCountry.js world-countries.geojson overview
 */

function splitGeoJSONByCountry(inputFile, detailLevel) {
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  console.log(`🌍 Processing ${inputFile} for ${detailLevel} detail level...`);

  try {
    // Read and parse the input GeoJSON
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const geoJson = JSON.parse(rawData);

    if (!geoJson.features || !Array.isArray(geoJson.features)) {
      console.error('❌ Invalid GeoJSON: No features array found');
      process.exit(1);
    }

    // Create output directory
    const outputDir = path.join('data', 'boundaries', detailLevel);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created directory: ${outputDir}`);
    }

    let processedCount = 0;
    let errorCount = 0;
    const countryStats = {};

    // Process each feature
    geoJson.features.forEach((feature, index) => {
      try {
        // Extract country identifier (try multiple property names)
        const countryCode = feature.properties.ISO_A3 || 
                           feature.properties.iso_a3 || 
                           feature.properties.ISO3 ||
                           feature.properties.ADM0_A3 ||
                           feature.properties.SOV_A3;

        if (!countryCode || countryCode === '-99' || countryCode === 'null') {
          console.warn(`⚠️ Feature ${index}: No valid country code found`);
          errorCount++;
          return;
        }

        // Create individual GeoJSON for this country
        const countryGeoJSON = {
          type: 'FeatureCollection',
          metadata: {
            name: feature.properties.NAME || feature.properties.name || countryCode,
            iso_a3: countryCode,
            detailLevel: detailLevel,
            generatedAt: new Date().toISOString(),
            source: path.basename(inputFile)
          },
          features: [feature]
        };

        // Write to file
        const outputFile = path.join(outputDir, `${countryCode}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(countryGeoJSON, null, 2));

        // Track stats
        if (!countryStats[countryCode]) {
          countryStats[countryCode] = {
            name: feature.properties.NAME || feature.properties.name || countryCode,
            features: 0,
            fileSize: 0
          };
        }
        countryStats[countryCode].features++;
        countryStats[countryCode].fileSize = fs.statSync(outputFile).size;

        processedCount++;

        if (processedCount % 50 === 0) {
          console.log(`⏳ Processed ${processedCount} countries...`);
        }

      } catch (error) {
        console.error(`❌ Error processing feature ${index}:`, error.message);
        errorCount++;
      }
    });

    // Generate summary report
    const summaryFile = path.join(outputDir, '_summary.json');
    const summary = {
      detailLevel,
      generatedAt: new Date().toISOString(),
      sourceFile: path.basename(inputFile),
      totalCountries: processedCount,
      errors: errorCount,
      countries: countryStats
    };

    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    // Print results
    console.log(`\n✅ Processing complete!`);
    console.log(`📊 Results:`);
    console.log(`   - Countries processed: ${processedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Output directory: ${outputDir}`);
    console.log(`   - Summary file: ${summaryFile}`);

    // Show sample countries
    const sampleCountries = Object.entries(countryStats).slice(0, 5);
    if (sampleCountries.length > 0) {
      console.log(`\n📋 Sample countries:`);
      sampleCountries.forEach(([code, stats]) => {
        console.log(`   - ${code}: ${stats.name} (${(stats.fileSize / 1024).toFixed(1)}KB)`);
      });
    }

  } catch (error) {
    console.error(`❌ Fatal error:`, error.message);
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log(`
Usage: node splitGeoJSONByCountry.js <input-file> <detail-level>

Examples:
  node splitGeoJSONByCountry.js world-110m.geojson overview
  node splitGeoJSONByCountry.js world-10m.geojson detailed  
  node splitGeoJSONByCountry.js world-1m.geojson ultra

Detail levels:
  - overview: Low resolution for world view
  - detailed: Medium resolution for regional view
  - ultra: High resolution for province/state view
`);
    process.exit(1);
  }

  const [inputFile, detailLevel] = args;
  
  if (!['overview', 'detailed', 'ultra'].includes(detailLevel)) {
    console.error('❌ Detail level must be: overview, detailed, or ultra');
    process.exit(1);
  }

  splitGeoJSONByCountry(inputFile, detailLevel);
}

module.exports = { splitGeoJSONByCountry };