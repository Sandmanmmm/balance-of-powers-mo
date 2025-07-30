#!/usr/bin/env node

/**
 * Script to generate detailed and ultra detail levels from overview GeoJSON files
 * This simulates what would happen with real geographic data at different scales
 */

const fs = require('fs');
const path = require('path');

// Regions to process
const regions = ['usa', 'canada', 'mexico', 'china', 'india', 'russia', 'europe_west', 'europe_east'];
const publicDir = '/workspaces/spark-template/public/data/boundaries/provinces';

function interpolatePoints(coord1, coord2, steps = 3) {
  const points = [];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const lon = coord1[0] + (coord2[0] - coord1[0]) * t;
    const lat = coord1[1] + (coord2[1] - coord1[1]) * t;
    points.push([lon, lat]);
  }
  return points;
}

function addDetailToCoordinates(coordinates, detailLevel) {
  if (detailLevel === 'overview') {
    return coordinates;
  }
  
  const steps = detailLevel === 'detailed' ? 2 : 4; // More interpolation for ultra
  const precision = detailLevel === 'detailed' ? 4 : 6; // More decimal places for ultra
  
  const detailedCoords = [];
  
  for (let i = 0; i < coordinates.length; i++) {
    const currentCoord = coordinates[i];
    detailedCoords.push([
      Number(currentCoord[0].toFixed(precision)),
      Number(currentCoord[1].toFixed(precision))
    ]);
    
    // Add interpolated points between this and next coordinate
    if (i < coordinates.length - 1) {
      const nextCoord = coordinates[i + 1];
      const interpolated = interpolatePoints(currentCoord, nextCoord, steps);
      interpolated.forEach(coord => {
        detailedCoords.push([
          Number(coord[0].toFixed(precision)),
          Number(coord[1].toFixed(precision))
        ]);
      });
    }
  }
  
  return detailedCoords;
}

function addDetailToGeometry(geometry, detailLevel) {
  if (geometry.type === 'Polygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map(ring => 
        addDetailToCoordinates(ring, detailLevel)
      )
    };
  } else if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map(polygon =>
        polygon.map(ring => addDetailToCoordinates(ring, detailLevel))
      )
    };
  }
  return geometry;
}

function generateDetailLevel(overviewData, detailLevel) {
  return {
    ...overviewData,
    features: overviewData.features.map(feature => ({
      ...feature,
      geometry: addDetailToGeometry(feature.geometry, detailLevel)
    }))
  };
}

// Process each region
regions.forEach(region => {
  const overviewPath = path.join(publicDir, region, 'overview.json');
  
  if (fs.existsSync(overviewPath)) {
    try {
      const overviewData = JSON.parse(fs.readFileSync(overviewPath, 'utf8'));
      
      // Generate detailed level
      const detailedData = generateDetailLevel(overviewData, 'detailed');
      const detailedPath = path.join(publicDir, region, 'detailed.json');
      fs.writeFileSync(detailedPath, JSON.stringify(detailedData, null, 2));
      
      // Generate ultra level
      const ultraData = generateDetailLevel(overviewData, 'ultra');
      const ultraPath = path.join(publicDir, region, 'ultra.json');
      fs.writeFileSync(ultraPath, JSON.stringify(ultraData, null, 2));
      
      console.log(`✅ Generated detail levels for ${region}`);
      console.log(`   Overview: ${overviewData.features.length} features`);
      console.log(`   Detailed: ${detailedData.features.length} features`);
      console.log(`   Ultra: ${ultraData.features.length} features`);
      
    } catch (error) {
      console.error(`❌ Error processing ${region}:`, error.message);
    }
  } else {
    console.warn(`⚠️ Overview file not found for ${region}: ${overviewPath}`);
  }
});

console.log('🎉 Detail level generation complete!');