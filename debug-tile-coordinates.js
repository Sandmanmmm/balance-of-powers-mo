// Debug script to understand the tile coordinate mismatch

// Simulating the getVisibleTilesWithLOD function
function getVisibleTilesWithLOD(center, zoom, viewRange = 5) {
  const detailLevel = 'overview';
  
  // Calculate tile size in degrees
  const baseTileSize = 10;
  const tileSize = baseTileSize / Math.max(1, zoom / 2);
  
  console.log(`Center: lat=${center.lat}, lon=${center.lon}`);
  console.log(`Zoom: ${zoom}, Tile Size: ${tileSize} degrees`);
  
  // Calculate tile coordinates for center
  const centerTileX = Math.floor(center.lon / tileSize) * tileSize;
  const centerTileY = Math.floor(center.lat / tileSize) * tileSize;
  
  console.log(`Center Tile: X=${centerTileX}, Y=${centerTileY}`);
  
  const tiles = [];
  const halfRange = Math.floor(viewRange / 2);
  
  for (let x = -halfRange; x <= halfRange; x++) {
    for (let y = -halfRange; y <= halfRange; y++) {
      const tileX = centerTileX + (x * tileSize);
      const tileY = centerTileY + (y * tileSize);
      
      // Clamp coordinates to valid world bounds
      const clampedX = Math.max(-180, Math.min(170, tileX));
      const clampedY = Math.max(-90, Math.min(80, tileY));
      
      // Create tile key in format "detailLevel_lat_lon"
      const tileKey = `${detailLevel}_${clampedY}_${clampedX}`;
      tiles.push({
        tileKey,
        lat: clampedY,
        lon: clampedX,
        gridX: x,
        gridY: y
      });
    }
  }
  
  return tiles;
}

// Test with different center points and zoom levels
console.log('=== Testing Tile Generation ===');

// Test 1: Center of USA
const usaCenter = { lat: 39.8283, lon: -98.5795 };
const zoom2 = 2.0;
console.log('\n--- USA Center, Zoom 2.0 ---');
const usaTiles = getVisibleTilesWithLOD(usaCenter, zoom2);
usaTiles.forEach(tile => {
  console.log(`Tile: ${tile.tileKey} (Grid: ${tile.gridX}, ${tile.gridY})`);
});

// Test 2: Origin point
const origin = { lat: 0, lon: 0 };
console.log('\n--- Origin (0,0), Zoom 2.0 ---');
const originTiles = getVisibleTilesWithLOD(origin, zoom2);
originTiles.forEach(tile => {
  console.log(`Tile: ${tile.tileKey} (Grid: ${tile.gridX}, ${tile.gridY})`);
});

// Now let's see what our generated tiles actually are
console.log('\n=== Our Generated Tile Structure ===');
console.log('Path format: /data/tiles/overview/z/x/COUNTRY_y.pbf');
console.log('Available tiles in overview/0/0/:');
console.log('- AFG_0.pbf, USA_0.pbf, CAN_0.pbf, etc.');
console.log('- This means: z=0, x=0, y=0 for all countries');

// The issue: We need to map lat/lon coordinates to z/x/y tile indices
// Our generated tiles seem to use a different coordinate system
console.log('\n=== Coordinate Mapping Analysis ===');
console.log('Generated tiles are at z=0, x=0, y=0');
console.log('This suggests a single tile per country at overview level');
console.log('We need to map world coordinates to tile indices differently');
