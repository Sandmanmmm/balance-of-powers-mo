import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function BoundaryFetchTest() {
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);

  const testCountries = ['BRA', 'ARG', 'ITA', 'ESP', 'JPN', 'KOR', 'EGY', 'TUR', 'ZAF', 'AUS'];

  const testBoundaryFetch = async () => {
    setTesting(true);
    const results: Record<string, string> = {};

    for (const country of testCountries) {
      try {
        const url = `/data/boundaries/overview/${country}.json`;
        console.log(`Testing fetch for: ${url}`);
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          const provinceCount = Object.keys(data).length;
          results[country] = `✅ ${provinceCount} provinces`;
        } else {
          results[country] = `❌ HTTP ${response.status}`;
        }
      } catch (error) {
        results[country] = `❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`;
      }
    }

    setTestResults(results);
    setTesting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Boundary Fetch Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Test if boundary files can be fetched from the public directory.
        </p>
        
        <Button 
          onClick={testBoundaryFetch}
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test Boundary Fetching'}
        </Button>

        {Object.keys(testResults).length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Test Results</h4>
            <div className="space-y-1">
              {Object.entries(testResults).map(([country, result]) => (
                <div key={country} className="flex justify-between items-center text-sm">
                  <span className="font-mono">{country}</span>
                  <Badge variant={result.includes('✅') ? 'default' : 'destructive'} className="text-xs">
                    {result}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}