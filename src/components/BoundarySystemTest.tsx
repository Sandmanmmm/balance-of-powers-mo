import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { geographicDataManager, type DetailLevel } from '../managers/GeographicDataManager';

export function BoundarySystemTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  const testCountries = [
    { code: 'CAN', name: 'Canada' },
    { code: 'USA', name: 'United States' },
    { code: 'CHN', name: 'China' },
    { code: 'DEU', name: 'Germany' },
    { code: 'FRA', name: 'France' }
  ];

  const runBoundaryTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    const results: any[] = [];

    for (const country of testCountries) {
      for (const detailLevel of ['overview', 'detailed', 'ultra'] as DetailLevel[]) {
        setCurrentTest(`Testing ${country.name} (${detailLevel})`);
        
        try {
          const startTime = Date.now();
          const boundaries = await geographicDataManager.loadNationBoundaries(country.code, detailLevel);
          const loadTime = Date.now() - startTime;
          
          const featureCount = Object.keys(boundaries).length;
          const firstFeature = Object.values(boundaries)[0];
          
          results.push({
            country: country.code,
            name: country.name,
            detailLevel,
            success: true,
            featureCount,
            loadTime,
            hasGeometry: firstFeature?.geometry ? true : false,
            geometryType: firstFeature?.geometry?.type || 'N/A'
          });
          
        } catch (error) {
          results.push({
            country: country.code,
            name: country.name,
            detailLevel,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            featureCount: 0,
            loadTime: 0
          });
        }
      }
    }

    // Test cache statistics
    const stats = geographicDataManager.getStats();
    results.push({
      type: 'cache_stats',
      ...stats,
      currentCacheSizeMB: (stats.currentCacheSize / 1024 / 1024).toFixed(2)
    });

    setTestResults(results);
    setIsLoading(false);
    setCurrentTest('');
  };

  const clearCache = () => {
    geographicDataManager.clearCache();
    console.log('🧹 Cleared GeographicDataManager cache');
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Nation-Based Boundary System Test</h3>
        <p className="text-sm text-muted-foreground">
          Test the new country-based boundary loading system with detail levels
        </p>
      </div>

      <div className="flex space-x-2">
        <Button 
          onClick={runBoundaryTests} 
          disabled={isLoading}
          variant="default"
        >
          {isLoading ? 'Testing...' : 'Run Boundary Tests'}
        </Button>
        <Button 
          onClick={clearCache} 
          variant="outline"
        >
          Clear Cache
        </Button>
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">
          {currentTest && <p>⏳ {currentTest}</p>}
        </div>
      )}

      {testResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Test Results:</h4>
          <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => {
              if (result.type === 'cache_stats') {
                return (
                  <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>Cache Stats:</strong>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>Entries: {result.cacheEntries}</div>
                      <div>Size: {result.currentCacheSizeMB} MB</div>
                      <div>Hit Ratio: {(result.hitRatio * 100).toFixed(1)}%</div>
                      <div>Total Requests: {result.totalRequests}</div>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={index} 
                  className={`p-2 border rounded text-sm ${
                    result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="font-medium">
                    {result.name} ({result.country}) - {result.detailLevel}
                  </div>
                  {result.success ? (
                    <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                      <div>Features: {result.featureCount}</div>
                      <div>Load: {result.loadTime}ms</div>
                      <div>Geometry: {result.hasGeometry ? '✅' : '❌'}</div>
                      <div>Type: {result.geometryType}</div>
                    </div>
                  ) : (
                    <div className="text-red-600 text-xs mt-1">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}