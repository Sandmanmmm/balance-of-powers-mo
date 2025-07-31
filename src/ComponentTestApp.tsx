import { useState } from 'react';
import { useGameState } from './hooks/useGameState';

// Import the components properly
import { GameDashboard } from './components/GameDashboard';
import { WorldMap } from './components/WorldMap';
import { ProvinceInfoPanel } from './components/ProvinceInfoPanel';

function ComponentTestApp() {
  const [currentTest, setCurrentTest] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const gameStateData = useGameState();
  const { gameState, provinces, nations, isInitialized, selectProvince, selectNation, setMapOverlay } = gameStateData;

  const tests = [
    {
      name: 'Base App (Working)',
      component: () => (
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Base App - Working ✅</h1>
          <p>useGameState hook working with {Array.isArray(provinces) ? provinces.length : 0} provinces</p>
        </div>
      )
    },
    {
      name: 'GameDashboard Component',
      component: () => {
        const selectedNation = nations.find(n => n.id === gameState?.selectedNation);
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Testing GameDashboard</h1>
            {selectedNation ? (
              <GameDashboard
                nation={selectedNation}
                gameState={gameState}
                onTogglePause={() => {}}
                onSpeedChange={() => {}}
                onPolicyChange={() => {}}
                onDecisionMake={() => {}}
              />
            ) : (
              <p>No nation selected for testing</p>
            )}
          </div>
        );
      }
    },
    {
      name: 'WorldMap Component',
      component: () => {
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Testing WorldMap</h1>
            <div className="h-96 border rounded">
              <WorldMap
                provinces={Array.isArray(provinces) ? provinces : []}
                selectedProvince={gameState.selectedProvince}
                mapOverlay={gameState.mapOverlay}
                onProvinceSelect={selectProvince}
                onOverlayChange={setMapOverlay}
              />
            </div>
          </div>
        );
      }
    },
    {
      name: 'ProvinceInfoPanel Component',
      component: () => {
        const selectedProvince = provinces.find(p => p.id === gameState?.selectedProvince);
        const selectedNation = nations.find(n => n.id === gameState?.selectedNation);
        
        const testProvince = selectedProvince || provinces[0];
        
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Testing ProvinceInfoPanel</h1>
            {testProvince && selectedNation ? (
              <ProvinceInfoPanel 
                province={testProvince} 
                nation={selectedNation}
                onStartConstruction={() => {}}
                onCancelConstruction={() => {}}
                isPlayerControlled={true}
              />
            ) : (
              <p>No provinces or nation available for testing</p>
            )}
          </div>
        );
      }
    }
  ];

  const runTest = (testIndex: number) => {
    setError(null);
    setCurrentTest(testIndex);
  };

  const renderCurrentTest = () => {
    try {
      const TestComponent = tests[currentTest].component;
      return <TestComponent />;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`${tests[currentTest].name} failed: ${errorMsg}`);
      return (
        <div className="p-8 bg-red-50">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Component Test Failed</h1>
          <p className="text-red-700 mb-4">Failed component: {tests[currentTest].name}</p>
          <pre className="text-sm text-red-700 bg-red-100 p-4 rounded overflow-auto">
            {errorMsg}
          </pre>
        </div>
      );
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Initializing game data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Test Navigation */}
      <div className="bg-gray-100 border-b p-4">
        <h1 className="text-xl font-bold mb-4">Component Testing - Find the Broken Component</h1>
        <div className="flex flex-wrap gap-2">
          {tests.map((test, index) => (
            <button
              key={index}
              onClick={() => runTest(index)}
              className={`px-4 py-2 rounded text-sm ${
                currentTest === index
                  ? 'bg-blue-600 text-white'
                  : error && currentTest === index
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {index + 1}. {test.name}
              {currentTest === index && error ? ' ❌' : currentTest === index ? ' ✅' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Test Content */}
      <div className="flex-1">
        {renderCurrentTest()}
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded-lg p-4 max-w-md shadow-lg">
          <h3 className="font-semibold text-red-800 mb-2">Component Error</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

export default ComponentTestApp;
