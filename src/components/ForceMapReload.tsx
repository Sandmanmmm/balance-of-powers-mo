import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RefreshCw } from '@phosphor-icons/react';
import { clearGameDataCache } from '../data/gameData';

export function ForceMapReload() {
  const [isReloading, setIsReloading] = useState(false);

  const handleForceReload = async () => {
    setIsReloading(true);
    
    try {
      // Clear any cached data
      console.log('🔄 Force reloading map data...');
      
      // Clear game data cache
      clearGameDataCache();
      
      // Clear localStorage if used
      localStorage.clear();
      
      // Force refresh the page to reload all data
      window.location.reload();
      
    } catch (error) {
      console.error('Error during force reload:', error);
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw size={20} />
          Force Map Reload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Click to force reload all map data and clear caches.
        </p>
        <Button 
          onClick={handleForceReload}
          disabled={isReloading}
          className="w-full"
          variant="outline"
        >
          {isReloading ? 'Reloading...' : 'Force Reload Map'}
        </Button>
      </CardContent>
    </Card>
  );
}