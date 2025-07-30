import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { geographicDataManager, type DetailLevel } from '../managers/GeographicDataManager';

interface BoundarySystemTesterProps {
  className?: string;
}

export function BoundarySystemTester({ className }: BoundarySystemTesterProps) {
  const [loadingState, setLoadingState] = useState<{
    loading: boolean;
    nation?: string;
    detailLevel?: DetailLevel;
    result?: any;
    error?: string;
  }>({ loading: false });

  const testNations = ['USA', 'CAN', 'CHN', 'RUS', 'FRA'];
  const detailLevels: DetailLevel[] = ['overview', 'detailed', 'ultra'];

  const testBoundaryLoad = async (nationCode: string, detailLevel: DetailLevel) => {
    setLoadingState({ loading: true, nation: nationCode, detailLevel });
    
    try {
      console.log(`🧪 Testing boundary load for ${nationCode} at ${detailLevel} detail`);
      const result = await geographicDataManager.loadNationBoundaries(nationCode, detailLevel);
      
      const provinceCount = Object.keys(result).length;
      console.log(`✅ Successfully loaded ${provinceCount} provinces for ${nationCode}`);
      
      setLoadingState({ 
        loading: false, 
        nation: nationCode, 
        detailLevel, 
        result: { provinceCount, sampleIds: Object.keys(result).slice(0, 3) }
      });
    } catch (error) {
      console.error(`❌ Failed to load boundaries for ${nationCode}:`, error);
      setLoadingState({ 
        loading: false, 
        nation: nationCode, 
        detailLevel, 
        error: String(error) 
      });
    }
  };

  const clearCache = () => {
    geographicDataManager.clearCache();
    setLoadingState({ loading: false });
    console.log('🧹 Cache cleared');
  };

  const getStats = () => {
    const stats = geographicDataManager.getStats();
    console.log('📊 GeographicDataManager Stats:', stats);
    return stats;
  };

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const updateStats = () => setStats(getStats());
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Country Boundary System Tester</h3>
          <Button variant="outline" size="sm" onClick={clearCache}>
            Clear Cache
          </Button>
        </div>

        {/* Test Controls */}
        <div className="space-y-2">
          <h4 className="font-medium">Test Nation Loading</h4>
          <div className="grid grid-cols-2 gap-2">
            {testNations.map(nation => (
              <div key={nation} className="space-y-1">
                <div className="text-sm font-medium">{nation}</div>
                <div className="flex gap-1">
                  {detailLevels.map(level => (
                    <Button
                      key={level}
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => testBoundaryLoad(nation, level)}
                      disabled={loadingState.loading}
                    >
                      {level.charAt(0).toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loadingState.loading && (
          <div className="text-center text-sm text-muted-foreground">
            Loading {loadingState.nation} at {loadingState.detailLevel} detail...
          </div>
        )}

        {/* Results */}
        {loadingState.result && !loadingState.loading && (
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm">
              <strong>✅ Success:</strong> {loadingState.nation} ({loadingState.detailLevel})
            </div>
            <div className="text-xs text-muted-foreground">
              Loaded {loadingState.result.provinceCount} provinces: {loadingState.result.sampleIds.join(', ')}
              {loadingState.result.provinceCount > 3 && '...'}
            </div>
          </div>
        )}

        {/* Errors */}
        {loadingState.error && !loadingState.loading && (
          <div className="bg-red-50 p-3 rounded">
            <div className="text-sm">
              <strong>❌ Error:</strong> {loadingState.nation} ({loadingState.detailLevel})
            </div>
            <div className="text-xs text-muted-foreground">
              {loadingState.error}
            </div>
          </div>
        )}

        {/* Stats Display */}
        {stats && (
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm font-medium mb-2">Cache Stats</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Entries: {stats.cacheEntries}</div>
              <div>Hit Rate: {(stats.hitRatio * 100).toFixed(1)}%</div>
              <div>Cache Size: {(stats.currentCacheSize / 1024).toFixed(1)}KB</div>
              <div>Requests: {stats.totalRequests}</div>
            </div>
          </div>
        )}

        {/* New Structure Info */}
        <div className="bg-slate-50 p-3 rounded">
          <div className="text-sm font-medium mb-2">New Boundary Structure</div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>📁 /data/boundaries/{'{detailLevel}'}/{'{ISO_A3}'}.json</div>
            <div>🔍 Example: /data/boundaries/overview/USA.json</div>
            <div>📊 Format: Record&lt;string, GeoJSONFeature&gt;</div>
            <div>🎯 Province-level boundaries within country files</div>
          </div>
        </div>
      </div>
    </Card>
  );
}