import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from '@phosphor-icons/react';

export function ForceMapReload() {
  const [isReloading, setIsReloading] = useState(false);

  const handleForceReload = async () => {
    setIsReloading(true);
    
    try {
      // Clear any cached data
      console.log('🔄 Force reloading map data...');
      
      // Clear localStorage if used
      localStorage.clear();
      
      // Force refresh the page to reload all data
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to force reload:', error);
      setIsReloading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">Force Map Reload</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleForceReload}
          disabled={isReloading}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
          {isReloading ? 'Reloading...' : 'Force Reload'}
        </Button>
      </CardContent>
    </Card>
  );
}