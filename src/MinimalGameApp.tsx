import { useGameState } from './hooks/useGameState';

function MinimalGameApp() {
  console.log('MinimalGameApp rendering...');
  
  try {
    console.log('Calling useGameState...');
    const gameStateResult = useGameState();
    console.log('useGameState returned:', {
      provinces: Array.isArray(gameStateResult.provinces) ? gameStateResult.provinces.length : 'not array',
      nations: Array.isArray(gameStateResult.nations) ? gameStateResult.nations.length : 'not array',
      isInitialized: gameStateResult.isInitialized,
      gameState: !!gameStateResult.gameState
    });

    const { gameState, provinces, nations, isInitialized } = gameStateResult;

    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-blue-600">
            Balance of Powers - Minimal Game App
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Game State</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Initialized:</strong> {isInitialized ? 'Yes' : 'No'}</p>
                <p><strong>Current Date:</strong> {gameState?.currentDate?.toLocaleDateString() || 'N/A'}</p>
                <p><strong>Selected Nation:</strong> {gameState?.selectedNation || 'None'}</p>
                <p><strong>Time Speed:</strong> {gameState?.timeSpeed || 'N/A'}</p>
                <p><strong>Paused:</strong> {gameState?.isPaused ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Data Status</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Provinces:</strong> {Array.isArray(provinces) ? provinces.length : 'Loading...'}</p>
                <p><strong>Nations:</strong> {Array.isArray(nations) ? nations.length : 'Loading...'}</p>
                <p><strong>Provinces Type:</strong> {typeof provinces}</p>
                <p><strong>Nations Type:</strong> {typeof nations}</p>
              </div>
            </div>
          </div>

          {Array.isArray(nations) && nations.length > 0 && (
            <div className="mt-6 bg-green-100 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-green-800">Sample Nations</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {nations.slice(0, 8).map((nation) => (
                  <div key={nation.id} className="bg-white p-2 rounded">
                    <strong>{nation.id}</strong>: {nation.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(provinces) && provinces.length > 0 && (
            <div className="mt-6 bg-blue-100 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">Sample Provinces</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {provinces.slice(0, 8).map((province) => (
                  <div key={province.id} className="bg-white p-2 rounded">
                    <strong>{province.id}</strong>: {province.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-green-600 text-lg font-semibold">
              🎉 useGameState hook is working correctly!
            </p>
            <p className="text-gray-600 mt-2">
              The issue must be in one of the complex components or their rendering logic.
            </p>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error('Error in MinimalGameApp:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-300 rounded-lg p-6 max-w-2xl">
          <h1 className="text-2xl font-bold text-red-600 mb-4">useGameState Hook Error</h1>
          <pre className="text-sm text-red-700 bg-red-100 p-4 rounded overflow-auto">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
          {error instanceof Error && error.stack && (
            <details className="mt-4">
              <summary className="text-sm text-gray-600 cursor-pointer">Stack Trace</summary>
              <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default MinimalGameApp;
