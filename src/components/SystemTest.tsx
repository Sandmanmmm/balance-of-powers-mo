import { useEffect, useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { loadWorldData } from '../data/dataLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export function SystemTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { provinces, nations, isInitialized } = useGameState();

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    try {
      // Test 1: Check if game state is initialized
      results.push({
        name: 'Game State Initialization',
        status: isInitialized ? 'pass' : 'fail',
        message: isInitialized ? 'Game state is properly initialized' : 'Game state is not initialized'
      });

      // Test 2: Check provinces loading
      const provinceCount = Array.isArray(provinces) ? provinces.length : 0;
      results.push({
        name: 'Provinces Loading',
        status: provinceCount > 0 ? 'pass' : 'fail',
        message: `Loaded ${provinceCount} provinces`,
        details: provinceCount > 0 ? provinces.slice(0, 3).map(p => p?.name).filter(Boolean) : []
      });

      // Test 3: Check nations loading
      const nationCount = Array.isArray(nations) ? nations.length : 0;
      results.push({
        name: 'Nations Loading',
        status: nationCount > 0 ? 'pass' : 'fail',
        message: `Loaded ${nationCount} nations`,
        details: nationCount > 0 ? nations.slice(0, 5).map(n => n?.name).filter(Boolean) : []
      });

      // Test 4: Direct data loader test
      try {
        const worldData = await loadWorldData();
        results.push({
          name: 'Direct Data Loader',
          status: worldData.nations.length > 0 && worldData.provinces.length > 0 ? 'pass' : 'warning',
          message: `Direct load: ${worldData.nations.length} nations, ${worldData.provinces.length} provinces`,
          details: {
            warnings: worldData.warnings?.slice(0, 3),
            loadTime: worldData.loadingStats?.totalTime
          }
        });
      } catch (error) {
        results.push({
          name: 'Direct Data Loader',
          status: 'fail',
          message: `Direct load failed: ${error}`,
          details: { error: String(error) }
        });
      }

      // Test 5: Check for specific key countries
      const keyCountries = ['CAN', 'USA', 'CHN', 'RUS'];
      const foundCountries = keyCountries.filter(id => 
        nations.some(n => n?.id === id)
      );
      results.push({
        name: 'Key Countries Present',
        status: foundCountries.length >= 2 ? 'pass' : 'warning',
        message: `Found ${foundCountries.length}/${keyCountries.length} key countries`,
        details: foundCountries
      });

      // Test 6: Check boundary data structure
      try {
        const response = await fetch('/data/boundaries/overview/CAN.json');
        if (response.ok) {
          const canadaBoundaries = await response.json();
          results.push({
            name: 'Boundary System',
            status: 'pass',
            message: 'New boundary system is accessible',
            details: { 
              hasCanada: !!canadaBoundaries,
              provinceCount: Object.keys(canadaBoundaries || {}).length 
            }
          });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        results.push({
          name: 'Boundary System',
          status: 'fail',
          message: `Boundary system test failed: ${error}`,
          details: { error: String(error) }
        });
      }

    } catch (error) {
      results.push({
        name: 'System Test',
        status: 'fail',
        message: `Overall test failed: ${error}`,
        details: { error: String(error) }
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run tests on mount
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const passCount = testResults.filter(r => r.status === 'pass').length;
  const failCount = testResults.filter(r => r.status === 'fail').length;
  const warningCount = testResults.filter(r => r.status === 'warning').length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          System Test Results
          <Button
            onClick={runTests}
            disabled={isRunning}
            size="sm"
            variant="outline"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Re-run Tests
          </Button>
        </CardTitle>
        <CardDescription>
          Comprehensive test of the Balance of Powers game system
        </CardDescription>
        {testResults.length > 0 && (
          <div className="flex gap-2 mt-2">
            <Badge variant="default">{passCount} Pass</Badge>
            <Badge variant="destructive">{failCount} Fail</Badge>
            <Badge variant="secondary">{warningCount} Warning</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 border rounded-md"
            >
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{result.name}</span>
                  {getStatusBadge(result.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {result.message}
                </p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Show Details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
          
          {testResults.length === 0 && isRunning && (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Running tests...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}