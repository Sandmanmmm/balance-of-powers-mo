import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { geographicDataManager } from '../managers/GeographicDataManager';

export function BoundaryLoadingStatus() {
  const [loadingStatus, setLoadingStatus] = useState<{
    cached: Array<{region: string; detailLevel: string; size: number}>;
    stats: any;
  } | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      try {
        const cached = geographicDataManager.getCachedRegions();
        const stats = geographicDataManager.getStats();
        setLoadingStatus({ cached, stats });
      } catch (error) {
        console.error('Failed to get boundary loading status:', error);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!loadingStatus) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Boundary Loading Status</h3>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  const { cached, stats } = loadingStatus;

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Boundary Loading Status</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Cache Stats:</span>
          <div className="ml-2">
            <div>Entries: {stats.cacheEntries}</div>
            <div>Size: {Math.round(stats.currentCacheSize / 1024 / 1024 * 100) / 100}MB</div>
            <div>Hit Ratio: {Math.round(stats.hitRatio * 100)}%</div>
            <div>Total Requests: {stats.totalRequests}</div>
          </div>
        </div>
        
        <div>
          <span className="font-medium">Cached Countries ({cached.length}):</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {cached.map((entry, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {entry.region}:{entry.detailLevel}
              </Badge>
            ))}
          </div>
        </div>
        
        {cached.length === 0 && (
          <p className="text-muted-foreground">No boundaries cached yet</p>
        )}
      </div>
    </Card>
  );
}