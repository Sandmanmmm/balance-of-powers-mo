import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function BoundaryLoadingTest() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const testBoundaryLoading = async () => {
    setIsLoading(true);
    const results: Record<string, any> = {};

    // Test the new country-based boundary system
    const testCountries = [
      { code: 'USA', name: 'United States' },
      { code: 'CAN', name: 'Canada' },
      { code: 'CHN', name: 'China' },
      { code: 'IND', name: 'India' },
      { code: 'RUS', name: 'Russia' },
      { code: 'DEU', name: 'Germany' },
      { code: 'FRA', name: 'France' },
      { code: 'MEX', name: 'Mexico' }
    ];

    const detailLevels = ['overview', 'detailed', 'ultra'];

    for (const country of testCountries) {
      for (const detailLevel of detailLevels) {
        const testKey = `${country.code}_${detailLevel}`;
        
        try {
          const filePath = `/data/boundaries/${detailLevel}/${country.code}.json`;
          console.log(`Testing: ${filePath}`);
          
          const response = await fetch(filePath);
          
          if (response.ok) {
            const data = await response.json();
            results[testKey] = {
              status: 'success',
              country: country.name,
              detailLevel,
              type: data?.type || 'unknown',
              hasGeometry: !!data?.geometry,
              geometryType: data?.geometry?.type || 'none'
            };
          } else {
            results[testKey] = {
              status: 'missing',
              country: country.name,
              detailLevel,
              error: `${response.status} ${response.statusText}`
            };
          }
        } catch (error) {
          results[testKey] = {
            status: 'failed',
            country: country.name,
            detailLevel,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }

    setTestResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    testBoundaryLoading();
  }, []);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Boundary Loading Test</h3>
          <Button 
            onClick={testBoundaryLoading}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Testing...' : 'Retest'}
          </Button>
        </div>

        <div className="space-y-2">
          {Object.entries(testResults).map(([testKey, result]) => (
            <div key={testKey} className="text-sm border rounded p-2">
              <div className="font-medium">{result.country} ({result.detailLevel})</div>
              <div className={`text-xs ${result.status === 'success' ? 'text-green-600' : result.status === 'missing' ? 'text-yellow-600' : 'text-red-600'}`}>
                {result.status === 'success' 
                  ? `✓ ${result.type} loaded (${result.geometryType})` 
                  : result.status === 'missing'
                  ? `⚠ File missing`
                  : `✗ ${result.error}`
                }
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          Total regions tested: {Object.keys(testResults).length}
          <br />
          Successful: {Object.values(testResults).filter((r: any) => r.status === 'success').length}
          <br />
          Failed: {Object.values(testResults).filter((r: any) => r.status === 'failed').length}
        </div>
      </div>
    </Card>
  );
}