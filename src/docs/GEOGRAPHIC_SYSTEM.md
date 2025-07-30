# Geographic Data System - Balance of Powers

## Overview

The Balance of Powers geographic data system is designed to efficiently handle large-scale world boundary data with multiple detail levels, smart caching, and memory management.

## Architecture

### Core Components

1. **`types/geo.ts`** - Type definitions for geographic data
2. **`managers/GeographicDataManager.ts`** - Advanced boundary data management
3. **`public/data/boundaries/`** - Directory structure for boundary files

### Key Features

- **Multi-detail loading**: `overview`, `detailed`, `ultra` resolution levels
- **Smart caching**: LRU cache with 50MB default limit
- **Memory management**: Automatic eviction when cache exceeds limits
- **Region-based**: Organized by geographic/political regions
- **Type safety**: Full TypeScript support with GeoJSON types

## Directory Structure

```
public/data/boundaries/provinces/
├── usa/
│   ├── overview.json    # Low detail for continent view
│   ├── detailed.json    # Medium detail for regional view
│   └── ultra.json       # High detail for province view
├── china/
│   ├── overview.json
│   ├── detailed.json
│   └── ultra.json
├── canada/
├── russia/
├── europe_west/
├── europe_east/
└── [other regions...]
```

## Usage Examples

### Basic Loading

```typescript
import { geoDataManager } from '../managers/GeographicDataManager';
import { DetailLevel } from '../types/geo';

// Load USA boundaries at overview level
const usaData = await geoDataManager.loadRegionData('usa', DetailLevel.OVERVIEW);

// Load multiple regions in parallel
const multiRegionData = await geoDataManager.loadMultipleRegions([
  { region: 'usa', detailLevel: DetailLevel.DETAILED },
  { region: 'china', detailLevel: DetailLevel.OVERVIEW },
  { region: 'europe_west', detailLevel: DetailLevel.DETAILED }
]);
```

### Dynamic Detail Upgrading

```typescript
// Start with overview, then upgrade to higher detail
let data = await geoDataManager.loadRegionData('usa', DetailLevel.OVERVIEW);

// Zoom in - upgrade to detailed
data = await geoDataManager.upgradeRegionDetail('usa', DetailLevel.DETAILED);

// Zoom in further - upgrade to ultra
data = await geoDataManager.upgradeRegionDetail('usa', DetailLevel.ULTRA);
```

### Cache Management

```typescript
// Get cache statistics
const stats = geoDataManager.getCacheStats();
console.log('Cache entries:', stats.entryCount);
console.log('Memory usage:', stats.utilizationPercent + '%');

// Get memory usage
const memory = geoDataManager.getMemoryUsage();
console.log(`Using ${memory.used} / ${memory.limit} bytes (${memory.percentage}%)`);

// Clear cache if needed
geoDataManager.clearCache();
```

### Preloading

```typescript
// Preload commonly accessed regions
await geoDataManager.preloadRegions(['usa', 'canada', 'mexico'], DetailLevel.OVERVIEW);
```

## Type System

### DetailLevel Enum

```typescript
export enum DetailLevel {
  OVERVIEW = 'overview',  // Low detail for world/continental view
  DETAILED = 'detailed',  // Medium detail for regional view  
  ULTRA = 'ultra'         // High detail for province-level view
}
```

### GeoJSON Types

```typescript
export interface GeoJSONFeature {
  type: 'Feature';
  id?: string | number;
  properties: ProvinceProperties;
  geometry: GeoJSONGeometryUnion;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}
```

### Province Properties

```typescript
export interface ProvinceProperties {
  id: string;
  name: string;
  country: string;
  type?: 'province' | 'state' | 'territory' | 'region';
  capital?: string;
  population?: number;
  area?: number; // km²
  [key: string]: any; // Allow additional properties
}
```

## Configuration

### Default Configuration

```typescript
const DEFAULT_CONFIG: GeoDataManagerConfig = {
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  defaultDetailLevel: DetailLevel.OVERVIEW,
  basePath: '/data/boundaries/provinces',
  enableCaching: true
};
```

### Custom Configuration

```typescript
import { GeographicDataManager } from '../managers/GeographicDataManager';

const customGeoManager = new GeographicDataManager({
  maxCacheSize: 100 * 1024 * 1024, // 100MB cache
  defaultDetailLevel: DetailLevel.DETAILED,
  enableCaching: true
});
```

## File Format

### GeoJSON Structure

Each boundary file should follow this structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "california",
      "properties": {
        "id": "california",
        "name": "California",
        "country": "United States",
        "type": "state",
        "capital": "Sacramento",
        "population": 39538223,
        "area": 423970
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-124.4096, 42.0000],
          [-120.0060, 42.0000],
          [-114.0394, 32.5342],
          [-117.1258, 32.5342],
          [-124.4096, 42.0000]
        ]]
      }
    }
  ]
}
```

## Integration with Game Systems

### WorldMap Component

The WorldMap component automatically uses the GeographicDataManager:

```typescript
// In WorldMap.tsx
const regions = ['usa', 'canada', 'mexico', 'china', 'india', 'russia'];
const allFeatures: any[] = [];

for (const region of regions) {
  const regionData = await geoDataManager.loadRegionData(region, currentDetailLevel);
  if (regionData?.features?.length > 0) {
    allFeatures.push(...regionData.features);
  }
}
```

### Linking with Province Data

Province boundary features are linked to game province data via the `id` field:

```typescript
// Province data (from provinces_usa.yaml)
- id: california
  name: California
  country: United States
  # ... other province data

// Boundary data (from usa/overview.json)
{
  "id": "california",
  "properties": {
    "id": "california",
    "name": "California"
    # ... boundary metadata
  }
}
```

## Performance Considerations

### Memory Management

- **Automatic Eviction**: LRU eviction when cache exceeds limit
- **Size Estimation**: JSON stringify length * 2 for rough byte estimate
- **Headroom**: Evicts to 80% of limit to prevent thrashing

### Loading Strategy

- **Progressive Loading**: Start with overview, upgrade on demand
- **Parallel Loading**: Multiple regions loaded simultaneously
- **Error Handling**: Graceful fallback to empty collections

### Caching Strategy

- **Region + Detail Level**: Cache key includes both parameters
- **Cache Hits**: Fast retrieval of previously loaded data
- **Upgrade Path**: Smart cache replacement for detail upgrades

## Error Handling

### Graceful Fallbacks

```typescript
// Returns empty collection on error
{
  type: 'FeatureCollection',
  features: []
}
```

### Error States

- Invalid GeoJSON format validation
- Network request failures
- Missing boundary files
- Memory limit exceeded

## Future Enhancements

### Planned Features

1. **Compression**: GZIP or Brotli compression for boundary files
2. **Streaming**: Progressive loading of large boundary files
3. **Web Workers**: Background processing for large datasets
4. **IndexedDB**: Client-side persistent storage
5. **CDN Integration**: Global boundary data distribution

### Scalability

- Support for thousands of provinces per region
- Efficient handling of complex multi-polygon geometries
- Real-time boundary updates and versioning
- Cross-region boundary alignment

## Testing

Use the `GeographicDataManagerTest` component to verify functionality:

```typescript
import { GeographicDataManagerTest } from '../components/GeographicDataManagerTest';

// Renders test suite with:
// - Load USA Overview
// - Load China Detailed  
// - Upgrade USA to Ultra
// - Cache Hit Test
// - Memory Management
```

## Migration from Legacy System

The system is designed to completely replace the old flat-file approach:

### Before (Legacy)
```typescript
import provinceBoundaries from './province-boundaries.json';
import provinces from './provinces.yaml';
```

### After (Modular)
```typescript
const boundaries = await geoDataManager.loadRegionData('usa', DetailLevel.OVERVIEW);
const provinces = await loadWorldData(); // From dataLoader.ts
```

This provides much better scalability, memory management, and development experience.