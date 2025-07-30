import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MagnifyingGlassPlus, 
  MagnifyingGlassMinus, 
  Play, 
  Pause, 
  SkipForward,
  MapPin,
  Users,
  TrendUp,
  Shield,
  Lightning
} from '@phosphor-icons/react';
import { Province, MapOverlayType } from '../lib/types';
import { cn } from '../lib/utils';
import { coordinatesToPath, calculateOptimalProjection, ProjectionConfig, projectCoordinates, calculatePolygonCentroid, geometryToPath } from '../lib/mapProjection';
import { geographicDataManager, type DetailLevel, type GeoJSONFeature, type GeoJSONFeatureCollection } from '../managers/GeographicDataManager';

interface WorldMapProps {
  provinces: Province[];
  selectedProvince?: string;
  mapOverlay: MapOverlayType;
  onProvinceSelect: (provinceId: string | undefined) => void;
  onOverlayChange: (overlay: MapOverlayType) => void;
}

const overlayConfig = {
  none: { label: 'None', color: 'bg-gray-200', icon: MapPin },
  political: { label: 'Political', color: 'bg-blue-500', icon: Users },
  economic: { label: 'Economic', color: 'bg-green-500', icon: TrendUp },
  military: { label: 'Military', color: 'bg-red-500', icon: Shield },
  unrest: { label: 'Unrest', color: 'bg-orange-500', icon: Users },
  resources: { label: 'Resources', color: 'bg-purple-500', icon: Lightning }
};

function getProvinceColor(province: Province, overlay: MapOverlayType): string {
  if (!province) return '#6b7280';
  
  switch (overlay) {
    case 'political':
      if (!province.politics?.partySupport) return '#6b7280';
      const partyEntries = Object.entries(province.politics.partySupport);
      if (partyEntries.length === 0) return '#6b7280';
      const dominantParty = partyEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
      if (!dominantParty) return '#6b7280';
      if (dominantParty.includes('Democrat') || dominantParty.includes('Social')) return '#3b82f6';
      if (dominantParty.includes('Republican') || dominantParty.includes('Conservative')) return '#ef4444';
      if (dominantParty.includes('Green')) return '#22c55e';
      if (dominantParty.includes('Communist')) return '#dc2626';
      return '#6b7280';
    
    case 'economic':
      const gdp = province.economy?.gdpPerCapita || 0;
      if (gdp > 60000) return '#059669';
      if (gdp > 40000) return '#10b981';
      if (gdp > 25000) return '#34d399';
      if (gdp > 15000) return '#fbbf24';
      return '#f87171';
    
    case 'military':
      const unitsCount = province.military?.stationedUnits?.length || 0;
      const fortLevel = province.military?.fortificationLevel || 0;
      const military = unitsCount + fortLevel;
      if (military > 5) return '#dc2626';
      if (military > 3) return '#f97316';
      if (military > 1) return '#fbbf24';
      return '#d1d5db';
    
    case 'unrest':
      const unrest = province.unrest || 0;
      if (unrest > 8) return '#dc2626';
      if (unrest > 6) return '#f97316';
      if (unrest > 4) return '#fbbf24';
      if (unrest > 2) return '#34d399';
      return '#10b981';
    
    case 'resources':
      if (!province.resourceOutput) return '#e5e7eb';
      const totalResources = Object.values(province.resourceOutput).reduce((a, b) => a + b, 0);
      if (totalResources > 3000) return '#7c3aed';
      if (totalResources > 2000) return '#a855f7';
      if (totalResources > 1000) return '#c084fc';
      if (totalResources > 500) return '#ddd6fe';
      return '#e5e7eb';
    
    default:
      // Country-based coloring for default view
      switch (province.country) {
        case 'Germany': return '#2dd4bf';  // Teal
        case 'United States': return '#34d399';  // Emerald  
        case 'Canada': return '#f87171';  // Red
        case 'China': return '#a78bfa';  // Violet
        case 'France': return '#60a5fa';  // Blue
        case 'United Kingdom': return '#f472b6';  // Pink
        case 'Australia': return '#fbbf24';  // Amber
        default: return '#e5e7eb';  // Gray
      }
  }
}

export function WorldMap({ 
  provinces, 
  selectedProvince, 
  mapOverlay, 
  onProvinceSelect, 
  onOverlayChange 
}: WorldMapProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [provinceBoundariesData, setProvinceBoundariesData] = useState<any>(null);
  const [currentDetailLevel, setCurrentDetailLevel] = useState<DetailLevel>('overview');

  // Load province boundaries - prioritize regional system for province-level data
  useEffect(() => {
    const loadBoundaries = async () => {
      try {
        console.log('🌍 WorldMap: Loading boundaries at', currentDetailLevel, 'detail');
        
        const allFeatures: any[] = [];
        
        // Load from regional system (primary approach) - this has the actual province-level data
        console.log('🔄 Loading from regional system...');
        const allRegions = [
          'north_america',      // Contains detailed Canada, USA, Mexico provinces
          'south_america', 
          'europe_west', 
          'europe_east', 
          'caribbean', 
          'central_asia', 
          'middle_east', 
          'north_africa', 
          'oceania', 
          'south_asia', 
          'southeast_asia', 
          'sub_saharan_africa',
          'superpowers/usa',    // Try superpowers after general regions
          'superpowers/china', 
          'superpowers/india', 
          'superpowers/russia'
        ];
        
        let totalLoaded = 0;
        for (const region of allRegions) {
          try {
            const regionData = await geographicDataManager.loadRegion(region, currentDetailLevel);
            if (regionData?.features?.length > 0) {
              allFeatures.push(...regionData.features);
              totalLoaded += regionData.features.length;
              console.log(`✓ Loaded ${regionData.features.length} features from region ${region}`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to load region ${region}:`, error);
          }
        }
        
        console.log(`📍 Regional system loaded ${totalLoaded} province-level boundaries`);
        
        // If we didn't get enough features from regional system, try country-level as fallback
        if (totalLoaded < 10) {
          console.log('🔄 Low province count from regional system, trying country-level fallback...');
          
          const countries = Array.from(new Set(provinces.map(p => p.country)));
          const countryCodeMap: Record<string, string> = {
            'United States': 'USA',
            'Canada': 'CAN', 
            'Mexico': 'MEX',
            'China': 'CHN',
            'India': 'IND',
            'Russia': 'RUS',
            'France': 'FRA',
            'Germany': 'DEU',
            'United Kingdom': 'GBR',
            'Australia': 'AUS'
          };
          
          for (const country of countries) {
            const countryCode = countryCodeMap[country];
            if (!countryCode) continue;
            
            try {
              console.log(`Attempting to load country boundaries for ${country} (${countryCode})...`);
              const countryBoundaries = await geographicDataManager.loadNationBoundaries(countryCode, currentDetailLevel);
              
              // Convert Record<string, GeoJSONFeature> to Feature array
              const features = Object.values(countryBoundaries);
              if (features.length > 0) {
                allFeatures.push(...features);
                totalLoaded += features.length;
                console.log(`✓ Loaded ${features.length} boundaries from ${country} (country-level fallback)`);
              }
            } catch (error) {
              console.warn(`⚠️ Failed to load country-based boundaries for ${country} (${countryCode}):`, error);
            }
          }
        }
        
        const boundariesData = {
          type: "FeatureCollection",
          features: allFeatures
        };
        
        setProvinceBoundariesData(boundariesData);
        console.log(`✅ WorldMap: Loaded ${totalLoaded} total province boundaries at ${currentDetailLevel} detail`);
        
        // Log province IDs for debugging
        const provinceIds = allFeatures.map(f => f.properties?.id).filter(Boolean);
        console.log('🗺️ Province IDs in boundary data:', provinceIds);
        
        // Log province data coverage
        const provinceDataIds = Array.from(provinceDataMap.keys());
        console.log('📊 Province IDs in game data:', provinceDataIds);
        
        // Log matches
        const matches = provinceIds.filter(id => provinceDataMap.has(id));
        console.log(`🎯 Matching provinces: ${matches.length}/${provinceIds.length}`, matches);
        
        // Log cache stats
        const stats = geographicDataManager.getStats();
        console.log('📊 GeographicDataManager stats:', {
          cacheEntries: stats.cacheEntries,
          currentCacheSize: Math.round(stats.currentCacheSize / 1024 / 1024 * 100) / 100 + 'MB',
          hitRatio: Math.round(stats.hitRatio * 100) + '%'
        });
        
      } catch (error) {
        console.error('❌ Failed to load province boundaries:', error);
        // Fallback to empty data
        setProvinceBoundariesData({ type: "FeatureCollection", features: [] });
      }
    };
    
    loadBoundaries();
  }, [currentDetailLevel]);

  // Memoize projection configuration
  const projectionConfig: ProjectionConfig = useMemo(() => {
    if (!provinceBoundariesData?.features) {
      return { centerLon: 0, centerLat: 0, scale: 1, width: 1000, height: 600 };
    }
    return calculateOptimalProjection(
      provinceBoundariesData.features,
      1000,
      600,
      50
    );
  }, [provinceBoundariesData]);

  // Create a map of province data for quick lookup
  const provinceDataMap = useMemo(() => {
    const map = new Map<string, Province>();
    if (Array.isArray(provinces)) {
      provinces.forEach(province => {
        if (province && province.id) {
          map.set(province.id, province);
        }
      });
    }
    return map;
  }, [provinces]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const handleProvinceClick = useCallback((provinceId: string) => {
    onProvinceSelect(selectedProvince === provinceId ? undefined : provinceId);
  }, [selectedProvince, onProvinceSelect]);

  const handleProvinceHover = useCallback((provinceId: string | null) => {
    setHoveredProvince(provinceId);
  }, []);

  const handleUpgradeRegion = useCallback(async (countryCode: string) => {
    const nextDetailLevel: DetailLevel = 
      currentDetailLevel === 'overview' ? 'detailed' :
      currentDetailLevel === 'detailed' ? 'ultra' : 'ultra';
      
    if (nextDetailLevel !== currentDetailLevel) {
      try {
        console.log(`🔄 Upgrading ${countryCode} to ${nextDetailLevel}`);
        await geographicDataManager.upgradeNationDetail(countryCode, nextDetailLevel);
        setCurrentDetailLevel(nextDetailLevel);
      } catch (error) {
        console.error(`Failed to upgrade ${countryCode}:`, error);
      }
    }
  }, [currentDetailLevel]);

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden">
      {/* Loading state */}
      {!provinceBoundariesData && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading map boundaries...</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Card className="p-2">
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
            >
              <MagnifyingGlassPlus size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
            >
              <MagnifyingGlassMinus size={16} />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-center">
            Zoom: {(zoomLevel * 100).toFixed(0)}%
          </div>
        </Card>

        {/* Detail Level Controls */}
        <Card className="p-2">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground mb-2">Map Detail</div>
            <div className="grid grid-cols-3 gap-1">
              {(['overview', 'detailed', 'ultra'] as DetailLevel[]).map((level) => (
                <Button
                  key={level}
                  variant={currentDetailLevel === level ? "default" : "ghost"}
                  size="sm"
                  className="text-xs px-1"
                  onClick={() => setCurrentDetailLevel(level)}
                  disabled={currentDetailLevel === level}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-center">
              Current: {currentDetailLevel}
            </div>
          </div>
        </Card>

        {/* Overlay Controls */}
        <Card className="p-2">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground mb-2">Map Overlay</div>
            {Object.entries(overlayConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  variant={mapOverlay === key ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => onOverlayChange(key as MapOverlayType)}
                  title={config.label}
                >
                  <Icon size={16} />
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Quick Upgrade Controls */}
        <Card className="p-2">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground mb-2">Quick Upgrade</div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { code: 'USA', label: 'USA' },
                { code: 'CAN', label: 'CAN' },
                { code: 'CHN', label: 'CHN' },
                { code: 'IND', label: 'IND' }
              ].map(({ code, label }) => (
                <Button
                  key={code}
                  variant="outline"
                  size="sm"
                  className="text-xs px-1"
                  onClick={() => handleUpgradeRegion(code)}
                  disabled={currentDetailLevel === 'ultra'}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-center">
              {currentDetailLevel === 'ultra' ? 'Max detail' : `Next: ${
                currentDetailLevel === 'overview' ? 'detailed' : 'ultra'
              }`}
            </div>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div 
        className="w-full h-full relative"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
      >
        {/* Interactive Province Map */}
        <svg
          viewBox={`0 0 ${projectionConfig.width} ${projectionConfig.height}`}
          className="w-full h-full"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)' }}
        >
          {/* Ocean/background with gradient */}
          <defs>
            <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="1" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="1" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="1" />
            </linearGradient>
            <filter id="landShadow">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          <rect
            x="0"
            y="0"
            width={projectionConfig.width}
            height={projectionConfig.height}
            fill="url(#oceanGradient)"
          />

          {/* Province polygons */}
          {provinceBoundariesData?.features && Array.isArray(provinceBoundariesData.features) && provinceBoundariesData.features
            .filter((feature) => {
              try {
                const provinceId = feature?.properties?.id;
                const province = provinceDataMap.get(provinceId);
                return province && feature.geometry && feature.geometry.coordinates && Array.isArray(feature.geometry.coordinates);
              } catch (error) {
                console.warn('Error filtering province feature:', error);
                return false;
              }
            })
            .map((feature) => {
              let provinceId: string | undefined;
              try {
                provinceId = feature.properties?.id;
                if (!provinceId) return null;
                
                const province = provinceDataMap.get(provinceId);
                if (!province) return null;
                
                const isSelected = selectedProvince === provinceId;
                const isHovered = hoveredProvince === provinceId;
                const color = getProvinceColor(province, mapOverlay);
            
            // Convert coordinates to SVG path
            const pathData = geometryToPath(
              feature.geometry,
              projectionConfig
            );

            // Calculate centroid for label positioning
            let centroid: [number, number];
            if (feature.geometry.type === 'Polygon') {
              centroid = calculatePolygonCentroid(feature.geometry.coordinates[0]);
            } else if (feature.geometry.type === 'MultiPolygon') {
              // For MultiPolygon, use the centroid of the largest polygon
              const largestPolygon = feature.geometry.coordinates.reduce((largest: number[][][], current: number[][][]) => {
                return current[0].length > largest[0].length ? current : largest;
              });
              centroid = calculatePolygonCentroid(largestPolygon[0]);
            } else {
              centroid = [0, 0]; // fallback
            }
            const [labelX, labelY] = projectCoordinates(centroid[0], centroid[1], projectionConfig);

            return (
              <g key={provinceId}>
                {/* Province boundary */}
                <path
                  d={pathData}
                  fill={color}
                  stroke={isSelected ? "#1f2937" : isHovered ? "#374151" : "#9ca3af"}
                  strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                  fillOpacity={isSelected ? 0.9 : isHovered ? 0.8 : 0.7}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => provinceId && handleProvinceClick(provinceId)}
                  onMouseEnter={() => provinceId && handleProvinceHover(provinceId)}
                  onMouseLeave={() => handleProvinceHover(null)}
                  filter={mapOverlay === 'none' ? 'url(#landShadow)' : 'none'}
                  style={{
                    filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' : 
                            isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' : 'none'
                  }}
                />
                
                {/* Province label (visible when zoomed in or selected) */}
                {(zoomLevel > 1.2 || isSelected || isHovered) && (
                  <g>
                    {/* Text shadow for better readability */}
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none"
                      style={{ 
                        fontSize: isSelected ? '14px' : '12px',
                        fontWeight: isSelected ? 'bold' : 'normal',
                        fill: '#ffffff',
                        stroke: '#ffffff',
                        strokeWidth: '2px',
                        strokeOpacity: 0.8
                      }}
                    >
                      {province.name}
                    </text>
                    {/* Main text */}
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={cn(
                        "font-medium pointer-events-none",
                        isSelected ? "fill-primary" : "fill-foreground"
                      )}
                      style={{ 
                        fontSize: isSelected ? '14px' : '12px',
                        fontWeight: isSelected ? 'bold' : 'normal'
                      }}
                    >
                      {province.name}
                    </text>
                  </g>
                )}
              </g>
            );
              } catch (error) {
                console.warn('Error rendering province:', provinceId, error);
                return null;
              }
          })}

          {/* Province centers for reference when not showing boundaries */}
          {mapOverlay === 'none' && zoomLevel < 1.5 && Array.isArray(provinces) && provinces
            .filter(province => province && province.coordinates && Array.isArray(province.coordinates))
            .map((province) => {
              try {
                const [x, y] = projectCoordinates(
                  province.coordinates[1], 
                  province.coordinates[0], 
                  projectionConfig
                );
                const isSelected = selectedProvince === province.id;
                const isHovered = hoveredProvince === province.id;

                return (
                  <circle
                    key={`${province.id}-center`}
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : isHovered ? 5 : 4}
                    fill={isSelected ? "#1f2937" : isHovered ? "#374151" : "#6b7280"}
                    stroke="#ffffff"
                    strokeWidth="1"
                    className="cursor-pointer"
                    onClick={() => handleProvinceClick(province.id)}
                    onMouseEnter={() => handleProvinceHover(province.id)}
                    onMouseLeave={() => handleProvinceHover(null)}
                  />
            );
              } catch (error) {
                console.warn('Error rendering province center:', province.id, error);
                return null;
              }
          })}
        </svg>
      </div>

      {/* Hover Tooltip */}
      {hoveredProvince && (() => {
        const province = provinceDataMap.get(hoveredProvince);
        if (!province || !province.population || !province.economy) return null;
        
        return (
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <Card className="p-3 bg-card/95 backdrop-blur-sm border shadow-lg">
              <div className="space-y-2">
                <div className="font-semibold text-sm">{province.name}</div>
                <div className="text-xs text-muted-foreground">{province.country}</div>
                <div className="space-y-1 text-xs">
                  <div>Population: {((province.population?.total || 0) / 1000000).toFixed(1)}M</div>
                  <div>GDP/capita: ${(province.economy?.gdpPerCapita || 0).toLocaleString()}</div>
                  <div>Unrest: {(province.unrest || 0).toFixed(1)}</div>
                  {mapOverlay !== 'none' && (
                    <div className="pt-1 border-t border-border">
                      <Badge variant="outline" className="text-xs">
                        {overlayConfig[mapOverlay].label} View
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* Legend */}
      {mapOverlay !== 'none' && (
        <div className="absolute bottom-4 right-4 z-10">
          <Card className="p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {overlayConfig[mapOverlay].label} Legend
            </div>
            <div className="space-y-1 text-xs">
              {mapOverlay === 'political' && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Liberal/Democratic</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Conservative/Republican</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Environmental/Green</span>
                  </div>
                </>
              )}
              {mapOverlay === 'economic' && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-600 rounded"></div>
                    <span>&gt;$60k GDP/capita</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>$15k-$40k GDP/capita</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded"></div>
                    <span>&lt;$15k GDP/capita</span>
                  </div>
                </>
              )}
              {mapOverlay === 'unrest' && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-600 rounded"></div>
                    <span>High Unrest (&gt;8)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>Medium Unrest (4-8)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Low Unrest (&lt;4)</span>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}