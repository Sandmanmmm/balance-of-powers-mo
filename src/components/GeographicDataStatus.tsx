import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { geographicDataManager } from '../managers/GeographicDataManager';
import { HardDrives, Trash, Activity } from '@phosphor-icons/react';

export function GeographicDataStatus() {
  const [stats, setStats] = useState<any>(null);
  const [cachedRegions, setCachedRegions] = useState<any[]>([]);

  const refreshStats = async () => {
    const currentStats = geographicDataManager.getStats();
    const regions = geographicDataManager.getCachedRegions();
    
    setStats(currentStats);
    setCachedRegions(regions);
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = (region?: string) => {
    geographicDataManager.clearCache(region);
    refreshStats();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  };

  if (!stats) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Activity className="animate-spin" size={16} />
          <span className="text-sm">Loading geographic data status...</span>
        </div>
      </Card>
    );
  }

  const cacheUsagePercent = (stats.currentCacheSize / (50 * 1024 * 1024)) * 100;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center space-x-2">
          <HardDrives size={16} />
          <span>Geographic Data Manager</span>
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleClearCache()}
          className="text-xs"
        >
          <Trash size={12} className="mr-1" />
          Clear All
        </Button>
      </div>

      {/* Cache Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">Cache Size</div>
          <div className="font-mono">
            {formatBytes(stats.currentCacheSize)}
            <span className="text-muted-foreground ml-1">
              ({cacheUsagePercent.toFixed(1)}%)
            </span>
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Entries</div>
          <div className="font-mono">{stats.cacheEntries}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Hit Ratio</div>
          <div className="font-mono">
            {(stats.hitRatio * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Requests</div>
          <div className="font-mono">{stats.totalRequests}</div>
        </div>
      </div>

      {/* Cache Usage Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Cache Usage</span>
          <span className="text-muted-foreground">50MB Limit</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              cacheUsagePercent > 80 
                ? 'bg-destructive' 
                : cacheUsagePercent > 60 
                ? 'bg-amber-500' 
                : 'bg-primary'
            }`}
            style={{ width: `${Math.min(cacheUsagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Cached Regions */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Cached Regions</div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {cachedRegions.length === 0 ? (
            <div className="text-xs text-muted-foreground italic">No regions cached</div>
          ) : (
            cachedRegions.map((region, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-mono">{region.region}</span>
                  <Badge variant="outline" className="text-xs">
                    {region.detailLevel}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">
                    {formatBytes(region.size)}
                  </span>
                  <span className="text-muted-foreground">
                    {formatTime(region.lastAccessed)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearCache(region.region)}
                    className="h-4 w-4 p-0"
                  >
                    <Trash size={10} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Performance Stats */}
      <div className="text-xs text-muted-foreground">
        <div>Avg Load Time: {stats.averageLoadTime.toFixed(0)}ms</div>
        <div>Total Data: {formatBytes(stats.totalBytesLoaded)}</div>
        <div>Evicted: {stats.evictedEntries} entries</div>
      </div>
    </Card>
  );
}