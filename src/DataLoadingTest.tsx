// Test the full data loading chain
import { useState, useEffect } from 'react';

function DataLoadingTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState('Starting...');

  useEffect(() => {
    const testDataChain = async () => {
      const results: string[] = [];
      
      try {
        setCurrentStep('Testing YAML parsing...');
        results.push('🔄 Testing YAML parsing...');
        
        // Test js-yaml
        const yaml = await import('js-yaml');
        results.push('✅ js-yaml library imported');
        
        // Test raw imports and parsing
        const buildingsRaw = await import('./data/buildings.yaml?raw');
        const parsedBuildings = yaml.default.load(buildingsRaw.default);
        results.push(`✅ buildings.yaml parsed: ${Array.isArray(parsedBuildings) ? parsedBuildings.length : 'object'} items`);

        setCurrentStep('Testing data loader...');
        results.push('🔄 Testing data loader...');
        
        // Test dataLoader
        const { loadWorldData } = await import('./data/dataLoader');
        results.push('✅ dataLoader module imported');
        
        setCurrentStep('Loading world data...');
        results.push('🔄 Loading world data...');
        
        const worldData = await loadWorldData();
        results.push(`✅ World data loaded: ${worldData.provinces?.length || 0} provinces, ${worldData.nations?.length || 0} nations`);
        
        setCurrentStep('Testing gameData module...');
        results.push('🔄 Testing gameData module...');
        
        // Test gameData
        const { loadGameData } = await import('./data/gameData');
        results.push('✅ gameData module imported');
        
        setCurrentStep('Loading full game data...');
        results.push('🔄 Loading full game data...');
        
        const gameData = await loadGameData();
        results.push(`✅ Game data loaded: ${gameData.provinces?.length || 0} provinces, ${gameData.nations?.length || 0} nations`);
        
        setCurrentStep('Testing useGameState hook...');
        results.push('🔄 Testing useGameState hook import...');
        
        // Test useGameState import
        const { useGameState } = await import('./hooks/useGameState');
        results.push('✅ useGameState hook imported successfully');
        
        setCurrentStep('All tests completed successfully!');
        results.push('🎉 All data loading tests passed!');
        
        setTestResults(results);
      } catch (err) {
        console.error('Data loading test failed:', err);
        setError(`${currentStep} - ${err instanceof Error ? err.message : 'Unknown error'}`);
        setTestResults(results);
      }
    };

    testDataChain();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-300 rounded-lg p-6 max-w-3xl">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Data Loading Test Failed</h1>
          <p className="text-red-700 mb-4">Failed at: {currentStep}</p>
          <pre className="text-sm text-red-700 bg-red-100 p-4 rounded overflow-auto mb-4">
            {error}
          </pre>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Progress before failure:</h3>
            <div className="space-y-1 max-h-40 overflow-auto">
              {testResults.map((result, i) => (
                <div key={i} className={`p-2 rounded text-sm ${
                  result.startsWith('✅') ? 'bg-green-100 text-green-800' : 
                  result.startsWith('❌') ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {result}
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-3xl w-full">
        <h1 className="text-3xl font-bold mb-6">Data Loading Chain Test</h1>
        
        <div className="mb-6 p-4 bg-blue-100 text-blue-800 rounded">
          Current: {currentStep}
        </div>
        
        <div className="space-y-2 text-left max-h-96 overflow-auto">
          {testResults.map((result, i) => (
            <div key={i} className={`p-3 rounded text-sm ${
              result.startsWith('✅') ? 'bg-green-100 text-green-800' : 
              result.startsWith('❌') ? 'bg-red-100 text-red-800' :
              result.startsWith('🎉') ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {result}
            </div>
          ))}
        </div>

        {testResults.length === 0 && (
          <div className="mt-4 p-3 bg-gray-100 text-gray-800 rounded">
            Initializing tests...
          </div>
        )}

        {currentStep === 'All tests completed successfully!' && (
          <div className="mt-8">
            <p className="text-green-600 mb-4">All data loading works! The issue must be in the App component rendering.</p>
            <button 
              onClick={() => {
                // Let's try a minimal version of the App
                window.location.href = window.location.href + '?test=minimal-app';
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Test Minimal App Component
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataLoadingTest;
