# Balance of Powers - Modular Regional Data System

## Overview

This directory contains the modular regional data system for Balance of Powers. The world data has been split into manageable chunks to:

- Improve IDE performance (smaller files under 5000 lines)
- Enable collaborative editing by region
- Allow selective loading of world data
- Support regional expertise application
- Make the codebase more maintainable

## Directory Structure

### Superpowers (Individual Files)
Each superpower gets its own dedicated files for detailed modeling:
- `superpowers/usa/` - United States
- `superpowers/china/` - People's Republic of China  
- `superpowers/russia/` - Russian Federation
- `superpowers/india/` - Republic of India

### Regional Collections
Other countries are grouped by geographic/political regions:
- `north_america/` - Canada, Mexico, Central America (excluding USA)
- `europe_west/` - Germany, France, UK, Benelux, Scandinavia
- `europe_east/` - Poland, Czech Rep, Slovakia, Hungary, Balkans
- `southeast_asia/` - Thailand, Vietnam, Indonesia, Philippines, Malaysia, Singapore
- `south_asia/` - Pakistan, Bangladesh, Sri Lanka, Nepal (excluding India)
- `middle_east/` - Saudi Arabia, Iran, Iraq, Turkey, Israel, UAE
- `north_africa/` - Egypt, Libya, Tunisia, Algeria, Morocco, Sudan
- `sub_saharan_africa/` - Nigeria, South Africa, Kenya, Ethiopia, Ghana
- `south_america/` - Brazil, Argentina, Chile, Colombia, Peru
- `oceania/` - Australia, New Zealand, Pacific Island nations
- `central_asia/` - Kazakhstan, Uzbekistan, Kyrgyzstan, Tajikistan

## File Format for Each Region

Each regional directory contains three files:

### 1. Nations Data (`nations_<region>.yaml`)
Contains political, economic, and military data for each nation:
```yaml
nations:
  USA:
    name: "United States of America"
    capital: "Washington D.C."
    government:
      type: "federal_democracy"
      leader: "Current Leader"
    economy:
      gdp: 23315000000000
      currency: "USD"
    military:
      manpower: 1385000
      nuclear_capability: true
```

### 2. Provinces Data (`provinces_<region>.yaml`)
Contains detailed province/state-level information:
```yaml
provinces:
  USA_CA:
    name: "California"
    country: "United States"
    coordinates: [36.7783, -119.4179]
    features:
      - "coastal"
      - "tech_hub"
    population:
      total: 39538000
    infrastructure:
      roads: 4
      internet: 5
```

### 3. Boundary Data (`province-boundaries_<region>.json`)
GeoJSON format containing polygon boundaries for map rendering:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {"id": "USA_CA", "name": "California"},
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      }
    }
  ]
}
```

## Loading System

The modular data is loaded by `src/lib/gameDataModular.ts`:

1. **Primary**: Attempts to load from modular regional files
2. **Fallback**: Falls back to legacy `nations.yaml`/`provinces.yaml` if modular loading fails
3. **Error Handling**: Graceful degradation with meaningful error messages

### Usage in Code

```typescript
import { loadGameData } from '../lib/gameDataModular';

const { nations, provinces, boundaries } = await loadGameData();
```

## Development Workflow

### Adding a New Region
1. Create directory: `src/data/regions/new_region/`
2. Create three files:
   - `nations_new_region.yaml`
   - `provinces_new_region.yaml` 
   - `province-boundaries_new_region.json`
3. Update `REGIONAL_DATA_CONFIG` in `gameDataModular.ts`

### Editing Existing Data
1. Find the appropriate regional file
2. Edit using normal YAML/JSON syntax
3. Ensure province IDs match between provinces and boundaries
4. Test locally to verify no syntax errors

### Best Practices
- Keep files under 5000 lines for optimal IDE performance
- Use consistent naming: region codes (3-letter) + underscore + number
- Maintain geographic accuracy in boundary data
- Include all required fields per schema
- Test modular loading after changes

## Migration from Legacy System

The system maintains backward compatibility:
- Legacy `nations.yaml` and `provinces.yaml` still work as fallbacks
- New modular system loads first, legacy as backup
- No breaking changes to existing code using the data

## Future Enhancements

- **Selective Loading**: Load only active regions for performance
- **Dynamic Updates**: Hot-reload changed regional files
- **Validation**: Schema validation for each regional file
- **Compression**: Optimized boundary data for web delivery
- **Localization**: Multi-language support per region