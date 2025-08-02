import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { Province, MapOverlayType } from '../lib/types';
import { GeoJSONFeature } from '../types/geo';
import { geoManager } from '../managers/GeographicDataManager';
import { DetailLevel } from '../types/geo';

interface WorldMapWebGLProps {
  provinces: Province[];
  selectedProvince?: string;
  mapOverlay: MapOverlayType;
  onProvinceSelect: (provinceId: string | undefined) => void;
  onOverlayChange: (overlay: MapOverlayType) => void;
  detailLevel?: DetailLevel;
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
  copyLabel: string = ""
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
  graphics.on('pointerdown', () => {
    const provinceId = featureId || countryName || feature.properties?.name;
    console.log(`🖱️ Clicked on province${copyLabel}: ${provinceId}`);
    onProvinceSelect(provinceId);
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

export function WorldMapWebGL({
  provinces,
  selectedProvince,
  mapOverlay,
  onProvinceSelect,
  onOverlayChange,
  detailLevel = 'overview'
}: WorldMapWebGLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const worldContainerRef = useRef<PIXI.Container | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [provinceBoundariesData, setProvinceBoundariesData] = useState<any>(null);
  const [currentDetailLevel, setCurrentDetailLevel] = useState<DetailLevel>(detailLevel);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState({ x: 0, y: 0 });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const borderHighlightRef = useRef<PIXI.Graphics | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomCenter, setZoomCenter] = useState({ x: 0, y: 0 });
  const zoomLevelRef = useRef(1);
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef(false);

  // Sync detail level with prop
  useEffect(() => {
    if (detailLevel !== currentDetailLevel) {
      setCurrentDetailLevel(detailLevel);
    }
  }, [detailLevel, currentDetailLevel]);

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
        const worldWidth = app.screen.width * 1.0;
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
                  // Apply infinite scrolling wrap-around with exact screen width
                  const worldWidth = app.screen.width * 1.0; // Match the rendering world width
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
            
            console.log(`🎯 Mouse wheel zoom: ${newZoomLevel.toFixed(2)}x at (${mouseX}, ${mouseY})`);
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

      } catch (error) {
        console.error('❌ Failed to initialize PixiJS:', error);
        setIsInitialized(false);
      }
    };

    console.log('🎬 Starting PixiJS initialization...');
    initializePixi();
  }, []);

  // Load Natural Earth country boundaries
  useEffect(() => {
    const loadBoundaries = async () => {
      try {
        console.log('🌍 PixiJS WorldMap: Starting to load Natural Earth boundaries');
        
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
        
        console.log(`🌍 PixiJS: Attempting to load boundaries for ${availableBoundaryFiles.length} countries with detail level: ${currentDetailLevel}`);
        
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
        console.log(`✅ PixiJS WorldMap: Successfully loaded ${allFeatures.length} total features`);
        
      } catch (error) {
        console.error('❌ Critical error loading province boundaries:', error);
        setProvinceBoundariesData({ type: "FeatureCollection", features: [] });
      }
    };
    
    if (isInitialized) {
      console.log('🚀 Starting boundary loading process...');
      loadBoundaries();
    } else {
      console.log('⏳ Waiting for PixiJS initialization...');
    }
  }, [currentDetailLevel, isInitialized]);

  // Render province boundaries when data is loaded or selection changes
  useEffect(() => {
    if (!isInitialized || !appRef.current || !worldContainerRef.current || !provinceBoundariesData?.features) {
      return;
    }

    const worldContainer = worldContainerRef.current;
    const app = appRef.current;

    console.log(`🗺️ PixiJS: Rendering ${provinceBoundariesData.features.length} province features with real-time infinite scrolling (selected: ${selectedProvince || 'none'})`);

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

    // Calculate world width for infinite scrolling - exact screen width for seamless connection
    const worldWidth = app.screen.width * 1.0; // Exactly screen width to connect without gaps or overlap

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
          borderHighlightRef, provinceBoundariesData, " (center)"
        );
        worldContainer.addChild(centerGraphics);
        
        // Create left world copy (for scrolling right) - closer to center
        const leftGraphics = createWorldCopy(
          feature, worldContainer, app, -worldWidth, zoomLevel, zoomCenter,
          selectedProvince, onProvinceSelect, setHoveredCountry, hoveredCountry,
          borderHighlightRef, provinceBoundariesData, " (left)"
        );
        worldContainer.addChild(leftGraphics);
        
        // Create right world copy (for scrolling left) - closer to center
        const rightGraphics = createWorldCopy(
          feature, worldContainer, app, worldWidth, zoomLevel, zoomCenter,
          selectedProvince, onProvinceSelect, setHoveredCountry, hoveredCountry,
          borderHighlightRef, provinceBoundariesData, " (right)"
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



    console.log(`✅ PixiJS: Completed real-time infinite scrolling rendering - ${provinceBoundariesData.features.length} countries × 3 copies = ${provinceBoundariesData.features.length * 3} total graphics (selected: ${selectedProvince || 'none'})`);
    
  }, [isInitialized, provinceBoundariesData, selectedProvince, zoomLevel, zoomCenter, panOffset]);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!appRef.current || !containerRef.current) return;

    const newWidth = containerRef.current.clientWidth;
    const newHeight = containerRef.current.clientHeight;

    appRef.current.renderer.resize(newWidth, newHeight);
    console.log(`🔄 PixiJS resized to: ${newWidth}x${newHeight}`);
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
      {/* Loading state */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Initializing WebGL renderer...</p>
          </div>
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
            <div>Countries: {provinceBoundariesData?.features?.length || 0}</div>
            <div>Graphics: {(provinceBoundariesData?.features?.length || 0) * 3} (3× copies)</div>
            <div>World Width: {appRef.current ? (appRef.current.screen.width * 1.0).toFixed(0) : 'N/A'}px</div>
            <div>Detail: {currentDetailLevel}</div>
            <div>Provinces: {provinces.length}</div>
            <div>Overlay: {mapOverlay}</div>
            <div>Selected: {selectedProvince || 'None'}</div>
            <div>Hovered: {hoveredCountry || 'None'}</div>
            <div>Pan: ({Math.round(panOffset.x)}, {Math.round(panOffset.y)})</div>
            <div>Zoom: {zoomLevel.toFixed(2)}x</div>
            <div>{isDragging ? 'Dragging...' : 'Ready'}</div>
            <div>🌍 Infinite Scrolling: Active</div>
            <div>🔴 🟢 🔵 World Markers: Visible</div>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white/90 p-2 rounded shadow">
          <div className="text-sm font-medium mb-2">WebGL Controls</div>
          <div className="space-y-1">
            <button 
              className="block w-full text-left px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setCurrentDetailLevel('detailed')}
              disabled={currentDetailLevel === 'detailed'}
            >
              Load Detailed
            </button>
            <button 
              className="block w-full text-left px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setCurrentDetailLevel('overview')}
              disabled={currentDetailLevel === 'overview'}
            >
              Load Overview
            </button>
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
