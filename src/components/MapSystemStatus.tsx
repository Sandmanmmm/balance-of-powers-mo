import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { loadWorldData } from '../data/dataLoader';

interface MapStatus {
  loaded: boolean;
  chinaBoundaries: string[];
  chinaProvinces: string[];
  mismatches: string[];
  errors: string[];
}

export function MapSystemStatus() {
  const [status, setStatus] = useState<MapStatus>({
    loaded: false,
    chinaBoundaries: [],
    chinaProvinces: [],
    mismatches: [],
    errors: []
  });

  useEffect(() => {
    const analyzeSystem = async () => {
      try {
        console.log('🔍 Starting map system analysis...');
        const worldData = await loadWorldData();
        
        // Get China data
        const chinaProvinces = worldData.provinces
          .filter(p => p.country === 'China')
          .map(p => p.id);
        
        const chinaBoundaries = Object.keys(worldData.boundaries)
          .filter(key => key.startsWith('CN_'));
        
        // Find mismatches
        const provincesMissingBoundaries = chinaProvinces.filter(id => !chinaBoundaries.includes(id));
        const boundariesMissingProvinces = chinaBoundaries.filter(id => !chinaProvinces.includes(id));
        
        const mismatches = [
          ...provincesMissingBoundaries.map(id => `Province ${id} missing boundary`),
          ...boundariesMissingProvinces.map(id => `Boundary ${id} missing province`)
        ];
        
        // Test boundary data integrity
        const errors: string[] = [];
        chinaBoundaries.forEach(id => {
          const boundary = worldData.boundaries[id];
          if (!boundary?.geometry?.coordinates) {
            errors.push(`${id}: Missing geometry coordinates`);
          } else if (!Array.isArray(boundary.geometry.coordinates[0])) {
            errors.push(`${id}: Invalid coordinates format`);
          } else if (boundary.geometry.coordinates[0].length < 3) {
            errors.push(`${id}: Insufficient coordinate points`);
          }
        });
        
        setStatus({
          loaded: true,
          chinaBoundaries,
          chinaProvinces,
          mismatches,
          errors
        });
        
        console.log('🇨🇳 Map System Analysis Complete:', {
          chinaProvinces: chinaProvinces.length,
          chinaBoundaries: chinaBoundaries.length,
          mismatches: mismatches.length,
          errors: errors.length
        });
        
      } catch (error) {
        console.error('❌ Map system analysis failed:', error);
        setStatus(prev => ({
          ...prev,
          loaded: true,
          errors: [`System load failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }));
      }
    };
    
    analyzeSystem();
  }, []);

  if (!status.loaded) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm">Analyzing map system...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 max-w-lg">
      <h3 className="font-bold mb-3">🗺️ Map System Status</h3>
      
      <div className="space-y-3 text-sm">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between">
            <span>China Provinces:</span>
            <Badge variant={status.chinaProvinces.length > 0 ? "default" : "destructive"}>
              {status.chinaProvinces.length}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>China Boundaries:</span>
            <Badge variant={status.chinaBoundaries.length > 0 ? "default" : "destructive"}>
              {status.chinaBoundaries.length}
            </Badge>
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
            ✅ All systems operational! China should render correctly.
          </div>
        )}
        
        {/* Quick fixes */}
        {(status.errors.length > 0 || status.mismatches.length > 0) && (
          <div className="mt-3 p-2 bg-blue-50 rounded">
            <div className="text-xs text-blue-600 font-medium">Quick Fixes Available:</div>
            <ul className="text-xs text-blue-600 mt-1 space-y-1">
              {status.mismatches.length > 0 && <li>• Sync province IDs with boundary IDs</li>}
              {status.errors.length > 0 && <li>• Fix boundary geometry data</li>}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}