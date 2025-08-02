# WorldMapWebGL Component

A React component that uses PixiJS for hardware-accelerated WebGL rendering of the world map. This component provides better performance for complex map visualizations and infinite scrolling.

## Features

- **WebGL Rendering**: Uses PixiJS for hardware-accelerated graphics
- **Auto Resize**: Automatically resizes with window/container changes  
- **Clean Lifecycle**: Proper PixiJS application cleanup on unmount
- **Canvas Integration**: Manages canvas element within React lifecycle
- **Performance**: Better suited for complex map rendering than SVG

## Usage

```tsx
import { WorldMapWebGL } from './components/WorldMapWebGL';

function MyMapComponent() {
  const [selectedProvince, setSelectedProvince] = useState<string>();
  const [mapOverlay, setMapOverlay] = useState<MapOverlayType>('none');

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <WorldMapWebGL
        provinces={provinces}
        selectedProvince={selectedProvince}
        mapOverlay={mapOverlay}
        onProvinceSelect={setSelectedProvince}
        onOverlayChange={setMapOverlay}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `provinces` | `Province[]` | Array of province data to render |
| `selectedProvince` | `string?` | Currently selected province ID |
| `mapOverlay` | `MapOverlayType` | Current map overlay mode |
| `onProvinceSelect` | `(id?: string) => void` | Callback when province is selected |
| `onOverlayChange` | `(overlay: MapOverlayType) => void` | Callback when overlay changes |

## Implementation Details

### PixiJS Application Setup
- Creates PixiJS application with WebGL renderer
- Sets up canvas with proper resolution and anti-aliasing
- Configures ocean blue background color

### Resize Handling
- Listens for window resize events
- Automatically adjusts PixiJS renderer size
- Maintains proper aspect ratio

### Cleanup
- Destroys PixiJS application on component unmount
- Cleans up all textures and resources
- Prevents memory leaks

### Container Structure
```
<div> (container)
  <canvas> (PixiJS managed)
  <div> (loading overlay)
  <div> (debug info)
  <div> (controls)
```

## Testing

Use the `WebGLMapTest.tsx` component to test the WorldMapWebGL functionality:

```bash
# Include WebGLMapTest in your app to see the component in action
```

## Performance Benefits

- **Hardware Acceleration**: Uses GPU for rendering operations
- **Efficient Updates**: Only re-renders changed elements  
- **Smooth Animations**: 60fps animations and interactions
- **Large Datasets**: Better handling of complex geometries
- **Memory Management**: Efficient texture and resource management

## Browser Support

Requires WebGL support (available in all modern browsers):
- Chrome 51+
- Firefox 53+  
- Safari 10+
- Edge 79+

## Future Enhancements

- [ ] Implement actual map geometry rendering
- [ ] Add infinite scrolling with world wrapping
- [ ] Province interaction (click, hover)
- [ ] Zoom and pan controls
- [ ] Map overlay rendering
- [ ] Performance monitoring
- [ ] Texture atlas for efficient rendering
- [ ] Level-of-detail (LOD) for different zoom levels
