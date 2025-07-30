# Geographic Boundary Architecture - Nation-Based File Structure

## Overview

The Balance of Powers app now uses a sophisticated geographic boundary system organized by nation and detail level. This replaces the previous region-based approach with a more scalable and efficient structure.

## File Structure

```
/public/data/boundaries/
├── overview/           # Low-detail boundaries for world view
│   ├── CAN.json       # Canada provinces (simplified)
│   ├── USA.json       # United States states (simplified)  
│   ├── CHN.json       # China provinces (simplified)
│   ├── RUS.json       # Russia federal districts (simplified)
│   ├── FRA.json       # France regions (simplified)
│   └── ...
├── detailed/          # Medium-detail boundaries for regional view
│   ├── CAN.json       # Canada provinces (detailed)
│   ├── USA.json       # United States states (detailed)
│   └── ...
└── ultra/             # High-detail boundaries for close-up view
    ├── CAN.json       # Canada provinces (ultra-detailed)
    ├── USA.json       # United States states (ultra-detailed)
    └── ...
```

## Data Format

Each nation file contains a `Record<string, GeoJSONFeature>` where:
- **Key**: Province/state ID (e.g., "CAN_001", "USA_001")
- **Value**: GeoJSON Feature with geometry and properties

### Example Structure
```json
{
  "CAN_001": {
    "type": "Feature",
    "properties": {
      "id": "CAN_001", 
      "name": "British Columbia"
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[lon, lat], [lon, lat], ...]]
    }
  },
  "CAN_002": {
    "type": "Feature",
    "properties": {
      "id": "CAN_002",
      "name": "Alberta" 
    },
    "geometry": { ... }
  }
}
```

## Detail Levels

### Overview Level
- **Purpose**: World map view (zoom levels 1-4)
- **Complexity**: 10-50 coordinate points per province
- **File Size**: 1-10 KB per nation
- **Use Case**: Initial map load, continent-level navigation

### Detailed Level  
- **Purpose**: Regional map view (zoom levels 5-8)
- **Complexity**: 50-200 coordinate points per province
- **File Size**: 5-50 KB per nation
- **Use Case**: Country-level exploration, province selection

### Ultra Level
- **Purpose**: Close-up map view (zoom levels 9+)
- **Complexity**: 200+ coordinate points per province
- **File Size**: 20-200 KB per nation
- **Use Case**: Province-level detail, border accuracy

## GeographicDataManager Features

### Intelligent Caching
- 50MB memory limit with LRU eviction
- Automatic size estimation and monitoring
- Cache hit/miss ratio tracking
- Per-entry access time recording

### Dynamic Loading
```typescript
// Load nation at specific detail level
const boundaries = await geographicDataManager.loadNationBoundaries('CAN', 'overview');

// Upgrade to higher detail when zooming in
const detailed = await geographicDataManager.upgradeNationDetail('CAN', 'detailed');

// Get performance statistics
const stats = geographicDataManager.getStats();
```

### Error Handling
- Graceful fallback to empty data on load failure
- Detailed error logging with nation/detail context
- Network timeout and retry logic
- Invalid data format detection

## Implementation Benefits

### Scalability
- **File Size Management**: Each nation file stays manageable in size
- **Memory Efficiency**: Only load nations currently visible on map
- **Network Optimization**: Progressive detail loading based on zoom level

### Performance
- **Cache Efficiency**: Nation-based caching reduces redundant loads
- **Selective Loading**: Load only required detail levels
- **Memory Management**: Automatic eviction prevents memory bloat

### Maintainability  
- **Clear Organization**: Easy to find and update specific nation data
- **Modular Structure**: Add new nations without affecting existing ones
- **Version Control**: Track changes per nation independently

## Adding New Nations

1. **Create boundary files** for each detail level:
   ```
   /public/data/boundaries/overview/NEW.json
   /public/data/boundaries/detailed/NEW.json  
   /public/data/boundaries/ultra/NEW.json
   ```

2. **Follow naming convention**:
   - Nation code: 3-letter ISO code (e.g., "GBR", "JPN")
   - Province IDs: "{NATION}_{NUMBER}" (e.g., "GBR_001")

3. **Validate data format**:
   - Must be `Record<string, GeoJSONFeature>`
   - Each feature needs `id` and `name` in properties
   - Coordinates in [longitude, latitude] format

## Migration from Legacy System

The new system maintains backward compatibility through:
- Legacy region-based loading methods still supported
- Automatic conversion between GeoJSON formats
- Gradual migration path for existing boundary data

## Performance Monitoring

The GeographicDataManager provides comprehensive statistics:
- Total requests and cache hit ratios
- Memory usage and eviction counts  
- Average load times per detail level
- Per-nation loading performance

This enables optimization of:
- Cache size limits
- Detail level thresholds
- Preloading strategies
- Network retry policies

## Future Enhancements

Planned improvements include:
- **Compression**: Gzip boundary files for faster loading
- **Incremental Updates**: Delta updates for boundary changes
- **Predictive Loading**: Preload adjacent nations based on user navigation
- **WebWorker Processing**: Background boundary processing for smooth UI