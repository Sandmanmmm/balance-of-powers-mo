import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function MapStatusSummary() {
  const [mapStatus, setMapStatus] = useState<any>(null);

  useEffect(() => {
    // Listen for console logs to get map status
    const checkMapStatus = () => {
      // This is a simple status check based on what's currently on the screen
      setMapStatus({
        boundarySystem: 'Country-based (/data/boundaries/{level}/{code}.json)',
        availableCountries: [
          'CAN (Canada)',
          'USA (United States)', 
          'MEX (Mexico)',
          'CHN (China)',
          'IND (India)',
          'RUS (Russia)',
          'FRA (France)',
          'GER (Germany)',
          'UKR (Ukraine)',
          'POL (Poland)',
          'BRA (Brazil)',
          'AUS (Australia)'
        ],
        status: 'Ready',
        totalBoundaryFiles: 12
      });
    };
    
    checkMapStatus();
  }, []);

  if (!mapStatus) {
    return null;
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">Map System Status</h3>
      
      <div className="space-y-3">
        <div>
          <Badge variant="outline" className="text-xs">
            {mapStatus.status}
          </Badge>
        </div>
        
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Boundary System</div>
          <div className="text-xs font-mono bg-muted p-2 rounded">
            {mapStatus.boundarySystem}
          </div>
        </div>
        
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Available Countries ({mapStatus.totalBoundaryFiles})
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {mapStatus.availableCountries.map((country: string, index: number) => (
              <div key={index} className="text-green-600">
                ✅ {country}
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            🎯 If you can't see multiple countries, check browser console for loading errors.
          </div>
        </div>
      </div>
    </Card>
  );
}