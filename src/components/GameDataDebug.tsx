import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGameState } from '../hooks/useGameState';
import { getLoadingStats, validateOnlyModularSources } from '../data/gameData';
import { Eye, EyeSlash, CheckCircle, XCircle, Warning } from '@phosphor-icons/react';

export function GameDataDebug() {
  const { provinces, nations, isInitialized, forceReload } = useGameState();
  const [showSummary, setShowSummary] = useState(false);
  const [modularValidation, setModularValidation] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState<any>(null);
  
  // Check modular validation and loading stats
  useEffect(() => {
    if (isInitialized) {
      const validation = validateOnlyModularSources();
      const stats = getLoadingStats();
      setModularValidation(validation);
      setLoadingStats(stats);
      
      console.log('GameDataDebug: Modular validation:', validation);
      console.log('GameDataDebug: Loading stats:', stats);
    }
  }, [isInitialized, provinces, nations]);
  
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded text-sm">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          Game Data Debug
          {modularValidation?.valid ? (
            <CheckCircle size={16} className="text-green-500" />
          ) : (
            <XCircle size={16} className="text-red-500" />
          )}
        </h3>
        
        <div className="space-y-1 text-xs">
          <div>Initialized: {String(isInitialized)}</div>
          <div>Provinces: {Array.isArray(provinces) ? provinces.length : 'Not Array'}</div>
          <div>Nations: {Array.isArray(nations) ? nations.length : 'Not Array'}</div>
          
          {/* Modular Source Validation */}
          {modularValidation && (
            <div className="border-t pt-2 mt-2">
              <div className="font-semibold mb-1 flex items-center gap-2">
                Modular Data Sources
                {modularValidation.valid ? (
                  <CheckCircle size={12} className="text-green-500" />
                ) : (
                  <XCircle size={12} className="text-red-500" />
                )}
              </div>
              {modularValidation.stats && (
                <div className="space-y-1">
                  <div>🏛️ Nations from regions/: {modularValidation.stats.nationsFromRegions}</div>
                  <div>🗺️ Provinces from regions/: {modularValidation.stats.provincesFromRegions}</div>
                  <div>🌍 Boundaries from regions/: {modularValidation.stats.boundariesFromRegions}</div>
                  <div>⏱️ Load time: {modularValidation.stats.loadTime?.toFixed(2)}ms</div>
                  {modularValidation.stats.warnings > 0 && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Warning size={12} />
                      {modularValidation.stats.warnings} warnings
                    </div>
                  )}
                </div>
              )}
              {modularValidation.error && (
                <div className="text-red-600 text-xs mt-1">
                  Error: {modularValidation.error}
                </div>
              )}
            </div>
          )}
          
          {/* Canadian Provinces Debug */}
          {Array.isArray(provinces) && provinces.length > 0 && (
            <div className="border-t pt-2 mt-2">
              <div className="font-semibold">Canadian Provinces ({provinces.filter(p => p.country === 'Canada').length}):</div>
              {provinces
                .filter(p => p.country === 'Canada')
                .slice(0, 5)
                .map(p => (
                  <div key={p.id} className="ml-2">
                    {p.id}: {p.name}
                  </div>
                ))
              }
              {provinces.filter(p => p.country === 'Canada').length > 5 && (
                <div className="ml-2 text-muted-foreground">
                  ...and {provinces.filter(p => p.country === 'Canada').length - 5} more
                </div>
              )}
            </div>
          )}
          
          {/* Nations Debug */}
          {Array.isArray(nations) && nations.length > 0 && (
            <div className="border-t pt-2 mt-2">
              <div className="font-semibold">Nations ({nations.length}):</div>
              {nations.slice(0, 5).map(n => (
                <div key={n.id} className="ml-2">
                  {n.id}: {n.name}
                </div>
              ))}
              {nations.length > 5 && (
                <div className="ml-2 text-muted-foreground">
                  ...and {nations.length - 5} more
                </div>
              )}
            </div>
          )}
          
          <div className="pt-2 space-x-2 border-t">
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
              {showSummary ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </div>
      </div>
      
      {/* Detailed Loading Stats */}
      {showSummary && loadingStats && (
        <div className="p-4 bg-card border rounded text-xs">
          <h4 className="font-bold mb-2">Detailed Loading Statistics</h4>
          <div className="space-y-2">
            <div>
              <strong>Data Sources:</strong>
              <div className="ml-2 space-y-1">
                <div>Nations from regions: {loadingStats.nationsFromRegions}</div>
                <div>Provinces from regions: {loadingStats.provincesFromRegions}</div>
                <div>Boundaries from regions: {loadingStats.boundariesFromRegions}</div>
                <div>Load time: {loadingStats.loadTime?.toFixed(2)}ms</div>
              </div>
            </div>
            
            {loadingStats.warnings && loadingStats.warnings.length > 0 && (
              <div>
                <strong className="text-yellow-600">Warnings ({loadingStats.warnings.length}):</strong>
                <div className="ml-2 space-y-1 max-h-32 overflow-y-auto">
                  {loadingStats.warnings.map((warning: string, index: number) => (
                    <div key={index} className="text-yellow-600">
                      {index + 1}. {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}