import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function QuickMapTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testDirectFetch = async () => {
    setIsLoading(true);
    try {
      // Test new country-based boundary system
      const response = await fetch('/data/boundaries/overview/CAN.json');
      const data = await response.json();
      
      if (data && data.type === 'Feature' && data.properties) {
        setTestResult(`✅ SUCCESS: Loaded country boundary for ${data.properties.name} (${data.properties.id}). Geometry type: ${data.geometry?.type}`);
      } else {
        setTestResult(`❌ UNEXPECTED FORMAT: Expected GeoJSONFeature, got ${data?.type}`);
      }
    } catch (error) {
      setTestResult(`❌ ERROR: ${error}`);
    }
    setIsLoading(false);
  };

  return (
    <Card className="p-4 max-w-md">
      <h3 className="font-semibold mb-3">Quick Map Test</h3>
      
      <Button 
        onClick={testDirectFetch} 
        disabled={isLoading}
        className="w-full mb-3"
      >
        {isLoading ? 'Testing...' : 'Test Direct Fetch'}
      </Button>

      {testResult && (
        <div className="text-xs font-mono p-2 bg-muted rounded">
          {testResult}
        </div>
      )}
    </Card>
  );
}