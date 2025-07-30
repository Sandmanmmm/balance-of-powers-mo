import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { geographicDataManager, type DetailLevel } from '../managers/GeographicDataManager';
import { completeMigration } from '../utils/migrationHelper';
import { Play, CheckCircle, XCircle, Clock } from '@phosphor-icons/react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export function GeographicDataManagerTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, duration?: number) => {
    setTests(prev => prev.map(test => 
      test.name === name 
        ? { ...test, status, message, duration }
        : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // Initialize tests
    const testSuite: TestResult[] = [
      { name: 'Load USA Overview', status: 'pending', message: 'Waiting...' },
      { name: 'Load China Detailed', status: 'pending', message: 'Waiting...' },
      { name: 'Upgrade USA to Ultra', status: 'pending', message: 'Waiting...' },
      { name: 'Cache Hit Test', status: 'pending', message: 'Waiting...' },
      { name: 'Memory Management', status: 'pending', message: 'Waiting...' }
    ];
    
    setTests(testSuite);
    
    try {
      // Test 1: Load USA Overview
      const start1 = Date.now();
      const usaOverview = await geographicDataManager.loadRegion('usa', 'overview');
      const duration1 = Date.now() - start1;
      
      if (usaOverview.features.length > 0) {
        updateTest('Load USA Overview', 'success', 
          `Loaded ${usaOverview.features.length} features`, duration1);
      } else {
        updateTest('Load USA Overview', 'error', 'No features loaded', duration1);
      }
      
      // Test 2: Load China Detailed
      const start2 = Date.now();
      const chinaDetailed = await geographicDataManager.loadRegion('china', 'detailed');
      const duration2 = Date.now() - start2;
      
      if (chinaDetailed.features.length > 0) {
        updateTest('Load China Detailed', 'success', 
          `Loaded ${chinaDetailed.features.length} features`, duration2);
      } else {
        updateTest('Load China Detailed', 'error', 'No features loaded', duration2);
      }
      
      // Test 3: Upgrade USA to Ultra
      const start3 = Date.now();
      const usaUltra = await geographicDataManager.upgradeRegionDetail('usa', 'ultra');
      const duration3 = Date.now() - start3;
      
      if (usaUltra.features.length > 0) {
        updateTest('Upgrade USA to Ultra', 'success', 
          `Upgraded to ${usaUltra.features.length} features`, duration3);
      } else {
        updateTest('Upgrade USA to Ultra', 'error', 'Upgrade failed', duration3);
      }
      
      // Test 4: Cache Hit Test (reload USA ultra - should be faster)
      const start4 = Date.now();
      const usaUltraCached = await geographicDataManager.loadRegion('usa', 'ultra');
      const duration4 = Date.now() - start4;
      
      if (duration4 < 50) { // Should be very fast from cache
        updateTest('Cache Hit Test', 'success', 
          `Cache hit in ${duration4}ms`, duration4);
      } else {
        updateTest('Cache Hit Test', 'error', 
          `Too slow (${duration4}ms) - possible cache miss`, duration4);
      }
      
      // Test 5: Memory Management
      const stats = geographicDataManager.getStats();
      const cacheSize = stats.currentCacheSize;
      const hitRatio = stats.hitRatio;
      
      if (cacheSize > 0 && hitRatio > 0) {
        updateTest('Memory Management', 'success', 
          `Cache: ${Math.round(cacheSize/1024)}KB, Hit ratio: ${Math.round(hitRatio*100)}%`);
      } else {
        updateTest('Memory Management', 'error', 
          `Invalid stats - Cache: ${cacheSize}, Hit ratio: ${hitRatio}`);
      }
      
    } catch (error) {
      console.error('Test suite error:', error);
      setTests(prev => prev.map(test => 
        test.status === 'pending' 
          ? { ...test, status: 'error', message: `Error: ${error}` }
          : test
      ));
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Geographic Data Manager Test Suite</h3>
        <div className="flex space-x-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => completeMigration()}
            className="text-xs"
          >
            Full Migration
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={runTests}
            disabled={isRunning}
            className="text-xs"
          >
            <Play size={12} className="mr-1" />
            {isRunning ? 'Running...' : 'Run Tests'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {tests.map((test, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              {getStatusIcon(test.status)}
              <span>{test.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              {test.duration && (
                <span className="text-muted-foreground">
                  {test.duration}ms
                </span>
              )}
              <Badge variant="outline" className={`text-xs ${getStatusColor(test.status)}`}>
                {test.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {tests.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          {tests.map((test, index) => (
            <div key={index} className="truncate">
              <span className="font-mono">{test.name}:</span> {test.message}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}