import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause, 
  SkipForward,
  MapPin,
  Users,
  TrendingUp,
  Shield,
  Zap
} from '@phosphor-icons/react';
import { Province, MapOverlayType } from '../lib/types';
import { cn } from '../lib/utils';

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
  economic: { label: 'Economic', color: 'bg-green-500', icon: TrendingUp },
  military: { label: 'Military', color: 'bg-red-500', icon: Shield },
  unrest: { label: 'Unrest', color: 'bg-orange-500', icon: Users },
  resources: { label: 'Resources', color: 'bg-purple-500', icon: Zap }
};

function getProvinceColor(province: Province, overlay: MapOverlayType): string {
  switch (overlay) {
    case 'political':
      const dominantParty = Object.entries(province.politics.partySupport)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];
      if (dominantParty.includes('Democrat') || dominantParty.includes('Social')) return '#3b82f6';
      if (dominantParty.includes('Republican') || dominantParty.includes('Conservative')) return '#ef4444';
      if (dominantParty.includes('Green')) return '#22c55e';
      if (dominantParty.includes('Communist')) return '#dc2626';
      return '#6b7280';
    
    case 'economic':
      const gdp = province.economy.gdpPerCapita;
      if (gdp > 60000) return '#059669';
      if (gdp > 40000) return '#10b981';
      if (gdp > 25000) return '#34d399';
      if (gdp > 15000) return '#fbbf24';
      return '#f87171';
    
    case 'military':
      const military = province.military.stationedUnits.length + province.military.fortificationLevel;
      if (military > 5) return '#dc2626';
      if (military > 3) return '#f97316';
      if (military > 1) return '#fbbf24';
      return '#d1d5db';
    
    case 'unrest':
      const unrest = province.unrest;
      if (unrest > 8) return '#dc2626';
      if (unrest > 6) return '#f97316';
      if (unrest > 4) return '#fbbf24';
      if (unrest > 2) return '#34d399';
      return '#10b981';
    
    case 'resources':
      const totalResources = Object.values(province.resourceOutput).reduce((a, b) => a + b, 0);
      if (totalResources > 3000) return '#7c3aed';
      if (totalResources > 2000) return '#a855f7';
      if (totalResources > 1000) return '#c084fc';
      if (totalResources > 500) return '#ddd6fe';
      return '#e5e7eb';
    
    default:
      return '#e5e7eb';
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

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden">
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
              <ZoomIn size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut size={16} />
            </Button>
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
                  className="w-full justify-start"
                  onClick={() => onOverlayChange(key as MapOverlayType)}
                >
                  <Icon size={14} className="mr-2" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div 
        className="w-full h-full relative"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
      >
        {/* Simplified World Map using positioned provinces */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full"
        >
          {/* World outline (simplified) */}
          <rect
            x="0"
            y="0"
            width="1000"
            height="500"
            fill="#e0f2fe"
            stroke="#0369a1"
            strokeWidth="1"
          />

          {/* Province representations */}
          {provinces.map((province) => {
            const x = ((province.coordinates[1] + 180) / 360) * 1000;
            const y = ((90 - province.coordinates[0]) / 180) * 500;
            const isSelected = selectedProvince === province.id;
            const color = getProvinceColor(province, mapOverlay);

            return (
              <g key={province.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 12 : 8}
                  fill={color}
                  stroke={isSelected ? "#1f2937" : "#374151"}
                  strokeWidth={isSelected ? 3 : 1}
                  className="cursor-pointer hover:stroke-accent transition-all duration-200"
                  onClick={() => onProvinceSelect(isSelected ? undefined : province.id)}
                />
                <text
                  x={x}
                  y={y - 15}
                  textAnchor="middle"
                  className="text-xs font-medium fill-foreground pointer-events-none"
                  style={{ fontSize: isSelected ? '12px' : '10px' }}
                >
                  {province.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

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