import React, { useState } from 'react';
import { geoManager } from '../managers/GeographicDataManager';

export function ProvinceLoadingTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testProvinceLoading = async (countryCode: string) => {
    setLoading(true);
    setResult('Loading...');
    
    try {
      console.log(`🧪 Testing province loading for ${countryCode}...`);
      
      // Test direct province loading
      const provinceBoundaries = await geoManager.loadProvinceBoundaries(countryCode, 'detailed');
      console.log(`📊 Direct province boundaries:`, provinceBoundaries);
      
      // Test through loadRegion (which should now use province boundaries)
      const regionData = await geoManager.loadRegion(countryCode, 'detailed');
      console.log(`📊 Region data:`, regionData);
      
      const provinceCount = Object.keys(regionData).length;
      const featureCount = provinceBoundaries.features.length;
      
      setResult(`✅ Success! 
        Country: ${countryCode}
        Features from direct call: ${featureCount}
        Provinces from region call: ${provinceCount}
        Sample provinces: ${Object.keys(regionData).slice(0, 3).join(', ')}${provinceCount > 3 ? '...' : ''}
      `);
      
    } catch (error) {
      console.error(`❌ Error testing ${countryCode}:`, error);
      setResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50 bg-white p-4 rounded shadow-lg border max-w-md">
      <h3 className="font-bold mb-2">Province Loading Test</h3>
      
      <div className="space-y-2 mb-4">
        <button 
          onClick={() => testProvinceLoading('USA')}
          disabled={loading}
          className="block w-full bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Test USA Provinces
        </button>
        
        <button 
          onClick={() => testProvinceLoading('CAN')}
          disabled={loading}
          className="block w-full bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          Test Canada Provinces
        </button>
        
        <button 
          onClick={() => testProvinceLoading('CHN')}
          disabled={loading}
          className="block w-full bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:bg-gray-400"
        >
          Test China Provinces
        </button>
      </div>
      
      <div className="text-sm">
        <strong>Result:</strong>
        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap overflow-auto max-h-32">
          {result || 'Click a button to test province loading'}
        </pre>
      </div>
      
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
