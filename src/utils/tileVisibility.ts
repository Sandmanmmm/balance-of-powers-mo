import type { DetailLevel } from '../types/geo';

/**
 * Calculate detail level based on zoom level
 * @param zoomLevel - Current zoom level (1.0 to 10.0)
 * @param currentLevel - Current detail level for hysteresis
 * @returns The appropriate detail level
 */
export function getDetailLevelFromZoom(zoomLevel: number, currentLevel: DetailLevel): DetailLevel {
  // Add hysteresis to prevent oscillation
  const hysteresis = 0.2;
  
  // Base zoom thresholds
  const lowThreshold = 1.5;
  const overviewThreshold = 2.5;
  const detailedThreshold = 4.0;
  
  // Apply hysteresis based on current level
  let actualLowThreshold = lowThreshold;
  let actualOverviewThreshold = overviewThreshold;
  let actualDetailedThreshold = detailedThreshold;
  
  // Adjust thresholds based on current level to add hysteresis
  if (currentLevel === 'low') {
    actualLowThreshold += hysteresis;
  } else if (currentLevel === 'overview') {
    actualLowThreshold -= hysteresis;
    actualOverviewThreshold += hysteresis;
  } else if (currentLevel === 'detailed') {
    actualOverviewThreshold -= hysteresis;
    actualDetailedThreshold += hysteresis;
  } else if (currentLevel === 'ultra') {
    actualDetailedThreshold -= hysteresis;
  }
  
  // Determine detail level
  if (zoomLevel < actualLowThreshold) {
    return 'low';
  } else if (zoomLevel < actualOverviewThreshold) {
    return 'overview';
  } else if (zoomLevel < actualDetailedThreshold) {
    return 'detailed';
  } else {
    return 'ultra';
  }
}

/**
 * Get visible tiles with level of detail for a given viewport
 * @param center - Center point {lat, lon}
 * @param zoom - Zoom level
 * @param viewRange - Number of tiles in each direction (default: 5 for 5x5 grid)
 * @param currentDetailLevel - Current detail level (optional)
 * @returns Array of tile keys
 */
export function getVisibleTilesWithLOD(
  center: { lat: number; lon: number },
  zoom: number,
  viewRange: number = 5,
  currentDetailLevel?: DetailLevel
): string[] {
  // Calculate appropriate detail level based on zoom
  const detailLevel = currentDetailLevel || getDetailLevelFromZoom(zoom, 'overview');
  
  // Calculate tile size in degrees (world is divided into tiles)
  // Higher zoom = smaller tiles for more detail
  const baseTileSize = 10; // 10 degrees per tile at base zoom
  const tileSize = baseTileSize / Math.max(1, zoom / 2);
  
  // Calculate tile coordinates for center
  const centerTileX = Math.floor(center.lon / tileSize) * tileSize;
  const centerTileY = Math.floor(center.lat / tileSize) * tileSize;
  
  const tiles: string[] = [];
  
  // Generate tiles in a grid around the center
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
      tiles.push(tileKey);
    }
  }
  
  return tiles;
}

/**
 * Filter tiles for culling based on distance from viewport center
 * @param tileIds - Array of tile IDs to filter
 * @param center - Viewport center {x: lon, y: lat}
 * @param zoom - Current zoom level
 * @param maxDistance - Maximum distance in tile units (default: 3)
 * @returns Object with keep and cull arrays
 */
export function filterTilesForCulling(
  tileIds: string[],
  center: { x: number; y: number },
  zoom: number,
  maxDistance: number = 3
): { keep: string[]; cull: string[] } {
  const keep: string[] = [];
  const cull: string[] = [];
  
  tileIds.forEach(tileId => {
    try {
      // Parse tile key to get coordinates
      const parts = tileId.split('_');
      if (parts.length !== 3) {
        cull.push(tileId);
        return;
      }
      
      const [, latStr, lonStr] = parts;
      const tileLat = parseInt(latStr, 10);
      const tileLon = parseInt(lonStr, 10);
      
      if (isNaN(tileLat) || isNaN(tileLon)) {
        cull.push(tileId);
        return;
      }
      
      // Calculate distance from center
      const deltaLat = Math.abs(tileLat - center.y);
      const deltaLon = Math.abs(tileLon - center.x);
      const distance = Math.max(deltaLat / 10, deltaLon / 10); // Convert to tile units
      
      if (distance > maxDistance) {
        cull.push(tileId);
      } else {
        keep.push(tileId);
      }
    } catch (error) {
      // If parsing fails, cull the tile
      cull.push(tileId);
    }
  });
  
  return { keep, cull };
}

/**
 * Calculate tile bounds for a given tile key
 * @param tileKey - Tile key like "detailed_40_-80"
 * @returns Object with bounds {north, south, east, west} or null if invalid
 */
export function getTileBounds(tileKey: string): { north: number; south: number; east: number; west: number } | null {
  try {
    const parts = tileKey.split('_');
    if (parts.length !== 3) return null;
    
    const [, latStr, lonStr] = parts;
    const lat = parseInt(latStr, 10);
    const lon = parseInt(lonStr, 10);
    
    if (isNaN(lat) || isNaN(lon)) return null;
    
    // Assume 10x10 degree tiles
    const tileSize = 10;
    
    return {
      north: lat + tileSize,
      south: lat,
      east: lon + tileSize,
      west: lon
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if a point is within a tile's bounds
 * @param point - Point {lat, lon}
 * @param tileKey - Tile key
 * @returns Boolean indicating if point is within tile
 */
export function isPointInTile(point: { lat: number; lon: number }, tileKey: string): boolean {
  const bounds = getTileBounds(tileKey);
  if (!bounds) return false;
  
  return (
    point.lat >= bounds.south &&
    point.lat < bounds.north &&
    point.lon >= bounds.west &&
    point.lon < bounds.east
  );
}
