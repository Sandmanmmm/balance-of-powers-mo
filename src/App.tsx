import { useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import { WorldMapWebGL } from './components/WorldMapWebGL';
import { ProvinceInfoPanel } from './components/ProvinceInfoPanel';
import { GameDashboard } from './components/GameDashboard';
import { DetailLevelTest } from './components/DetailLevelTest';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error, resetErrorBoundary}: {error: Error, resetErrorBoundary?: () => void}) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h1>
        <p className="text-gray-600 mb-4">The application encountered an error.</p>
        <p className="text-sm text-gray-600 mb-6">{error.message}</p>
        <div className="space-x-2">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
          {resetErrorBoundary && (
            <button 
              onClick={resetErrorBoundary}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const {
    gameState,
    provinces,
    nations,
    isInitialized,
    selectProvince,
    selectNation,
    setMapOverlay,
    togglePause,
    setTimeSpeed,
    getSelectedProvince,
    getSelectedNation,
    startConstruction,
    cancelConstruction,
  } = useGameState();

  const selectedProvince = getSelectedProvince();
  const selectedNation = getSelectedNation();

  // Debug: log the state of selectedNation  
  useEffect(() => {
    console.log('App - Selected Nation Debug:', {
      selectedNationId: gameState?.selectedNation,
      selectedNationObject: selectedNation,
      nationsCount: Array.isArray(nations) ? nations.length : 'NOT_ARRAY',
      nationIds: Array.isArray(nations) ? nations.map(n => n?.id).filter(Boolean) : 'NOT_ARRAY'
    });
  }, [selectedNation, nations, gameState?.selectedNation]);

  // Policy and decision handlers
  const handlePolicyChange = (policy: string, value: string) => {
    if (!selectedNation) return;
    
    toast.success(`Policy "${policy}" changed to "${value}"`);
    console.log(`Policy ${policy} changed to ${value} for nation ${selectedNation.id}`);
  };

  const handleDecisionMake = (decisionId: string, choiceIndex: number) => {
    if (!selectedNation) return;
    
    toast.success(`Decision "${decisionId}" executed`);
    console.log(`Decision ${decisionId} executed for nation ${selectedNation.id}`);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6 text-blue-600">Balance of Powers</h1>
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading game data...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we initialize the world</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen bg-white">
        <div className="flex h-screen">
          {/* Left Sidebar - Game Dashboard */}
          <div className="w-80 border-r border-gray-300 bg-white p-4 overflow-y-auto">
            {selectedNation ? (
              <GameDashboard
                nation={selectedNation}
                gameState={gameState}
                onTogglePause={togglePause}
                onSpeedChange={setTimeSpeed}
                onPolicyChange={handlePolicyChange}
                onDecisionMake={handleDecisionMake}
              />
            ) : (
              <div className="p-4 text-center text-gray-500">
                <h2 className="text-lg font-semibold mb-2">No Nation Selected</h2>
                <p className="text-sm">Select a nation from the map to begin playing.</p>
              </div>
            )}
          </div>

          {/* Main Map Area */}
          <div className="flex-1 relative">
            <WorldMapWebGL
              provinces={Array.isArray(provinces) ? provinces : []}
              selectedProvince={gameState.selectedProvince}
              mapOverlay={gameState.mapOverlay}
              onProvinceSelect={selectProvince}
              onOverlayChange={setMapOverlay}
            />
            
            {/* System Status Debug Overlay (top-right) */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-gray-300 rounded-lg p-3 text-xs space-y-1 shadow-lg">
              <div className="font-medium">System Status</div>
              <div>Nations: {Array.isArray(nations) ? nations.length : 0}</div>
              <div>Provinces: {Array.isArray(provinces) ? provinces.length : 0}</div>
              <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
              <div>Selected: {selectedNation?.name || 'None'}</div>
              <div>Game Time: {gameState?.currentDate?.toLocaleDateString() || 'N/A'}</div>
              <div>Paused: {gameState?.isPaused ? '⏸️' : '▶️'}</div>
            </div>
            
            {/* Detail Level Test Component (bottom-left) */}
            <div className="absolute bottom-4 left-4 z-50">
              <DetailLevelTest />
            </div>
          </div>

          {/* Right Sidebar - Province Info (when selected) */}
          {selectedProvince && selectedNation && (
            <div className="w-80 border-l border-gray-300 bg-white p-4 overflow-y-auto">
              <ProvinceInfoPanel 
                province={selectedProvince} 
                nation={selectedNation}
                onStartConstruction={startConstruction}
                onCancelConstruction={cancelConstruction}
                isPlayerControlled={selectedProvince.country === selectedNation?.name}
              />
            </div>
          )}
        </div>

        {/* Global Toast Notifications */}
        <Toaster position="top-right" />
      </div>
    </ErrorBoundary>
  );
}

export default App;
