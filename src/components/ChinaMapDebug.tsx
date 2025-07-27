import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { loadWorldData } from '../data/dataLoader';

export function ChinaMapDebug() {
  const [chinaData, setChinaData] = useState<{
    provinces: any[];
    boundaries: any;
    total: number;
    missing: string[];
  }>({ provinces: [], boundaries: {}, total: 0, missing: [] });

  useEffect(() => {
    const loadData = async () => {
      try {
        const worldData = await loadWorldData();
        
        // Filter China provinces
        const chinaProvinces = worldData.provinces.filter(p => p.country === 'China');
        
        // Get China boundaries
        const chinaBoundaries = Object.keys(worldData.boundaries).filter(key => key.startsWith('CN_'));
        
        // Find missing boundaries
        const provinceIds = chinaProvinces.map(p => p.id);
        const missingBoundaries = provinceIds.filter(id => !chinaBoundaries.includes(id));
        const missingProvinces = chinaBoundaries.filter(id => !provinceIds.includes(id));
        
        setChinaData({
          provinces: chinaProvinces,
          boundaries: chinaBoundaries,
          total: chinaProvinces.length,
          missing: [...missingBoundaries, ...missingProvinces]
        });
        
        console.log('🇨🇳 China Debug Data:', {
          provinces: chinaProvinces.length,
          boundaries: chinaBoundaries.length,
          provinceIds,
          chinaBoundaries,
          missing: [...missingBoundaries, ...missingProvinces]
        });
      } catch (error) {
        console.error('Failed to load China debug data:', error);
      }
    };
    
    loadData();
  }, []);

  return (
    <Card className="p-4 max-w-md">
      <h3 className="font-bold mb-3">🇨🇳 China Map Debug</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Provinces:</span>
          <Badge variant="outline">{chinaData.total}</Badge>
        </div>
        
        <div className="flex justify-between">
          <span>Boundaries:</span>
          <Badge variant="outline">{Array.isArray(chinaData.boundaries) ? chinaData.boundaries.length : Object.keys(chinaData.boundaries).length}</Badge>
        </div>
        
        {chinaData.missing.length > 0 && (
          <div>
            <span className="text-red-600 font-medium">Missing Data:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {chinaData.missing.map(id => (
                <Badge key={id} variant="destructive" className="text-xs">
                  {id}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <span className="font-medium">Sample Provinces:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {chinaData.provinces.slice(0, 5).map(p => (
              <Badge key={p.id} variant="secondary" className="text-xs">
                {p.name}
              </Badge>
            ))}
            {chinaData.provinces.length > 5 && (
              <span className="text-xs text-muted-foreground">+{chinaData.provinces.length - 5} more</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}