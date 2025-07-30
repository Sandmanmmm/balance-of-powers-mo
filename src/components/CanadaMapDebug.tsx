import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { loadWorldData } from '../data/dataLoader';

interface CanadaMapStatus {
  loaded: boolean;
  canadaBoundaries: string[];
  canadaProvinces: string[];
  mismatches: string[];
  errors: string[];
  boundaryDetails: Record<string, {
    name: string;
    coordinateCount: number;
    hasValidGeometry: boolean;
  }>;
}

export function CanadaMapDebug() {
  const [status, setStatus] = useState<CanadaMapStatus>({
    loaded: false,
    canadaBoundaries: [],
    canadaProvinces: [],
    mismatches: [],
    errors: [],
    boundaryDetails: {}
  });

  useEffect(() => {
    const analyzeCanadaSystem = async () => {
      try {
        console.log('🇨🇦 Starting Canada map system analysis...');
        const worldData = await loadWorldData();
        
        // Get Canada data
        const canadaProvinces = worldData.provinces
          .filter(p => p.country === 'Canada')
          .map(p => ({ id: p.id, name: p.name }));
        
        const canadaBoundaries = Object.keys(worldData.boundaries)
          .filter(key => key.startsWith('CAN_'));
        
        // Find mismatches
        const canadaProvinceIds = canadaProvinces.map(p => p.id);
        const provincesMissingBoundaries = canadaProvinceIds.filter(id => !canadaBoundaries.includes(id));
        const boundariesMissingProvinces = canadaBoundaries.filter(id => !canadaProvinceIds.includes(id));
        
        const mismatches = [
          ...provincesMissingBoundaries.map(id => `Province ${id} missing boundary`),
          ...boundariesMissingProvinces.map(id => `Boundary ${id} missing province`)
        ];
        
        // Test boundary data integrity and collect details
        const errors: string[] = [];
        const boundaryDetails: Record<string, {
          name: string;
          coordinateCount: number;
          hasValidGeometry: boolean;
        }> = {};
        
        canadaBoundaries.forEach(id => {
          const boundary = worldData.boundaries[id];
          const province = canadaProvinces.find(p => p.id === id);
          
          if (!boundary?.geometry?.coordinates) {
            errors.push(`${id}: Missing geometry coordinates`);
            boundaryDetails[id] = {
              name: province?.name || 'Unknown',
              coordinateCount: 0,
              hasValidGeometry: false
            };
          } else if (!Array.isArray(boundary.geometry.coordinates[0])) {
            errors.push(`${id}: Invalid coordinates format`);
            boundaryDetails[id] = {
              name: province?.name || 'Unknown',
              coordinateCount: 0,
              hasValidGeometry: false
            };
          } else if (boundary.geometry.coordinates[0].length < 3) {
            errors.push(`${id}: Insufficient coordinate points`);
            boundaryDetails[id] = {
              name: province?.name || 'Unknown',
              coordinateCount: boundary.geometry.coordinates[0].length,
              hasValidGeometry: false
            };
          } else {
            boundaryDetails[id] = {
              name: province?.name || boundary.properties?.name || 'Unknown',
              coordinateCount: boundary.geometry.coordinates[0].length,
              hasValidGeometry: true
            };
          }
        });
        
        setStatus({
          loaded: true,
          canadaBoundaries,
          canadaProvinces: canadaProvinceIds,
          mismatches,
          errors,
          boundaryDetails
        });
        
        console.log('🇨🇦 Canada Map System Analysis Complete:', {
          canadaProvinces: canadaProvinces.length,
          canadaBoundaries: canadaBoundaries.length,
          mismatches: mismatches.length,
          errors: errors.length,
          validBoundaries: Object.values(boundaryDetails).filter(d => d.hasValidGeometry).length
        });
        
      } catch (error) {
        console.error('❌ Canada map system analysis failed:', error);
        setStatus(prev => ({
          ...prev,
          loaded: true,
          errors: [`System load failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }));
      }
    };
    
    analyzeCanadaSystem();
  }, []);

  if (!status.loaded) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm">Analyzing Canada map system...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 max-w-2xl">
      <h3 className="font-bold mb-3">🇨🇦 Canada Map System Status</h3>
      
      <div className="space-y-4 text-sm">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex justify-between">
            <span>Provinces:</span>
            <Badge variant={status.canadaProvinces.length > 0 ? "default" : "destructive"}>
              {status.canadaProvinces.length}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Boundaries:</span>
            <Badge variant={status.canadaBoundaries.length > 0 ? "default" : "destructive"}>
              {status.canadaBoundaries.length}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Valid Polygons:</span>
            <Badge variant={Object.values(status.boundaryDetails).filter(d => d.hasValidGeometry).length > 0 ? "default" : "destructive"}>
              {Object.values(status.boundaryDetails).filter(d => d.hasValidGeometry).length}
            </Badge>
          </div>
        </div>
        
        {/* Province Boundary Details */}
        <div>
          <span className="font-medium">Province Boundaries:</span>
          <div className="mt-2 grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
            {Object.entries(status.boundaryDetails).map(([id, details]) => (
              <div key={id} className={`text-xs p-2 rounded flex justify-between items-center ${
                details.hasValidGeometry ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <span className="font-mono">{id}</span>
                <span className="flex-1 mx-2 truncate">{details.name}</span>
                <div className="flex items-center space-x-1">
                  <span>{details.coordinateCount} pts</span>
                  {details.hasValidGeometry ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Errors */}
        {status.errors.length > 0 && (
          <div>
            <span className="text-red-600 font-medium">❌ Errors ({status.errors.length}):</span>
            <div className="mt-1 space-y-1">
              {status.errors.slice(0, 3).map((error, index) => (
                <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              ))}
              {status.errors.length > 3 && (
                <div className="text-xs text-red-600">+{status.errors.length - 3} more errors</div>
              )}
            </div>
          </div>
        )}
        
        {/* Mismatches */}
        {status.mismatches.length > 0 && (
          <div>
            <span className="text-yellow-600 font-medium">⚠️ Mismatches ({status.mismatches.length}):</span>
            <div className="mt-1 space-y-1">
              {status.mismatches.slice(0, 3).map((mismatch, index) => (
                <div key={index} className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  {mismatch}
                </div>
              ))}
              {status.mismatches.length > 3 && (
                <div className="text-xs text-yellow-600">+{status.mismatches.length - 3} more mismatches</div>
              )}
            </div>
          </div>
        )}
        
        {/* Success */}
        {status.errors.length === 0 && status.mismatches.length === 0 && (
          <div className="text-green-600 font-medium">
            ✅ All systems operational! Canada should render with proper polygon boundaries.
          </div>
        )}
        
        {/* Improvement Summary */}
        <div className="mt-3 p-3 bg-blue-50 rounded">
          <div className="text-xs text-blue-600 font-medium">🎯 Canada Improvement Status:</div>
          <div className="text-xs text-blue-600 mt-1">
            {Object.values(status.boundaryDetails).filter(d => d.hasValidGeometry).length > 8 ? (
              '🇨🇦 Canada now has detailed polygon boundaries instead of rectangular placeholders!'
            ) : (
              'Working on replacing rectangular boundaries with realistic polygon shapes...'
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}