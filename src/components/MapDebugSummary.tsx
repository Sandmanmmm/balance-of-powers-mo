import { useState, useEffect } from 'react';
import { geographicDataManager } from '../managers/GeographicDataManager';
import { Card } from '@/components/ui/card';

export function MapDebugSummary() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        const knownCountries = ['CAN', 'USA', 'MEX', 'FRA', 'GBR', 'DEU', 'CHN', 'RUS', 'IND'];
        
        const stats = geographicDataManager.getStats();
        const cachedRegions = geographicDataManager.getCachedRegions();
        
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
        setDebugInfo({ error: String(error) });
      } finally {
        setIsLoading(false);
      }
    };

    loadDebugInfo();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Map Debug Summary</h3>
        <div className="text-muted-foreground">Loading debug info...</div>
      </Card>
    );
  }

  if (debugInfo?.error) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-2 text-red-600">Map Debug Error</h3>
        <div className="text-red-600 text-sm">{debugInfo.error}</div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Map Debug Summary</h3>
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