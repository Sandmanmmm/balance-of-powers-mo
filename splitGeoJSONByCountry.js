#!/usr/bin/env node

/**
 * splitGeoJSONByCountry.js
 * 
 * Script to split a large GeoJSON file containing multiple countries
 * into separate files per country, organized by detail level.
 * 
 * Usage:
 *   node splitGeoJSONByCountry.js input.geojson overview
 *   node splitGeoJSONByCountry.js world-detailed.geojson detailed
 *   node splitGeoJSONByCountry.js world-ultra.geojson ultra
 */

const fs = require('fs');
const path = require('path');

// Comprehensive country name to ISO_A3 mapping
const COUNTRY_CODE_MAP = {
  // North America
  'United States': 'USA',
  'United States of America': 'USA',
  'Canada': 'CAN',
  'Mexico': 'MEX',
  
  // Caribbean and Central America  
  'Cuba': 'CUB',
  'Jamaica': 'JAM',
  'Haiti': 'HTI',
  'Dominican Republic': 'DOM',
  'Bahamas': 'BHS',
  'Barbados': 'BRB',
  'Trinidad and Tobago': 'TTO',
  'Antigua and Barbuda': 'ATG',
  'Saint Lucia': 'LCA',
  'Grenada': 'GRD',
  'Saint Vincent and the Grenadines': 'VCT',
  'Dominica': 'DMA',
  'Saint Kitts and Nevis': 'KNA',
  'Guatemala': 'GTM',
  'Belize': 'BLZ',
  'El Salvador': 'SLV',
  'Honduras': 'HND',
  'Nicaragua': 'NIC',
  'Costa Rica': 'CRI',
  'Panama': 'PAN',
  
  // South America
  'Brazil': 'BRA',
  'Argentina': 'ARG',
  'Chile': 'CHL',
  'Colombia': 'COL',
  'Peru': 'PER',
  'Venezuela': 'VEN',
  'Ecuador': 'ECU',
  'Bolivia': 'BOL',
  'Paraguay': 'PRY',
  'Uruguay': 'URY',
  'Guyana': 'GUY',
  'Suriname': 'SUR',
  
  // Superpowers & Major Powers
  'China': 'CHN',
  'People\'s Republic of China': 'CHN',
  'India': 'IND',
  'Russia': 'RUS',
  'Russian Federation': 'RUS',
  'Germany': 'DEU',
  'France': 'FRA',
  'United Kingdom': 'GBR',
  'Japan': 'JPN',
  'Australia': 'AUS',
  'Italy': 'ITA',
  'Spain': 'ESP',
  
  // Europe West
  'Netherlands': 'NLD',
  'Belgium': 'BEL',
  'Switzerland': 'CHE',
  'Austria': 'AUT',
  'Portugal': 'PRT',
  'Ireland': 'IRL',
  'Luxembourg': 'LUX',
  'Denmark': 'DNK',
  'Sweden': 'SWE',
  'Norway': 'NOR',
  'Finland': 'FIN',
  'Iceland': 'ISL',
  
  // Europe East
  'Ukraine': 'UKR',
  'Poland': 'POL',
  'Romania': 'ROU',
  'Czech Republic': 'CZE',
  'Czechia': 'CZE',
  'Hungary': 'HUN',
  'Slovakia': 'SVK',
  'Bulgaria': 'BGR',
  'Croatia': 'HRV',
  'Serbia': 'SRB',
  'Slovenia': 'SVN',
  'Bosnia and Herzegovina': 'BIH',
  'Montenegro': 'MNE',
  'North Macedonia': 'MKD',
  'Macedonia': 'MKD',
  'Albania': 'ALB',
  'Belarus': 'BLR',
  'Lithuania': 'LTU',
  'Latvia': 'LVA',
  'Estonia': 'EST',
  'Moldova': 'MDA',
  
  // Middle East & North Africa
  'Turkey': 'TUR',
  'Iran': 'IRN',
  'Iraq': 'IRQ',
  'Syria': 'SYR',
  'Jordan': 'JOR',
  'Lebanon': 'LBN',
  'Israel': 'ISR',
  'Palestine': 'PSE',
  'Saudi Arabia': 'SAU',
  'United Arab Emirates': 'ARE',
  'Kuwait': 'KWT',
  'Qatar': 'QAT',
  'Bahrain': 'BHR',
  'Oman': 'OMN',
  'Yemen': 'YEM',
  'Egypt': 'EGY',
  'Libya': 'LBY',
  'Tunisia': 'TUN',
  'Algeria': 'DZA',
  'Morocco': 'MAR',
  'Sudan': 'SDN',
  
  // South Asia
  'Pakistan': 'PAK',
  'Bangladesh': 'BGD',
  'Sri Lanka': 'LKA',
  'Nepal': 'NPL',
  'Bhutan': 'BTN',
  'Maldives': 'MDV',
  'Afghanistan': 'AFG',
  
  // Southeast Asia
  'Indonesia': 'IDN',
  'Thailand': 'THA',
  'Malaysia': 'MYS',
  'Singapore': 'SGP',
  'Philippines': 'PHL',
  'Vietnam': 'VNM',
  'Myanmar': 'MMR',
  'Cambodia': 'KHM',
  'Laos': 'LAO',
  'Brunei': 'BRN',
  'Timor-Leste': 'TLS',
  
  // Central Asia
  'Kazakhstan': 'KAZ',
  'Uzbekistan': 'UZB',
  'Turkmenistan': 'TKM',
  'Kyrgyzstan': 'KGZ',
  'Tajikistan': 'TJK',
  'Mongolia': 'MNG',
  
  // Africa
  'South Africa': 'ZAF',
  'Nigeria': 'NGA',
  'Kenya': 'KEN',
  'Ethiopia': 'ETH',
  'Ghana': 'GHA',
  'Tanzania': 'TZA',
  'Uganda': 'UGA',
  'Mozambique': 'MOZ',
  'Madagascar': 'MDG',
  'Cameroon': 'CMR',
  'Angola': 'AGO',
  'Mali': 'MLI',
  'Burkina Faso': 'BFA',
  'Niger': 'NER',
  'Malawi': 'MWI',
  'Zambia': 'ZMB',
  'Senegal': 'SEN',
  'Somalia': 'SOM',
  'Chad': 'TCD',
  'Guinea': 'GIN',
  'Rwanda': 'RWA',
  'Benin': 'BEN',
  'Burundi': 'BDI',
  'South Sudan': 'SSD',
  'Togo': 'TGO',
  'Sierra Leone': 'SLE',
  'Liberia': 'LBR',
  'Mauritania': 'MRT',
  'Eritrea': 'ERI',
  'Gambia': 'GMB',
  'Botswana': 'BWA',
  'Gabon': 'GAB',
  'Lesotho': 'LSO',
  'Guinea-Bissau': 'GNB',
  'Equatorial Guinea': 'GNQ',
  'Mauritius': 'MUS',
  'Eswatini': 'SWZ',
  'Swaziland': 'SWZ',
  'Djibouti': 'DJI',
  'Comoros': 'COM',
  'Cape Verde': 'CPV',
  'Sao Tome and Principe': 'STP',
  'Seychelles': 'SYC',
  
  // Oceania
  'New Zealand': 'NZL',
  'Papua New Guinea': 'PNG',
  'Fiji': 'FJI',
  'Solomon Islands': 'SLB',
  'Vanuatu': 'VUT',
  'Samoa': 'WSM',
  'Micronesia': 'FSM',
  'Tonga': 'TON',
  'Kiribati': 'KIR',
  'Palau': 'PLW',
  'Marshall Islands': 'MHL',
  'Tuvalu': 'TUV',
  'Nauru': 'NRU'
};

function getCountryCode(feature) {
  // Try different property names for country identification
  const countryNames = [
    feature.properties?.ISO_A3,
    feature.properties?.ADM0_A3,
    feature.properties?.SOV_A3,
    feature.properties?.NAME,
    feature.properties?.NAME_EN,
    feature.properties?.ADMIN,
    feature.properties?.SOVEREIGNT,
    feature.properties?.country,
    feature.properties?.name
  ].filter(Boolean);

  // If we have a direct ISO_A3 code, use it
  if (feature.properties?.ISO_A3 && feature.properties.ISO_A3.length === 3) {
    return feature.properties.ISO_A3;
  }

  // Otherwise, try to map country names to ISO codes
  for (const countryName of countryNames) {
    if (COUNTRY_CODE_MAP[countryName]) {
      return COUNTRY_CODE_MAP[countryName];
    }
  }

  // Fallback: try partial matching for common variations
  for (const countryName of countryNames) {
    for (const [name, code] of Object.entries(COUNTRY_CODE_MAP)) {
      if (name.toLowerCase().includes(countryName.toLowerCase()) || 
          countryName.toLowerCase().includes(name.toLowerCase())) {
        return code;
      }
    }
  }

  // Final fallback: return the first available name property
  return countryNames[0] || 'UNK';
}

function splitGeoJSONByCountry(inputFile, detailLevel) {
  console.log(`📂 Processing: ${inputFile} (${detailLevel} detail level)`);
  
  // Validate input parameters
  if (!inputFile || !detailLevel) {
    console.error('❌ Usage: node splitGeoJSONByCountry.js <input.geojson> <detail-level>');
    console.error('   Detail levels: overview, detailed, ultra');
    process.exit(1);
  }

  if (!['overview', 'detailed', 'ultra'].includes(detailLevel)) {
    console.error('❌ Invalid detail level. Must be: overview, detailed, or ultra');
    process.exit(1);
  }

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    // Read and parse the input GeoJSON
    console.log('📖 Reading input file...');
    const inputData = fs.readFileSync(inputFile, 'utf8');
    const geoJSON = JSON.parse(inputData);

    if (!geoJSON || geoJSON.type !== 'FeatureCollection' || !Array.isArray(geoJSON.features)) {
      throw new Error('Invalid GeoJSON format - expected FeatureCollection with features array');
    }

    console.log(`📊 Found ${geoJSON.features.length} features in input file`);

    // Create output directory structure
    const outputDir = `data/boundaries/${detailLevel}`;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created directory: ${outputDir}`);
    }

    // Group features by country
    const countriesMap = new Map();
    const unknownFeatures = [];
    
    for (const feature of geoJSON.features) {
      const countryCode = getCountryCode(feature);
      
      if (countryCode === 'UNK' || countryCode.length !== 3) {
        unknownFeatures.push(feature);
        console.warn(`⚠️ Unknown country for feature:`, {
          name: feature.properties?.NAME || feature.properties?.name,
          properties: Object.keys(feature.properties || {})
        });
        continue;
      }

      if (!countriesMap.has(countryCode)) {
        countriesMap.set(countryCode, []);
      }
      countriesMap.get(countryCode).push(feature);
    }

    console.log(`🌍 Found ${countriesMap.size} countries`);
    console.log(`❓ ${unknownFeatures.length} features could not be mapped to countries`);

    // Write separate files for each country
    let filesWritten = 0;
    const stats = {
      totalCountries: countriesMap.size,
      totalFeatures: 0,
      largestCountry: { code: '', count: 0 },
      smallestCountry: { code: '', count: Infinity }
    };

    for (const [countryCode, features] of countriesMap) {
      const countryGeoJSON = {
        type: "FeatureCollection",
        metadata: {
          country: countryCode,
          detailLevel: detailLevel,
          featureCount: features.length,
          generatedAt: new Date().toISOString(),
          source: path.basename(inputFile)
        },
        features: features
      };

      const outputFile = path.join(outputDir, `${countryCode}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(countryGeoJSON, null, 2));
      
      console.log(`✅ ${countryCode}: ${features.length} features → ${outputFile}`);
      filesWritten++;

      // Update stats
      stats.totalFeatures += features.length;
      if (features.length > stats.largestCountry.count) {
        stats.largestCountry = { code: countryCode, count: features.length };
      }
      if (features.length < stats.smallestCountry.count) {
        stats.smallestCountry = { code: countryCode, count: features.length };
      }
    }

    // Write unknown features to a separate file for manual inspection
    if (unknownFeatures.length > 0) {
      const unknownGeoJSON = {
        type: "FeatureCollection",
        metadata: {
          country: "UNKNOWN",
          detailLevel: detailLevel,
          featureCount: unknownFeatures.length,
          generatedAt: new Date().toISOString(),
          source: path.basename(inputFile),
          note: "Features that could not be mapped to ISO_A3 country codes"
        },
        features: unknownFeatures
      };

      const unknownFile = path.join(outputDir, `UNKNOWN.json`);
      fs.writeFileSync(unknownFile, JSON.stringify(unknownGeoJSON, null, 2));
      console.log(`❓ UNKNOWN: ${unknownFeatures.length} features → ${unknownFile}`);
    }

    // Generate summary report
    const summaryFile = path.join(outputDir, `_SUMMARY.json`);
    const summary = {
      inputFile: path.basename(inputFile),
      detailLevel: detailLevel,
      processedAt: new Date().toISOString(),
      statistics: {
        ...stats,
        filesGenerated: filesWritten,
        unknownFeatures: unknownFeatures.length
      },
      countries: Array.from(countriesMap.keys()).sort(),
      sampleCountries: Array.from(countriesMap.entries())
        .slice(0, 10)
        .map(([code, features]) => ({ code, featureCount: features.length }))
    };

    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    // Final report
    console.log('\n🎉 PROCESSING COMPLETE!');
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`📊 Statistics:`);
    console.log(`   • ${stats.totalCountries} countries processed`);
    console.log(`   • ${stats.totalFeatures} total features`);
    console.log(`   • ${filesWritten} country files generated`);
    console.log(`   • ${unknownFeatures.length} unknown features`);
    console.log(`   • Largest country: ${stats.largestCountry.code} (${stats.largestCountry.count} features)`);
    console.log(`   • Smallest country: ${stats.smallestCountry.code} (${stats.smallestCountry.count} features)`);
    console.log(`📄 Summary report: ${summaryFile}`);

    if (unknownFeatures.length > 0) {
      console.log(`\n⚠️ ${unknownFeatures.length} features could not be mapped to countries.`);
      console.log(`   Check ${outputDir}/UNKNOWN.json for manual inspection.`);
    }

  } catch (error) {
    console.error('❌ Error processing GeoJSON:', error.message);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const [,, inputFile, detailLevel] = process.argv;
  splitGeoJSONByCountry(inputFile, detailLevel);
}

module.exports = { splitGeoJSONByCountry, COUNTRY_CODE_MAP };