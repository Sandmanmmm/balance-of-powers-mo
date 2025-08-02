import React, { useState } from 'react';
import { geographicDataManager } from '@/managers/GeographicDataManager';
import type { DetailLevel } from '@/types/geo';

export const DetailLevelTest: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState('USA');
  const [selectedLevel, setSelectedLevel] = useState<DetailLevel>('low');
  const [loadResults, setLoadResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const countries = [
    'USA', 'CAN', 'CHN', 'IND', 'RUS', 'MEX', 
    'DEU', 'FRA', 'GBR', 'ITA', 'ESP', 'POL', 'CZE', 'HUN'
  ];

  const detailLevels: DetailLevel[] = ['low', 'overview', 'detailed', 'ultra'];

  const handleLoadTest = async () => {
    setLoading(true);
    const startTime = performance.now();
    
    try {
      console.log(`🧪 Testing ${selectedCountry} at ${selectedLevel} detail...`);
      
      const data = await geographicDataManager.loadProvinceBoundaries(
        selectedCountry, 
        selectedLevel
      );
      
      const loadTime = performance.now() - startTime;
      
      setLoadResults({
        country: selectedCountry,
        level: selectedLevel,
        provinceCount: data.features.length,
        loadTime: Math.round(loadTime),
        dataSize: JSON.stringify(data).length,
        dataSizeKB: Math.round(JSON.stringify(data).length / 1024),
        success: true
      });
      
      console.log(`✅ Loaded ${data.features.length} provinces in ${loadTime.toFixed(1)}ms`);
      
    } catch (error) {
      setLoadResults({
        country: selectedCountry,
        level: selectedLevel,
        error: error instanceof Error ? error.message : String(error),
        success: false
      });
      console.error('❌ Load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        🎚️ Detail Level Performance Test
      </h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country:
          </label>
          <select 
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detail Level:
          </label>
          <select 
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as DetailLevel)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {detailLevels.map(level => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <button
        onClick={handleLoadTest}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? '⏳ Loading...' : '🚀 Load Province Data'}
      </button>
      
      {loadResults && (
        <div className={`p-4 rounded-lg ${loadResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className="font-semibold mb-2">
            {loadResults.success ? '✅ Load Results' : '❌ Load Failed'}
          </h3>
          
          {loadResults.success ? (
            <div className="space-y-1 text-sm">
              <div><strong>Country:</strong> {loadResults.country}</div>
              <div><strong>Detail Level:</strong> {loadResults.level}</div>
              <div><strong>Provinces:</strong> {loadResults.provinceCount}</div>
              <div><strong>Load Time:</strong> {loadResults.loadTime}ms</div>
              <div><strong>Data Size:</strong> {loadResults.dataSizeKB}KB</div>
              <div className="mt-2 text-xs text-gray-600">
                {loadResults.level === 'low' && '🔸 Low quality provides faster loading with simplified boundaries'}
                {loadResults.level === 'overview' && '🔹 Overview quality balances detail and performance'} 
                {loadResults.level === 'detailed' && '🔺 Detailed quality provides high resolution boundaries'}
                {loadResults.level === 'ultra' && '🔶 Ultra quality provides maximum detail and precision'}
              </div>
            </div>
          ) : (
            <div className="text-red-700">
              <strong>Error:</strong> {loadResults.error}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <div className="grid grid-cols-2 gap-2">
          <div><strong>Low:</strong> ~5MB, simplified geometry</div>
          <div><strong>Overview:</strong> ~23MB, standard resolution</div>
          <div><strong>Detailed:</strong> ~23MB, high resolution</div>
          <div><strong>Ultra:</strong> ~23MB, maximum precision</div>
        </div>
      </div>
    </div>
  );
};

export default DetailLevelTest;
