// Map projection utilities for converting geographic coordinates to SVG coordinates

export interface ProjectionConfig {
  width: number;
  height: number;
  centerLon: number;
  centerLat: number;
  scale: number;
}

/**
 * Convert longitude/latitude coordinates to SVG x/y coordinates
 * Using a simplified equirectangular projection
 */
export function projectCoordinates(
  lon: number,
  lat: number,
  config: ProjectionConfig
): [number, number] {
  // Convert to radians
  const lonRad = (lon * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const centerLonRad = (config.centerLon * Math.PI) / 180;
  const centerLatRad = (config.centerLat * Math.PI) / 180;

  // Equirectangular projection
  const x = config.width / 2 + (lonRad - centerLonRad) * config.scale;
  const y = config.height / 2 - (latRad - centerLatRad) * config.scale;

  return [x, y];
}

/**
 * Convert an array of longitude/latitude coordinates to SVG path string
 */
export function coordinatesToPath(
  coordinates: number[][],
  config: ProjectionConfig
): string {
  if (!coordinates || coordinates.length === 0) return '';

  const points = coordinates.map(([lon, lat]) => 
    projectCoordinates(lon, lat, config)
  );

  const pathParts = points.map((point, index) => {
    const [x, y] = point;
    return index === 0 ? `M ${x},${y}` : `L ${x},${y}`;
  });

  return pathParts.join(' ') + ' Z';
}

/**
 * Get bounding box of coordinates for auto-fitting the map
 */
export function getCoordinatesBounds(coordinates: number[][]): {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
} {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  coordinates.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  return { minLon, maxLon, minLat, maxLat };
}

/**
 * Calculate optimal projection config to fit all features in view
 */
export function calculateOptimalProjection(
  features: any[],
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 50
): ProjectionConfig {
  // Get all coordinates from all features
  const allCoordinates: number[][] = [];
  
  features.forEach(feature => {
    if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates[0].forEach((coord: number[]) => {
        allCoordinates.push(coord);
      });
    }
  });

  if (allCoordinates.length === 0) {
    // Default world view
    return {
      width: viewportWidth,
      height: viewportHeight,
      centerLon: 0,
      centerLat: 0,
      scale: Math.min(viewportWidth, viewportHeight) / 4
    };
  }

  const bounds = getCoordinatesBounds(allCoordinates);
  
  // Calculate center point
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  
  // Calculate scale to fit all coordinates with padding
  const lonSpan = bounds.maxLon - bounds.minLon;
  const latSpan = bounds.maxLat - bounds.minLat;
  
  const scaleX = (viewportWidth - padding * 2) / (lonSpan * Math.PI / 180);
  const scaleY = (viewportHeight - padding * 2) / (latSpan * Math.PI / 180);
  
  const scale = Math.min(scaleX, scaleY);

  return {
    width: viewportWidth,
    height: viewportHeight,
    centerLon,
    centerLat,
    scale
  };
}