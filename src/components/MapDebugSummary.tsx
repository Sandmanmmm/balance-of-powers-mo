import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { geographicDataManager } from '../managers/GeographicDataManager';

export function MapDebugSummary() {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        const stats = geographicDataManager.getStats();
        const cachedRegions = geographicDataManager.getCachedRegions();
        
        // Check what boundary files exist
        const knownCountries = ['BRA', 'CAN', 'CHN', 'DEU', 'FRA', 'GBR', 'IND', 'MEX', 'RUS', 'USA'];
        const boundaryChecks = await Promise.allSettled(
          knownCountries.map(async (country) => {
            try {
              const boundaries = await geographicDataManager.loadNationBoundaries(country, 'overview');
              return { country, status: 'success', count: Object.keys(boundaries).length };
            } catch (error) {
              return { country, status: 'failed', error: String(error) };
            }
          })
        );

        setDebugInfo({
          stats,
          cachedRegions,
          boundaryChecks: boundaryChecks.map(result => 
            result.status === 'fulfilled' ? result.value : { status: 'error', error: result.reason }
          )
        });
      } catch (error) {
        console.error('Failed to load debug info:', error);
        setDebugInfo({ error: String(error) });
      }
    };

    loadDebugInfo();
  }, []);

  if (!debugInfo) {
    return (
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Loading debug info...</div>
      </Card>
    );
  }

  if (debugInfo.error) {
    return (
      <Card className="p-4">
        <div className="text-sm text-red-600">Debug Error: {debugInfo.error}</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 max-w-lg">
      <h3 className="text-lg font-semibold mb-3">Map System Debug</h3>
      
      <div className="space-y-3 text-sm">
        <div>
          <strong>Cache Stats:</strong>
          <div className="ml-2">
            <div>Entries: {debugInfo.stats.cacheEntries}</div>
            <div>Size: {Math.round(debugInfo.stats.currentCacheSize / 1024 / 1024 * 100) / 100}MB</div>
            <div>Hit Ratio: {Math.round(debugInfo.stats.hitRatio * 100)}%</div>
          </div>
        </div>

        <div>
          <strong>Cached Regions:</strong>
          <div className="ml-2">
            {debugInfo.cachedRegions.length === 0 ? (
              <div className="text-muted-foreground">None</div>
            ) : (
              debugInfo.cachedRegions.slice(0, 5).map((region: any, index: number) => (
                <div key={index} className="text-xs">
                  {region.region} ({region.detailLevel}) - {Math.round(region.size / 1024)}KB
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <strong>Boundary Loading Results:</strong>
          <div className="ml-2 grid grid-cols-2 gap-1 text-xs">
            {debugInfo.boundaryChecks.map((check: any, index: number) => (
              <div key={index} className={`p-1 rounded ${check.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {check.country}: {check.status === 'success' ? `${check.count} boundaries` : 'Failed'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}