import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { geographicDataManager } from '../managers/GeographicDataManager';
import { DetailLevel } from '../types/geo';
import type { GeoJSONFeature } from '../types/geo';

export function GeographicDataTester() {
  const [currentNation, setCurrentNation] = useState('CAN');
  const [currentDetail, setCurrentDetail] = useState<DetailLevel>('overview');
  const [boundaryData, setBoundaryData] = useState<Record<string, GeoJSONFeature> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const testNations = ['CAN', 'USA', 'CHN', 'RUS', 'FRA'];
  const detailLevels: DetailLevel[] = ['overview', 'detailed', 'ultra'];

  const loadBoundaries = async (nation: string, detail: DetailLevel) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await geographicDataManager.loadNationBoundaries(nation, detail);
      setBoundaryData(data);
      setStats(geographicDataManager.getStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setBoundaryData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoundaries(currentNation, currentDetail);
  }, [currentNation, currentDetail]);

  const handleUpgrade = async (nation: string, newDetail: DetailLevel) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await geographicDataManager.upgradeNationDetail(nation, newDetail);
      setBoundaryData(data);
      setCurrentDetail(newDetail);
      setStats(geographicDataManager.getStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    geographicDataManager.clearCache();
    setStats(geographicDataManager.getStats());
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Geographic Data Manager Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nation Selection */}
        <div className="flex space-x-2">
          <span className="font-medium">Nation:</span>
          {testNations.map(nation => (
            <Button
              key={nation}
              variant={currentNation === nation ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentNation(nation)}
            >
              {nation}
            </Button>
          ))}
        </div>

        {/* Detail Level Selection */}
        <div className="flex space-x-2">
          <span className="font-medium">Detail Level:</span>
          {detailLevels.map(level => (
            <Button
              key={level}
              variant={currentDetail === level ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentDetail(level)}
            >
              {level}
            </Button>
          ))}
        </div>

        {/* Upgrade Test */}
        <div className="flex space-x-2">
          <span className="font-medium">Upgrade to:</span>
          {detailLevels.map(level => (
            <Button
              key={level}
              variant="secondary"
              size="sm"
              onClick={() => handleUpgrade(currentNation, level)}
              disabled={level === currentDetail}
            >
              {level}
            </Button>
          ))}
        </div>

        {/* Clear Cache */}
        <div>
          <Button variant="destructive" size="sm" onClick={clearCache}>
            Clear Cache
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p>Loading {currentNation} boundaries...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Data Display */}
        {boundaryData && (
          <div className="space-y-2">
            <h3 className="font-medium">Loaded Boundaries for {currentNation} ({currentDetail}):</h3>
            <div className="bg-muted p-3 rounded text-sm font-mono max-h-40 overflow-y-auto">
              {Object.entries(boundaryData).map(([id, feature]) => (
                <div key={id} className="mb-1">
                  <strong>{id}:</strong> {feature.properties?.name || 'Unnamed'}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Total provinces: {Object.keys(boundaryData).length}
            </p>
          </div>
        )}

        {/* Stats Display */}
        {stats && (
          <div className="space-y-2">
            <h3 className="font-medium">Cache Statistics:</h3>
            <div className="bg-muted p-3 rounded text-sm">
              <div>Total Requests: {stats.totalRequests}</div>
              <div>Cache Hits: {stats.cacheHits}</div>
              <div>Cache Misses: {stats.cacheMisses}</div>
              <div>Hit Ratio: {(stats.hitRatio * 100).toFixed(1)}%</div>
              <div>Cache Entries: {stats.cacheEntries}</div>
              <div>Cache Size: {Math.round(stats.currentCacheSize / 1024)} KB</div>
              <div>Total Bytes Loaded: {Math.round(stats.totalBytesLoaded / 1024)} KB</div>
              <div>Evicted Entries: {stats.evictedEntries}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}