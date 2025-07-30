/**
 * Geographic data types for the Balance of Powers modular boundary system
 * Provides standardized types for GeoJSON features and detail levels
 */

/**
 * Detail levels for geographic data loading
 * - overview: Low-detail boundaries for zoomed-out view
 * - detailed: Medium-detail boundaries for regional view  
 * - ultra: High-detail boundaries for close-up view
 */
export enum DetailLevel {
  OVERVIEW = 'overview',
  DETAILED = 'detailed',
  ULTRA = 'ultra'
}

/**
 * GeoJSON geometry types
 */
export interface GeoJSONPosition extends Array<number> {
  0: number; // longitude
  1: number; // latitude
  2?: number; // elevation (optional)
}

export interface GeoJSONGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'GeometryCollection';
  coordinates?: any;
  geometries?: GeoJSONGeometry[];
}

export interface GeoJSONPoint extends GeoJSONGeometry {
  type: 'Point';
  coordinates: GeoJSONPosition;
}

export interface GeoJSONLineString extends GeoJSONGeometry {
  type: 'LineString';
  coordinates: GeoJSONPosition[];
}

export interface GeoJSONPolygon extends GeoJSONGeometry {
  type: 'Polygon';
  coordinates: GeoJSONPosition[][];
}

export interface GeoJSONMultiPoint extends GeoJSONGeometry {
  type: 'MultiPoint';
  coordinates: GeoJSONPosition[];
}

export interface GeoJSONMultiLineString extends GeoJSONGeometry {
  type: 'MultiLineString';
  coordinates: GeoJSONPosition[][];
}

export interface GeoJSONMultiPolygon extends GeoJSONGeometry {
  type: 'MultiPolygon';
  coordinates: GeoJSONPosition[][][];
}

export interface GeoJSONGeometryCollection extends GeoJSONGeometry {
  type: 'GeometryCollection';
  geometries: GeoJSONGeometry[];
}

/**
 * GeoJSON Feature with properties for province data
 */
export interface GeoJSONFeature {
  type: 'Feature';
  id?: string | number;
  geometry: GeoJSONGeometry;
  properties: {
    id: string;
    name?: string;
    country?: string;
    region?: string;
    area?: number;
    population?: number;
    [key: string]: any;
  };
}

/**
 * GeoJSON Feature Collection containing multiple features
 */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  crs?: {
    type: string;
    properties: {
      name: string;
    };
  };
}

/**
 * Regional boundary data with multiple detail levels
 */
export interface RegionalBoundaryData {
  region: string;
  detailLevels: {
    [K in DetailLevel]?: GeoJSONFeatureCollection;
  };
  lastUpdated: Date;
  memorySize: number;
}

/**
 * Cache entry for geographic data manager
 */
export interface GeographicCacheEntry {
  data: GeoJSONFeatureCollection;
  loadedAt: Date;
  detailLevel: DetailLevel;
  memorySize: number;
  accessCount: number;
  lastAccessed: Date;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  totalEntries: number;
  totalMemoryUsage: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

/**
 * Loading statistics for performance monitoring
 */
export interface LoadingStats {
  regionsLoaded: number;
  totalLoadTime: number;
  averageLoadTime: number;
  failedLoads: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * Geographic data manager configuration
 */
export interface GeographicManagerConfig {
  maxCacheSize: number; // in bytes
  defaultDetailLevel: DetailLevel;
  preloadRegions: string[];
  enableCompression: boolean;
  cacheExpiryTime: number; // in milliseconds
}

/**
 * Error types for geographic data loading
 */
export class GeographicDataError extends Error {
  constructor(
    message: string,
    public region: string,
    public detailLevel: DetailLevel,
    public cause?: Error
  ) {
    super(message);
    this.name = 'GeographicDataError';
  }
}

/**
 * Utility type for coordinate transformation
 */
export interface CoordinateTransform {
  scale: number;
  translateX: number;
  translateY: number;
  projection: 'mercator' | 'equirectangular' | 'custom';
}

/**
 * Viewport bounds for determining which regions to load
 */
export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  zoom: number;
}

/**
 * Region metadata for geographic data organization
 */
export interface RegionMetadata {
  id: string;
  name: string;
  bounds: ViewportBounds;
  provinceCount: number;
  dataSource: string;
  version: string;
  supportedDetailLevels: DetailLevel[];
}

// Explicit export list to fix any module resolution issues
export type {
  GeoJSONPosition,
  GeoJSONGeometry,
  GeoJSONPoint,
  GeoJSONLineString,
  GeoJSONPolygon,
  GeoJSONMultiPoint,
  GeoJSONMultiLineString,
  GeoJSONMultiPolygon,
  GeoJSONGeometryCollection,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  RegionalBoundaryData,
  GeographicCacheEntry,
  CacheStats,
  LoadingStats,
  GeographicManagerConfig,
  CoordinateTransform,
  ViewportBounds,
  RegionMetadata
};

export {
  DetailLevel,
  GeographicDataError
};