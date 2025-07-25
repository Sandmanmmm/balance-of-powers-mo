import { useGameState } from './hooks/useGameState';
import { useSimulationEngine } from './hooks/useSimulationEngine';
import { WorldMap } from './components/WorldMap';
import { ProvinceInfoPanel } from './components/ProvinceInfoPanel';
import { GameDashboard } from './components/GameDashboard';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const {
    gameState,
    provinces,
    nations,
    selectProvince,
    selectNation,
    setMapOverlay,
    togglePause,
    setTimeSpeed,
    advanceTime,
    getSelectedProvince,
    getSelectedNation,
    updateProvince,
    updateNation
  } = useGameState();

  const selectedProvince = getSelectedProvince();
  const selectedNation = getSelectedNation();

  // Initialize simulation engine
  useSimulationEngine({
    gameState,
    provinces,
    nations,
    onAdvanceTime: advanceTime,
    onUpdateProvince: updateProvince,
    onUpdateNation: updateNation
  });

  if (!selectedNation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Balance of Powers</h1>
          <p className="text-muted-foreground">Loading game data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Left Sidebar - Game Dashboard */}
        <div className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
          <GameDashboard
            nation={selectedNation}
            gameState={gameState}
            onTogglePause={togglePause}
            onSpeedChange={setTimeSpeed}
          />
        </div>

        {/* Main Map Area */}
        <div className="flex-1 relative">
          <WorldMap
            provinces={provinces}
            selectedProvince={gameState.selectedProvince}
            mapOverlay={gameState.mapOverlay}
            onProvinceSelect={selectProvince}
            onOverlayChange={setMapOverlay}
          />
        </div>

        {/* Right Sidebar - Province Info (when selected) */}
        {selectedProvince && (
          <div className="w-80 border-l border-border bg-card p-4 overflow-y-auto">
            <ProvinceInfoPanel province={selectedProvince} />
          </div>
        )}
      </div>

      {/* Global Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;