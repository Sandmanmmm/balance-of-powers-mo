#!/usr/bin/env node

/**
 * generateMissingBoundaries.js
 * 
 * Generate placeholder boundary files for countries that have province data
 * but no boundary files yet.
 */

const fs = require('fs');
const path = require('path');

// Simple boundary generator for countries missing boundary data
const generateCountryBoundary = (countryCode, countryName, center = [0, 0], size = 5) => {
  const [centerLon, centerLat] = center;
  
  // Generate a simple rectangular boundary as placeholder
  const boundary = {
    type: "FeatureCollection",
    metadata: {
      country: countryCode,
      detailLevel: "overview",
      featureCount: 1,
      generatedAt: new Date().toISOString(),
      source: "generated_placeholder",
      note: "This is a placeholder boundary - replace with real geographic data"
    },
    features: [
      {
        type: "Feature",
        id: countryCode,
        properties: {
          id: countryCode,
          name: countryName,
          country: countryName,
          iso_a3: countryCode,
          type: "country_boundary"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [centerLon - size, centerLat - size],
            [centerLon + size, centerLat - size],
            [centerLon + size, centerLat + size],
            [centerLon - size, centerLat + size],
            [centerLon - size, centerLat - size]
          ]]
        }
      }
    ]
  };

  return boundary;
};

// Country positions (approximate centers)
const countryPositions = {
  'NLD': { name: 'Netherlands', center: [5.2913, 52.1326], size: 2 },
  'BEL': { name: 'Belgium', center: [4.4699, 50.5039], size: 1.5 },
  'CHE': { name: 'Switzerland', center: [8.2275, 46.8182], size: 1.5 },
  'AUT': { name: 'Austria', center: [14.5501, 47.5162], size: 2 },
  'PRT': { name: 'Portugal', center: [-8.2245, 39.3999], size: 2 },
  'IRL': { name: 'Ireland', center: [-8.2439, 53.4129], size: 2 },
  'DNK': { name: 'Denmark', center: [9.5018, 56.2639], size: 2 },
  'SWE': { name: 'Sweden', center: [18.6435, 60.1282], size: 4 },
  'NOR': { name: 'Norway', center: [10.7522, 59.9139], size: 4 },
  'FIN': { name: 'Finland', center: [25.7482, 61.9241], size: 4 },
  'UKR': { name: 'Ukraine', center: [31.1656, 49.4871], size: 6 },
  'POL': { name: 'Poland', center: [19.1343, 51.9194], size: 3 },
  'ROU': { name: 'Romania', center: [24.9668, 45.9432], size: 3 },
  'CZE': { name: 'Czech Republic', center: [15.4729, 49.8175], size: 2 },
  'HUN': { name: 'Hungary', center: [19.5033, 47.1625], size: 2 },
  'IDN': { name: 'Indonesia', center: [113.9213, -0.7893], size: 8 },
  'THA': { name: 'Thailand', center: [100.9925, 15.8700], size: 4 },
  'MYS': { name: 'Malaysia', center: [101.9758, 4.2105], size: 4 },
  'VNM': { name: 'Vietnam', center: [108.2772, 14.0583], size: 4 },
  'PHL': { name: 'Philippines', center: [121.7740, 12.8797], size: 4 },
  'SGP': { name: 'Singapore', center: [103.8198, 1.3521], size: 0.1 },
  'PAK': { name: 'Pakistan', center: [69.3451, 30.3753], size: 5 },
  'BGD': { name: 'Bangladesh', center: [90.4125, 23.6850], size: 2 },
  'LKA': { name: 'Sri Lanka', center: [80.7718, 7.8731], size: 1 },
  'IRN': { name: 'Iran', center: [53.6880, 32.4279], size: 6 },
  'IRQ': { name: 'Iraq', center: [43.6793, 33.2232], size: 4 },
  'SAU': { name: 'Saudi Arabia', center: [45.0792, 23.8859], size: 8 },
  'ARE': { name: 'United Arab Emirates', center: [53.8478, 23.4241], size: 1 },
  'NGA': { name: 'Nigeria', center: [8.6753, 9.0820], size: 4 },
  'ZWE': { name: 'Zimbabwe', center: [29.1549, -19.0154], size: 3 },
  'KEN': { name: 'Kenya', center: [37.9062, -0.0236], size: 3 },
  'ETH': { name: 'Ethiopia', center: [40.4897, 9.1450], size: 4 },
  'GHA': { name: 'Ghana', center: [-1.0232, 7.9465], size: 2 },
  'NZL': { name: 'New Zealand', center: [174.8860, -40.9006], size: 4 },
  'CHL': { name: 'Chile', center: [-71.5430, -35.6751], size: 8 },
  'COL': { name: 'Colombia', center: [-74.2973, 4.5709], size: 5 },
  'PER': { name: 'Peru', center: [-75.0152, -9.1900], size: 6 },
  'VEN': { name: 'Venezuela', center: [-66.5897, 6.4238], size: 5 },
  'ECU': { name: 'Ecuador', center: [-78.1834, -1.8312], size: 3 },
  'URY': { name: 'Uruguay', center: [-55.7658, -32.5228], size: 2 }
};

const outputDir = 'public/data/boundaries';

// Create directories for each detail level
['overview', 'detailed', 'ultra'].forEach(level => {
  const dir = path.join(outputDir, level);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('🌍 Generating missing boundary files...\n');

let generatedCount = 0;

for (const [countryCode, info] of Object.entries(countryPositions)) {
  for (const detailLevel of ['overview', 'detailed', 'ultra']) {
    const outputFile = path.join(outputDir, detailLevel, `${countryCode}.json`);
    
    // Only generate if file doesn't exist
    if (!fs.existsSync(outputFile)) {
      const boundary = generateCountryBoundary(countryCode, info.name, info.center, info.size);
      fs.writeFileSync(outputFile, JSON.stringify(boundary, null, 2));
      console.log(`✅ Generated ${countryCode} (${info.name}) - ${detailLevel}`);
      generatedCount++;
    } else {
      console.log(`⏭️ Skipped ${countryCode} (${info.name}) - ${detailLevel} (already exists)`);
    }
  }
}

console.log(`\n🎉 Generated ${generatedCount} boundary files!`);
console.log(`📁 Files saved to: ${outputDir}/[overview|detailed|ultra]/`);

// Also generate a summary of what files now exist
const summaryFiles = {};
['overview', 'detailed', 'ultra'].forEach(level => {
  const dir = path.join(outputDir, level);
  if (fs.existsSync(dir)) {
    summaryFiles[level] = fs.readdirSync(dir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .sort();
  }
});

console.log('\n📊 Available boundary files by detail level:');
Object.entries(summaryFiles).forEach(([level, files]) => {
  console.log(`  ${level}: ${files.length} countries`);
  console.log(`    ${files.join(', ')}`);
});

const summary = {
  generatedAt: new Date().toISOString(),
  totalGenerated: generatedCount,
  availableFiles: summaryFiles,
  note: "Placeholder boundaries generated for missing countries. Replace with real geographic data when available."
};

fs.writeFileSync(path.join(outputDir, '_GENERATED_SUMMARY.json'), JSON.stringify(summary, null, 2));
console.log(`\n📄 Summary saved to: ${path.join(outputDir, '_GENERATED_SUMMARY.json')}`);