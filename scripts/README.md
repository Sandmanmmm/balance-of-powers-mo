# Natural Earth Data Pipeline

This directory contains scripts for downloading and processing real geographical boundary data from Natural Earth and other sources.

## Quick Start

```bash
# Run the complete pipeline (recommended)
node scripts/natural-earth-complete.js

# Check current status
node scripts/natural-earth-complete.js status

# Run individual components
node scripts/simple-natural-earth.js
node scripts/validate-natural-earth.js
```

## Pipeline Components

### 1. Complete Pipeline (`natural-earth-complete.js`)
- **Purpose**: Orchestrates the entire download and validation process
- **Features**: 
  - Downloads from multiple sources
  - Validates data integrity
  - Enhances with game metadata
  - Generates comprehensive reports
- **Usage**: `node natural-earth-complete.js`

### 2. Simple Downloader (`simple-natural-earth.js`)
- **Purpose**: Downloads GeoJSON data from GitHub and CDN sources
- **Features**:
  - No external dependencies (no GDAL required)
  - Multiple data sources for redundancy
  - Automatic format conversion
  - Detail level processing (overview, detailed, ultra)
- **Sources**:
  - World Atlas (TopoJSON from NPM CDN)
  - Natural Earth GitHub repositories
  - D3.js gallery datasets

### 3. Data Validator (`validate-natural-earth.js`)
- **Purpose**: Validates and enhances downloaded boundary data
- **Features**:
  - GeoJSON structure validation
  - Missing country detection
  - Game metadata enhancement
  - Comprehensive reporting

### 4. Advanced Pipeline (`natural-earth-pipeline.js`)
- **Purpose**: Full-featured pipeline with shapefile support
- **Features**:
  - Direct Natural Earth downloads
  - Shapefile to GeoJSON conversion
  - Provincial boundary processing
- **Requirements**: GDAL tools (ogr2ogr, unzip)

## Data Structure

The pipeline generates boundary files in this structure:

```
data/boundaries/
├── overview/           # Low-resolution (1:110m scale)
│   ├── USA.json       # United States boundaries
│   ├── CAN.json       # Canada boundaries
│   └── ...
├── detailed/          # Medium-resolution (1:50m scale)
│   ├── USA.json
│   ├── CAN.json
│   └── ...
├── ultra/             # High-resolution (1:10m scale)
│   ├── USA.json
│   ├── CAN.json
│   └── ...
├── pipeline-summary.json      # Pipeline execution report
├── validation-report.json     # Data validation results
└── download-summary.json      # Download statistics
```

## File Format

Each country file follows this GeoJSON structure:

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "source": "Natural Earth",
    "level": "detailed",
    "country": "USA",
    "generated": "2024-01-01T00:00:00.000Z",
    "enhanced": "2024-01-01T00:00:00.000Z"
  },
  "gameMetadata": {
    "displayName": "United States",
    "region": "North America",
    "startingYear": 1990,
    "government": "Federal Republic",
    "ideology": "Liberal Democracy",
    "gdpEstimate": 5900000000000,
    "population": 248709873
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "USA",
        "ISO_A3": "USA",
        "NAME": "United States of America"
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [...]
      }
    }
  ]
}
```

## Data Sources

### Primary Sources
1. **Natural Earth** (naturalearthdata.com)
   - Official source for cartographic boundary data
   - Multiple resolution levels
   - Public domain license

2. **World Atlas** (NPM CDN)
   - Pre-processed TopoJSON format
   - Fast download and processing
   - Good for development/testing

3. **GitHub Repositories**
   - Various curated GeoJSON collections
   - Community-maintained datasets
   - Fallback for missing data

### Detail Levels

- **Overview (1:110m)**: ~1MB total, good for world view
- **Detailed (1:50m)**: ~5MB total, good for country view  
- **Ultra (1:10m)**: ~20MB total, good for province view

## Integration with Game

The processed boundary data integrates with the game's geographic system:

1. **GeographicDataManager** loads files on-demand
2. **WorldMap component** renders boundaries as SVG paths
3. **Province system** links to boundary geometries via ISO codes
4. **Detail level switching** provides progressive enhancement

## Troubleshooting

### Common Issues

1. **Missing countries**: Run validator to identify gaps
   ```bash
   node scripts/validate-natural-earth.js
   ```

2. **Invalid GeoJSON**: Check validation report for details
   ```bash
   cat data/boundaries/validation-report.json
   ```

3. **Download failures**: Try alternative sources or check network
   ```bash
   node scripts/simple-natural-earth.js
   ```

4. **Performance issues**: Use lower detail levels for overview
   ```javascript
   // In WorldMap component
   const detailLevel = zoomLevel > 5 ? 'ultra' : 'overview';
   ```

### Error Recovery

If the pipeline fails:

1. Check the error message and logs
2. Verify internet connectivity
3. Clear temporary data: `rm -rf temp/`
4. Re-run specific components as needed
5. Check `data/boundaries/pipeline-summary.json` for details

## Development

### Adding New Data Sources

1. Add URL to `GEOJSON_URLS` in `simple-natural-earth.js`
2. Implement format-specific processing if needed
3. Test with a small dataset first
4. Update validation checks

### Enhancing Game Metadata

1. Modify `gameCountryData` in `validate-natural-earth.js`
2. Add new fields to the schema
3. Update game components to use new metadata
4. Re-run validation to apply changes

### Performance Optimization

1. Monitor file sizes in pipeline reports
2. Adjust coordinate precision if needed
3. Implement progressive loading
4. Cache frequently accessed countries

## License

The boundary data comes from Natural Earth, which is in the public domain.
The processing scripts are part of the Balance of Powers project.