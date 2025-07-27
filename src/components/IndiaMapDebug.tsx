import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { loadWorldData } from '../data/dataLoader';

export function IndiaMapDebug() {
  const [indiaData, setIndiaData] = useState<{
    provinces: any[];
    boundaries: any;
    total: number;
    missing: string[];
  }>({ provinces: [], boundaries: {}, total: 0, missing: [] });

  useEffect(() => {
    const loadData = async () => {
      try {
        const worldData = await loadWorldData();
        
        // Filter India provinces
        const indiaProvinces = worldData.provinces.filter(p => p.country === 'India');
        
        // Get India boundaries
        const indiaBoundaries = Object.keys(worldData.boundaries).filter(key => key.startsWith('IND_'));
        
        // Find missing boundaries
        const provinceIds = indiaProvinces.map(p => p.id);
        const missingBoundaries = provinceIds.filter(id => !indiaBoundaries.includes(id));
        const missingProvinces = indiaBoundaries.filter(id => !provinceIds.includes(id));
        
        setIndiaData({
          provinces: indiaProvinces,
          boundaries: indiaBoundaries,
          total: indiaProvinces.length,
          missing: [...missingBoundaries, ...missingProvinces]
        });
        
        console.log('🇮🇳 India Debug Data:', {
          provinces: indiaProvinces.length,
          boundaries: indiaBoundaries.length,
          provinceIds,
          indiaBoundaries,
          missing: [...missingBoundaries, ...missingProvinces]
        });
      } catch (error) {
        console.error('Failed to load India debug data:', error);
      }
    };
    
    loadData();
  }, []);

  return (
    <Card className="p-4 max-w-md">
      <h3 className="font-bold mb-3">🇮🇳 India Map Debug</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Provinces:</span>
          <Badge variant="outline">{indiaData.total}</Badge>
        </div>
        
        <div className="flex justify-between">
          <span>Boundaries:</span>
          <Badge variant="outline">{Array.isArray(indiaData.boundaries) ? indiaData.boundaries.length : indiaData.boundaries.length}</Badge>
        </div>
        
        {indiaData.missing.length > 0 && (
          <div>
            <span className="text-red-600 font-medium">Missing Data:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {indiaData.missing.map(id => (
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
            {indiaData.provinces.slice(0, 8).map(p => (
              <Badge key={p.id} variant="secondary" className="text-xs">
                {p.name}
              </Badge>
            ))}
            {indiaData.provinces.length > 8 && (
              <span className="text-xs text-muted-foreground">+{indiaData.provinces.length - 8} more</span>
            )}
          </div>
        </div>
        
        <div>
          <span className="font-medium">Major States:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {indiaData.provinces
              .filter(p => ['Maharashtra', 'Uttar Pradesh', 'Tamil Nadu', 'Karnataka', 'Gujarat', 'West Bengal'].includes(p.name))
              .map(p => (
                <Badge key={p.id} variant="default" className="text-xs">
                  {p.name}
                </Badge>
              ))}
          </div>
        </div>
      </div>
    </Card>
  );
}