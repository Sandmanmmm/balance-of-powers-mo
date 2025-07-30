import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { geoManager } from '../managers/GeographicDataManager';
import { DetailLevel } from '../types/geo';

export function GeographicSystemStatus() {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkSystemStatus = async () => {
    setIsLoading(true);
    try {
      // Test loading boundaries from different detail levels
      const testCountries = ['USA', 'CAN', 'CHN', 'DEU', 'FRA', 'GBR'];
      const detailLevels: DetailLevel[] = ['overview', 'detailed', 'ultra'];
      
      const testResults = [];
      let totalBoundariesLoaded = 0;
      
      for (const country of testCountries) {
        for (const level of detailLevels) {
          try {
            const startTime = Date.now();
            const boundaries = await geoManager.loadCountryBoundaries(country, level);
            const loadTime = Date.now() - startTime;
            const featureCount = boundaries.features?.length || 0;
            
            testResults.push({
              country,
              detailLevel: level,
              success: true,
              featureCount,
              loadTime,
              hasValidGeometry: boundaries.features?.some(f => f.geometry?.coordinates)
            });
            
            totalBoundariesLoaded += featureCount;
          } catch (error) {
            testResults.push({
              country,
              detailLevel: level,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
      
      // Get cache statistics
      const cacheStats = geoManager.getCacheStats();
      
      // Get cached countries info
      const cachedCountries = geoManager.getCachedCountries();
      
      const status = {
        timestamp: new Date().toISOString(),
        totalTestsRun: testResults.length,
        successfulLoads: testResults.filter(r => r.success).length,
        failedLoads: testResults.filter(r => !r.success).length,
        totalBoundariesLoaded,
        cacheStats: {
          entryCount: cacheStats.entryCount,
          totalSizeMB: cacheStats.totalSizeMB.toFixed(2),
          utilizationPercent: cacheStats.utilizationPercent.toFixed(1),
          totalFiles: cacheStats.loadStats.totalFiles
        },
        cachedCountries: cachedCountries.slice(0, 10), // Top 10 most recently accessed
        testResults: testResults.sort((a, b) => {
          if (a.country !== b.country) return a.country.localeCompare(b.country);
          const levelOrder = { overview: 1, detailed: 2, ultra: 3 };
          return levelOrder[a.detailLevel] - levelOrder[b.detailLevel];
        }),
        availableCountries: [...new Set(testResults.filter(r => r.success).map(r => r.country))],
        availableDetailLevels: [...new Set(testResults.filter(r => r.success).map(r => r.detailLevel))],
        performance: {
          averageLoadTime: testResults.filter(r => r.success).reduce((sum, r) => sum + (r.loadTime || 0), 0) / testResults.filter(r => r.success).length || 0,
          fastestLoad: Math.min(...testResults.filter(r => r.success).map(r => r.loadTime || Infinity)),
          slowestLoad: Math.max(...testResults.filter(r => r.success).map(r => r.loadTime || 0))
        }
      };
      
      setSystemStatus(status);
    } catch (error) {
      console.error('Failed to check system status:', error);
      setSystemStatus({
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  if (!systemStatus) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Checking geographic system...</p>
        </div>
      </Card>
    );
  }

  if (systemStatus.error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <h3 className="text-lg font-semibold text-red-800 mb-2">System Error</h3>
        <p className="text-sm text-red-600">{systemStatus.error}</p>
        <Button 
          onClick={checkSystemStatus} 
          variant="outline" 
          size="sm" 
          className="mt-2"
        >
          Retry Check
        </Button>
      </Card>
    );
  }

  const successRate = (systemStatus.successfulLoads / systemStatus.totalTestsRun * 100).toFixed(1);

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Geographic Data System Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Badge variant={systemStatus.successfulLoads > 20 ? "default" : "destructive"}>
              {successRate}% Success Rate
            </Badge>
            <p className="text-muted-foreground mt-1">
              {systemStatus.successfulLoads}/{systemStatus.totalTestsRun} tests passed
            </p>
          </div>
          <div>
            <Badge variant="outline">
              {systemStatus.totalBoundariesLoaded} Boundaries
            </Badge>
            <p className="text-muted-foreground mt-1">
              Total features loaded
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Cache Performance</h4>
          <div className="space-y-1 text-sm">
            <div>Size: {systemStatus.cacheStats.totalSizeMB} MB</div>
            <div>Entries: {systemStatus.cacheStats.entryCount}</div>
            <div>Utilization: {systemStatus.cacheStats.utilizationPercent}%</div>
            <div>Files: {systemStatus.cacheStats.totalFiles}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Load Performance</h4>
          <div className="space-y-1 text-sm">
            <div>Avg: {systemStatus.performance.averageLoadTime.toFixed(1)}ms</div>
            <div>Fastest: {systemStatus.performance.fastestLoad}ms</div>
            <div>Slowest: {systemStatus.performance.slowestLoad}ms</div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Available Countries ({systemStatus.availableCountries.length})</h4>
        <div className="flex flex-wrap gap-1">
          {systemStatus.availableCountries.map(country => (
            <Badge key={country} variant="secondary" className="text-xs">
              {country}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Detail Levels</h4>
        <div className="flex gap-2">
          {systemStatus.availableDetailLevels.map(level => (
            <Badge key={level} variant="outline" className="text-xs">
              {level}
            </Badge>
          ))}
        </div>
      </div>

      {systemStatus.failedLoads > 0 && (
        <div>
          <h4 className="font-medium mb-2 text-orange-700">Failed Loads ({systemStatus.failedLoads})</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {systemStatus.testResults
              .filter(r => !r.success)
              .map((result, index) => (
                <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                  <strong>{result.country} ({result.detailLevel})</strong>: {result.error}
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <Button 
          onClick={checkSystemStatus} 
          size="sm" 
          disabled={isLoading}
        >
          {isLoading ? 'Checking...' : 'Refresh Status'}
        </Button>
        <Button 
          onClick={() => geoManager.clearCache()} 
          variant="outline" 
          size="sm"
        >
          Clear Cache
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        Last updated: {new Date(systemStatus.timestamp).toLocaleTimeString()}
      </div>
    </Card>
  );
}