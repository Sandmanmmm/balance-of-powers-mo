export type DetailLevel = 'overview' | 'detailed' | 'ultra';

// Standard GeoJSON types
export interface GeoJSONGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'GeometryCollection';
  coordinates: any;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: {
    id?: string;
    name?: string;
    ISO_A3?: string;
    [key: string]: any;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// Boundary loading types
export interface BoundaryLoadRequest {
  countryCode: string;
  detailLevel: DetailLevel;
}

export interface BoundaryLoadResult {
  countryCode: string;
  detailLevel: DetailLevel;
  data: GeoJSONFeatureCollection;
  loadTime: number;
  cached: boolean;
}

// Geographic data manager types
export interface GeographicCacheStats {
  entryCount: number;
  totalSize: number;
  totalSizeMB: number;
  maxSizeMB: number;
  utilizationPercent: number;
  loadStats: {
    totalFiles: number;
    totalSize: number;
    loadTime: number;
    errors: string[];
  };
}