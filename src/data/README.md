# Geographic Data Organization

This document outlines the modular geographic data system for Balance of Powers.

## Directory Structure

```
data/
├── boundaries/
│   └── provinces/
│       ├── usa/
│       │   ├── overview.json     # Low-detail US province boundaries
│       │   ├── detailed.json     # Medium-detail US province boundaries
│       │   └── ultra.json        # High-detail US province boundaries
│       ├── canada/
│       │   ├── overview.json
│       │   ├── detailed.json
│       │   └── ultra.json
│       ├── china/
│       │   ├── overview.json
│       │   ├── detailed.json
│       │   └── ultra.json
│       └── europe_west/
│           ├── overview.json
│           ├── detailed.json
│           └── ultra.json
├── regions/
│   ├── nations_usa.yaml
│   ├── provinces_usa.yaml
│   ├── nations_canada.yaml
│   ├── provinces_canada.yaml
│   └── ...
└── static/
    ├── resources.yaml
    ├── buildings.yaml
    └── technologies.yaml
```

## Detail Levels

### Overview (Low Detail)
- Simplified province boundaries (1000-2000 points max)
- Used for world map zoom levels 1-3
- Fast loading, minimal memory usage
- Good for strategy overview and region identification

### Detailed (Medium Detail)
- Standard province boundaries (5000-8000 points max)
- Used for regional zoom levels 4-6
- Balance between detail and performance
- Suitable for most gameplay interactions

### Ultra (High Detail)
- Full-resolution province boundaries (20000+ points)
- Used for close-up zoom levels 7+
- High memory usage, detailed visualization
- Perfect for province-level strategic planning

## GeoJSON Format

All boundary files must follow this structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "US_CA",
        "name": "California",
        "country": "United States",
        "region": "usa"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lon, lat], [lon, lat], ...]]
      }
    }
  ]
}
```

## Loading Strategy

The GeographicDataManager automatically:

1. **Loads on Demand**: Only loads regions when needed
2. **Caches Intelligently**: Keeps frequently accessed data in memory
3. **Upgrades Detail**: Automatically loads higher detail when zooming
4. **Manages Memory**: Evicts old data when cache exceeds 50MB
5. **Handles Errors**: Gracefully degrades when files are missing

## Creating New Regional Data

1. Create province boundary files at all 3 detail levels
2. Ensure property.id matches entries in provinces_[region].yaml
3. Test loading through GeographicDataManagerTest component
4. Verify memory usage and performance with large datasets

## Performance Guidelines

- **Overview files**: < 500KB each
- **Detailed files**: < 2MB each  
- **Ultra files**: < 10MB each
- **Cache limit**: 50MB total across all loaded regions
- **Load time**: < 2 seconds per region on average connection