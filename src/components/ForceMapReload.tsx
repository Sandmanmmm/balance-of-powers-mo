import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardConten
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
      
    }

    <Card class
        <CardTitle className
     
    

        </
          onClick={handleForc
          classNam
        >
        </Button>
    </Card>
}
















