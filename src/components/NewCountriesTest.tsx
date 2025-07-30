import React, { useEffect, useState } from 'react';
import { loadWorldData } from '../data/dataLoader';

export function NewCountriesTest() {
  const [testResults, setTestResults] = useState<{
    newCountries: string[];
    totalCountries: number;
    totalProvinces: number;
    boundaryFiles: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runTest = async () => {
      try {
        const worldData = await loadWorldData();
        
        // List of newly added countries
        const newCountryCodes = ['JPN', 'KOR', 'AUS', 'ITA', 'ESP', 'ARG', 'TUR', 'EGY', 'ZAF'];
        
        const foundNewCountries = worldData.allNations
          .filter(nation => newCountryCodes.includes(nation.id))
          .map(nation => `${nation.id} (${nation.name})`);

        const boundaryKeys = Object.keys(worldData.allProvinceBoundaries);
        
        setTestResults({
          newCountries: foundNewCountries,
          totalCountries: worldData.allNations.length,
          totalProvinces: worldData.allProvinces.length,
          boundaryFiles: boundaryKeys.length
        });
        
        console.log('🌍 NEW COUNTRIES TEST RESULTS:');
        console.log('New countries found:', foundNewCountries);
        console.log('Total nations loaded:', worldData.allNations.length);
        console.log('Total provinces loaded:', worldData.allProvinces.length);
        console.log('Boundary files loaded:', boundaryKeys.length);
        console.log('Sample boundary keys:', boundaryKeys.slice(0, 10));
        
      } catch (err) {
        console.error('Test failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    runTest();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800">Testing New Countries...</h3>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mt-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="font-semibold text-red-800">Test Error</h3>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!testResults) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 className="font-semibold text-gray-800">No Test Results</h3>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded">
      <h3 className="font-semibold text-green-800 mb-3">New Countries Test Results</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">New Countries Found:</span>
          <div className="ml-4 text-green-700">
            {testResults.newCountries.length > 0 ? (
              <ul className="list-disc list-inside">
                {testResults.newCountries.map((country, index) => (
                  <li key={index}>{country}</li>
                ))}
              </ul>
            ) : (
              <span className="text-red-600">None found</span>
            )}
          </div>
        </div>
        
        <div className="flex gap-4 mt-3 text-xs text-gray-600">
          <span>Total Countries: {testResults.totalCountries}</span>
          <span>Total Provinces: {testResults.totalProvinces}</span>
          <span>Boundary Files: {testResults.boundaryFiles}</span>
        </div>
      </div>
    </div>
  );
}