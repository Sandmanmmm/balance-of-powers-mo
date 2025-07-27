import React from 'react';
import { Button } from '@/components/ui/button';
import { useGameState } from '../hooks/useGameState';

export function GameDataDebug() {
  const { provinces, nations, isInitialized, forceReload } = useGameState();
  
  return (
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
        <div className="pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={forceReload}
            className="text-xs"
          >
            Force Reload Data
          </Button>
        </div>
      </div>
    </div>
  );
}