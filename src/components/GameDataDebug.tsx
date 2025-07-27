import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGameState } from '../hooks/useGameState';
import { DataLoadingSummary } from './DataLoadingSummary';
import { loadWorldData, type WorldData } from '../data/dataLoader';
import { Eye, EyeSlash } from '@phosphor-icons/react';

export function GameDataDebug() {
  const { provinces, nations, isInitialized, forceReload } = useGameState();
  const [loadingSummary, setLoadingSummary] = useState<WorldData | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  
  // Load the full summary data
  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await loadWorldData();
        setLoadingSummary(data);
      } catch (error) {
        console.error('Failed to load summary data:', error);
      }
    };
    
    if (isInitialized) {
      loadSummary();
    }
  }, [isInitialized]);
  
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded text-sm">
        <h3 className="font-bold mb-2">Game Data Debug</h3>
        <div className="space-y-1 text-xs">
          <div>Initialized: {String(isInitialized)}</div>
          <div>Provinces: {Array.isArray(provinces) ? provinces.length : 'Not Array'}</div>
          <div>Nations: {Array.isArray(nations) ? nations.length : 'Not Array'}</div>
          {Array.isArray(provinces) && provinces.length > 0 && (
            <div>
              <div className="font-semibold">Canadian Provinces:</div>
              {provinces
                .filter(p => p.country === 'Canada')
                .map(p => (
                  <div key={p.id} className="ml-2">
                    {p.id}: {p.name}
                  </div>
                ))
              }
            </div>
          )}
          {Array.isArray(nations) && nations.length > 0 && (
            <div>
              <div className="font-semibold">Nations:</div>
              {nations.map(n => (
                <div key={n.id} className="ml-2">
                  {n.id}: {n.name}
                </div>
              ))}
            </div>
          )}
          <div className="pt-2 space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={forceReload}
              className="text-xs"
            >
              Force Reload Data
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowSummary(!showSummary)}
              className="text-xs"
            >
              {showSummary ? <EyeSlash size={14} /> : <Eye size={14} />}
              {showSummary ? 'Hide' : 'Show'} Summary
            </Button>
          </div>
        </div>
      </div>
      
      {loadingSummary && (
        <DataLoadingSummary 
          warnings={loadingSummary.warnings || []}
          summary={loadingSummary.loadingSummary}
          isVisible={showSummary}
        />
      )}
    </div>
  );
}