#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Node.js Script: splitGeoJSONByCountry.js
 * 
 * Splits a large GeoJSON file into individual country files organized by detail level.
 * 
 * Usage:
 *   node splitGeoJSONByCountry.js <input-file> <detail-level>
 * 
 * Example:
 *   node splitGeoJSONByCountry.js world-countries-overview.geojson overview
 *   node splitGeoJSONByCountry.js world-countries-detailed.geojson detailed
 *   node splitGeoJSONByCountry.js world-countries-ultra.geojson ultra
 */

function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Usage: node splitGeoJSONByCountry.js <input-file> <detail-level>');
    console.error('');
    console.error('Examples:');
    console.error('  node splitGeoJSONByCountry.js overview.geojson overview');
    console.error('  node splitGeoJSONByCountry.js detailed.geojson detailed');
    console.error('  node splitGeoJSONByCountry.js ultra.geojson ultra');
    process.exit(1);
  }

  const [inputFile, detailLevel] = args;

  // Validate detail level
  const validDetailLevels = ['overview', 'detailed', 'ultra'];
  if (!validDetailLevels.includes(detailLevel)) {
    console.error(`Error: Detail level must be one of: ${validDetailLevels.join(', ')}`);
    process.exit(1);
  }

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file '${inputFile}' does not exist.`);
    process.exit(1);
  }

  console.log(`🌍 Processing GeoJSON file: ${inputFile}`);
  console.log(`📊 Detail level: ${detailLevel}`);
  console.log('');

  try {
    // Read and parse the input GeoJSON file
    console.log('📖 Reading input file...');
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const geoData = JSON.parse(rawData);

    // Validate GeoJSON structure
    if (!geoData.type || geoData.type !== 'FeatureCollection') {
      console.error('Error: Input file is not a valid GeoJSON FeatureCollection.');
      process.exit(1);
    }

    if (!Array.isArray(geoData.features)) {
      console.error('Error: GeoJSON file does not contain a valid features array.');
      process.exit(1);
    }

    console.log(`✅ Found ${geoData.features.length} features in input file`);

    // Create output directory structure
    const outputDir = path.join('data', 'boundaries', detailLevel);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created directory: ${outputDir}`);
    }

    // Process each feature and group by country
    const countriesMap = new Map();
    let processed = 0;
    let skipped = 0;

    console.log('🔄 Processing features...');

    geoData.features.forEach((feature, index) => {
      try {
        // Extract ISO_A3 country code from feature properties
        const isoCode = extractCountryCode(feature);
        
        if (!isoCode) {
          console.warn(`⚠️  Feature ${index + 1}: No valid ISO_A3 country code found, skipping`);
          skipped++;
          return;
        }

        // Group features by country code
        if (!countriesMap.has(isoCode)) {
          countriesMap.set(isoCode, []);
        }
        
        countriesMap.get(isoCode).push(feature);
        processed++;

        // Progress indicator
        if ((index + 1) % 50 === 0) {
          process.stdout.write(`📊 Processed ${index + 1}/${geoData.features.length} features\r`);
        }

      } catch (error) {
        console.warn(`⚠️  Feature ${index + 1}: Error processing - ${error.message}`);
        skipped++;
      }
    });

    console.log(`\n✅ Processing complete: ${processed} processed, ${skipped} skipped`);
    console.log(`🗺️  Found ${countriesMap.size} unique countries`);

    // Write individual country files
    console.log('\n💾 Writing country files...');
    
    let written = 0;
    const countryList = [];

    for (const [isoCode, features] of countriesMap) {
      try {
        // Create individual country GeoJSON
        const countryGeoJSON = {
          type: 'FeatureCollection',
          features: features,
          metadata: {
            country: isoCode,
            detailLevel: detailLevel,
            featureCount: features.length,
            generatedAt: new Date().toISOString(),
            generatedBy: 'splitGeoJSONByCountry.js'
          }
        };

        // Write to file
        const outputFile = path.join(outputDir, `${isoCode}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(countryGeoJSON, null, 2));
        
        countryList.push({
          code: isoCode,
          features: features.length,
          file: outputFile
        });

        written++;
        
        // Progress indicator
        if (written % 10 === 0) {
          process.stdout.write(`💾 Written ${written}/${countriesMap.size} countries\r`);
        }

      } catch (error) {
        console.error(`❌ Error writing file for ${isoCode}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Successfully written ${written} country files to ${outputDir}`);

    // Generate summary report
    generateSummaryReport(countryList, detailLevel, outputDir);

    console.log('\n✨ Split operation completed successfully!');

  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Extract country code from GeoJSON feature properties
 * Tries multiple common property names for ISO_A3 codes
 */
function extractCountryCode(feature) {
  if (!feature.properties) {
    return null;
  }

  const props = feature.properties;
  
  // Try common property names for ISO_A3 country codes
  const possibleFields = [
    'ISO_A3',
    'iso_a3', 
    'ISO3',
    'iso3',
    'ADM0_A3',
    'adm0_a3',
    'SOV_A3',
    'sov_a3',
    'COUNTRY_CODE',
    'country_code',
    'code',
    'CODE'
  ];

  for (const field of possibleFields) {
    if (props[field] && typeof props[field] === 'string') {
      const code = props[field].trim().toUpperCase();
      
      // Validate ISO_A3 format (3 letters)
      if (/^[A-Z]{3}$/.test(code) && code !== 'UNK' && code !== 'N/A') {
        return code;
      }
    }
  }

  // Fallback: try to extract from NAME field if available
  if (props.NAME || props.name) {
    const name = (props.NAME || props.name).toString().trim();
    const isoCode = getISOCodeFromName(name);
    if (isoCode) {
      return isoCode;
    }
  }

  return null;
}

/**
 * Basic mapping of common country names to ISO_A3 codes
 * This is a fallback for cases where ISO_A3 is not directly available
 */
function getISOCodeFromName(name) {
  const nameToISO = {
    'United States': 'USA',
    'United States of America': 'USA',
    'Canada': 'CAN',
    'Mexico': 'MEX',
    'France': 'FRA',
    'Germany': 'DEU',
    'United Kingdom': 'GBR',
    'Great Britain': 'GBR',
    'China': 'CHN',
    'Russia': 'RUS',
    'Russian Federation': 'RUS',
    'India': 'IND',
    'Brazil': 'BRA',
    'Australia': 'AUS',
    'Japan': 'JPN',
    'South Africa': 'ZAF'
  };

  return nameToISO[name] || null;
}

/**
 * Generate a summary report of the split operation
 */
function generateSummaryReport(countryList, detailLevel, outputDir) {
  console.log('\n📋 Generating summary report...');

  // Sort countries by feature count (descending)
  countryList.sort((a, b) => b.features - a.features);

  const reportFile = path.join(outputDir, `_split_summary_${detailLevel}.txt`);
  
  let report = `GeoJSON Split Summary Report\n`;
  report += `================================\n\n`;
  report += `Detail Level: ${detailLevel}\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Total Countries: ${countryList.length}\n`;
  report += `Total Features: ${countryList.reduce((sum, c) => sum + c.features, 0)}\n\n`;
  
  report += `Countries by Feature Count:\n`;
  report += `---------------------------\n`;
  
  countryList.forEach(country => {
    report += `${country.code}: ${country.features} features\n`;
  });

  report += `\nOutput Files:\n`;
  report += `-------------\n`;
  countryList.forEach(country => {
    report += `${path.basename(country.file)}\n`;
  });

  fs.writeFileSync(reportFile, report);
  console.log(`📊 Summary report written to: ${reportFile}`);

  // Also show top countries in console
  console.log('\n🏆 Top countries by feature count:');
  countryList.slice(0, 10).forEach((country, index) => {
    console.log(`  ${index + 1}. ${country.code}: ${country.features} features`);
  });
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  extractCountryCode,
  getISOCodeFromName
};