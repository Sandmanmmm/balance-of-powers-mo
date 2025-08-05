import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { Province, MapOverlayType } from '../lib/types';
import { GeoJSONFeature } from '../types/geo';
import { geoManager } from '../managers/GeographicDataManager';
import { DetailLevel } from '../types/geo';
import { ProvinceLoadingTest } from './ProvinceLoadingTest';
import { TileVisibilityDebug } from './TileVisibilityDebug';
import { 
  getVisibleTilesWithLOD,
  getDetailLevelFromZoom,
  filterTilesForCulling
} from '../utils/tileVisibility';

type RenderMode = 'legacy' | 'tiles';

// Tile system types
interface TileInfo {
  id: string;
  detailLevel: DetailLevel;
  x: number;
  y: number;
  lat: number;
  lon: number;
}

interface ViewportState {
  center: { x: number; y: number }; // World center (longitude, latitude)
  zoom: number;
  screenWidth: number;
  screenHeight: number;
  panOffset: { x: number; y: number };
}

interface WorldMapWebGLProps {
  provinces: Province[];
  selectedProvince?: string;
  mapOverlay: MapOverlayType;
  onProvinceSelect: (provinceId: string | undefined) => void;
  onOverlayChange: (overlay: MapOverlayType) => void;
  detailLevel?: DetailLevel;
  renderMode?: RenderMode;
}

/**
 * Convert screen coordinates back to world coordinates (longitude, latitude)
 * This is the inverse of transformCoordinates function
 */
function screenToWorldCoordinates(
  screenX: number,
  screenY: number,
  screenWidth: number,
  screenHeight: number,
  offsetX: number = 0,
  zoomLevel: number = 1,
  zoomCenter: { x: number; y: number } = { x: 0, y: 0 },
  offsetY: number = 0
): { lon: number; lat: number } {
  const baseScale = Math.min(screenWidth / 360, screenHeight / 180);
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
  
  // Reverse the zoom transformation
  const unzoomedX = centerX + (screenX - centerX - zoomCenter.x) / zoomLevel + zoomCenter.x;
  const unzoomedY = centerY + (screenY - centerY - zoomCenter.y) / zoomLevel + zoomCenter.y;
  
  // Reverse the pan offset
  const unpannedX = unzoomedX - offsetX;
  const unpannedY = unzoomedY - offsetY;
  
  // Convert back to world coordinates
  const lon = (unpannedX - centerX) / baseScale;
  const lat = -(unpannedY - centerY) / baseScale;
  
  return { lon, lat };
}

/**
 * Enhanced coordinate transformation with date line crossing detection and zoom support
 * Handles countries that span the international date line (like Russia) and zoom scaling
 */
function transformCoordinates(
  lon: number, 
  lat: number, 
  screenWidth: number, 
  screenHeight: number, 
  offsetX: number = 0,
  zoomLevel: number = 1,
  zoomCenter: { x: number; y: number } = { x: 0, y: 0 },
  offsetY: number = 0
): [number, number] {
  // Scale and center the world map properly
  const baseScale = Math.min(screenWidth / 360, screenHeight / 180); // Fit world to screen
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
  
  // Transform longitude/latitude to base screen coordinates
  const baseX = centerX + (lon * baseScale);
  const baseY = centerY - (lat * baseScale);
  
  // Apply pan offset at base scale
  const pannedX = baseX + offsetX;
  const pannedY = baseY + offsetY;
  
  // Apply zoom transformation around zoom center
  const x = centerX + (pannedX - centerX - zoomCenter.x) * zoomLevel + zoomCenter.x;
  const y = centerY + (pannedY - centerY - zoomCenter.y) * zoomLevel + zoomCenter.y;
  
  return [x, y];
}

/**
 * Detects if a ring of coordinates crosses the international date line
 * Disabled for infinite scrolling to prevent visual artifacts
 */
function crossesDateLine(ring: number[][]): boolean {
  // For infinite scrolling, we disable date line crossing detection entirely
  // The world copies will handle longitude wrapping naturally
  return false;
}

/**
 * Splits a ring that crosses the date line into multiple segments
 * Disabled for infinite scrolling - returns the original ring intact
 */
function splitRingAtDateLine(ring: number[][]): number[][][] {
  // For infinite scrolling, we never split rings - just return the original ring
  // This prevents visual artifacts and lets the world copies handle wrapping
  return [ring];
}

/**
 * Draws a GeoJSON feature (Polygon or MultiPolygon) onto a PixiJS Graphics object
 * with support for infinite horizontal scrolling
 */
function drawProvinceFeature(
  feature: GeoJSONFeature, 
  graphics: PIXI.Graphics, 
  color: number,
  screenWidth: number = 800,
  screenHeight: number = 600,
  offsetX: number = 0,
  zoomLevel: number = 1,
  zoomCenter: { x: number; y: number } = { x: 0, y: 0 },
  offsetY: number = 0
) {
  if (!feature.geometry || !feature.geometry.coordinates) {
    console.warn('Invalid feature geometry:', feature);
    return;
  }

  // Clear any previous drawing
  graphics.clear();
  
  // Set fill and stroke styles
  graphics.beginFill(color);
  graphics.lineStyle(1, 0x666666, 1);

  const { type, coordinates } = feature.geometry;

  if (type === 'Polygon') {
    drawPolygon(coordinates as number[][][], graphics, screenWidth, screenHeight, offsetX, zoomLevel, zoomCenter, offsetY);
  } else if (type === 'MultiPolygon') {
    const multiPolygonCoords = coordinates as number[][][][];
    multiPolygonCoords.forEach(polygonCoords => {
      drawPolygon(polygonCoords, graphics, screenWidth, screenHeight, offsetX, zoomLevel, zoomCenter, offsetY);
    });
  } else {
    console.warn('Unsupported geometry type:', type);
  }
  
  // End the fill
  graphics.endFill();
}

function drawPolygon(
  coordinates: number[][][], 
  graphics: PIXI.Graphics,
  screenWidth: number,
  screenHeight: number,
  offsetX: number = 0,
  zoomLevel: number = 1,
  zoomCenter: { x: number; y: number } = { x: 0, y: 0 },
  offsetY: number = 0
) {
  if (!coordinates || coordinates.length === 0) return;

  const exteriorRing = coordinates[0];
  if (exteriorRing && exteriorRing.length > 0) {
    drawRing(exteriorRing, graphics, screenWidth, screenHeight, offsetX, zoomLevel, zoomCenter, offsetY);
  }
}

function drawRing(
  ring: number[][], 
  graphics: PIXI.Graphics, 
  screenWidth: number,
  screenHeight: number,
  offsetX: number = 0,
  zoomLevel: number = 1,
  zoomCenter: { x: number; y: number } = { x: 0, y: 0 },
  offsetY: number = 0
) {
  if (!ring || ring.length < 3) return;

  // Split the ring into segments if it crosses the date line
  const segments = splitRingAtDateLine(ring);
  
  segments.forEach((segment, segmentIndex) => {
    if (segment.length < 3) return;
    
    const [startLon, startLat] = segment[0];
    const [startX, startY] = transformCoordinates(startLon, startLat, screenWidth, screenHeight, offsetX, zoomLevel, zoomCenter, offsetY);
    
    // Debug first coordinate of first segment
    if (segmentIndex === 0 && Math.random() < 0.01) {
      console.log(`🗺️ Drawing ring segment ${segmentIndex}: first coord (${startLon}, ${startLat}) -> (${startX}, ${startY})`);
    }
    
    if (segmentIndex === 0) {
      graphics.moveTo(startX, startY);
    } else {
      // For subsequent segments, move to the start point
      graphics.moveTo(startX, startY);
    }

    for (let i = 1; i < segment.length; i++) {
      const [lon, lat] = segment[i];
      const [x, y] = transformCoordinates(lon, lat, screenWidth, screenHeight, offsetX, zoomLevel, zoomCenter, offsetY);
      graphics.lineTo(x, y);
    }

    // Close the segment if it's the last one and not already closed
    if (segmentIndex === segments.length - 1) {
      const [firstLon, firstLat] = segment[0];
      const [lastLon, lastLat] = segment[segment.length - 1];
      if (firstLon !== lastLon || firstLat !== lastLat) {
        const [closeX, closeY] = transformCoordinates(firstLon, firstLat, screenWidth, screenHeight, offsetX, zoomLevel, zoomCenter, offsetY);
        graphics.lineTo(closeX, closeY);
      }
    }
  });
}

/**
 * Draws a polygon border only (no fill) - for highlighting
 */
function drawPolygonBorderOnly(
  coordinates: number[][][], 
  graphics: PIXI.Graphics,
  screenWidth: number,
  screenHeight: number,
  offsetX: number = 0,
  zoomLevel: number = 1,
  zoomCenter: { x: number; y: number } = { x: 0, y: 0 },
  offsetY: number = 0
) {
  if (!coordinates || coordinates.length === 0) {
    console.warn('No coordinates for border drawing');
    return;
  }

  const exteriorRing = coordinates[0];
  if (exteriorRing && exteriorRing.length > 0) {
    console.log(`🔷 Drawing polygon border with ${exteriorRing.length} points`);
    
    // Draw the exterior ring using the same logic but with explicit moveTo/lineTo
    if (exteriorRing.length < 3) {
      console.warn('Not enough points for polygon border');
      return;
    }

    // Get first point
    const [startLon, startLat] = exteriorRing[0];
    const [startX, startY] = transformCoordinates(startLon, startLat, screenWidth, screenHeight, offsetX, zoomLevel, zoomCenter, offsetY);
    
    console.log(`🎯 Border: Starting at (${startX.toFixed(1)}, ${startY.toFixed(1)}) from coords (${startLon}, ${startLat})`);
    graphics.moveTo(startX, startY);

    // Draw lines to all other points
    for (let i = 1; i < exteriorRing.length; i++) {
      const [lon, lat] = exteriorRing[i];
      const [x, y] = transformCoordinates(lon, lat, screenWidth, screenHeight, offsetX, zoomLevel, zoomCenter, offsetY);
      graphics.lineTo(x, y);
    }

    // Close the polygon
    graphics.lineTo(startX, startY);
    
    // Explicitly stroke the path to ensure it's rendered
    graphics.stroke();
    
    console.log(`✅ Border: Completed polygon with ${exteriorRing.length} points`);
  } else {
    console.warn('No exterior ring for polygon border');
  }
}

function getCountryColor(countryName?: string, isSelected: boolean = false): number {
  if (isSelected) return 0xff6b6b; // Bright red for selected
  if (!countryName) return 0xe5e7eb;
  
  const countryColorMap: Record<string, number> = {
    'United States': 0xfbbf24,
    'Canada': 0x34d399,
    'Mexico': 0xf87171,
    'China': 0xa78bfa,
    'India': 0xfb7185,
    'Russia': 0x06b6d4,
    'Germany': 0x2dd4bf,
    'France': 0x60a5fa,
    'United Kingdom': 0xf472b6,
    'Japan': 0xec4899,
    'Australia': 0xfbbf24,
    'Brazil': 0x16a34a,
    'Argentina': 0x0891b2,
  };
  
  return countryColorMap[countryName] || 0xd1d5db;
}

/**
 * Creates or updates the border highlight for the hovered country
 */
function createBorderHighlight(
  features: GeoJSONFeature[],
  countryName: string,
  worldContainer: PIXI.Container,
  screenWidth: number,
  screenHeight: number,
  offsetX: number,
  borderHighlightRef: React.MutableRefObject<PIXI.Graphics | null>,
  zoomLevel: number = 1,
  zoomCenter: { x: number; y: number } = { x: 0, y: 0 },
  offsetY: number = 0
): void {
  console.log(`🔍 Creating border highlight for ${countryName}`);
  
  // Clear existing highlight
  if (borderHighlightRef.current) {
    worldContainer.removeChild(borderHighlightRef.current);
    borderHighlightRef.current.destroy();
    borderHighlightRef.current = null;
  }

  // Find all features for this country
  const countryFeatures = features.filter(feature => {
    const featureCountry = feature.properties?.NAME || feature.properties?.ADMIN || feature.properties?.country;
    return featureCountry === countryName;
  });

  console.log(`📍 Found ${countryFeatures.length} features for ${countryName}`);

  if (countryFeatures.length === 0) {
    console.warn(`⚠️ No features found for country: ${countryName}`);
    return;
  }

  // Create new border highlight graphics
  const borderGraphics = new PIXI.Graphics();
  
  // Draw the actual country borders
  borderGraphics.lineStyle(2, 0xffd700, 1); // Gold border, 2px width, full opacity
  
  console.log(`🎨 Created border graphics with gold 2px line for actual country borders`);

  // Draw borders for all features of this country
  countryFeatures.forEach((feature, index) => {
    console.log(`📐 Drawing border for feature ${index} of ${countryName}`);
    try {
      // Use a stroke-only version of the drawing logic
      if (!feature.geometry || !feature.geometry.coordinates) {
        console.warn('Invalid feature geometry:', feature);
        return;
      }

      const { type, coordinates } = feature.geometry;

      if (type === 'Polygon') {
        drawPolygonBorderOnly(coordinates as number[][][], borderGraphics, screenWidth, screenHeight, offsetX, zoomLevel, zoomCenter, offsetY);
      } else if (type === 'MultiPolygon') {
        const multiPolygonCoords = coordinates as number[][][][];
        multiPolygonCoords.forEach(polygonCoords => {
          drawPolygonBorderOnly(polygonCoords, borderGraphics, screenWidth, screenHeight, offsetX, zoomLevel, zoomCenter, offsetY);
        });
      }
      
    } catch (error) {
      console.error(`❌ Error drawing border for feature ${index}:`, error);
    }
  });

  // Force the graphics to update and check bounds
  console.log(`🔧 Final bounds: width=${borderGraphics.width}, height=${borderGraphics.height}, bounds=${JSON.stringify(borderGraphics.getBounds())}`);

  // Add to container and store reference
  worldContainer.addChild(borderGraphics);
  borderHighlightRef.current = borderGraphics;
  
  // Bring border to front
  worldContainer.setChildIndex(borderGraphics, worldContainer.children.length - 1);
  
  // Debug the graphics object
  console.log(`📊 Graphics object:`, {
    width: borderGraphics.width,
    height: borderGraphics.height,
    visible: borderGraphics.visible,
    alpha: borderGraphics.alpha,
    children: borderGraphics.children.length,
    parent: borderGraphics.parent ? 'has parent' : 'no parent',
    bounds: borderGraphics.getBounds()
  });
  
  // Debug the container
  console.log(`📊 Container children count: ${worldContainer.children.length}`);
  
  console.log(`✅ Created border highlight for ${countryName} (${countryFeatures.length} features) - added to container`);
}

/**
 * Creates a world copy at the specified offset with full interactivity
 */
function createWorldCopy(
  feature: GeoJSONFeature,
  worldContainer: PIXI.Container,
  app: PIXI.Application,
  offsetX: number,
  zoomLevel: number,
  zoomCenter: { x: number; y: number },
  selectedProvince: string | undefined,
  onProvinceSelect: (provinceId: string | undefined) => void,
  setHoveredCountry: (country: string | null) => void,
  hoveredCountry: string | null,
  borderHighlightRef: React.MutableRefObject<PIXI.Graphics | null>,
  provinceBoundariesData: any,
  copyLabel: string = "",
  setProvinceDetailBoundaries: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  setSelectedCountryForProvinces: React.Dispatch<React.SetStateAction<string | null>>,
  currentDetailLevel: DetailLevel
): PIXI.Graphics {
  const graphics = new PIXI.Graphics();
  
  // Get the country name for coloring
  const countryName = feature.properties?.NAME || feature.properties?.ADMIN || feature.properties?.country;
  const featureId = feature.properties?.id || feature.properties?.ISO_A3;
  
  // Check if this feature is selected
  const isSelected = Boolean(selectedProvince && (
    featureId === selectedProvince || 
    countryName === selectedProvince ||
    feature.properties?.name === selectedProvince
  ));
  
  // Get color for this country (with selection highlighting)
  const color = getCountryColor(countryName, isSelected);
  
  // Draw the feature with the specified offset
  drawProvinceFeature(feature, graphics, color, app.screen.width, app.screen.height, offsetX, zoomLevel, zoomCenter, 0);
  
  // Make the graphics interactive
  graphics.eventMode = 'static';
  graphics.cursor = 'pointer';
  
  // Add click handler
  graphics.on('pointerdown', async () => {
    const provinceId = featureId || countryName || feature.properties?.name;
    console.log(`🖱️ Clicked on province${copyLabel}: ${provinceId}`);
    
    // If clicking on a country, try to load its province boundaries
    const countryCode = feature.properties?.ISO_A3 || feature.properties?.id;
    if (countryCode && countryName) {
      console.log(`🗺️ Attempting to load province boundaries for ${countryName} (${countryCode})`);
      
      try {
        // Use consistent casing for the key - always uppercase for storage
        const storageKey = countryCode.toUpperCase();
        const loadKey = countryCode.toLowerCase(); // File paths are lowercase
        
        console.log(`🔑 Storage key: ${storageKey}, Load key: ${loadKey}`);
        
        // Try to load province boundaries for this country
        const provinceData = await geoManager.loadRegion(loadKey, currentDetailLevel);
        
        console.log(`📊 Province data result:`, {
          hasData: !!provinceData,
          keyCount: provinceData ? Object.keys(provinceData).length : 0,
          sampleKeys: provinceData ? Object.keys(provinceData).slice(0, 3) : []
        });
        
        if (provinceData && Object.keys(provinceData).length > 0) {
          console.log(`✅ Loaded ${Object.keys(provinceData).length} provinces for ${countryName}`);
          console.log(`📝 Province IDs:`, Object.keys(provinceData));
          
          // Update state to show this country's provinces - use consistent uppercase key
          setProvinceDetailBoundaries(prev => {
            const newState = {
              ...prev,
              [storageKey]: provinceData
            };
            console.log(`💾 Updated provinceDetailBoundaries:`, Object.keys(newState));
            return newState;
          });
          
          setSelectedCountryForProvinces(storageKey);
          console.log(`🎯 Set selectedCountryForProvinces to: ${storageKey}`);
          
          // Also notify the parent about the province selection
          onProvinceSelect(storageKey);
        } else {
          console.log(`ℹ️ No province data available for ${countryName}, treating as single province`);
          onProvinceSelect(provinceId);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load province boundaries for ${countryName}:`, error);
        // Fall back to treating country as a single province
        onProvinceSelect(provinceId);
      }
    } else {
      // For individual provinces or countries without ISO codes
      onProvinceSelect(provinceId);
    }
  });
  
  // Add hover effects with border highlighting
  graphics.on('pointerover', () => {
    console.log(`🖱️ HOVER START${copyLabel}: ${countryName}`);
    
    // Lighten the fill
    graphics.tint = 0xdddddd;
    
    // Create border highlight for the entire country (use the same offset as this world copy)
    if (countryName && countryName !== hoveredCountry) {
      console.log(`🌟 Starting border highlight${copyLabel} for ${countryName} at offset ${offsetX}`);
      setHoveredCountry(countryName);
      try {
        createBorderHighlight(
          provinceBoundariesData.features,
          countryName,
          worldContainer,
          app.screen.width,
          app.screen.height,
          offsetX, // Use the same offset as this world copy for proper border positioning
          borderHighlightRef,
          zoomLevel,
          zoomCenter,
          0
        );
      } catch (error) {
        console.error(`❌ Error creating border highlight${copyLabel} for ${countryName}:`, error);
      }
    }
  });
  
  graphics.on('pointerout', () => {
    console.log(`🖱️ HOVER END${copyLabel}: ${countryName}`);
    
    // Reset tint
    graphics.tint = 0xffffff;
    
    // Clear border highlight
    if (borderHighlightRef.current) {
      console.log(`🧹 Clearing border highlight${copyLabel} for ${hoveredCountry}`);
      worldContainer.removeChild(borderHighlightRef.current);
      borderHighlightRef.current.destroy();
      borderHighlightRef.current = null;
    }
    setHoveredCountry(null);
  });
  
  return graphics;
}

/**
 * Renders province boundaries on top of country boundaries
 */
function renderProvinceBoundaries(
  provinceData: Record<string, GeoJSONFeature>,
  worldContainer: PIXI.Container,
  app: PIXI.Application,
  zoomLevel: number,
  zoomCenter: { x: number; y: number },
  selectedProvince: string | undefined,
  onProvinceSelect: (provinceId: string | undefined) => void
) {
  console.log(`🏛️ Rendering ${Object.keys(provinceData).length} provinces`);
  console.log(`🏛️ Province IDs:`, Object.keys(provinceData));
  console.log(`🏛️ Container children before adding provinces:`, worldContainer.children.length);
  
  const baseScale = Math.min(app.screen.width / 360, app.screen.height / 180);
  const worldWidth = 360 * baseScale;
  
  let totalProvincesAdded = 0;
  
  // Render provinces for each world copy (left, center, right)
  [-worldWidth, 0, worldWidth].forEach((offsetX, copyIndex) => {
    const copyLabel = copyIndex === 0 ? " (left)" : copyIndex === 1 ? " (center)" : " (right)";
    
    Object.entries(provinceData).forEach(([provinceId, province]) => {
      console.log(`🎨 Creating province graphics for ${provinceId}${copyLabel}`);
      
      const graphics = new PIXI.Graphics();
      
      // Check if this province is selected
      const isSelected = selectedProvince === provinceId || selectedProvince === province.properties?.name;
      
      // Different styling for provinces vs countries - make them MUCH more visible!
      const fillColor = isSelected ? 0xff4444 : 0x90EE90; // Light green for provinces, bright red for selected
      const strokeColor = 0x000000; // Black border for maximum contrast
      const strokeWidth = isSelected ? 4 : 3; // Even thicker borders for visibility
      
      console.log(`🎨 Styling province ${provinceId}: fill=${fillColor.toString(16)}, stroke=${strokeColor.toString(16)}, width=${strokeWidth}`);
      
      // Draw the province
      drawProvinceFeature(
        province,
        graphics,
        fillColor,
        app.screen.width,
        app.screen.height,
        offsetX,
        zoomLevel,
        zoomCenter,
        0
      );
      
      // Add border with enhanced visibility
      graphics.lineStyle(strokeWidth, strokeColor, 1);
      
      // Set full opacity for maximum visibility
      graphics.alpha = 1.0;
      
      // Make interactive
      graphics.eventMode = 'static';
      graphics.cursor = 'pointer';
      
      // Add click handler for provinces
      graphics.on('pointerdown', (event) => {
        // Stop propagation to prevent country click
        event.stopPropagation();
        console.log(`🏛️ Clicked on province${copyLabel}: ${provinceId}`);
        onProvinceSelect(provinceId);
      });
      
      // Add hover effects
      graphics.on('pointerover', () => {
        graphics.tint = 0xdddddd;
        console.log(`🏛️ Hovering province${copyLabel}: ${provinceId}`);
      });
      
      graphics.on('pointerout', () => {
        graphics.tint = 0xffffff;
      });
      
      worldContainer.addChild(graphics);
      totalProvincesAdded++;
      
      console.log(`✅ Added province ${provinceId}${copyLabel} to container (total: ${totalProvincesAdded})`);
    });
  });
  
  console.log(`🏛️ Final result: ${totalProvincesAdded} total province graphics added to container`);
  console.log(`🏛️ Container children after adding provinces:`, worldContainer.children.length);
}

export function WorldMapWebGL({
  provinces,
  selectedProvince,
  mapOverlay,
  onProvinceSelect,
  onOverlayChange,
  detailLevel = 'overview',
  renderMode = 'legacy'
}: WorldMapWebGLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const worldContainerRef = useRef<PIXI.Container | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [provinceBoundariesData, setProvinceBoundariesData] = useState<any>(null);
  const [provinceDetailBoundaries, setProvinceDetailBoundaries] = useState<Record<string, any>>({});
  const [selectedCountryForProvinces, setSelectedCountryForProvinces] = useState<string | null>(null);
  const [currentDetailLevel, setCurrentDetailLevel] = useState<DetailLevel>(detailLevel);
  const [currentRenderMode, setCurrentRenderMode] = useState<RenderMode>(renderMode);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState({ x: 0, y: 0 });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const borderHighlightRef = useRef<PIXI.Graphics | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomCenter, setZoomCenter] = useState({ x: 0, y: 0 });
  const zoomLevelRef = useRef(1);

  // Debug: Log initial render mode
  console.log(`🔧 WorldMapWebGL initialized with renderMode prop: "${renderMode}", currentRenderMode state: "${currentRenderMode}"`);

  // Debug: Track renderMode changes
  const setCurrentRenderModeWithDebug = useCallback((newMode: RenderMode) => {
    console.log(`🔄 setCurrentRenderMode called: "${currentRenderMode}" -> "${newMode}"`);
    console.trace('🔍 setCurrentRenderMode call stack:');
    setCurrentRenderMode(newMode);
  }, [currentRenderMode]);
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  
  // Single loading lock to prevent concurrent tile loading
  const isLoadingTilesRef = useRef(false);
  // Set to track tiles being processed to prevent duplicates
  const tilesBeingLoadedRef = useRef<Set<string>>(new Set());
  // Debounce timer ref for tile loading
  const tileLoadDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to access loaded tiles without causing re-renders
  const loadedTilesRef = useRef<Set<string>>(new Set());
  // Atomic lock for adding tiles to world container
  const addingTileRef = useRef<string | null>(null);
  // Version counter to detect stale updates
  const loadVersionRef = useRef(0);
  // Track last activity to detect idle periods
  const lastActivityRef = useRef(Date.now());
  // Flag to prevent initial load race conditions
  const initialLoadCompleteRef = useRef(false);

  // Camera center tracking in map coordinates (lat, lon)
  const [cameraCenter, setCameraCenter] = useState({ lat: 0, lon: 0 });
  const cameraCenterRef = useRef({ lat: 0, lon: 0 });

  // Function to update camera center based on current pan/zoom state
  const updateCameraCenter = useCallback(() => {
    if (!appRef.current) return;
    
    const app = appRef.current;
    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;
    
    // Calculate the world coordinates of the screen center
    const worldCoords = screenToWorldCoordinates(
      screenWidth / 2,  // Screen center X
      screenHeight / 2, // Screen center Y
      screenWidth,
      screenHeight,
      panOffsetRef.current.x,
      zoomLevelRef.current,
      zoomCenter,
      panOffsetRef.current.y
    );
    
    // Update both state and ref
    cameraCenterRef.current = worldCoords;
    setCameraCenter(worldCoords);
    
    // Debug logging (throttled)
    const now = Date.now();
    if (now - lastLogTimeRef.current > 500) { // Log at most every 500ms
      console.log(`📍 Camera center: (${worldCoords.lat.toFixed(2)}, ${worldCoords.lon.toFixed(2)}) at zoom ${zoomLevelRef.current.toFixed(2)}`);
      lastLogTimeRef.current = now;
    }
  }, [zoomCenter, panOffset, zoomLevel]);

  // Tile Visibility & Culling System State
  const [loadedTiles, setLoadedTiles] = useState<Set<string>>(new Set());
  const [visibleTiles, setVisibleTiles] = useState<TileInfo[]>([]);
  const [viewportState, setViewportState] = useState<ViewportState>({
    center: { x: 0, y: 0 }, // World center (longitude, latitude)
    zoom: 1,
    screenWidth: 800,
    screenHeight: 600,
    panOffset: { x: 0, y: 0 }
  });
  const tileContainersRef = useRef<Map<string, PIXI.Container>>(new Map());
  const lastVisibilityUpdateRef = useRef<number>(0);
  const lastLogTimeRef = useRef<number>(0);
  const [showTileDebug, setShowTileDebug] = useState(false);
  const lastDetailLevelChangeRef = useRef<number>(0);
  const detailLevelStabilityRef = useRef<{ level: DetailLevel; startTime: number } | null>(null);
  const detailLevelLockedRef = useRef<boolean>(false);
  const zoomHistoryRef = useRef<number[]>([]);
  const lastZoomChangeRef = useRef<number>(0);

  // Debug hook
  useEffect(() => {
    // General debug functions (available in all modes)
    (window as any).testProvinceURL = (countryCode: string, detailLevel: string) => {
      geoManager.testProvinceURL(countryCode, detailLevel as DetailLevel);
    };
    
    // Add camera state debug to window for easy access
    (window as any).getCameraState = () => {
      const state = {
        center: cameraCenterRef.current,
        zoom: zoomLevelRef.current,
        panOffset: panOffsetRef.current,
        zoomCenter: zoomCenter
      };
      console.log('📷 Current camera state:', state);
      return state;
    };

    // Conditional debug functions based on render mode
    if (currentRenderMode === 'tiles') {
      // TILE MODE: Tile-specific debug functions
      (window as any).toggleTileDebug = () => {
        setShowTileDebug(prev => !prev);
        console.log('🔍 Tile debug visibility toggled');
      };
      
      // Add visible tiles calculation to window for testing
      (window as any).getVisibleTilesFromCamera = () => {
        const center = cameraCenterRef.current;
        const zoom = zoomLevelRef.current;
        console.log(`🔍 Calculating visible tiles for camera at (${center.lat.toFixed(2)}, ${center.lon.toFixed(2)}) zoom ${zoom.toFixed(2)}`);
        
        if (getVisibleTilesWithLOD) {
          const tiles = getVisibleTilesWithLOD(center, zoom);
          console.log(`📍 Visible tiles:`, tiles);
          return tiles;
        } else {
          console.warn('⚠️ getVisibleTilesWithLOD not available');
          return [];
        }
      };

      // Add function to check for duplicate tiles
      (window as any).checkDuplicateTiles = () => {
        if (!worldContainerRef.current) {
          console.log('❌ No world container');
          return;
        }
        
        const tileNames = new Map<string, number>();
        const positionMap = new Map<string, string[]>(); // position -> tile names
        
        worldContainerRef.current.children.forEach(child => {
          if (child.name && child.name.startsWith('tile_')) {
            const count = tileNames.get(child.name) || 0;
            tileNames.set(child.name, count + 1);
            
            // Track positions
            const posKey = `${Math.round(child.position.x)},${Math.round(child.position.y)}`;
            if (!positionMap.has(posKey)) {
              positionMap.set(posKey, []);
            }
            positionMap.get(posKey)!.push(child.name);
          }
        });
        
        const duplicates = Array.from(tileNames.entries()).filter(([name, count]) => count > 1);
        const overlaps = Array.from(positionMap.entries()).filter(([pos, names]) => names.length > 1);
        
        if (duplicates.length > 0) {
          console.error('🚨 DUPLICATE TILES FOUND:', duplicates);
        }
        
        if (overlaps.length > 0) {
          console.error('🚨 OVERLAPPING TILES FOUND:');
          overlaps.forEach(([pos, names]) => {
            console.error(`  Position ${pos}: ${names.join(', ')}`);
          });
        }
        
        if (duplicates.length === 0 && overlaps.length === 0) {
          console.log('✅ No duplicate or overlapping tiles found');
        }
        
        return { duplicates, overlaps };
      };
      
      // Add comprehensive tile system debug function
      (window as any).debugTileSystem = () => {
        const center = cameraCenterRef.current;
        const zoom = zoomLevelRef.current;
        const loadedCount = loadedTiles.size;
        const visibleCount = visibleTiles.length;
        const containerCount = tileContainersRef.current.size;
        
        console.log('🔧 TILE SYSTEM DEBUG REPORT:');
        console.log(`📍 Camera: (${center.lat.toFixed(3)}, ${center.lon.toFixed(3)}) @ zoom ${zoom.toFixed(2)}`);
        console.log(`📊 Tiles: ${visibleCount} visible, ${loadedCount} loaded, ${containerCount} containers`);
        console.log(`🎯 Detail level: ${currentDetailLevel}`);
        
        // List loaded tiles with positions
        if (worldContainerRef.current && appRef.current) {
          console.log(`📋 Loaded tiles with positions:`);
          worldContainerRef.current.children.forEach(child => {
            if (child.name?.startsWith('tile_')) {
              const info = (child as any).tileInfo;
              console.log(`  ${child.name}: screen=(${child.position.x.toFixed(1)}, ${child.position.y.toFixed(1)}), world=(${info?.worldX}, ${info?.worldY})`);
            }
          });
        }
        
        // List visible tiles
        console.log(`👀 Visible tiles:`, visibleTiles.map(t => t.id).sort());
        
        // Show GeographicDataManager cache stats
        const geoStats = geoManager.getCacheStats();
        console.log(`💾 GeographicDataManager cache: ${geoStats.entryCount} entries, ${geoStats.totalSizeMB.toFixed(1)}MB`);
        
        // Show tile containers
        const containers = Array.from(tileContainersRef.current.entries()).map(([id, container]) => ({
          id,
          name: container.name,
          children: container.children.length,
          visible: container.visible
        }));
        console.log(`🗂️ Tile containers:`, containers);
        
        // Show what tiles should be visible now
        const currentVisible = getVisibleTilesWithLOD(
          { lat: center.lat, lon: center.lon },
          zoom,
          5
        );
        console.log(`🔍 Should be visible (GeographicDataManager):`, currentVisible.sort());
        
        // Show tile rendering info
        const renderedTiles = Array.from(tileContainersRef.current.entries()).map(([tileKey, container]) => {
          const tileInfo = (container as any).tileInfo;
          return {
            tileKey,
            rendered: container.children.length > 0,
            featureCount: tileInfo?.featureCount || 0,
            failed: tileInfo?.failed || false,
            position: { x: container.position.x, y: container.position.y },
            scale: container.scale.x
          };
        });
        console.log(`🎨 Rendered tiles:`, renderedTiles);
        
        return {
          camera: { lat: center.lat, lon: center.lon, zoom },
          tiles: { visible: visibleCount, loaded: loadedCount, containers: containerCount },
          detailLevel: currentDetailLevel,
          loadedTiles: Array.from(loadedTiles).sort(),
          visibleTiles: visibleTiles.map(t => t.id).sort(),
          shouldBeVisible: currentVisible.sort(),
          renderedTiles,
          geoManagerStats: geoStats,
          containers
        };
      };

      // Add tile cleanup function
      (window as any).cleanupTiles = () => {
        console.log('🧹 Manual tile cleanup initiated...');
        // We'll call the culling function when it's defined
        console.log('✅ Manual tile cleanup function registered');
      };
      
      // Add function to clear ALL tiles for debugging
      (window as any).clearAllTiles = () => {
        console.log('🗑️ Clearing ALL tiles...');
        
        // Clear all tile containers
        tileContainersRef.current.forEach((tileContainer, tileKey) => {
          if (worldContainerRef.current && tileContainer.parent === worldContainerRef.current) {
            worldContainerRef.current.removeChild(tileContainer);
          }
          tileContainer.destroy({ children: true, texture: false });
        });
        tileContainersRef.current.clear();
        
        // Clear loaded tiles
        setLoadedTiles(new Set());
        loadedTilesRef.current.clear();
        
        // Clear loading state
        isLoadingTilesRef.current = false;
        tilesBeingLoadedRef.current.clear();
        loadVersionRef.current++;
        
        console.log('✅ All tiles cleared');
      };
      
      // Add function to check loading state
      (window as any).checkLoadingState = () => {
        console.log('🔍 Loading State Check:');
        console.log(`  isLoadingTiles: ${isLoadingTilesRef.current}`);
        console.log(`  tilesBeingLoaded: ${tilesBeingLoadedRef.current.size} tiles`, Array.from(tilesBeingLoadedRef.current));
        console.log(`  loadedTiles: ${loadedTilesRef.current.size} tiles`);
        console.log(`  tileContainers: ${tileContainersRef.current.size} containers`);
        console.log(`  addingTile: ${addingTileRef.current}`);
        console.log(`  loadVersion: ${loadVersionRef.current}`);
        console.log(`  initialLoadComplete: ${initialLoadCompleteRef.current}`);
        console.log(`  lastActivity: ${Date.now() - lastActivityRef.current}ms ago`);
        console.log(`  worldContainer children: ${worldContainerRef.current?.children.filter(c => c.name?.startsWith('tile_')).length || 0} tiles`);
      };
      
      // Add emergency cleanup function
      (window as any).emergencyCleanup = () => {
        console.log('🚨 Emergency cleanup initiated...');
        
        // Stop all operations
        isLoadingTilesRef.current = false;
        tilesBeingLoadedRef.current.clear();
        addingTileRef.current = null;
        if (tileLoadDebounceRef.current) {
          clearTimeout(tileLoadDebounceRef.current);
          tileLoadDebounceRef.current = null;
        }
        
        // Force sync world container with our state
        if (worldContainerRef.current) {
          const actualTiles = new Map<string, PIXI.Container>();
          const duplicates: string[] = [];
          
          // Find all tile containers and remove duplicates
          worldContainerRef.current.children.forEach(child => {
            if (child.name?.startsWith('tile_')) {
              const tileKey = child.name.replace('tile_', '');
              if (actualTiles.has(tileKey)) {
                // Duplicate found - remove it
                worldContainerRef.current!.removeChild(child);
                (child as any).destroy({ children: true, texture: false });
                duplicates.push(tileKey);
              } else {
                actualTiles.set(tileKey, child as PIXI.Container);
              }
            }
          });
          
          // Update our refs to match reality
          tileContainersRef.current.clear();
          actualTiles.forEach((container, tileKey) => {
            tileContainersRef.current.set(tileKey, container);
          });
          
          // Update state
          const actualTileKeys = new Set(actualTiles.keys());
          setLoadedTiles(actualTileKeys);
          loadedTilesRef.current = actualTileKeys;
          
          console.log(`✅ Emergency cleanup complete: removed ${duplicates.length} duplicates, synced ${actualTileKeys.size} tiles`);
        }
      };
    } else if (currentRenderMode === 'legacy') {
      // LEGACY MODE: Clear tile-specific debug functions and add legacy-specific ones
      (window as any).toggleTileDebug = () => {
        console.log('ℹ️ Tile debug not available in legacy mode');
      };
      
      (window as any).getVisibleTilesFromCamera = () => {
        console.log('ℹ️ Tile visibility calculation not available in legacy mode');
        return [];
      };
      
      (window as any).debugTileSystem = () => {
        console.log('ℹ️ Tile system debug not available in legacy mode');
        return { message: 'Not available in legacy mode' };
      };
      
      (window as any).cleanupTiles = () => {
        console.log('ℹ️ Tile cleanup not needed in legacy mode');
      };
    }
  }, [zoomCenter, currentDetailLevel, loadedTiles, visibleTiles, currentRenderMode]);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef(false);

  // Sync zoom level with ref and update camera center
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
    updateCameraCenter();
  }, [zoomLevel, updateCameraCenter]);

  // Update camera center when pan offset changes
  useEffect(() => {
    panOffsetRef.current = panOffset;
    updateCameraCenter();
  }, [panOffset, updateCameraCenter]);

  // Sync detail level with prop
  useEffect(() => {
    if (detailLevel !== currentDetailLevel) {
      setCurrentDetailLevel(detailLevel);
    }
  }, [detailLevel, currentDetailLevel]);

  // Track previous render mode for cleanup logic
  const prevRenderModeRef = useRef<RenderMode>(currentRenderMode);
  
  // Handle cleanup when render mode changes internally
  useEffect(() => {
    const prevMode = prevRenderModeRef.current;
    const currentMode = currentRenderMode;
    
    if (prevMode !== currentMode) {
      console.log(`🔄 Internal render mode change detected: ${prevMode} → ${currentMode}`);
      
      // Cleanup tiles when switching away from tile mode
      if (prevMode === 'tiles') {
        console.log('🧹 Cleaning up tiles when switching from tile mode...');
        
        // Clear loading locks and refs
        isLoadingTilesRef.current = false;
        tilesBeingLoadedRef.current.clear();
        if (tileLoadDebounceRef.current) {
          clearTimeout(tileLoadDebounceRef.current);
          tileLoadDebounceRef.current = null;
        }
        
        // Clear all tile containers
        tileContainersRef.current.forEach((tileContainer, tileKey) => {
          if (worldContainerRef.current && tileContainer.parent === worldContainerRef.current) {
            worldContainerRef.current.removeChild(tileContainer);
          }
          tileContainer.destroy({ children: true, texture: false });
        });
        tileContainersRef.current.clear();
        setLoadedTiles(new Set());
        loadedTilesRef.current.clear();
        console.log('✅ Tile cleanup completed');
      }
      
      // Clear tiles when switching TO tile mode to start fresh
      if (currentMode === 'tiles') {
        console.log('🧹 Clearing tiles when switching to tile mode for fresh start...');
        
        // Reset initial load flag
        initialLoadCompleteRef.current = false;
        lastActivityRef.current = Date.now();
        
        // Clear loading locks and refs for fresh start
        isLoadingTilesRef.current = false;
        tilesBeingLoadedRef.current.clear();
        addingTileRef.current = null;
        if (tileLoadDebounceRef.current) {
          clearTimeout(tileLoadDebounceRef.current);
          tileLoadDebounceRef.current = null;
        }
        
        // Clear any existing tile containers
        tileContainersRef.current.forEach((tileContainer, tileKey) => {
          if (worldContainerRef.current && tileContainer.parent === worldContainerRef.current) {
            worldContainerRef.current.removeChild(tileContainer);
          }
          tileContainer.destroy({ children: true, texture: false });
        });
        tileContainersRef.current.clear();
        setLoadedTiles(new Set());
        loadedTilesRef.current.clear();
        
        // Also clear any visual artifacts from world container
        if (worldContainerRef.current) {
          // Remove any orphaned tile containers that might be attached
          const childrenToRemove = worldContainerRef.current.children.filter(child => 
            child.name && child.name.startsWith('tile_')
          );
          childrenToRemove.forEach(child => {
            worldContainerRef.current!.removeChild(child);
            if (typeof (child as any).destroy === 'function') {
              (child as any).destroy({ children: true, texture: false });
            }
          });
          console.log(`🧹 Removed ${childrenToRemove.length} orphaned tile containers from world container`);
        }
        
        console.log('✅ Tile fresh start cleanup completed');
      }
      
      // Update the ref to track the current mode for next comparison
      prevRenderModeRef.current = currentMode;
      console.log(`🔄 Render mode change completed: ${currentMode}`);
    }
  }, [currentRenderMode]);

  // Clear province cache when quality level changes and reload provinces
  useEffect(() => {
    if (selectedCountryForProvinces) {
      // Clear cached province data to force reload with new quality
      geoManager.clearProvinceCache(selectedCountryForProvinces);
      
      // Reset province detail boundaries to force reload
      setProvinceDetailBoundaries({});
      
      console.log(`🔄 Quality changed to ${currentDetailLevel}, clearing province cache for ${selectedCountryForProvinces}`);
    }
  }, [currentDetailLevel, selectedCountryForProvinces]);

  // Sync zoom level ref
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  // Sync pan offset ref
  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  // Sync dragging state ref
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // Update viewport state when camera tracking variables change
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    setViewportState(prev => ({
      ...prev,
      center: { x: cameraCenterRef.current.lon, y: cameraCenterRef.current.lat },
      zoom: zoomLevel,
      panOffset,
      screenWidth: app.screen.width,
      screenHeight: app.screen.height
    }));
  }, [cameraCenter, zoomLevel, panOffset]);

  // Tile Visibility Management
  const updateVisibleTiles = useCallback(() => {
    const now = Date.now();
    
    // Throttle updates to avoid excessive computation
    if (now - lastVisibilityUpdateRef.current < 100) return;
    lastVisibilityUpdateRef.current = now;

    if (!appRef.current) return;

    const app = appRef.current;
    const currentViewport: ViewportState = {
      center: viewportState.center,
      zoom: zoomLevel,
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      panOffset
    };

    // Use getVisibleTilesWithLOD for accurate tile calculation
    const geoManagerTileKeys = getVisibleTilesWithLOD(
      { lat: currentViewport.center.y, lon: currentViewport.center.x },
      currentViewport.zoom,
      5 // 5x5 grid of tiles
    );

    // Convert tile keys to TileInfo objects for compatibility with existing system
    const newVisibleTiles = geoManagerTileKeys.map(tileKey => {
      const parsed = geoManager.parseTileKey(tileKey);
      if (!parsed) {
        console.warn(`⚠️ Invalid tile key: ${tileKey}`);
        return null;
      }

      // Calculate distance from center for prioritization
      const deltaX = parsed.worldX - currentViewport.center.x;
      const deltaY = parsed.worldY - currentViewport.center.y;
      const distanceFromCenter = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      return {
        id: tileKey,
        detailLevel: parsed.detailLevel,
        x: parsed.tileX,           // Tile coordinate X
        y: parsed.tileY,           // Tile coordinate Y
        lat: parsed.worldY,        // World Y coordinate (latitude)
        lon: parsed.worldX,        // World X coordinate (longitude)
        distanceFromCenter,
        isLoaded: loadedTiles.has(tileKey)
      } as TileInfo & { distanceFromCenter: number; isLoaded: boolean };
    }).filter(Boolean) as (TileInfo & { distanceFromCenter: number; isLoaded: boolean })[];

    // Use GeographicDataManager tiles as primary source
    setVisibleTiles(newVisibleTiles);

    // Log tile information for debugging
    if (now - lastLogTimeRef.current > 2000) { // Log every 2 seconds
      console.log(`🔍 Visible tiles: ${newVisibleTiles.length} tiles at ${currentDetailLevel} (zoom: ${zoomLevel.toFixed(2)})`);
      console.log(`📍 Center: (${currentViewport.center.y.toFixed(2)}, ${currentViewport.center.x.toFixed(2)})`);
      console.log(`� Tile keys:`, geoManagerTileKeys.slice(0, 5).map(key => key));
      lastLogTimeRef.current = now;
    }

    // Track zoom changes for stability analysis
    if (Math.abs(zoomLevel - (zoomHistoryRef.current[zoomHistoryRef.current.length - 1] || 0)) > 0.01) {
      zoomHistoryRef.current.push(zoomLevel);
      lastZoomChangeRef.current = now;
      
      // Keep only last 10 zoom changes
      if (zoomHistoryRef.current.length > 10) {
        zoomHistoryRef.current.shift();
      }
    }

    // Check if zoom is stabilizing
    const zoomStabilized = now - lastZoomChangeRef.current > 1500;
    const recentZoomVariance = zoomHistoryRef.current.length > 1 ? 
      Math.abs(zoomHistoryRef.current[zoomHistoryRef.current.length - 1] - zoomHistoryRef.current[0]) : 0;
    const zoomIsStable = zoomStabilized && recentZoomVariance < 0.2;

    // Aggressive anti-oscillation system with zoom tracking
    const newDetailLevel = getDetailLevelFromZoom(zoomLevel, currentDetailLevel);
    
    // Check if we're locked (prevent changes during unstable periods)
    if (detailLevelLockedRef.current) {
      const lockDuration = 3000; // 3 second lock after any change
      if (now - lastDetailLevelChangeRef.current > lockDuration && zoomIsStable) {
        detailLevelLockedRef.current = false;
        console.log(`🔓 Detail level unlocked after ${lockDuration}ms stability period`);
      } else {
        // Still locked, ignore any detail level change requests
        return;
      }
    }
    
    if (newDetailLevel !== currentDetailLevel) {
      // AGGRESSIVE stability requirements - increased all timings
      const stabilityTime = 2000; // Doubled from 1000ms
      // Also require minimum 4 seconds between any detail level changes
      const minTimeBetweenChanges = 4000; // Doubled from 2000ms
      const timeSinceLastChange = now - lastDetailLevelChangeRef.current;
      
      if (timeSinceLastChange < minTimeBetweenChanges) {
        // Too soon since last change, ignore this request
        console.log(`⏸️ Detail level change blocked - too soon (need ${minTimeBetweenChanges}ms, only ${timeSinceLastChange}ms)`);
        return;
      }
      
      if (!zoomIsStable) {
        console.log(`⏸️ Detail level change blocked - zoom not stable (variance: ${recentZoomVariance.toFixed(3)})`);
        detailLevelStabilityRef.current = null; // Reset any pending change
        return;
      }
      
      if (!detailLevelStabilityRef.current || detailLevelStabilityRef.current.level !== newDetailLevel) {
        // Start new stability period
        detailLevelStabilityRef.current = { level: newDetailLevel, startTime: now };
        console.log(`⏳ Detail level change pending: ${currentDetailLevel} → ${newDetailLevel} (zoom: ${zoomLevel.toFixed(2)}) - waiting ${stabilityTime}ms`);
      } else if (now - detailLevelStabilityRef.current.startTime >= stabilityTime) {
        // Stability period completed, change detail level
        console.log(`� Detail level change: ${currentDetailLevel} → ${newDetailLevel} (zoom: ${zoomLevel.toFixed(2)})`);
        setCurrentDetailLevel(newDetailLevel);
        lastDetailLevelChangeRef.current = now;
        detailLevelStabilityRef.current = null;
      }
    } else {
      // Reset stability tracker if we're back to current level
      if (detailLevelStabilityRef.current) {
        console.log(`↩️ Detail level change cancelled - back to ${currentDetailLevel} (zoom: ${zoomLevel.toFixed(2)})`);
        detailLevelStabilityRef.current = null;
      }
    }

    // Only log every 1 second to reduce console spam
    if (now - lastLogTimeRef.current > 1000) {
      console.log(`🔍 Visible tiles: ${newVisibleTiles.length} at ${currentDetailLevel} (zoom: ${zoomLevel.toFixed(2)})`);
      lastLogTimeRef.current = now;
    }
  }, [viewportState.center, zoomLevel, panOffset, currentDetailLevel]);

  // Enhanced Tile Culling Management
  const cullInvisibleTiles = useCallback(() => {
    if (loadedTiles.size === 0) return; // No tiles to cull
    
    // Don't cull while loading to prevent race conditions
    if (isLoadingTilesRef.current) {
      console.log('🔒 Skipping culling - tiles are being loaded');
      return;
    }

    const currentTileIds = Array.from(loadedTiles);
    const currentCenter = { lat: viewportState.center.y, lon: viewportState.center.x };
    
    // Simple culling logic: remove tiles that are too far from center
    const cullDistance = 4; // Keep tiles up to 4 tile-widths away
    const keep: string[] = [];
    const cull: string[] = [];
    
    currentTileIds.forEach(tileId => {
      try {
        const parsed = geoManager.parseTileKey(tileId);
        if (!parsed) {
          cull.push(tileId);
          return;
        }
        
        // Calculate distance from center
        const deltaLat = Math.abs(parsed.worldY - currentCenter.lat);
        const deltaLon = Math.abs(parsed.worldX - currentCenter.lon);
        const distance = Math.max(deltaLat / 10, deltaLon / 10); // Convert to tile units
        
        if (distance > cullDistance) {
          cull.push(tileId);
        } else {
          keep.push(tileId);
        }
      } catch (error) {
        // If parsing fails, cull the tile
        cull.push(tileId);
      }
    });

    const finalCull = cull;
    const finalKeep = keep;

    if (finalCull.length > 0) {
      console.log(`🗑️ Culling ${finalCull.length} tiles: ${finalCull.slice(0, 3).join(', ')}${finalCull.length > 3 ? '...' : ''}`);
      console.log(`📌 Keeping ${finalKeep.length} tiles in view`);
      
      // Remove culled tiles from containers
      finalCull.forEach(tileId => {
        const container = tileContainersRef.current.get(tileId);
        if (container && worldContainerRef.current) {
          // Also check if container is actually in world
          if (container.parent === worldContainerRef.current) {
            worldContainerRef.current.removeChild(container);
          }
          container.destroy({ children: true, texture: false });
          tileContainersRef.current.delete(tileId);
          console.log(`🗂️ Removed tile container: ${tileId}`);
        }
        // Also clear from being loaded set
        tilesBeingLoadedRef.current.delete(tileId);
        
        // Double-check world container doesn't have any orphaned tiles with this name
        const orphaned = worldContainerRef.current?.children.filter(
          child => child.name === `tile_${tileId}`
        );
        if (orphaned && orphaned.length > 0) {
          console.warn(`⚠️ Found ${orphaned.length} orphaned tile(s) ${tileId}, removing`);
          orphaned.forEach(child => {
            worldContainerRef.current!.removeChild(child);
            if (typeof (child as any).destroy === 'function') {
              (child as any).destroy({ children: true, texture: false });
            }
          });
        }
      });

      // Update loaded tiles set - both state and ref
      setLoadedTiles(prev => {
        const newSet = new Set(prev);
        finalCull.forEach(tileId => newSet.delete(tileId));
        loadedTilesRef.current = newSet; // Keep ref in sync
        console.log(`📊 Tile count: ${prev.size} → ${newSet.size} (culled ${finalCull.length})`);
        return newSet;
      });

      // Optionally clear GeographicDataManager cache for culled tiles
      // Note: We don't clear ALL cache to preserve performance
      console.log(`💾 Preserving cache for performance (${finalCull.length} tiles culled from render)`);
    }
  }, [loadedTiles, viewportState.center, zoomLevel]);

  // Render geographic features for a tile
  const renderTileFeatures = useCallback(async (
    tileContainer: PIXI.Container, 
    tileData: any, 
    tileKey: string
  ) => {
    if (!tileData || !tileData.features || !Array.isArray(tileData.features)) {
      console.warn(`⚠️ Invalid tile data for ${tileKey}`);
      return;
    }

    const app = appRef.current;
    if (!app) return;

    console.log(`🎨 Rendering ${tileData.features.length} features for tile ${tileKey}`);

    // Clear any existing graphics in this tile container
    tileContainer.removeChildren();

    // Create a graphics object for this tile
    const tileGraphics = new PIXI.Graphics();
    tileGraphics.name = `graphics_${tileKey}`;

    // Render each feature in the tile
    for (const feature of tileData.features) {
      try {
        // Use the existing drawProvinceFeature function to render each feature
        const featureGraphics = new PIXI.Graphics();
        
        // Set appropriate colors based on feature type or properties
        const color = getFeatureColor(feature);
        
        drawProvinceFeature(
          feature,
          featureGraphics,
          color,
          app.screen.width,
          app.screen.height,
          panOffsetRef.current.x,
          zoomLevelRef.current,
          zoomCenter,
          panOffsetRef.current.y
        );

        // Add the feature graphics to the tile graphics
        tileGraphics.addChild(featureGraphics);
        
      } catch (error) {
        console.warn(`⚠️ Failed to render feature in tile ${tileKey}:`, error);
      }
    }

    // Add the completed graphics to the tile container
    tileContainer.addChild(tileGraphics);
    
    console.log(`✅ Rendered tile ${tileKey} with ${tileData.features.length} features`);
  }, [panOffsetRef, zoomLevelRef, zoomCenter]);

  // Get appropriate color for a geographic feature
  const getFeatureColor = useCallback((feature: any): number => {
    // Default color scheme for geographic features
    const featureType = feature.properties?.type || 'unknown';
    
    switch (featureType) {
      case 'country':
      case 'nation':
        return 0x4CAF50; // Green for countries
      case 'province':
      case 'state':
        return 0x2196F3; // Blue for provinces/states
      case 'city':
        return 0xFF9800; // Orange for cities
      case 'water':
      case 'ocean':
        return 0x03A9F4; // Light blue for water
      default:
        return 0x9E9E9E; // Gray for unknown features
    }
  }, []);

  // Update tile positions and scale when viewport changes
  const updateTileTransforms = useCallback(() => {
    if (!appRef.current) return;
    
    // Skip transform updates if we're loading to prevent interference
    if (isLoadingTilesRef.current) {
      console.log('⏸️ Skipping transform update - tiles are being loaded');
      return;
    }
    
    const app = appRef.current;
    
    // Update all loaded tile containers with new transformations
    let updateCount = 0;
    tileContainersRef.current.forEach((tileContainer, tileKey) => {
      try {
        // Parse tile key to get world coordinates
        const parsed = geoManager.parseTileKey(tileKey);
        if (!parsed) return;
        
        // Calculate tile position consistently with initial positioning
        const pixelsPerDegreeX = app.screen.width / 360;
        const pixelsPerDegreeY = app.screen.height / 180;
        
        // Convert world coordinates to screen coordinates
        const baseX = parsed.worldX * pixelsPerDegreeX;
        const baseY = -parsed.worldY * pixelsPerDegreeY;
        
        // Apply pan offset and zoom
        const screenX = (baseX * zoomLevelRef.current) + panOffsetRef.current.x;
        const screenY = (baseY * zoomLevelRef.current) + panOffsetRef.current.y;
        
        // Update tile container position
        tileContainer.position.set(screenX, screenY);
        
        // Scale the tile based on zoom level
        const tileScale = zoomLevelRef.current;
        tileContainer.scale.set(tileScale);
        
        updateCount++;
        
      } catch (error) {
        console.warn(`⚠️ Failed to update transform for tile ${tileKey}:`, error);
      }
    });
    
    // Only log if significant updates
    if (updateCount > 0 && Date.now() - lastLogTimeRef.current > 1000) {
      console.log(`🔄 Updated transforms for ${updateCount} tiles`);
      lastLogTimeRef.current = Date.now();
    }
  }, [zoomCenter]);

  // Enhanced Tile Loading with GeographicDataManager Integration and Duplicate Prevention
  const loadVisibleTiles = useCallback(async () => {
    if (!worldContainerRef.current) return;

    // Update activity timestamp
    lastActivityRef.current = Date.now();

    // Single loading lock - prevent any concurrent loading
    if (isLoadingTilesRef.current) {
      console.log('🔒 Tile loading already in progress, skipping');
      console.trace('🔍 Attempted concurrent load from:');
      return;
    }

    // Detect idle period and clean stale state
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    if (timeSinceLastActivity > 5000) { // 5 seconds idle
      console.log(`🧹 Idle period detected (${timeSinceLastActivity}ms), cleaning stale state`);
      tilesBeingLoadedRef.current.clear();
      addingTileRef.current = null;
      loadVersionRef.current++; // Invalidate any pending operations
    }

    const loadSessionId = Math.random().toString(36).substr(2, 9);
    const loadVersion = ++loadVersionRef.current;
    console.log(`🏁 Starting load session: ${loadSessionId} (version ${loadVersion})`);
    
    try {
      // Acquire loading lock
      isLoadingTilesRef.current = true;

      // Get visible tiles using getVisibleTilesWithLOD for accurate tile calculation
      const visibleTileKeys = getVisibleTilesWithLOD(
        { lat: viewportState.center.y, lon: viewportState.center.x },
        zoomLevel,
        5 // 5x5 grid
      );

      // Comprehensive duplicate prevention - check all refs before loading
      const tilesToLoad = visibleTileKeys.filter(tileKey => {
        // Check if already loaded (use ref to avoid stale closure)
        if (loadedTilesRef.current.has(tileKey)) {
          console.log(`⏭️ Tile ${tileKey} already in loadedTilesRef`);
          return false;
        }
        // Check if currently being loaded
        if (tilesBeingLoadedRef.current.has(tileKey)) {
          console.log(`⏭️ Tile ${tileKey} already in tilesBeingLoadedRef`);
          return false;
        }
        // Check if container already exists
        if (tileContainersRef.current.has(tileKey)) {
          console.log(`⏭️ Tile ${tileKey} already has container`);
          return false;
        }
        return true;
      });
      
      if (tilesToLoad.length === 0) {
        return;
      }

      // Parse tile information for distance sorting
      const tilesWithInfo = tilesToLoad.map(tileKey => {
        const parsed = geoManager.parseTileKey(tileKey);
        if (!parsed) return null;
        
        // Calculate distance from center for prioritization
        const deltaX = parsed.worldX - viewportState.center.x;
        const deltaY = parsed.worldY - viewportState.center.y;
        const distanceFromCenter = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        return {
          tileKey,
          detailLevel: parsed.detailLevel,
          worldX: parsed.worldX,
          worldY: parsed.worldY,
          distanceFromCenter
        };
      }).filter(Boolean);

      // Sort by distance from center for optimal loading order
      const sortedTiles = tilesWithInfo.sort((a, b) => a!.distanceFromCenter - b!.distanceFromCenter);

      console.log(`📦 [${loadSessionId}] Loading ${sortedTiles.length} new tiles (sequential):`, sortedTiles.slice(0, 3).map(t => t!.tileKey));

      // For initial load, be extra cautious with timing
      if (!initialLoadCompleteRef.current && sortedTiles.length > 0) {
        console.log(`🚀 [${loadSessionId}] Initial load detected - adding extra safety delays`);
      }

      // Sequential processing - process tiles one by one instead of in parallel
      for (const tileInfo of sortedTiles) {
        if (!tileInfo) continue;
        
        // Check if this load session is still current
        if (loadVersion !== loadVersionRef.current) {
          console.log(`⏹️ [${loadSessionId}] Load session outdated (${loadVersion} vs ${loadVersionRef.current}), aborting`);
          break;
        }
        
        const { tileKey, detailLevel } = tileInfo;
        
        // Double-check before loading (use ref to avoid stale closure)
        if (loadedTilesRef.current.has(tileKey) || 
            tilesBeingLoadedRef.current.has(tileKey) || 
            tileContainersRef.current.has(tileKey)) {
          console.log(`⏭️ Skipping ${tileKey} - already loaded or being loaded`);
          continue;
        }
        
        // Immediate marking - mark as being loaded immediately
        tilesBeingLoadedRef.current.add(tileKey);
        
        try {
          // Use the new GeographicDataManager.loadTile method
          const tileData = await geoManager.loadTile(detailLevel, tileKey);
          
          // Add small delay for initial load to prevent race conditions
          if (!initialLoadCompleteRef.current) {
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay for initial load
          }
          
          // Create container for this tile if it doesn't exist
          if (!tileContainersRef.current.has(tileKey) && worldContainerRef.current) {
            // Atomic lock check - wait if another tile is being added
            while (addingTileRef.current !== null) {
              await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // Acquire atomic lock
            addingTileRef.current = tileKey;
            
            try {
              // Double-check after acquiring lock
              if (tileContainersRef.current.has(tileKey)) {
                console.log(`⏭️ [${loadSessionId}] Tile ${tileKey} was added while waiting for lock`);
                continue;
              }
              
              // Final check - make sure no duplicate container exists in world
              const existingContainers = worldContainerRef.current.children.filter(
                child => child.name === `tile_${tileKey}`
              );
              if (existingContainers.length > 0) {
                console.warn(`⚠️ [${loadSessionId}] Found ${existingContainers.length} existing container(s) for ${tileKey} in world, removing all`);
                existingContainers.forEach(existing => {
                  worldContainerRef.current!.removeChild(existing);
                  existing.destroy({ children: true, texture: false });
                });
              }
            
            const tileContainer = new PIXI.Container();
            tileContainer.name = `tile_${tileKey}`;
            
            // Add tile metadata for debugging
            (tileContainer as any).tileInfo = {
              id: tileKey,
              detailLevel: detailLevel,
              worldX: tileInfo.worldX,
              worldY: tileInfo.worldY,
              loadTime: Date.now(),
              featureCount: tileData.features.length
            };
            
            // Inline rendering - render features directly to avoid race conditions
            if (tileData.features && tileData.features.length > 0) {
              const app = appRef.current;
              if (app) {
                console.log(`🎨 [${loadSessionId}] Inline rendering ${tileData.features.length} features for tile ${tileKey} at world pos (${tileInfo.worldX}, ${tileInfo.worldY})`);

                // Create a graphics object for this tile
                const tileGraphics = new PIXI.Graphics();
                tileGraphics.name = `graphics_${tileKey}`;

                // Render each feature in the tile
                for (const feature of tileData.features) {
                  try {
                    // Get appropriate color
                    const color = getFeatureColor(feature);
                    
                    // Begin fill for this feature
                    tileGraphics.beginFill(color);
                    tileGraphics.lineStyle(1, 0x666666, 1);
                    
                    // Draw the feature geometry directly into the tile graphics
                    // Features are already in tile-local coordinates (0-10 degrees relative to tile origin)
                    if (feature.geometry && feature.geometry.type === 'Polygon') {
                      const coordinates = feature.geometry.coordinates as number[][][];
                      if (coordinates && coordinates[0]) {
                        const ring = coordinates[0];
                        if (ring.length >= 3) {
                          // Convert degrees to pixels within tile (no global transform)
                          const pixelsPerDegreeX = app.screen.width / 360;
                          const pixelsPerDegreeY = app.screen.height / 180;
                          
                          // First point - relative to tile origin
                          const [firstLon, firstLat] = ring[0];
                          const firstX = (firstLon - tileInfo.worldX) * pixelsPerDegreeX;
                          const firstY = -(firstLat - tileInfo.worldY) * pixelsPerDegreeY;
                          
                          tileGraphics.moveTo(firstX, firstY);
                          
                          // Draw the rest of the ring
                          for (let i = 1; i < ring.length; i++) {
                            const [lon, lat] = ring[i];
                            const x = (lon - tileInfo.worldX) * pixelsPerDegreeX;
                            const y = -(lat - tileInfo.worldY) * pixelsPerDegreeY;
                            tileGraphics.lineTo(x, y);
                          }
                          
                          // Close the path
                          tileGraphics.lineTo(firstX, firstY);
                        }
                      }
                    } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
                      const multiCoords = feature.geometry.coordinates as number[][][][];
                      const pixelsPerDegreeX = app.screen.width / 360;
                      const pixelsPerDegreeY = app.screen.height / 180;
                      
                      multiCoords.forEach(polygonCoords => {
                        if (polygonCoords && polygonCoords[0]) {
                          const ring = polygonCoords[0];
                          if (ring.length >= 3) {
                            const [firstLon, firstLat] = ring[0];
                            const firstX = (firstLon - tileInfo.worldX) * pixelsPerDegreeX;
                            const firstY = -(firstLat - tileInfo.worldY) * pixelsPerDegreeY;
                            
                            tileGraphics.moveTo(firstX, firstY);
                            
                            for (let i = 1; i < ring.length; i++) {
                              const [lon, lat] = ring[i];
                              const x = (lon - tileInfo.worldX) * pixelsPerDegreeX;
                              const y = -(lat - tileInfo.worldY) * pixelsPerDegreeY;
                              tileGraphics.lineTo(x, y);
                            }
                            
                            tileGraphics.lineTo(firstX, firstY);
                          }
                        }
                      });
                    }
                    
                    // End fill for this feature
                    tileGraphics.endFill();
                    
                  } catch (error) {
                    console.warn(`⚠️ Failed to render feature in tile ${tileKey}:`, error);
                  }
                }

                // Add graphics to tile container
                tileContainer.addChild(tileGraphics);
              }
              
              // Add debug border if debug mode is on
              if (showTileDebug && appRef.current) {
                const debugGraphics = new PIXI.Graphics();
                debugGraphics.lineStyle(2, 0xff0000, 0.5); // Red border
                const tileSize = 10; // 10 degree tiles
                const tileWidth = tileSize * appRef.current.screen.width / 360;
                const tileHeight = tileSize * appRef.current.screen.height / 180;
                debugGraphics.drawRect(0, 0, tileWidth, tileHeight);
                const debugText = new PIXI.Text(tileKey, {
                  fontSize: 12,
                  fill: 0xff0000,
                  fontWeight: 'bold'
                });
                debugText.position.set(5, 5);
                debugGraphics.addChild(debugText);
                tileContainer.addChild(debugGraphics);
              }
            }
            
            // Store container reference first to claim it
            if (tileContainersRef.current.has(tileKey)) {
              console.error(`🚨 [${loadSessionId}] Container ref already exists for ${tileKey}, aborting add`);
              tileContainer.destroy({ children: true, texture: false });
              return; // Skip this tile entirely
            }
            tileContainersRef.current.set(tileKey, tileContainer);
            
            // Add to world only if ref was successfully set
            worldContainerRef.current.addChild(tileContainer);
            
            // Verify no duplicates after adding
            const duplicateCheck = worldContainerRef.current.children.filter(
              child => child.name === `tile_${tileKey}`
            );
            if (duplicateCheck.length > 1) {
              console.error(`🚨 [${loadSessionId}] DUPLICATE DETECTED: ${duplicateCheck.length} containers for ${tileKey}`);
              // Remove all but the first one
              for (let i = 1; i < duplicateCheck.length; i++) {
                worldContainerRef.current.removeChild(duplicateCheck[i]);
                duplicateCheck[i].destroy({ children: true, texture: false });
              }
            }
            
            // Log container hierarchy
            console.log(`📦 [${loadSessionId}] Container ${tileKey} added. Total world children: ${worldContainerRef.current.children.length}`);
            
            // Check for overlapping tiles at same position - more aggressive
            const myPosition = { x: tileContainer.position.x, y: tileContainer.position.y };
            const overlapping = worldContainerRef.current.children.filter(child => {
              if (child === tileContainer || !child.name?.startsWith('tile_')) return false;
              // Check position overlap (tiles at exact same position) - more precise check
              const deltaX = Math.abs(child.position.x - myPosition.x);
              const deltaY = Math.abs(child.position.y - myPosition.y);
              return deltaX < 5 && deltaY < 5; // Increased tolerance to catch near-overlaps
            });
            
            if (overlapping.length > 0) {
              console.error(`🚨 [${loadSessionId}] Tile ${tileKey} overlaps with ${overlapping.length} other tiles at position (${myPosition.x.toFixed(1)}, ${myPosition.y.toFixed(1)}):`, 
                overlapping.map(c => `${c.name}@(${c.position.x.toFixed(1)},${c.position.y.toFixed(1)})`));
              
              // Check if any overlapping tile has the same tileKey
              const sameKeyOverlaps = overlapping.filter(child => child.name === `tile_${tileKey}`);
              if (sameKeyOverlaps.length > 0) {
                console.error(`🚨 [${loadSessionId}] CRITICAL: Found exact duplicate of ${tileKey}! Removing this one.`);
                worldContainerRef.current.removeChild(tileContainer);
                tileContainer.destroy({ children: true, texture: false });
                tileContainersRef.current.delete(tileKey);
                console.log(`🗑️ [${loadSessionId}] Removed exact duplicate tile ${tileKey}`);
                continue; // Skip to next tile
              }
              
              // For position overlaps with different keys, just log warning but keep both
              console.warn(`⚠️ [${loadSessionId}] Position overlap detected but different tile keys - keeping both`);
            }
            
            // Update transform immediately
            const parsed = geoManager.parseTileKey(tileKey);
            if (parsed && appRef.current) {
              // Calculate tile position - tiles are positioned by their bottom-left corner
              const tileSize = 10; // degrees
              const pixelsPerDegreeX = appRef.current.screen.width / 360;
              const pixelsPerDegreeY = appRef.current.screen.height / 180;
              
              // Convert world coordinates to screen coordinates
              // Note: Y is inverted (positive Y goes up in world coords, down in screen coords)
              const baseX = parsed.worldX * pixelsPerDegreeX;
              const baseY = -parsed.worldY * pixelsPerDegreeY;
              
              // Apply pan offset and zoom
              const screenX = (baseX * zoomLevelRef.current) + panOffsetRef.current.x;
              const screenY = (baseY * zoomLevelRef.current) + panOffsetRef.current.y;
              
              tileContainer.position.set(screenX, screenY);
              tileContainer.scale.set(zoomLevelRef.current);
              
              console.log(`📍 [${loadSessionId}] Positioned tile ${tileKey} at (${screenX.toFixed(1)}, ${screenY.toFixed(1)}) scale: ${zoomLevelRef.current.toFixed(2)}`);
            }
            } finally {
              // Always release atomic lock
              addingTileRef.current = null;
            }
          }

          // Mark tile as loaded - update both state and ref
          setLoadedTiles(prev => {
            const newSet = new Set(prev).add(tileKey);
            loadedTilesRef.current = newSet;
            return newSet;
          });
          
          console.log(`✅ [${loadSessionId}] Loaded and rendered tile ${tileKey} at ${detailLevel} (${tileData.features.length} features)`);
          
        } catch (error) {
          console.error(`❌ Failed to load tile ${tileKey}:`, error);
          
          // Still mark as loaded to prevent retry loops - update both state and ref
          setLoadedTiles(prev => {
            const newSet = new Set(prev).add(tileKey);
            loadedTilesRef.current = newSet;
            return newSet;
          });
        } finally {
          // Always remove from being loaded set
          tilesBeingLoadedRef.current.delete(tileKey);
        }
      }

      console.log(`🎯 [${loadSessionId}] Completed loading ${sortedTiles.length} visible tiles`);
      
      // Mark initial load as complete
      if (!initialLoadCompleteRef.current && sortedTiles.length > 0) {
        initialLoadCompleteRef.current = true;
        console.log(`✅ [${loadSessionId}] Initial load completed successfully`);
      }
      
      // Final sync - ensure refs match state
      setLoadedTiles(prev => {
        loadedTilesRef.current = prev;
        console.log(`🔄 [${loadSessionId}] Final sync: ${prev.size} loaded tiles`);
        return prev;
      });
      
    } finally {
      // Always release loading lock
      isLoadingTilesRef.current = false;
      console.log(`🔓 [${loadSessionId}] Released loading lock`);
    }
  }, [viewportState.center, zoomLevel, zoomCenter, getFeatureColor]); // Removed loadedTiles to prevent re-creation

  // Debounced tile loading function
  const debouncedLoadVisibleTiles = useCallback(() => {
    if (currentRenderMode !== 'tiles' || renderMode !== 'tiles') return;
    
    // Update activity timestamp
    lastActivityRef.current = Date.now();
    
    // Clear any existing debounce timer
    if (tileLoadDebounceRef.current) {
      clearTimeout(tileLoadDebounceRef.current);
      console.log('🔄 Cleared existing debounce timer');
    }
    
    // Set new debounce timer - increased to 300ms for more stability
    const timerId = setTimeout(() => {
      console.log('⏱️ Debounced tile loading triggered');
      // Double-check we're still in tile mode
      if (currentRenderMode === 'tiles' && renderMode === 'tiles') {
        // Check for stale state before loading
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        if (timeSinceActivity > 5000) {
          console.log(`⚠️ Stale debounce detected (${timeSinceActivity}ms old), cleaning state`);
          tilesBeingLoadedRef.current.clear();
          addingTileRef.current = null;
        }
        
        loadVisibleTiles();
      }
    }, 300);
    
    tileLoadDebounceRef.current = timerId;
    console.log('⏲️ Set new debounce timer');
  }, [currentRenderMode, renderMode, loadVisibleTiles]);

  // TILE SYSTEM: Update visible tiles when viewport changes (only in tile mode)
  useEffect(() => {
    if (currentRenderMode === 'tiles' && renderMode === 'tiles') {
      updateVisibleTiles();
    }
  }, [updateVisibleTiles, currentRenderMode, renderMode]);

  // TILE SYSTEM: Single trigger effect with debouncing - combines all tile loading triggers
  useEffect(() => {
    if (currentRenderMode === 'tiles' && renderMode === 'tiles') {
      debouncedLoadVisibleTiles();
    }
    
    // Cleanup debounce timer on unmount
    return () => {
      if (tileLoadDebounceRef.current) {
        clearTimeout(tileLoadDebounceRef.current);
      }
    };
  }, [debouncedLoadVisibleTiles, currentRenderMode, renderMode, viewportState.center, zoomLevel, panOffset]);

  // TILE SYSTEM: Update tile transforms when viewport changes (only in tile mode)
  useEffect(() => {
    if (currentRenderMode === 'tiles' && renderMode === 'tiles') {
      updateTileTransforms();
    }
  }, [updateTileTransforms, panOffset, zoomLevel, zoomCenter, currentRenderMode, renderMode]);

  // TILE SYSTEM: Cull invisible tiles periodically (only in tile mode)
  useEffect(() => {
    if (currentRenderMode === 'tiles' && renderMode === 'tiles') {
      const cullInterval = setInterval(cullInvisibleTiles, 2000); // Cull every 2 seconds
      
      // Also run periodic duplicate cleanup
      const duplicateCleanupInterval = setInterval(() => {
        if (!worldContainerRef.current) return;
        
        const tileCount = new Map<string, PIXI.Container[]>();
        
        // Find all tile containers
        worldContainerRef.current.children.forEach(child => {
          if (child.name?.startsWith('tile_')) {
            const tileName = child.name;
            if (!tileCount.has(tileName)) {
              tileCount.set(tileName, []);
            }
            tileCount.get(tileName)!.push(child as PIXI.Container);
          }
        });
        
        // Remove duplicates - more aggressive checking
        let duplicatesRemoved = 0;
        tileCount.forEach((containers, tileName) => {
          if (containers.length > 1) {
            console.warn(`🚨 Periodic cleanup: Found ${containers.length} duplicates of ${tileName}`);
            // Keep the first one, remove the rest
            for (let i = 1; i < containers.length; i++) {
              worldContainerRef.current!.removeChild(containers[i]);
              containers[i].destroy({ children: true, texture: false });
              duplicatesRemoved++;
            }
            
            // Also clean up from our refs if the tile container was duplicated
            const tileKey = tileName.replace('tile_', '');
            if (tileContainersRef.current.has(tileKey)) {
              // Make sure our ref points to the remaining container
              tileContainersRef.current.set(tileKey, containers[0]);
            }
          }
        });
        
        if (duplicatesRemoved > 0) {
          console.log(`🧹 Periodic cleanup: Removed ${duplicatesRemoved} duplicate tiles`);
          
          // Force state sync after cleanup
          const actualTileNames = new Set<string>();
          worldContainerRef.current.children.forEach(child => {
            if (child.name?.startsWith('tile_')) {
              const tileKey = child.name.replace('tile_', '');
              actualTileNames.add(tileKey);
            }
          });
          
          // Sync loaded tiles state to match actual world container
          setLoadedTiles(actualTileNames);
          loadedTilesRef.current = actualTileNames;
          console.log(`🔄 Synced loaded tiles: ${actualTileNames.size} tiles after cleanup`);
        }
      }, 1000); // Check every second
      
      return () => {
        clearInterval(cullInterval);
        clearInterval(duplicateCleanupInterval);
      };
    }
  }, [cullInvisibleTiles, currentRenderMode, renderMode]);

  // TILE SYSTEM: Expose working tile cleanup function to window after cullInvisibleTiles is defined
  useEffect(() => {
    (window as any).cleanupTilesNow = () => {
      if (currentRenderMode === 'tiles' && renderMode === 'tiles') {
        console.log('🧹 Manual tile cleanup initiated...');
        cullInvisibleTiles();
        console.log('✅ Manual tile cleanup completed');
      } else {
        console.log('ℹ️ Tile cleanup skipped - not in tile mode');
      }
    };
  }, [cullInvisibleTiles, currentRenderMode, renderMode]);

  // Initialize PixiJS application
  useEffect(() => {
    if (!containerRef.current) return;

    const initializePixi = async () => {
      try {
        console.log('🚀 Starting PixiJS initialization...');
        
        const app = new PIXI.Application();
        
        await app.init({
          width: containerRef.current!.clientWidth || 800,
          height: containerRef.current!.clientHeight || 600,
          backgroundColor: 0x0ea5e9,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        console.log('📱 PixiJS app created, adding to DOM...');
        appRef.current = app;

        // Clear container and add canvas
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
        }
        
        console.log('🎨 Canvas added to container');

        const worldContainer = new PIXI.Container();
        worldContainerRef.current = worldContainer;
        app.stage.addChild(worldContainer);

        worldContainer.eventMode = 'static';
        // Expand hit area to cover all three world copies (left, center, right)
        const baseScale = Math.min(app.screen.width / 360, app.screen.height / 180);
        const worldWidth = 360 * baseScale; // Match the coordinate transformation scale
        worldContainer.hitArea = new PIXI.Rectangle(-worldWidth, 0, worldWidth * 3, app.screen.height);

        worldContainer.on('pointerup', () => {
          setIsDragging(false);
          // Sync final position to state
          setPanOffset({ x: panOffsetRef.current.x, y: panOffsetRef.current.y });
        });

        worldContainer.on('pointerupoutside', () => {
          setIsDragging(false);
          // Sync final position to state
          setPanOffset({ x: panOffsetRef.current.x, y: panOffsetRef.current.y });
        });

        worldContainer.on('pointermove', (event) => {
          if (isDraggingRef.current) {
            const deltaX = event.globalX - lastPointerRef.current.x;
            const deltaY = event.globalY - lastPointerRef.current.y;
            
            // Only process if there's actual movement
            if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;
            
            // Improved pan speed - less aggressive zoom compensation for better feel
            const panSpeedMultiplier = Math.max(0.5, 1 / Math.sqrt(zoomLevelRef.current));
            
            const newPanX = panOffsetRef.current.x + deltaX * panSpeedMultiplier;
            const newPanY = panOffsetRef.current.y + deltaY * panSpeedMultiplier;
            
            // Update refs immediately
            panOffsetRef.current = { x: newPanX, y: newPanY };
            lastPointerRef.current = { x: event.globalX, y: event.globalY };
            
            // Use requestAnimationFrame for smooth visual updates
            if (!pendingUpdateRef.current) {
              pendingUpdateRef.current = true;
              
              animationFrameRef.current = requestAnimationFrame(() => {
                if (worldContainerRef.current) {
                  // Apply infinite scrolling wrap-around with coordinate-based world width
                  const baseScale = Math.min(app.screen.width / 360, app.screen.height / 180);
                  const worldWidth = 360 * baseScale; // Match the coordinate transformation scale
                  let wrappedX = panOffsetRef.current.x;
                  
                  // Wrap horizontally when container moves too far
                  if (wrappedX > worldWidth) {
                    wrappedX -= worldWidth * 2;
                    panOffsetRef.current.x = wrappedX;
                    setPanOffset({ x: wrappedX, y: panOffsetRef.current.y });
                  } else if (wrappedX < -worldWidth) {
                    wrappedX += worldWidth * 2;
                    panOffsetRef.current.x = wrappedX;
                    setPanOffset({ x: wrappedX, y: panOffsetRef.current.y });
                  }
                  
                  worldContainerRef.current.x = wrappedX;
                  worldContainerRef.current.y = panOffsetRef.current.y;
                  
                  // Update camera center during pan
                  updateCameraCenter();
                }
                pendingUpdateRef.current = false;
              });
            }
          }
        });

        // Add simple drag interaction
        worldContainer.on('pointerdown', (event) => {
          setIsDragging(true);
          lastPointerRef.current = { x: event.globalX, y: event.globalY };
        });

        // Add double-click zoom (separate from drag)
        let lastClickTime = 0;
        worldContainer.on('pointertap', (event) => {
          const currentTime = Date.now();
          const timeDiff = currentTime - lastClickTime;
          
          if (timeDiff < 300) {
            // Double click detected - zoom in at the clicked location
            const zoomPoint = {
              x: event.globalX - app.screen.width / 2,
              y: event.globalY - app.screen.height / 2
            };
            
            setZoomLevel(prev => Math.min(prev * 2, 10));
            setZoomCenter(zoomPoint);
            zoomLevelRef.current = Math.min(zoomLevelRef.current * 2, 10);
            
            // Update camera center after double-click zoom
            setTimeout(() => updateCameraCenter(), 0);
          }
          
          lastClickTime = currentTime;
        });

        // Add mouse wheel zoom
        const handleWheel = (event: WheelEvent) => {
          event.preventDefault();
          
          const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
          const newZoomLevel = Math.max(1.0, Math.min(10, zoomLevelRef.current * zoomFactor));
          
          if (newZoomLevel !== zoomLevelRef.current) {
            // Get mouse position relative to canvas
            const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
            const mouseX = event.clientX - rect.left - app.screen.width / 2;
            const mouseY = event.clientY - rect.top - app.screen.height / 2;
            
            setZoomLevel(newZoomLevel);
            setZoomCenter({ x: mouseX, y: mouseY });
            zoomLevelRef.current = newZoomLevel;
            
            console.log(`🎯 Mouse wheel zoom: ${newZoomLevel.toFixed(2)}x at (${mouseX}, ${mouseY})`);
            
            // Update camera center after zoom
            setTimeout(() => updateCameraCenter(), 0);
          }
        };
        
        // Add wheel event listener to canvas
        (app.canvas as HTMLCanvasElement).addEventListener('wheel', handleWheel, { passive: false });

        // Add a test rectangle to verify rendering works
        const testRect = new PIXI.Graphics();
        testRect.beginFill(0xff0000); // Red
        testRect.drawRect(100, 100, 200, 100);
        testRect.endFill();
        worldContainer.addChild(testRect);
        console.log('🟥 Added test rectangle at (100,100) size 200x100');

        console.log('✅ PixiJS WorldMap initialized successfully');
        setIsInitialized(true);
        
        // Initialize camera center after PIXI setup
        setTimeout(() => updateCameraCenter(), 100);

      } catch (error) {
        console.error('❌ Failed to initialize PixiJS:', error);
        setIsInitialized(false);
      }
    };

    console.log('🎬 Starting PixiJS initialization...');
    initializePixi();
  }, []);

  // Load Natural Earth country boundaries (Legacy Mode Only)
  useEffect(() => {
    if (currentRenderMode === 'legacy') {
      const loadBoundaries = async () => {
        try {
          console.log('🌍 LEGACY: Starting to load Natural Earth boundaries');
          
          const allFeatures: any[] = [];
          
          const countryCodeMap: Record<string, string> = {
            'United States': 'USA',
            'Canada': 'CAN',
            'Mexico': 'MEX',
            'China': 'CHN',
            'India': 'IND',
            'Russia': 'RUS',
            'Germany': 'DEU',
            'France': 'FRA',
            'United Kingdom': 'GBR',
            'Japan': 'JPN',
            'Australia': 'AUS',
            'Brazil': 'BRA',
            'Argentina': 'ARG',
          };
          
          const availableBoundaryFiles = [
            'USA', 'CAN', 'MEX', 'CHN', 'IND', 'RUS', 'DEU', 'FRA', 'GBR', 'JPN', 
            'AUS', 'BRA', 'ARG', 'TUR', 'IRN', 'SAU', 'ISR', 'EGY',
            'ZAF', 'NGA', 'KEN', 'IDN', 'THA', 'VNM', 'KOR', 'NZL', 'CHL'
          ];
          
          console.log(`🌍 LEGACY: Attempting to load boundaries for ${availableBoundaryFiles.length} countries with detail level: ${currentDetailLevel}`);
          
          let successCount = 0;
          let errorCount = 0;
          
          for (const countryCode of availableBoundaryFiles) {
            try {
              console.log(`📍 Loading boundaries for ${countryCode}...`);
              const countryBoundaries = await geoManager.loadCountryBoundaries(countryCode, currentDetailLevel);
              
              const features = countryBoundaries.features || [];
              if (features.length > 0) {
              features.forEach((feature) => {
                if (feature && feature.geometry) {
                  if (!feature.properties) {
                    feature.properties = {};
                  }
                  
                  feature.properties.id = feature.properties.id || feature.properties.ISO_A3 || countryCode;
                  feature.properties.name = feature.properties.name || feature.properties.NAME || countryCode;
                  feature.properties.country = Object.keys(countryCodeMap).find(key => countryCodeMap[key] === countryCode) || countryCode;
                  
                  allFeatures.push(feature);
                }
              });
              console.log(`✅ Loaded boundaries for ${countryCode}: ${features.length} features`);
              successCount++;
            } else {
              console.warn(`⚠️ No features found for ${countryCode}`);
            }
          } catch (error) {
            console.error(`❌ Failed to load boundaries for ${countryCode}:`, error);
            errorCount++;
          }
        }
        
        console.log(`📊 Loading complete: ${successCount} successful, ${errorCount} errors, ${allFeatures.length} total features`);
        
        const boundariesData = {
          type: "FeatureCollection",
          features: allFeatures
        };
        
        setProvinceBoundariesData(boundariesData);
        console.log(`✅ LEGACY: Successfully loaded ${allFeatures.length} total features`);
        
      } catch (error) {
        console.error('❌ Critical error loading province boundaries:', error);
        setProvinceBoundariesData({ type: "FeatureCollection", features: [] });
      }
    };
    
    if (isInitialized) {
      console.log('🚀 LEGACY: Starting boundary loading process...');
      loadBoundaries();
    } else {
      console.log('⏳ LEGACY: Waiting for PixiJS initialization...');
    }
    } else if (currentRenderMode === 'tiles') {
      // TILE MODE: Clear legacy boundary data and let tile system handle data loading
      console.log('🗂️ TILES: Clearing legacy boundary data for tile mode');
      setProvinceBoundariesData({ type: "FeatureCollection", features: [] });
    }
  }, [currentDetailLevel, isInitialized, currentRenderMode]);

  // Render province boundaries when data is loaded or selection changes
  useEffect(() => {
    if (!isInitialized || !appRef.current || !worldContainerRef.current || !provinceBoundariesData?.features) {
      return;
    }

    const worldContainer = worldContainerRef.current;
    const app = appRef.current;

    console.log(`🗺️ PixiJS: Render mode = ${currentRenderMode}`);

    if (currentRenderMode === 'legacy') {
      // LEGACY MODE: Country-based rendering with infinite scrolling
      console.log(`🗺️ LEGACY: Rendering ${provinceBoundariesData.features.length} province features with real-time infinite scrolling (selected: ${selectedProvince || 'none'})`);

      // Clear previous graphics and border highlights
      const childrenToRemove = worldContainer.children.filter(child => child instanceof PIXI.Graphics);
      childrenToRemove.forEach(child => {
        child.destroy();
        worldContainer.removeChild(child);
      });
      
      // Clear any existing border highlight
      if (borderHighlightRef.current) {
        borderHighlightRef.current.destroy();
        borderHighlightRef.current = null;
      }
      setHoveredCountry(null);

      // Calculate world width for infinite scrolling based on coordinate system
      const baseScale = Math.min(app.screen.width / 360, app.screen.height / 180);
      const worldWidth = 360 * baseScale; // Match the coordinate transformation scale

      // Loop through provinceBoundariesData.features and render each one with infinite scrolling
      provinceBoundariesData.features.forEach((feature: GeoJSONFeature, index: number) => {
        try {
          if (index < 3) { // Enhanced logging for first few features
            console.log(`🌍 Creating 3 visible world copies for feature ${index}: ${feature.properties?.NAME || 'Unknown'}`);
          }
        
        // Create center world copy (main world)
        const centerGraphics = createWorldCopy(
          feature, worldContainer, app, 0, zoomLevel, zoomCenter, 
          selectedProvince, onProvinceSelect, setHoveredCountry, hoveredCountry,
          borderHighlightRef, provinceBoundariesData, " (center)",
          setProvinceDetailBoundaries, setSelectedCountryForProvinces, currentDetailLevel
        );
        worldContainer.addChild(centerGraphics);
        
        // Create left world copy (for scrolling right) - closer to center
        const leftGraphics = createWorldCopy(
          feature, worldContainer, app, -worldWidth, zoomLevel, zoomCenter,
          selectedProvince, onProvinceSelect, setHoveredCountry, hoveredCountry,
          borderHighlightRef, provinceBoundariesData, " (left)",
          setProvinceDetailBoundaries, setSelectedCountryForProvinces, currentDetailLevel
        );
        worldContainer.addChild(leftGraphics);
        
        // Create right world copy (for scrolling left) - closer to center
        const rightGraphics = createWorldCopy(
          feature, worldContainer, app, worldWidth, zoomLevel, zoomCenter,
          selectedProvince, onProvinceSelect, setHoveredCountry, hoveredCountry,
          borderHighlightRef, provinceBoundariesData, " (right)",
          setProvinceDetailBoundaries, setSelectedCountryForProvinces, currentDetailLevel
        );
        worldContainer.addChild(rightGraphics);
        
        if (index < 5) { // Log first few for debugging
          const countryName = feature.properties?.NAME || feature.properties?.ADMIN || feature.properties?.country;
          const isSelected = Boolean(selectedProvince && (
            feature.properties?.id === selectedProvince || 
            countryName === selectedProvince ||
            feature.properties?.name === selectedProvince
          ));
          console.log(`✅ Rendered 3 copies of feature ${index}: ${countryName} (${feature.geometry?.type}) ${isSelected ? '[SELECTED]' : ''}`);
          console.log(`   📍 Positions: Center(0), Left(-${worldWidth}), Right(+${worldWidth})`);
        }
        
      } catch (error) {
        console.warn(`❌ Error rendering feature ${index}:`, error);
      }
      });



      console.log(`✅ LEGACY: Completed real-time infinite scrolling rendering - ${provinceBoundariesData.features.length} countries × 3 copies = ${provinceBoundariesData.features.length * 3} total graphics (selected: ${selectedProvince || 'none'})`);
      
      // Update hit area to match the coordinate-based world width
      if (worldContainer && app) {
        const baseScale = Math.min(app.screen.width / 360, app.screen.height / 180);
        const worldWidth = 360 * baseScale;
        worldContainer.hitArea = new PIXI.Rectangle(-worldWidth, 0, worldWidth * 3, app.screen.height);
        console.log(`🎯 Updated hit area: width=${worldWidth * 3}, positions: ${-worldWidth} to ${worldWidth * 2}`);
      }
      
      // Render province boundaries for selected country
      console.log(`🔍 Checking province rendering conditions:`);
      console.log(`  selectedCountryForProvinces: ${selectedCountryForProvinces}`);
      console.log(`  provinceDetailBoundaries keys: [${Object.keys(provinceDetailBoundaries).join(', ')}]`);
      console.log(`  Has data for selected country: ${selectedCountryForProvinces ? !!provinceDetailBoundaries[selectedCountryForProvinces] : false}`);
      
      if (selectedCountryForProvinces && provinceDetailBoundaries[selectedCountryForProvinces]) {
        console.log(`🏛️ Rendering province boundaries for ${selectedCountryForProvinces}`);
        console.log(`🏛️ Province data:`, provinceDetailBoundaries[selectedCountryForProvinces]);
        renderProvinceBoundaries(
          provinceDetailBoundaries[selectedCountryForProvinces],
          worldContainer,
          app,
          zoomLevel,
          zoomCenter,
          selectedProvince,
          onProvinceSelect
        );
      }

    } else if (currentRenderMode === 'tiles') {
      // TILE MODE: Clear legacy graphics and use tile-based rendering
      console.log(`🎯 TILES: Clearing legacy graphics and using tile-based rendering`);
      
      // Clear all graphics (legacy country graphics)
      const childrenToRemove = worldContainer.children.filter(child => child instanceof PIXI.Graphics);
      childrenToRemove.forEach(child => {
        child.destroy();
        worldContainer.removeChild(child);
      });
      
      // Clear any existing border highlight
      if (borderHighlightRef.current) {
        borderHighlightRef.current.destroy();
        borderHighlightRef.current = null;
      }
      setHoveredCountry(null);

      console.log(`🗂️ TILES: Mode active - tile system will handle rendering via separate effects`);
      
      // Note: Tile rendering is handled by the tile system effects when currentRenderMode === 'tiles'
      // The loadVisibleTiles, updateVisibleTiles, etc. effects will take over
    } else {
      console.warn(`⚠️ Unknown render mode: ${currentRenderMode}`);
    }
    
  }, [isInitialized, provinceBoundariesData, selectedProvince, zoomLevel, zoomCenter, panOffset, selectedCountryForProvinces, provinceDetailBoundaries, currentRenderMode]);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!appRef.current || !containerRef.current || !worldContainerRef.current) return;

    const newWidth = containerRef.current.clientWidth;
    const newHeight = containerRef.current.clientHeight;

    appRef.current.renderer.resize(newWidth, newHeight);
    
    // Update hit area after resize to match new coordinate-based world width
    const baseScale = Math.min(newWidth / 360, newHeight / 180);
    const worldWidth = 360 * baseScale;
    worldContainerRef.current.hitArea = new PIXI.Rectangle(-worldWidth, 0, worldWidth * 3, newHeight);
    
    console.log(`🔄 PixiJS resized to: ${newWidth}x${newHeight}, updated hit area to world width: ${worldWidth.toFixed(0)}`);
  }, []);

  // Set up resize listener
  useEffect(() => {
    if (!isInitialized) return;

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isInitialized, handleResize]);

  // Cleanup PixiJS on unmount
  useEffect(() => {
    return () => {
      if (appRef.current) {
        console.log('🧹 Cleaning up PixiJS application');
        
        appRef.current.destroy(true, {
          children: true,
          texture: true,
        });
        
        appRef.current = null;
        setIsInitialized(false);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden">
      {/* Province Loading Test Component */}
      <ProvinceLoadingTest />

      {/* Tile Visibility Debug - Only shown in tile mode */}
      {currentRenderMode === 'tiles' && (
        <TileVisibilityDebug 
          visibleTiles={visibleTiles}
          loadedTiles={loadedTiles}
          viewportState={viewportState}
          isVisible={showTileDebug}
        />
      )}

      {/* Loading state */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Initializing WebGL renderer...</p>
          </div>
        </div>
      )}

      {/* Debug Controls - Only show tile debug in tile mode */}
      {showTileDebug && currentRenderMode === 'tiles' && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs">
          <div className="mb-1">🔍 Tile Debug Active</div>
          <div>Press F12 → Console → toggleTileDebug() to hide</div>
        </div>
      )}

      {/* PixiJS Container */}
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ 
          minHeight: '400px',
          position: 'relative'
        }}
      />

      {/* Debug Info */}
      {isInitialized && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black/80 text-white p-2 rounded text-sm">
            <div>PixiJS WebGL Renderer</div>
            <div>Render Mode: {currentRenderMode}</div>
            <div>Countries: {provinceBoundariesData?.features?.length || 0}</div>
            <div>Graphics: {(provinceBoundariesData?.features?.length || 0) * 3} (3× copies)</div>
            <div>World Width: {appRef.current ? (360 * Math.min(appRef.current.screen.width / 360, appRef.current.screen.height / 180)).toFixed(0) : 'N/A'}px (coordinate-based)</div>
            <div>Screen Width: {appRef.current ? appRef.current.screen.width.toFixed(0) : 'N/A'}px</div>
            <div>Detail: {currentDetailLevel}</div>
            <div>Provinces: {provinces.length}</div>
            <div>Overlay: {mapOverlay}</div>
            <div>Selected: {selectedProvince || 'None'}</div>
            <div>Hovered: {hoveredCountry || 'None'}</div>
            <div>Country w/ Provinces: {selectedCountryForProvinces || 'None'}</div>
            <div>Province Data: {Object.keys(provinceDetailBoundaries).length} countries loaded</div>
            {currentRenderMode === 'tiles' && (
              <>
                <div>Visible Tiles: {visibleTiles.length}</div>
                <div>Loaded Tiles: {loadedTiles.size}</div>
                <div>Tile Containers: {tileContainersRef.current.size}</div>
              </>
            )}
            <div>Pan: ({Math.round(panOffset.x)}, {Math.round(panOffset.y)})</div>
            <div>Zoom: {zoomLevel.toFixed(2)}x</div>
            <div>{isDragging ? 'Dragging...' : 'Ready'}</div>
            <div>� Hit Area: {worldContainerRef.current?.hitArea ? 
              `Hit Area Active` : 'None'}</div>
            <div>�🌍 Infinite Scrolling: Active</div>
            <div>🔴 🟢 🔵 World Markers: Visible</div>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white/90 p-2 rounded shadow">
          <div className="text-sm font-medium mb-2">Quality Level: {currentDetailLevel}</div>
          <div className="space-y-1">
            <button 
              className={`block w-full text-left px-2 py-1 text-xs rounded ${
                currentDetailLevel === 'low' 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
              onClick={() => setCurrentDetailLevel('low')}
              disabled={currentDetailLevel === 'low'}
            >
              🔸 Low Quality (Fast)
            </button>
            <button 
              className={`block w-full text-left px-2 py-1 text-xs rounded ${
                currentDetailLevel === 'overview' 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              onClick={() => setCurrentDetailLevel('overview')}
              disabled={currentDetailLevel === 'overview'}
            >
              🔹 Overview Quality
            </button>
            <button 
              className={`block w-full text-left px-2 py-1 text-xs rounded ${
                currentDetailLevel === 'detailed' 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={() => setCurrentDetailLevel('detailed')}
              disabled={currentDetailLevel === 'detailed'}
            >
              🔺 Detailed Quality
            </button>
            <button 
              className={`block w-full text-left px-2 py-1 text-xs rounded ${
                currentDetailLevel === 'ultra' 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
              onClick={() => setCurrentDetailLevel('ultra')}
              disabled={currentDetailLevel === 'ultra'}
            >
              🔶 Ultra Quality
            </button>
          </div>
          
          <div className="text-sm font-medium mt-3 mb-2">Render Mode: {currentRenderMode}</div>
          {/* Debug button states */}
          {(() => {
            console.log(`🎮 Button states - currentRenderMode: "${currentRenderMode}", Legacy disabled: ${currentRenderMode === 'legacy'}, Tiles disabled: ${currentRenderMode === 'tiles'}`);
            return null;
          })()}
          <div className="space-y-1">
            <button 
              className={`block w-full text-left px-2 py-1 text-xs rounded ${
                currentRenderMode === 'legacy' 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
              onClick={() => setCurrentRenderModeWithDebug('legacy')}
              disabled={currentRenderMode === 'legacy'}
            >
              🌍 Legacy (Country-based)
            </button>
            <button 
              className={`block w-full text-left px-2 py-1 text-xs rounded ${
                currentRenderMode === 'tiles' 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-teal-500 text-white hover:bg-teal-600'
              }`}
              onClick={() => setCurrentRenderModeWithDebug('tiles')}
              disabled={currentRenderMode === 'tiles'}
            >
              🗂️ Tiles (Performance)
            </button>
          </div>
          
          <div className="text-sm font-medium mt-3 mb-2">Map Controls</div>
          <div className="space-y-1">
            <button 
              className="block w-full text-left px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => setPanOffset({ x: 0, y: 0 })}
            >
              Reset Pan
            </button>
            <button 
              className="block w-full text-left px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
              onClick={() => {
                setZoomLevel(prev => Math.min(prev * 1.5, 10));
              }}
            >
              Zoom In (+)
            </button>
            <button 
              className="block w-full text-left px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
              onClick={() => {
                setZoomLevel(prev => Math.max(prev / 1.5, 1.0));
              }}
            >
              Zoom Out (-)
            </button>
            <button 
              className="block w-full text-left px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
              onClick={() => {
                setZoomLevel(1);
                setZoomCenter({ x: 0, y: 0 });
                setPanOffset({ x: 0, y: 0 });
              }}
            >
              Reset View
            </button>
            <button 
              className="block w-full text-left px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => {
                setProvinceDetailBoundaries({});
                setSelectedCountryForProvinces(null);
                console.log('🧹 Cleared all province boundaries');
              }}
            >
              Clear Provinces
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            • Drag to pan map<br/>
            • Double-click to zoom in<br/>
            • Mouse wheel to zoom<br/>
            • Use buttons to control view
          </div>
        </div>
      </div>
    </div>
  );
}
