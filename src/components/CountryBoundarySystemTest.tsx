/**
 * CountryBoundarySystemTest - Comprehensive test suite for the new country-based boundary loading system
 * 
 * Tests the new /data/boundaries/{detailLevel}/{ISO_A3}.json structure
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Loader2, Map, Globe } from '@phosphor-icons/react';
import { geographicDataManager } from '../managers/GeographicDataManager';
import type { DetailLevel, GeoJSONFeature } from '../types/geo';

interface CountryTestResult {
  nationCode: string;
  detailLevel: DetailLevel;
  status: 'loading' | 'success' | 'error' | 'pending';
  loadTime?: number;
  boundaryCount?: number;
  error?: string;
  features?: Record<string, GeoJSONFeature>;
}

const TEST_COUNTRIES = [
  { code: 'USA', name: 'United States' },
  { code: 'CAN', name: 'Canada' },
  { code: 'MEX', name: 'Mexico' },
  { code: 'CHN', name: 'China' },
  { code: 'IND', name: 'India' },
  { code: 'RUS', name: 'Russia' },
  { code: 'DEU', name: 'Germany' },
  { code: 'FRA', name: 'France' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'JPN', name: 'Japan' }
];

const DETAIL_LEVELS: DetailLevel[] = ['overview', 'detailed', 'ultra'];

export function CountryBoundarySystemTest() {
  const [testResults, setTestResults] = useState<CountryTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [managerStats, setManagerStats] = useState<any>(null);

  const runFullTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const allTests: CountryTestResult[] = [];
    
    // Initialize all test cases
    for (const country of TEST_COUNTRIES) {
      for (const detailLevel of DETAIL_LEVELS) {
        allTests.push({
          nationCode: country.code,
          detailLevel,
          status: 'pending'
        });
      }
    }
    
    setTestResults(allTests);
    
    // Run tests sequentially to avoid overwhelming the system
    for (let i = 0; i < allTests.length; i++) {
      const test = allTests[i];
      setCurrentTest(`${test.nationCode} (${test.detailLevel})`);
      
      // Update test status to loading
      setTestResults(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status: 'loading' } : t
      ));
      
      const startTime = Date.now();
      
      try {
        console.log(`🧪 Testing ${test.nationCode} at ${test.detailLevel} detail level...`);
        
        const result = await geographicDataManager.loadNationBoundaries(
          test.nationCode,
          test.detailLevel
        );
        
        const loadTime = Date.now() - startTime;
        const boundaryCount = Object.keys(result).length;
        
        // Update test result with success
        setTestResults(prev => prev.map((t, idx) => 
          idx === i ? {
            ...t,
            status: 'success',
            loadTime,
            boundaryCount,
            features: result
          } : t
        ));
        
        console.log(`✅ ${test.nationCode} (${test.detailLevel}): ${boundaryCount} boundaries in ${loadTime}ms`);
        
      } catch (error) {
        const loadTime = Date.now() - startTime;
        
        // Update test result with error
        setTestResults(prev => prev.map((t, idx) => 
          idx === i ? {
            ...t,
            status: 'error',
            loadTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          } : t
        ));
        
        console.error(`❌ ${test.nationCode} (${test.detailLevel}): Failed after ${loadTime}ms - ${error}`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setCurrentTest('');
    setIsRunning(false);
    
    // Update manager stats
    setManagerStats(geographicDataManager.getStats());
  };

  const testSingleCountry = async (nationCode: string, detailLevel: DetailLevel) => {
    const startTime = Date.now();
    
    try {
      const result = await geographicDataManager.loadNationBoundaries(nationCode, detailLevel);
      const loadTime = Date.now() - startTime;
      const boundaryCount = Object.keys(result).length;
      
      console.log(`✅ Individual test - ${nationCode} (${detailLevel}): ${boundaryCount} boundaries in ${loadTime}ms`);
      return { success: true, loadTime, boundaryCount, result };
      
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error(`❌ Individual test - ${nationCode} (${detailLevel}): Failed after ${loadTime}ms - ${error}`);
      return { success: false, loadTime, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const upgradeCountryDetail = async (nationCode: string, newDetailLevel: DetailLevel) => {
    try {
      const result = await geographicDataManager.upgradeNationDetail(nationCode, newDetailLevel);
      const boundaryCount = Object.keys(result).length;
      console.log(`🔄 Upgraded ${nationCode} to ${newDetailLevel}: ${boundaryCount} boundaries`);
    } catch (error) {
      console.error(`❌ Failed to upgrade ${nationCode} to ${newDetailLevel}:`, error);
    }
  };

  const clearCache = () => {
    geographicDataManager.clearCache();
    setManagerStats(geographicDataManager.getStats());
    console.log('🧹 Cache cleared');
  };

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRunning) {
        setManagerStats(geographicDataManager.getStats());
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isRunning]);

  const successCount = testResults.filter(t => t.status === 'success').length;
  const errorCount = testResults.filter(t => t.status === 'error').length;
  const pendingCount = testResults.filter(t => t.status === 'pending').length;
  const loadingCount = testResults.filter(t => t.status === 'loading').length;
  const totalTests = testResults.length;
  const completedTests = successCount + errorCount;
  
  const averageLoadTime = testResults
    .filter(t => t.loadTime)
    .reduce((sum, t) => sum + (t.loadTime || 0), 0) / Math.max(1, completedTests);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Country-Based Boundary System Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={runFullTest} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Map className="w-4 h-4" />}
              {isRunning ? 'Running Tests...' : 'Run Full Test Suite'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={clearCache}
              disabled={isRunning}
            >
              Clear Cache
            </Button>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {completedTests} / {totalTests}</span>
                <span>Currently testing: {currentTest}</span>
              </div>
              <Progress value={(completedTests / totalTests) * 100} />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-blue-600">{loadingCount}</div>
              <div className="text-sm text-muted-foreground">Loading</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>

          {completedTests > 0 && (
            <div className="text-center">
              <div className="text-lg font-semibold">
                Average Load Time: {averageLoadTime.toFixed(0)}ms
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manager Statistics */}
      {managerStats && (
        <Card>
          <CardHeader>
            <CardTitle>Cache & Performance Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="text-center space-y-1">
                <div className="text-xl font-bold">{managerStats.cacheEntries}</div>
                <div className="text-sm text-muted-foreground">Cache Entries</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-xl font-bold">{(managerStats.hitRatio * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Hit Ratio</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-xl font-bold">{Math.round(managerStats.currentCacheSize / 1024)}KB</div>
                <div className="text-sm text-muted-foreground">Cache Size</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-xl font-bold">{managerStats.evictedEntries}</div>
                <div className="text-sm text-muted-foreground">Evictions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Country Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Country Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEST_COUNTRIES.map(country => (
              <div key={country.code} className="space-y-2">
                <h4 className="font-semibold">{country.name} ({country.code})</h4>
                <div className="space-y-1">
                  {DETAIL_LEVELS.map(level => (
                    <Button
                      key={level}
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleCountry(country.code, level)}
                      disabled={isRunning}
                      className="w-full"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => upgradeCountryDetail(country.code, 'ultra')}
                  disabled={isRunning}
                  className="w-full"
                >
                  Upgrade to Ultra
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Results Table */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {result.status === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    {result.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {result.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                    {result.status === 'pending' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                    
                    <span className="font-mono text-sm">
                      {result.nationCode}
                    </span>
                    
                    <Badge variant="outline" className="text-xs">
                      {result.detailLevel}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    {result.boundaryCount !== undefined && (
                      <span>{result.boundaryCount} boundaries</span>
                    )}
                    {result.loadTime !== undefined && (
                      <span>{result.loadTime}ms</span>
                    )}
                    {result.error && (
                      <span className="text-red-500 truncate max-w-xs">{result.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}