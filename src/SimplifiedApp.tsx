import { useGameState } from './hooks/useGameState';
import { GameDashboard } from './components/GameDashboard';
import { WorldMap } from './components/WorldMap';
import { ProvinceInfoPanel } from './components/ProvinceInfoPanel';
import { Toaster } from '@/components/ui/sonner';

function SimplifiedApp() {
  console.log('SimplifiedApp rendering...');
  
  const {
    gameState,
    provinces,
    nations,
    isInitialized,
    selectProvince,
    setMapOverlay,
    getSelectedProvince,
    getSelectedNation,
  } = useGameState();

  const selectedProvince = getSelectedProvince();
  const selectedNation = getSelectedNation();

  console.log('SimplifiedApp state:', {
    isInitialized,
    provincesCount: Array.isArray(provinces) ? provinces.length : 0,
    nationsCount: Array.isArray(nations) ? nations.length : 0,
    selectedNation: selectedNation?.name,
    selectedProvince: selectedProvince?.name
  });

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Balance of Powers...</h1>
          <p>Initializing game data...</p>
        </div>
      </div>
    );
  }

  // Policy and decision handlers (simplified)
  const handlePolicyChange = (policy: string, value: string) => {
    console.log(`Policy ${policy} changed to ${value}`);
  };

  const handleDecisionMake = (decisionId: string, choiceIndex: number) => {
    console.log(`Decision ${decisionId} executed with choice ${choiceIndex}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen">
        {/* Left Sidebar - Game Dashboard */}
        <div className="w-80 border-r border-gray-300 bg-white p-4 overflow-y-auto">
          {selectedNation ? (
            <GameDashboard
              nation={selectedNation}
              gameState={gameState}
              onTogglePause={() => console.log('Toggle pause')}
              onSpeedChange={(speed) => console.log('Speed change:', speed)}
              onPolicyChange={handlePolicyChange}
              onDecisionMake={handleDecisionMake}
            />
          ) : (
            <div className="p-4 text-center text-gray-500">
              No nation selected
            </div>
          )}
        </div>

        {/* Main Map Area */}
        <div className="flex-1 relative">
          <WorldMap
            provinces={Array.isArray(provinces) ? provinces : []}
            selectedProvince={gameState.selectedProvince}
            mapOverlay={gameState.mapOverlay}
            onProvinceSelect={selectProvince}
            onOverlayChange={setMapOverlay}
          />
          
          {/* System Status Debug Overlay (top-right) */}
          <div className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg p-3 text-xs space-y-1 shadow-lg">
            <div className="font-medium">System Status</div>
            <div>Nations: {Array.isArray(nations) ? nations.length : 0}</div>
            <div>Provinces: {Array.isArray(provinces) ? provinces.length : 0}</div>
            <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
            <div>Selected: {selectedNation?.name || 'None'}</div>
            <div>Game Time: {gameState?.currentDate?.toLocaleDateString() || 'N/A'}</div>
            <div>Paused: {gameState?.isPaused ? '⏸️' : '▶️'}</div>
          </div>
        </div>

        {/* Right Sidebar - Province Info (when selected) */}
        {selectedProvince && selectedNation && (
          <div className="w-80 border-l border-gray-300 bg-white p-4 overflow-y-auto">
            <ProvinceInfoPanel 
              province={selectedProvince} 
              nation={selectedNation}
              onStartConstruction={() => console.log('Start construction')}
              onCancelConstruction={() => console.log('Cancel construction')}
              isPlayerControlled={selectedProvince.country === selectedNation?.name}
            />
          </div>
        )}
      </div>

      {/* Global Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}

export default SimplifiedApp;
