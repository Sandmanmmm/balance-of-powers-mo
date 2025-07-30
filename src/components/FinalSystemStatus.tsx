import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle } from '@phosphor-icons/react';
import { geoManager } from '@/managers/GeographicDataManager';

interface SystemCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'loading';
  message: string;
  details?: string;
}

export function FinalSystemStatus() {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSystemChecks = async () => {
    setIsRunning(true);
    const newChecks: SystemCheck[] = [];

    // 1. Check if boundary files exist
    newChecks.push({ name: 'Testing File Access', status: 'loading', message: 'Checking boundary file access...' });
    setChecks([...newChecks]);

    try {
      const testResult = await geoManager.loadCountryBoundaries('USA', 'overview');
      newChecks[0] = {
        name: 'File Access',
        status: testResult.features?.length > 0 ? 'pass' : 'fail',
        message: testResult.features?.length > 0 ? 'Boundary files accessible' : 'No boundary features found',
        details: `Loaded ${testResult.features?.length || 0} features`
      };
    } catch (error) {
      newChecks[0] = {
        name: 'File Access',
        status: 'fail',
        message: 'Cannot access boundary files',
        details: error instanceof Error ? error.message : String(error)
      };
    }
    setChecks([...newChecks]);

    // 2. Check multiple countries
    newChecks.push({ name: 'Testing Multiple Countries', status: 'loading', message: 'Testing country loading...' });
    setChecks([...newChecks]);

    const testCountries = ['USA', 'CAN', 'CHN', 'RUS', 'DEU', 'FRA'];
    let successCount = 0;
    let totalFeatures = 0;

    for (const country of testCountries) {
      try {
        const result = await geoManager.loadCountryBoundaries(country, 'overview');
        if (result.features?.length > 0) {
          successCount++;
          totalFeatures += result.features.length;
        }
      } catch (error) {
        // Silent fail for this test
      }
    }

    newChecks[1] = {
      name: 'Multiple Countries',
      status: successCount >= 3 ? 'pass' : successCount > 0 ? 'warning' : 'fail',
      message: `${successCount}/${testCountries.length} countries loaded successfully`,
      details: `Total features: ${totalFeatures}`
    };
    setChecks([...newChecks]);

    // 3. Check detail levels
    newChecks.push({ name: 'Testing Detail Levels', status: 'loading', message: 'Testing detail levels...' });
    setChecks([...newChecks]);

    const detailLevels = ['overview', 'detailed', 'ultra'] as const;
    let levelSuccess = 0;

    for (const level of detailLevels) {
      try {
        const result = await geoManager.loadCountryBoundaries('USA', level);
        if (result.features?.length > 0) {
          levelSuccess++;
        }
      } catch (error) {
        // Silent fail for this test
      }
    }

    newChecks[2] = {
      name: 'Detail Levels',
      status: levelSuccess >= 2 ? 'pass' : levelSuccess > 0 ? 'warning' : 'fail',
      message: `${levelSuccess}/3 detail levels working`,
      details: levelSuccess === 3 ? 'All detail levels available' : 'Some detail levels missing'
    };
    setChecks([...newChecks]);

    // 4. Check cache performance
    newChecks.push({ name: 'Testing Cache', status: 'loading', message: 'Testing cache performance...' });
    setChecks([...newChecks]);

    const cacheStats = geoManager.getCacheStats();
    const cacheWorking = cacheStats.entryCount > 0 && cacheStats.totalSizeMB > 0;

    newChecks[3] = {
      name: 'Cache Performance',
      status: cacheWorking ? 'pass' : 'warning',
      message: cacheWorking ? 'Cache functioning properly' : 'Cache not utilized',
      details: `${cacheStats.entryCount} entries, ${cacheStats.totalSizeMB.toFixed(1)}MB`
    };
    setChecks([...newChecks]);

    // 5. Check load performance
    newChecks.push({ name: 'Testing Performance', status: 'loading', message: 'Testing load performance...' });
    setChecks([...newChecks]);

    const startTime = performance.now();
    try {
      await geoManager.loadCountryBoundaries('CAN', 'overview');
      const loadTime = performance.now() - startTime;
      
      newChecks[4] = {
        name: 'Load Performance',
        status: loadTime < 1000 ? 'pass' : loadTime < 3000 ? 'warning' : 'fail',
        message: `Load time: ${Math.round(loadTime)}ms`,
        details: loadTime < 1000 ? 'Fast loading' : loadTime < 3000 ? 'Acceptable speed' : 'Slow loading'
      };
    } catch (error) {
      newChecks[4] = {
        name: 'Load Performance',
        status: 'fail',
        message: 'Performance test failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
    setChecks([...newChecks]);

    setIsRunning(false);
  };

  useEffect(() => {
    runSystemChecks();
  }, []);

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'loading': return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: SystemCheck['status']) => {
    switch (status) {
      case 'pass': return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'fail': return <Badge className="bg-red-100 text-red-800">FAIL</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">WARN</Badge>;
      case 'loading': return <Badge className="bg-blue-100 text-blue-800">LOADING</Badge>;
    }
  };

  const passCount = checks.filter(c => c.status === 'pass').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const overallStatus = failCount === 0 ? (passCount === checks.length ? 'pass' : 'warning') : 'fail';

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Geographic System Final Status</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon(overallStatus)}
            {getStatusBadge(overallStatus)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{passCount}</div>
            <div className="text-sm text-muted-foreground">Passing</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{checks.filter(c => c.status === 'warning').length}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{failCount}</div>
            <div className="text-sm text-muted-foreground">Failing</div>
          </div>
        </div>

        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
              {getStatusIcon(check.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{check.name}</h4>
                  {getStatusBadge(check.status)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{check.message}</p>
                {check.details && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{check.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-2">
          <Button onClick={runSystemChecks} disabled={isRunning} size="sm">
            {isRunning ? 'Running Checks...' : 'Run System Checks'}
          </Button>
          <Button onClick={() => geoManager.clearCache()} variant="outline" size="sm">
            Clear Cache
          </Button>
        </div>

        {overallStatus === 'pass' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">System Ready</h4>
                <p className="text-sm text-green-700">
                  The Geographic Data System is fully operational and ready for use.
                </p>
              </div>
            </div>
          </div>
        )}

        {overallStatus === 'fail' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="font-medium text-red-800">System Issues Detected</h4>
                <p className="text-sm text-red-700">
                  Critical issues found. Check boundary files and network connectivity.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}