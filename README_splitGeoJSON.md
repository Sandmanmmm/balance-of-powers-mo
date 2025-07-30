# GeoJSON Country Splitter Script

## Overview

The `splitGeoJSONByCountry.js` script takes a large GeoJSON file containing multiple countries and splits it into individual country files organized by detail level.

## Usage

```bash
node splitGeoJSONByCountry.js <input-file> <detail-level>
```

### Examples:

```bash
# Split an overview-level world GeoJSON
node splitGeoJSONByCountry.js world-countries-overview.geojson overview

# Split a detailed-level world GeoJSON  
node splitGeoJSONByCountry.js world-countries-detailed.geojson detailed

# Split an ultra-detailed world GeoJSON
node splitGeoJSONByCountry.js world-countries-ultra.geojson ultra
```

## Output Structure

The script creates files in this directory structure:

```
data/boundaries/
├── overview/
│   ├── USA.json
│   ├── CAN.json
│   ├── FRA.json
│   └── ...
├── detailed/
│   ├── USA.json
│   ├── CAN.json
│   ├── FRA.json
│   └── ...
└── ultra/
    ├── USA.json
    ├── CAN.json
    ├── FRA.json
    └── ...
```

## Features

- **Automatic ISO_A3 Detection**: Tries multiple property names to find country codes
- **Validation**: Ensures proper ISO_A3 format (3 letters, not UNK/N/A)
- **Progress Tracking**: Shows real-time progress during processing
- **Error Handling**: Gracefully handles malformed features
- **Summary Reports**: Generates detailed reports of the split operation
- **Metadata**: Adds generation metadata to each output file

## Input Requirements

- Input file must be a valid GeoJSON FeatureCollection
- Features should have ISO_A3 country codes in their properties
- Supported property names for country codes:
  - `ISO_A3`, `iso_a3`
  - `ISO3`, `iso3`
  - `ADM0_A3`, `adm0_a3`
  - `SOV_A3`, `sov_a3`
  - `COUNTRY_CODE`, `country_code`
  - `CODE`, `code`

## Output Format

Each country file contains:

```json
{
  "type": "FeatureCollection",
  "features": [
    // GeoJSON features for that country
  ],
  "metadata": {
    "country": "USA",
    "detailLevel": "overview",
    "featureCount": 50,
    "generatedAt": "2024-01-01T12:00:00.000Z",
    "generatedBy": "splitGeoJSONByCountry.js"
  }
}
```

## Error Handling

- Skips features without valid ISO_A3 codes
- Warns about problematic features but continues processing
- Creates summary reports showing what was processed/skipped
- Validates input file format before processing

## Integration with Balance of Powers

This script is designed to work with the Balance of Powers game's modular boundary system. The output files can be directly loaded by the `GeographicDataManager` class.