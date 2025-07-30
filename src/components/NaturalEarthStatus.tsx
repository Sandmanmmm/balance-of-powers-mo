import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { geographicDataManager } from '../managers/GeographicDataManager';

export function NaturalEarthStatus() {
  const [status, setStatus] = useState<{
    isLoading: boolean;
    loadedCountries: number;
    errors: number;
    detailLevel: string;
    cacheStats: any;
  }>({
    isLoading: true,
    loadedCountries: 0,
    errors: 0,
    detailLevel: 'overview',
    cacheStats: null
  });

  useEffect(() => {
    const updateStatus = () => {
      const stats = geographicDataManager.getCacheStats();
      const cachedCountries = geographicDataManager.getCachedCountries();
      
      setStatus({
        isLoading: false,
        loadedCountries: cachedCountries.length,
        errors: stats.loadStats.errors.length,
        detailLevel: cachedCountries[0]?.detailLevel || 'overview',
        cacheStats: stats
      });
    };

    // Update immediately and then every 2 seconds
    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);

  if (status.isLoading) {
    return (
      <Card className="p-3">
        <div className="text-sm text-muted-foreground">Loading Natural Earth boundaries...</div>
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Natural Earth Status</span>
          <Badge variant={status.errors > 0 ? 'destructive' : 'default'}>
            {status.loadedCountries} countries
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Detail:</span>
            <Badge variant="outline" className="ml-1 text-xs">
              {status.detailLevel}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Cache:</span>
            <Badge variant="outline" className="ml-1 text-xs">
              {status.cacheStats?.totalSizeMB?.toFixed(1) || 0}MB
            </Badge>
          </div>
        </div>
        
        {status.errors > 0 && (
          <div className="text-xs text-destructive">
            {status.errors} loading errors
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          🌍 Natural Earth Admin 0 boundaries loaded
        </div>
      </div>
    </Card>
  );
}