import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { getGameData } from '../data/gameData';

export function CountryBoundaryTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const testBoundaryLoading = async () => {
      try {
        console.log('🧪 Testing country boundary loading...');
        
        // Load game data
        const data = await getGameData();
        
        // Get unique countries from provinces
        const countries = Array.from(new Set(data.provinces.map(p => p.country)));
        
        console.log('📍 Countries with provinces:', countries);
        
        // Test boundary file availability
        const boundaryTests = [];
        
        const countryCodeMap: Record<string, string> = {
          'United States': 'USA',
          'Canada': 'CAN', 
          'Mexico': 'MEX',
          'China': 'CHN',
          'India': 'IND',
          'Russia': 'RUS',
          'France': 'FRA',
          'Germany': 'GER',
          'United Kingdom': 'GBR',
          'Australia': 'AUS',
          'Ukraine': 'UKR',
          'Poland': 'POL',
          'Brazil': 'BRA'
        };
        
        for (const country of countries) {
          const countryCode = countryCodeMap[country];
          if (countryCode) {
            try {
              const response = await fetch(`/data/boundaries/overview/${countryCode}.json`);
              const hasFile = response.ok;
              
              if (hasFile) {
                const boundaryData = await response.json();
                const provinceCount = Object.keys(boundaryData).length;
                boundaryTests.push({
                  country,
                  countryCode,
                  hasFile: true,
                  provinceCount,
                  status: '✅ Available'
                });
              } else {
                boundaryTests.push({
                  country,
                  countryCode,
                  hasFile: false,
                  provinceCount: 0,
                  status: '❌ Missing'
                });
              }
            } catch (error) {
              boundaryTests.push({
                country,
                countryCode,
                hasFile: false,
                provinceCount: 0,
                status: `❌ Error: ${error}`
              });
            }
          } else {
            boundaryTests.push({
              country,
              countryCode: 'N/A',
              hasFile: false,
              provinceCount: 0,
              status: '⚠️ No country code'
            });
          }
        }
        
        const totalCountries = countries.length;
        const withBoundaries = boundaryTests.filter(t => t.hasFile).length;
        const totalProvinces = data.provinces.length;
        
        setTestResults({
          countries: boundaryTests,
          summary: {
            totalCountries,
            withBoundaries,
            coverage: Math.round((withBoundaries / totalCountries) * 100),
            totalProvinces
          }
        });
        
        console.log('🧪 Boundary test results:', {
          totalCountries,
          withBoundaries,
          coverage: Math.round((withBoundaries / totalCountries) * 100) + '%'
        });
        
      } catch (error) {
        console.error('❌ Failed to test boundary loading:', error);
        setTestResults({ error: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    
    testBoundaryLoading();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Testing boundary loading...</p>
        </div>
      </Card>
    );
  }

  if (testResults?.error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <h3 className="font-semibold text-red-800 mb-2">Boundary Test Failed</h3>
        <p className="text-sm text-red-600">{testResults.error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">Country Boundary Status</h3>
      
      {/* Summary */}
      <div className="mb-4 p-3 bg-muted rounded">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Total Countries: <strong>{testResults.summary.totalCountries}</strong></div>
          <div>With Boundaries: <strong>{testResults.summary.withBoundaries}</strong></div>
          <div>Coverage: <strong>{testResults.summary.coverage}%</strong></div>
          <div>Total Provinces: <strong>{testResults.summary.totalProvinces}</strong></div>
        </div>
      </div>
      
      {/* Country List */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {testResults.countries.map((country: any, index: number) => (
          <div key={index} className="flex justify-between items-center text-xs p-2 rounded bg-background">
            <div className="font-medium">{country.country}</div>
            <div className="text-right">
              <div className={country.hasFile ? 'text-green-600' : 'text-red-600'}>
                {country.status}
              </div>
              {country.hasFile && (
                <div className="text-muted-foreground">
                  {country.provinceCount} provinces
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}