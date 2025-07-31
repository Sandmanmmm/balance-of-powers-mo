import { useState, useEffect } from 'react';

function DebugApp() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string>('');

  // Test data imports first
  const testDataImports = async () => {
    try {
      console.log('Testing data imports...');
      
      // Test basic data loading
      const { loadGameData } = await import('./data/gameData');
      console.log('✅ gameData module imported successfully');
      
      setDetails('gameData module imported');
      setStep(2);
    } catch (err) {
      console.error('❌ Data import failed:', err);
      setError(`Data import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Test actual data loading
  const testDataLoading = async () => {
    try {
      console.log('Testing actual data loading...');
      
      const { loadGameData } = await import('./data/gameData');
      const gameData = await loadGameData();
      
      console.log('Data loaded:', {
        provinces: gameData.provinces?.length || 0,
        nations: gameData.nations?.length || 0
      });
      
      setDetails(`Data loaded: ${gameData.provinces?.length || 0} provinces, ${gameData.nations?.length || 0} nations`);
      setStep(3);
    } catch (err) {
      console.error('❌ Data loading failed:', err);
      setError(`Data loading failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Test the useGameState hook
  const testGameState = async () => {
    try {
      console.log('Testing useGameState import...');
      const { useGameState } = await import('./hooks/useGameState');
      console.log('✅ useGameState imported successfully');
      setDetails('useGameState hook imported');
      setStep(4);
    } catch (err) {
      console.error('❌ useGameState import failed:', err);
      setError(`useGameState import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Test basic component imports
  const testComponentImports = async () => {
    try {
      console.log('Testing basic component imports...');
      
      const components = [
        './components/GameDashboard',
        './components/WorldMap',
        './components/ProvinceInfoPanel'
      ];

      for (const comp of components) {
        try {
          await import(comp);
          console.log(`✅ ${comp} imported successfully`);
        } catch (err) {
          console.error(`❌ ${comp} import failed:`, err);
          throw new Error(`Component import failed: ${comp} - ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
      
      setDetails('All core components imported successfully');
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown component import error');
    }
  };

  useEffect(() => {
    if (step === 1) {
      testDataImports();
    } else if (step === 2) {
      testDataLoading();
    } else if (step === 3) {
      testGameState();
    } else if (step === 4) {
      testComponentImports();
    }
  }, [step]);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-300 rounded-lg p-6 max-w-2xl">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Debug Error Found</h1>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Failed at step {step}</p>
            <p className="text-sm text-gray-600 mb-4">Details: {details}</p>
          </div>
          <pre className="text-sm text-red-700 bg-red-100 p-4 rounded overflow-auto whitespace-pre-wrap">
            {error}
          </pre>
          <button 
            onClick={() => { setError(null); setStep(1); setDetails(''); }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">Balance of Powers - Debug Mode</h1>
        
        <div className="space-y-4 max-w-md">
          <div className={`p-3 rounded ${step >= 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
            Step 1: Import Data Module {step >= 1 ? '✅' : '⏳'}
          </div>
          
          <div className={`p-3 rounded ${step >= 2 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
            Step 2: Load Game Data {step >= 2 ? '✅' : '⏳'}
          </div>
          
          <div className={`p-3 rounded ${step >= 3 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
            Step 3: Import useGameState Hook {step >= 3 ? '✅' : '⏳'}
          </div>
          
          <div className={`p-3 rounded ${step >= 4 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
            Step 4: Import Core Components {step >= 4 ? '✅' : '⏳'}
          </div>
          
          <div className={`p-3 rounded ${step >= 5 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
            Step 5: Ready to Load Full App {step >= 5 ? '✅' : '⏳'}
          </div>
        </div>

        {details && (
          <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded">
            {details}
          </div>
        )}

        {step >= 5 && (
          <div className="mt-8">
            <p className="text-green-600 mb-4">All tests passed! The issue is likely in the App component's render logic.</p>
            <button 
              onClick={() => {
                // Switch back to the real app
                setStep(6);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Full App Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DebugApp;
