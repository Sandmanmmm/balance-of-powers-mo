import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { geographicDataManager } from '../managers/GeographicDataManager';

export function MapLoadingTest() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testRegionLoading = async () => {
    setIsLoading(true);
    setResults([]);
    const newResults: string[] = [];

    const testRegions = [
      'north_america',
      'superpowers/usa',
      'europe_west',
      'caribbean'
    ];

    for (const region of testRegions) {
      try {
        const data = await geographicDataManager.loadRegion(region, 'overview');
        const featureCount = data?.features?.length || 0;
        const firstFeature = data?.features?.[0];
        const firstId = firstFeature?.properties?.id;
        
        newResults.push(`✅ ${region}: ${featureCount} features, first ID: ${firstId}`);
      } catch (error) {
        newResults.push(`❌ ${region}: ERROR - ${error}`);
      }
    }

    setResults(newResults);
    setIsLoading(false);
  };

  const testCountryLoading = async () => {
    setIsLoading(true);
    setResults([]);
    const newResults: string[] = [];

    const testCountries = ['CAN', 'USA', 'CHN', 'IND'];

    for (const country of testCountries) {
      try {
        const data = await geographicDataManager.loadNationBoundaries(country, 'overview');
        const boundaryCount = Object.keys(data).length;
        const firstKey = Object.keys(data)[0];
        const firstFeature = Object.values(data)[0];
        
        newResults.push(`✅ ${country}: ${boundaryCount} boundaries, first key: ${firstKey}, type: ${firstFeature?.type}`);
      } catch (error) {
        newResults.push(`❌ ${country}: ERROR - ${error}`);
      }
    }

    setResults(newResults);
    setIsLoading(false);
  };

  return (
    <Card className="p-4 max-w-md">
      <h3 className="font-semibold mb-3">Map Loading Test</h3>
      
      <div className="space-y-2 mb-4">
        <Button 
          onClick={testRegionLoading} 
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          Test Region Loading
        </Button>
        
        <Button 
          onClick={testCountryLoading} 
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          Test Country Loading
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading...</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-1">
          <h4 className="font-medium text-sm">Results:</h4>
          {results.map((result, index) => (
            <div key={index} className="text-xs font-mono p-2 bg-muted rounded">
              {result}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}