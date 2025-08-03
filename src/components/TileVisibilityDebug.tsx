import React from 'react';
import { TileInfo, ViewportState } from '../utils/tileVisibility';

interface TileVisibilityDebugProps {
  visibleTiles: TileInfo[];
  loadedTiles: Set<string>;
  viewportState: ViewportState;
  isVisible?: boolean;
}

export function TileVisibilityDebug({ 
  visibleTiles, 
  loadedTiles, 
  viewportState, 
  isVisible = false 
}: TileVisibilityDebugProps) {
  if (!isVisible) return null;

  const culledTiles = Array.from(loadedTiles).filter(
    tileId => !visibleTiles.some(tile => tile.id === tileId)
  );

  return (
    <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono max-w-md">
      <div className="mb-2">
        <h3 className="text-yellow-400 font-bold">🔍 Tile Visibility System</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-blue-300">Viewport:</div>
          <div>Center: ({viewportState.center.x.toFixed(1)}, {viewportState.center.y.toFixed(1)})</div>
          <div>Zoom: {viewportState.zoom.toFixed(2)}x</div>
          <div>Screen: {viewportState.screenWidth}×{viewportState.screenHeight}</div>
          <div>Pan: ({viewportState.panOffset.x.toFixed(0)}, {viewportState.panOffset.y.toFixed(0)})</div>
        </div>
        
        <div>
          <div className="text-green-300">Tiles:</div>
          <div className="text-green-400">Visible: {visibleTiles.length}</div>
          <div className="text-blue-400">Loaded: {loadedTiles.size}</div>
          <div className="text-red-400">Culled: {culledTiles.length}</div>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-green-300">📦 Visible Tiles:</div>
        <div className="max-h-24 overflow-y-auto text-xs">
          {visibleTiles.length > 0 ? (
            visibleTiles.map(tile => (
              <div key={tile.id} className="flex justify-between">
                <span className={loadedTiles.has(tile.id) ? 'text-green-400' : 'text-yellow-400'}>
                  {tile.id}
                </span>
                <span className="text-gray-400">
                  {tile.detailLevel}
                </span>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No visible tiles</div>
          )}
        </div>
      </div>

      {culledTiles.length > 0 && (
        <div className="mb-2">
          <div className="text-red-300">🗑️ Culled Tiles:</div>
          <div className="max-h-16 overflow-y-auto text-xs">
            {culledTiles.map(tileId => (
              <div key={tileId} className="text-red-400">
                {tileId}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 mt-2">
        <div>Detail Level: {visibleTiles[0]?.detailLevel || 'overview'}</div>
        <div>Grid Size: {Math.ceil(Math.sqrt(visibleTiles.length))}×{Math.ceil(Math.sqrt(visibleTiles.length))}</div>
      </div>
    </div>
  );
}
