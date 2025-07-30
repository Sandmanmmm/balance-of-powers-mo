import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function BoundaryLoadingTest() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const testBoundaryLoading = async () => {
    setIsLoading(true);
    const results: Record<string, any> = {};

    const testRegions = [
      'superpowers/usa',
      'superpowers/china', 
      'superpowers/india',
      'superpowers/russia',
      'north_america',
      'europe_west',
      'europe_east'
    ];

    for (const region of testRegions) {
      try {
        const filePath = region.includes('/') 
          ? `/data/regions/${region.split('/')[0]}/province-boundaries_${region.split('/')[1]}.json`
          : `/data/regions/${region}/province-boundaries_${region}.json`;

        console.log(`Testing: ${filePath}`);
        const response = await fetch(filePath);
        
        if (response.ok) {
          const data = await response.json();
          results[region] = {
            status: 'success',
            features: data?.features?.length || 0,
            type: data?.type || 'unknown'
          };
        } else {
          results[region] = {
            status: 'failed',
            error: `${response.status} ${response.statusText}`
          };
        }
      } catch (error) {
        results[region] = {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
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
          {Object.entries(testResults).map(([region, result]) => (
            <div key={region} className="text-sm border rounded p-2">
              <div className="font-medium">{region}</div>
              <div className={`text-xs ${result.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {result.status === 'success' 
                  ? `✓ ${result.features} features loaded` 
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