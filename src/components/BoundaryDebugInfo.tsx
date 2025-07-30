import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function BoundaryDebugInfo() {
  const [boundaryInfo, setBoundaryInfo] = useState<{
    available: string[]
    loaded: string[]
    detailLevel: string
  }>({
    available: [],
    loaded: [],
    detailLevel: 'overview'
  });

  useEffect(() => {
    // List of boundary files we've created
    const availableFiles = [
      'AUS', 'BRA', 'CAN', 'CHN', 'DEU', 'FRA', 'GBR', 'IND', 'MEX', 'RUS', 'USA'
    ];
    
    setBoundaryInfo({
      available: availableFiles,
      loaded: [], // This would be updated by the GeographicDataManager
      detailLevel: 'overview'
    });
  }, []);

  return (
    <Card className="p-3">
      <div className="space-y-2">
        <div className="font-medium text-sm">Boundary Files Available</div>
        
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Natural Earth Admin 0:</div>
          <div className="flex flex-wrap gap-1">
            {boundaryInfo.available.map(code => (
              <Badge key={code} variant="outline" className="text-xs">
                {code}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          📁 data/boundaries/{boundaryInfo.detailLevel}/*.json
        </div>
        
        <div className="text-xs text-green-600">
          ✅ Natural Earth format ready
        </div>
      </div>
    </Card>
  );
}