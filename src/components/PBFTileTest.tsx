// PBF Tiles Test Component
import React, { useState, useEffect } from 'react';
import { geographicDataManager } from '../managers/GeographicDataManager';
import type { DetailLevel } from '../types/geo';

export function PBFTileTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testPBFTiles = async () => {
    setIsLoading(true);
    setTestResult('Starting PBF tile test...\n');
    
    const appendResult = (message: string) => {
      setTestResult(prev => prev + message + '\n');
    };

    try {
      // Test different detail levels and tile coordinates
      const testCases = [
        { detailLevel: 'overview' as DetailLevel, tileKey: 'overview_40_-100' },
        { detailLevel: 'overview' as DetailLevel, tileKey: 'overview_45_-75' },
        { detailLevel: 'detailed' as DetailLevel, tileKey: 'detailed_40_-100' },
        { detailLevel: 'detailed' as DetailLevel, tileKey: 'detailed_45_-75' },
      ];

      for (const testCase of testCases) {
        appendResult(`\n🧪 Testing ${testCase.detailLevel} tile: ${testCase.tileKey}`);
        
        try {
          const startTime = performance.now();
          const tileData = await geographicDataManager.loadTile(
            testCase.detailLevel, 
            testCase.tileKey
          );
          const loadTime = performance.now() - startTime;
          
          appendResult(`✅ Success! Loaded ${tileData.features.length} features in ${loadTime.toFixed(1)}ms`);
          
          if (tileData.features.length > 0) {
            const firstFeature = tileData.features[0];
            const countryName = firstFeature.properties?.NAME || firstFeature.properties?.name || 'Unknown';
            appendResult(`   📍 First feature: ${countryName}`);
            appendResult(`   🗺️ Geometry type: ${firstFeature.geometry?.type}`);
          }
          
        } catch (error) {
          appendResult(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      appendResult('\n🎯 PBF tile test completed!');
      
    } catch (error) {
      appendResult(`💥 Test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md max-w-2xl">
      <h3 className="text-lg font-bold mb-4 text-gray-800">PBF Tiles Test</h3>
      
      <button
        onClick={testPBFTiles}
        disabled={isLoading}
        className={`px-4 py-2 rounded text-white font-medium ${
          isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isLoading ? '🔄 Testing...' : '🧪 Test PBF Tiles'}
      </button>
      
      {testResult && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">Test Results:</h4>
          <pre className="bg-gray-100 p-3 rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-96">
            {testResult}
          </pre>
        </div>
      )}
    </div>
  );
}
