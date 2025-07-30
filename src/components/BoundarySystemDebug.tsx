import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { geographicDataManager } from '../managers/GeographicDataManager';

export function BoundarySystemDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testBoundarySystem = async () => {
    setLoading(true);
    try {
      // Test which countries we can actually load boundaries for
      const availableCountries = ['USA', 'CAN', 'MEX', 'CHN', 'IND', 'RUS', 'FRA', 'GER', 'AUS', 'BRA', 'POL', 'UKR'];
      const results = {
        successful: [] as string[],
        failed: [] as string[],
        details: {} as Record<string, any>
      };

      for (const countryCode of availableCountries) {
        try {
          console.log(`Testing boundary load for ${countryCode}...`);
          const boundaries = await geographicDataManager.loadNationBoundaries(countryCode, 'overview');
          const featureCount = Object.keys(boundaries).length;
          
          results.successful.push(countryCode);
          results.details[countryCode] = {
            status: 'success',
            featureCount,
            features: Object.keys(boundaries)
          };
          
          console.log(`✅ ${countryCode}: ${featureCount} features`);
        } catch (error) {
          results.failed.push(countryCode);
          results.details[countryCode] = {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
          };
          
          console.log(`❌ ${countryCode}: ${error}`);
        }
      }

      // Get cache stats
      const cacheStats = geographicDataManager.getStats();

      setDebugInfo({
        results,
        cacheStats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Test failed:', error);
      setDebugInfo({
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 max-w-4xl">
      <h3 className="text-lg font-semibold mb-4">Boundary System Debug</h3>
      
      <div className="space-y-4">
        <Button 
          onClick={testBoundarySystem} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing Boundary System...' : 'Test Boundary System'}
        </Button>

        {debugInfo && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Last test: {debugInfo.timestamp}
            </div>

            {debugInfo.error ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <strong className="text-red-800">Error:</strong>
                <pre className="text-red-700 text-xs mt-1">{debugInfo.error}</pre>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">
                      Successful ({debugInfo.results.successful.length})
                    </h4>
                    <div className="space-y-1">
                      {debugInfo.results.successful.map((country: string) => (
                        <div key={country} className="flex items-center justify-between">
                          <Badge variant="secondary">{country}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {debugInfo.results.details[country]?.featureCount} features
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-red-700 mb-2">
                      Failed ({debugInfo.results.failed.length})
                    </h4>
                    <div className="space-y-1">
                      {debugInfo.results.failed.map((country: string) => (
                        <div key={country} className="flex flex-col">
                          <Badge variant="destructive">{country}</Badge>
                          <span className="text-xs text-red-600 mt-1">
                            {debugInfo.results.details[country]?.error}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-blue-800 mb-2">Cache Statistics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Cache Entries: {debugInfo.cacheStats.cacheEntries}</div>
                    <div>Hit Ratio: {Math.round(debugInfo.cacheStats.hitRatio * 100)}%</div>
                    <div>Total Requests: {debugInfo.cacheStats.totalRequests}</div>
                    <div>Cache Size: {Math.round(debugInfo.cacheStats.currentCacheSize / 1024 / 1024 * 100) / 100}MB</div>
                  </div>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Raw Debug Data</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}