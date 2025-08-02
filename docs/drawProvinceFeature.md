# drawProvinceFeature Function Documentation

## Overview

The `drawProvinceFeature` function renders GeoJSON Polygon and MultiPolygon features onto a PixiJS Graphics object using longitude/latitude coordinates.

## Function Signature

```typescript
function drawProvinceFeature(
  feature: GeoJSONFeature, 
  graphics: PIXI.Graphics, 
  color: number,
  screenWidth: number = 800,
  screenHeight: number = 600
): void
```

## Parameters

- **`feature`**: GeoJSON feature with Polygon or MultiPolygon geometry
- **`graphics`**: PixiJS Graphics object to draw on
- **`color`**: Fill color as hex number (e.g., `0xFF0000` for red)
- **`screenWidth`**: Screen width for coordinate transformation (default: 800)
- **`screenHeight`**: Screen height for coordinate transformation (default: 600)

## Usage Examples

### Basic Polygon

```typescript
const graphics = new PIXI.Graphics();

const feature: GeoJSONFeature = {
  type: 'Feature',
  properties: { name: 'Example Province' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-74.0, 40.7], // New York area
      [-73.9, 40.7],
      [-73.9, 40.8],
      [-74.0, 40.8],
      [-74.0, 40.7]
    ]]
  }
};

drawProvinceFeature(feature, graphics, 0x22c55e, 800, 600);
```

### MultiPolygon (Islands, Archipelagos)

```typescript
const multiPolygonFeature: GeoJSONFeature = {
  type: 'Feature',
  properties: { name: 'Island Nation' },
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [[-157.8, 21.3], [-157.7, 21.3], [-157.7, 21.4], [-157.8, 21.4], [-157.8, 21.3]] // Hawaii
      ],
      [
        [[-156.3, 20.7], [-156.2, 20.7], [-156.2, 20.8], [-156.3, 20.8], [-156.3, 20.7]] // Maui
      ]
    ]
  }
};

drawProvinceFeature(multiPolygonFeature, graphics, 0x3b82f6, 800, 600);
```

### With Holes (Complex Polygons)

```typescript
const polygonWithHole: GeoJSONFeature = {
  type: 'Feature',
  properties: { name: 'Country with Lake' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      // Exterior ring
      [[-100, 40], [-90, 40], [-90, 50], [-100, 50], [-100, 40]],
      // Interior ring (hole - lake)
      [[-98, 42], [-92, 42], [-92, 48], [-98, 48], [-98, 42]]
    ]
  }
};

drawProvinceFeature(polygonWithHole, graphics, 0xf59e0b, 800, 600);
```

## Coordinate System

- **Input**: Longitude/Latitude in decimal degrees
  - Longitude: -180 to 180 (West to East)
  - Latitude: -90 to 90 (South to North)

- **Output**: Screen coordinates
  - X: 0 to screenWidth (left to right)
  - Y: 0 to screenHeight (top to bottom)

## Coordinate Transformation

The function includes a `transformCoordinates` helper that converts geographic coordinates to screen space:

```typescript
function transformCoordinates(lon: number, lat: number, screenWidth: number, screenHeight: number): [number, number] {
  const x = ((lon + 180) / 360) * screenWidth;
  const y = ((90 - lat) / 180) * screenHeight;
  return [x, y];
}
```

## Supported GeoJSON Geometry Types

- ✅ **Polygon**: Single polygon with optional holes
- ✅ **MultiPolygon**: Multiple polygons (islands, disconnected regions)
- ❌ **Point**: Not supported (use different rendering method)
- ❌ **LineString**: Not supported (use different rendering method)
- ❌ **MultiPoint**: Not supported (use different rendering method)
- ❌ **MultiLineString**: Not supported (use different rendering method)

## Styling

The function applies:
- **Fill**: User-specified color
- **Stroke**: Gray border (0x666666) with 1px width

To customize styling, modify the function or create additional variants:

```typescript
graphics.fill(fillColor);
graphics.stroke({ color: strokeColor, width: strokeWidth });
```

## Performance Notes

- Each feature creates geometry on the GPU
- For many features, consider using a single Graphics object
- Clear graphics between updates: `graphics.clear()`
- Use object pooling for frequent updates

## Integration with Real Map Data

```typescript
// Example with Natural Earth country data
const countryFeatures = await loadCountryBoundaries('USA');
const graphics = new PIXI.Graphics();

countryFeatures.features.forEach(feature => {
  const color = getCountryColor(feature.properties.NAME);
  drawProvinceFeature(feature, graphics, color, app.screen.width, app.screen.height);
});

worldContainer.addChild(graphics);
```

## Limitations

1. **No built-in projection**: Uses simple linear transformation
2. **Holes rendering**: PixiJS doesn't natively support polygon holes
3. **Coordinate wrapping**: No automatic handling of 180° meridian crossing
4. **Performance**: Not optimized for thousands of features

## Future Enhancements

- Add proper map projections (Mercator, etc.)
- Implement polygon hole masking
- Add coordinate wrapping for infinite scrolling
- Optimize for large datasets with spatial indexing
- Add interaction support (click detection)
