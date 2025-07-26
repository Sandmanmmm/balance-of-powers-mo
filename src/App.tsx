import { useGameState } from './hooks/useGameState';
import { useSimulationEngine } from './hooks/useSimulationEngine';
import { WorldMap } from './components/WorldMap';
import { ProvinceInfoPanel } from './components/ProvinceInfoPanel';
import { GameDashboard } from './components/GameDashboard';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error}: {error: Error}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h1>
        <p className="text-muted-foreground mb-4">The application encountered an error.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Reload Page
        </button>
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
    advanceTime,
    getSelectedProvince,
    getSelectedNation,
    updateProvince,
    updateNation,
    startConstruction,
    cancelConstruction,
    processConstructionTick
  } = useGameState();

  const selectedProvince = getSelectedProvince();
  const selectedNation = getSelectedNation();

  // Policy and decision handlers
  const handlePolicyChange = (policy: string, value: string) => {
    if (!selectedNation) return;
    
    // In a real game, this would apply policy effects to the nation
    toast.success(`Policy "${policy}" changed to "${value}"`);
    
    // Example: Update nation based on policy change
    // This is where you'd implement actual policy effects
    console.log(`Policy ${policy} changed to ${value} for nation ${selectedNation.id}`);
  };

  const handleDecisionMake = (decisionId: string, choiceIndex: number) => {
    if (!selectedNation) return;
    
    // In a real game, this would execute the decision effects
    toast.success(`Decision "${decisionId}" executed`);
    
    // Example: Apply decision effects to the nation/provinces
    console.log(`Decision ${decisionId} executed for nation ${selectedNation.id}`);
  };

  // Initialize simulation engine only when data is loaded
  useSimulationEngine({
    gameState: gameState,
    provinces: Array.isArray(provinces) ? provinces : [],
    nations: Array.isArray(nations) ? nations : [],
    onAdvanceTime: advanceTime,
    onUpdateProvince: updateProvince,
    onUpdateNation: updateNation,
    onProcessConstructionTick: processConstructionTick
  });

  // Show loading state if not initialized or no nations are loaded
  if (!isInitialized || !Array.isArray(nations) || nations.length === 0 || !selectedNation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Balance of Powers</h1>
          <p className="text-muted-foreground">
            {!isInitialized ? 'Initializing game...' : 'Loading game data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          {/* Left Sidebar - Game Dashboard */}
          <div className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
            <GameDashboard
              nation={selectedNation}
              gameState={gameState}
              onTogglePause={togglePause}
              onSpeedChange={setTimeSpeed}
              onPolicyChange={handlePolicyChange}
              onDecisionMake={handleDecisionMake}
            />
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
          </div>

          {/* Right Sidebar - Province Info (when selected) */}
          {selectedProvince && (
            <div className="w-80 border-l border-border bg-card p-4 overflow-y-auto">
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