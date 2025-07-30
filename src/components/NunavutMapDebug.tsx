import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function NunavutMapDebug() {
  const [nunavutData, setNunavutData] = useState<any>(null);
  const [loadingState, setLoadingState] = useState<string>('Initializing...');

  useEffect(() => {
    const checkNunavutData = async () => {
      try {
        setLoadingState('Loading world data...');
        const { loadWorldData } = await import('../data/dataLoader');
        const worldData = await loadWorldData();
        
        setLoadingState('Searching for Nunavut...');
        
        // Check provinces data
        const nunavutProvince = worldData.provinces.find((p: any) => p.id === 'CAN_013');
        
        // Check boundaries data  
        const nunavutBoundary = worldData.boundaries.features?.find((f: any) => f.properties?.id === 'CAN_013');
        
        const debugData = {
          provincesTotal: worldData.provinces.length,
          boundariesTotal: worldData.boundaries.features?.length || 0,
          nunavutProvince: nunavutProvince ? {
            id: nunavutProvince.id,
            name: nunavutProvince.name,
            country: nunavutProvince.country,
            coordinates: nunavutProvince.coordinates,
            features: nunavutProvince.features,
            population: nunavutProvince.population?.total
          } : null,
          nunavutBoundary: nunavutBoundary ? {
            id: nunavutBoundary.properties?.id,
            name: nunavutBoundary.properties?.name,
            geometryType: nunavutBoundary.geometry?.type,
            coordinatesCount: nunavutBoundary.geometry?.coordinates?.length || 0,
            firstPolygonPoints: nunavutBoundary.geometry?.coordinates?.[0]?.[0]?.length || 0
          } : null
        };
        
        setNunavutData(debugData);
        setLoadingState('Complete');
        
      } catch (error) {
        console.error('Nunavut debug error:', error);
        setLoadingState(`Error: ${error.message}`);
        setNunavutData({ error: error.message });
      }
    };
    
    checkNunavutData();
  }, []);

  if (!nunavutData) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-2">🏔️ Nunavut Map Debug</h3>
        <p className="text-sm text-muted-foreground">{loadingState}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">🏔️ Nunavut Map Debug</h3>
      
      <div className="space-y-3 text-sm">
        <div>
          <Badge variant="outline" className="mb-2">Status: {loadingState}</Badge>
        </div>
        
        <div>
          <strong>Data Totals:</strong>
          <ul className="ml-4 mt-1">
            <li>Provinces: {nunavutData.provincesTotal}</li>
            <li>Boundaries: {nunavutData.boundariesTotal}</li>
          </ul>
        </div>

        <div>
          <strong>Nunavut Province Data:</strong>
          {nunavutData.nunavutProvince ? (
            <ul className="ml-4 mt-1">
              <li>✅ ID: {nunavutData.nunavutProvince.id}</li>
              <li>✅ Name: {nunavutData.nunavutProvince.name}</li>
              <li>✅ Country: {nunavutData.nunavutProvince.country}</li>
              <li>✅ Population: {nunavutData.nunavutProvince.population?.toLocaleString()}</li>
              <li>✅ Features: {nunavutData.nunavutProvince.features?.length} items</li>
              <li>✅ Coordinates: [{nunavutData.nunavutProvince.coordinates?.join(', ')}]</li>
            </ul>
          ) : (
            <p className="ml-4 mt-1 text-red-600">❌ Not found in provinces data</p>
          )}
        </div>

        <div>
          <strong>Nunavut Boundary Data:</strong>
          {nunavutData.nunavutBoundary ? (
            <ul className="ml-4 mt-1">
              <li>✅ ID: {nunavutData.nunavutBoundary.id}</li>
              <li>✅ Name: {nunavutData.nunavutBoundary.name}</li>
              <li>✅ Geometry: {nunavutData.nunavutBoundary.geometryType}</li>
              <li>✅ Polygons: {nunavutData.nunavutBoundary.coordinatesCount}</li>
              <li>✅ First polygon points: {nunavutData.nunavutBoundary.firstPolygonPoints}</li>
            </ul>
          ) : (
            <p className="ml-4 mt-1 text-red-600">❌ Not found in boundaries data</p>
          )}
        </div>

        {nunavutData.error && (
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <strong className="text-red-800">Error:</strong>
            <p className="text-red-600 text-xs mt-1">{nunavutData.error}</p>
          </div>
        )}
      </div>
    </Card>
  );
}