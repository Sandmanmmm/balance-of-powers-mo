import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { geoManager } from '@/managers/GeographicDataManager';
import { DetailLevel } from '@/types/geo';

export function GeographicSystemTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const testCountries = ['USA', 'CAN', 'CHN', 'RUS', 'DEU', 'FRA'];
  const detailLevels: DetailLevel[] = ['overview', 'detailed', 'ultra'];

  const testLoadCountry = async (countryCode: string, detailLevel: DetailLevel) => {
    setLoading(true);
    try {
      console.log(`Testing load: ${countryCode} at ${detailLevel}`);
      const startTime = performance.now();
      
      const data = await geoManager.loadCountryBoundaries(countryCode, detailLevel);
      const loadTime = performance.now() - startTime;
      
      const result = {
        country: countryCode,
        detailLevel,
        success: true,
        featureCount: data.features?.length || 0,
        loadTime: Math.round(loadTime),
        cached: geoManager.isCached(countryCode, detailLevel)
      };
      
      setResults((prev: any) => [...(prev || []), result]);
      updateCacheStats();
      
    } catch (error) {
      const result = {
        country: countryCode,
        detailLevel,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        loadTime: 0,
        cached: false
      };
      
      setResults((prev: any) => [...(prev || []), result]);
    } finally {
      setLoading(false);
    }
  };

  const updateCacheStats = () => {
    const stats = geoManager.getCacheStats();
    setCacheStats(stats);
  };

  const testAllCountries = async () => {
    setResults([]);
    for (const country of testCountries) {
      await testLoadCountry(country, 'overview');
      // Small delay to see progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const clearCache = () => {
    geoManager.clearCache();
    updateCacheStats();
    setResults([]);
  };

  useEffect(() => {
    updateCacheStats();
  }, []);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Geographic System Test</h3>
        <div className="space-x-2">
          <Button 
            onClick={testAllCountries}
            disabled={loading}
            size="sm"
          >
            {loading ? 'Testing...' : 'Test All Countries'}
          </Button>
          <Button 
            onClick={clearCache}
            variant="outline"
            size="sm"
          >
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Cache Stats */}
      {cacheStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{cacheStats.entryCount}</div>
            <div className="text-xs text-muted-foreground">Cache Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{cacheStats.totalSizeMB.toFixed(1)}MB</div>
            <div className="text-xs text-muted-foreground">Cache Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{cacheStats.utilizationPercent.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Utilization</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{cacheStats.loadStats.totalFiles}</div>
            <div className="text-xs text-muted-foreground">Files Loaded</div>
          </div>
        </div>
      )}

      {/* Individual Country Tests */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {testCountries.map(country => (
          <div key={country} className="space-y-1">
            <div className="text-sm font-medium">{country}</div>
            <div className="space-x-1">
              {detailLevels.map(level => (
                <Button
                  key={level}
                  onClick={() => testLoadCountry(country, level)}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      {results && results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Test Results</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {results.map((result: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                <div className="flex items-center space-x-2">
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.country}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{result.detailLevel}</span>
                  {result.cached && <Badge variant="secondary" className="text-xs">cached</Badge>}
                </div>
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <>
                      <span className="text-xs">{result.featureCount} features</span>
                      <span className="text-xs text-green-600">{result.loadTime}ms</span>
                    </>
                  ) : (
                    <span className="text-xs text-red-600">{result.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Load Errors */}
      {cacheStats?.loadStats?.errors && cacheStats.loadStats.errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-red-600">Load Errors</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {cacheStats.loadStats.errors.map((error: string, index: number) => (
              <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}