/**
 * Quick validation test for the country-based boundary system
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { geographicDataManager } from '../managers/GeographicDataManager';
import type { DetailLevel } from '../types/geo';

export function QuickBoundaryTest() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runQuickTest = async () => {
    setIsLoading(true);
    setResults([]);

    const testCases = [
      { country: 'USA', level: 'overview' as DetailLevel },
      { country: 'CAN', level: 'overview' as DetailLevel },
      { country: 'CHN', level: 'overview' as DetailLevel },
      { country: 'USA', level: 'detailed' as DetailLevel },
      { country: 'CAN', level: 'detailed' as DetailLevel },
      { country: 'USA', level: 'ultra' as DetailLevel }
    ];

    for (const test of testCases) {
      try {
        const start = Date.now();
        const result = await geographicDataManager.loadNationBoundaries(test.country, test.level);
        const time = Date.now() - start;
        const count = Object.keys(result).length;
        
        setResults(prev => [...prev, `✅ ${test.country} ${test.level}: ${count} boundaries (${time}ms)`]);
      } catch (error) {
        setResults(prev => [...prev, `❌ ${test.country} ${test.level}: ${error}`]);
      }
    }

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Quick Boundary System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runQuickTest} disabled={isLoading}>
          {isLoading ? 'Testing...' : 'Run Quick Test'}
        </Button>
        
        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((result, i) => (
              <div key={i} className="text-sm font-mono bg-muted p-2 rounded">
                {result}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}