import React, { useState, useEffect } from 'react';
import { geographicDataManager } from '@/managers/GeographicDataManager';
import { DetailLevel } from '@/types/geo';

interface TestResult {
  country: string;
  level: DetailLevel;
  success: boolean;
  features: number;
  loadTime: number;
  error?: string;
}

export function BoundarySystemTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const testCountries = ['USA', 'CAN', 'CHN', 'RUS', 'DEU', 'FRA'];
  const testLevels: DetailLevel[] = ['overview', 'detailed', 'ultra'];

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    
    const newResults: TestResult[] = [];
    
    for (const country of testCountries) {
      for (const level of testLevels) {
        const startTime = performance.now();
        
        try {
          console.log(`Testing ${country} at ${level} detail...`);
          const data = await geographicDataManager.loadCountryBoundaries(country, level);
          const loadTime = performance.now() - startTime;
          
          newResults.push({
            country,
            level,
            success: true,
            features: data.features.length,
            loadTime,
          });
          
        } catch (error) {
          const loadTime = performance.now() - startTime;
          newResults.push({
            country,
            level,
            success: false,
            features: 0,
            loadTime,
            error: error instanceof Error ? error.message : String(error)
          });
        }
        
        // Update results as we go
        setResults([...newResults]);
      }
    }
    
    // Update cache stats
    setCacheStats(geographicDataManager.getCacheStats());
    setTesting(false);
  };

  const clearCache = () => {
    geographicDataManager.clearCache();
    setCacheStats(geographicDataManager.getCacheStats());
  };

  useEffect(() => {
    setCacheStats(geographicDataManager.getCacheStats());
  }, []);

  const getStatusIcon = (success: boolean) => success ? '✅' : '❌';
  const getStatusColor = (success: boolean) => success ? 'text-green-600' : 'text-red-600';

  const successfulTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  const averageLoadTime = results.length > 0 
    ? results.reduce((sum, r) => sum + r.loadTime, 0) / results.length 
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Boundary System Test</h3>
          <button
            onClick={runTests}
            disabled={testing}
            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Run Tests'}
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          Tests loading boundary data for {testCountries.length} countries at {testLevels.length} detail levels
        </div>
      </div>

      {/* Test Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 border rounded bg-card text-center">
            <div className="text-xl font-bold text-primary">{successfulTests}/{totalTests}</div>
            <div className="text-xs text-muted-foreground">Tests Passed</div>
          </div>
          <div className="p-3 border rounded bg-card text-center">
            <div className="text-xl font-bold text-primary">{averageLoadTime.toFixed(1)}ms</div>
            <div className="text-xs text-muted-foreground">Avg Load Time</div>
          </div>
          <div className="p-3 border rounded bg-card text-center">
            <div className="text-xl font-bold text-primary">
              {results.filter(r => r.success && r.features > 0).length}
            </div>
            <div className="text-xs text-muted-foreground">Valid Boundaries</div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {results.length > 0 && (
        <div className="p-4 border rounded-lg bg-card">
          <h4 className="font-semibold mb-3">Test Results</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                <div className="flex items-center gap-2">
                  <span className={getStatusColor(result.success)}>
                    {getStatusIcon(result.success)}
                  </span>
                  <span className="font-mono">{result.country}</span>
                  <span className="text-muted-foreground">({result.level})</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  {result.success ? (
                    <>
                      <span>{result.features} features</span>
                      <span>{result.loadTime.toFixed(1)}ms</span>
                    </>
                  ) : (
                    <span className="text-red-600 max-w-48 truncate">
                      {result.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cache Stats */}
      {cacheStats && (
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Cache Statistics</h4>
            <button
              onClick={clearCache}
              className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
            >
              Clear Cache
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Cached Entries</div>
              <div className="font-medium">{cacheStats.entryCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Cache Size</div>
              <div className="font-medium">{cacheStats.totalSizeMB.toFixed(1)} MB</div>
            </div>
            <div>
              <div className="text-muted-foreground">Files Loaded</div>
              <div className="font-medium">{cacheStats.loadStats.totalFiles}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Load Errors</div>
              <div className="font-medium">{cacheStats.loadStats.errors.length}</div>
            </div>
          </div>
          
          {cacheStats.loadStats.errors.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-muted-foreground mb-1">Recent Errors:</div>
              <div className="text-xs text-red-600 space-y-1">
                {cacheStats.loadStats.errors.slice(-3).map((error: string, index: number) => (
                  <div key={index} className="truncate">{error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {testing && (
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Testing boundary system...</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Progress: {results.length}/{testCountries.length * testLevels.length} tests completed
          </div>
        </div>
      )}
    </div>
  );
}