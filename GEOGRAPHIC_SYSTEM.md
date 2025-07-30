# Geographic Data System

## Overview

The Balance of Powers Geographic Data System uses a modular, file-based approach to load country boundaries at multiple detail levels. This system is designed to handle real-world GeoJSON data efficiently with caching and progressive loading.

## File Structure

```
data/boundaries/
├── overview/          # Low-resolution boundaries for world view
│   ├── USA.json
│   ├── CAN.json
│   ├── CHN.json
│   └── ...
├── detailed/          # Medium-resolution boundaries
│   ├── USA.json
│   ├── CAN.json
│   └── ...
└── ultra/             # High-resolution boundaries for province view
    ├── USA.json
    ├── CAN.json
    └── ...
```

## Detail Levels

- **Overview**: Low-resolution for zoomed-out world map view (~1:110m)
- **Detailed**: Medium-resolution for regional view (~1:10m)  
- **Ultra**: High-resolution for province/state view (~1:1m)

## Data Sources

### Recommended Sources
1. **Natural Earth** - Free vector and raster map data
   - Overview: Admin 0 – 1:110m
   - Detailed: Admin 0 – 1:10m
   
2. **GADM** - Global Administrative Areas database
   - Country boundaries (Level 0)
   - Province/state boundaries (Level 1-2)
   
3. **OpenStreetMap** via Geofabrik
   - Highest resolution data
   - Ultra detail level

## GeoJSON Format

Each country file contains a GeoJSONFeatureCollection:

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "name": "United States",
    "iso_a3": "USA",
    "detailLevel": "overview",
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "source": "ne_110m_admin_0_countries.geojson"
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "USA",
        "name": "United States",
        "ISO_A3": "USA"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [...]
      }
    }
  ]
}
```

## Usage

### GeographicDataManager

```typescript
import { geoManager } from '@/managers/GeographicDataManager';

// Load country boundaries
const boundaries = await geoManager.loadCountryBoundaries('USA', 'overview');

// Check cache status
const stats = geoManager.getCacheStats();

// Upgrade detail level
const detailed = await geoManager.upgradeRegionDetail('USA', 'detailed');

// Clear cache
geoManager.clearCache();
```

### WorldMap Component

The WorldMap component automatically:
- Loads boundaries for countries with province data
- Uses caching to avoid redundant requests
- Projects coordinates for display
- Handles hover/click interactions

## Data Processing Scripts

### splitGeoJSONByCountry.js

Converts world GeoJSON files into individual country files:

```bash
# Process Natural Earth data
node splitGeoJSONByCountry.js ne_110m_admin_0_countries.geojson overview
node splitGeoJSONByCountry.js ne_10m_admin_0_countries.geojson detailed
node splitGeoJSONByCountry.js custom_1m_admin_0_countries.geojson ultra
```

## Performance Features

### Caching
- 50MB memory cache with LRU eviction
- Persistent across page sessions
- Size estimation for memory management

### Progressive Loading
- Start with overview level
- Upgrade to detailed/ultra on zoom
- Fallback to lower detail if higher fails

### Error Handling
- Graceful fallback to empty geometries
- Detailed error logging
- Retry mechanisms

## Monitoring

Use the GeographicSystemTest component to:
- Test boundary loading for all countries
- Monitor cache performance
- Check load times and success rates
- Debug missing files

## Adding New Countries

1. Obtain GeoJSON data for the country
2. Convert to proper format using splitGeoJSONByCountry.js
3. Place files in appropriate detail level directories
4. Update country code mappings in WorldMap.tsx if needed

## File Size Guidelines

- Overview: < 50KB per country
- Detailed: 50KB - 500KB per country  
- Ultra: 500KB - 5MB per country

Large countries may need simplified geometries to stay within guidelines.