import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function QuickMapTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testDirectFetch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/data/regions/north_america/province-boundaries_north_america.json');
      const data = await response.json();
      
      const features = data?.features || [];
      const canadianFeatures = features.filter(f => f.properties?.id?.startsWith('CAN_'));
      
      setTestResult(`✅ SUCCESS: Loaded ${features.length} total features, ${canadianFeatures.length} Canadian provinces. First Canadian province: ${canadianFeatures[0]?.properties?.name || 'None'}`);
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