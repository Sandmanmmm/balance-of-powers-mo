/**
 * CountryBoundarySystemStatus - Shows current status of the new boundary system
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Globe, Map } from '@phosphor-icons/react';

interface SystemStatus {
  totalCountries: number;
  implementedCountries: number;
  detailLevels: {
    overview: number;
    detailed: number;
    ultra: number;
  };
  directoryStructure: string[];
  systemHealth: 'healthy' | 'partial' | 'error';
}

export function CountryBoundarySystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    // Simulate checking the boundary system status
    const checkSystemStatus = async () => {
      // In a real implementation, this would scan the actual directory structure
      const simulatedStatus: SystemStatus = {
        totalCountries: 195, // Approximate total world countries
        implementedCountries: 8, // Currently implemented
        detailLevels: {
          overview: 8,   // USA, CAN, CHN, IND, MEX, RUS, DEU, FRA
          detailed: 3,   // USA, CAN, CHN
          ultra: 2       // USA, CAN
        },
        directoryStructure: [
          '/data/boundaries/overview/',
          '/data/boundaries/detailed/', 
          '/data/boundaries/ultra/'
        ],
        systemHealth: 'partial'
      };

      setStatus(simulatedStatus);
    };

    checkSystemStatus();
  }, []);

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading system status...</div>
        </CardContent>
      </Card>
    );
  }

  const completionPercentage = (status.implementedCountries / status.totalCountries) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Country-Based Boundary System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Health */}
        <div className="flex items-center gap-2">
          {status.systemHealth === 'healthy' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {status.systemHealth === 'partial' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
          <span className="font-semibold">System Health:</span>
          <Badge variant={status.systemHealth === 'healthy' ? 'default' : 'secondary'}>
            {status.systemHealth.toUpperCase()}
          </Badge>
        </div>

        {/* Implementation Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Countries Implemented:</span>
            <span>{status.implementedCountries} / {status.totalCountries} ({completionPercentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Detail Level Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-blue-600">{status.detailLevels.overview}</div>
            <div className="text-sm text-muted-foreground">Overview</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-green-600">{status.detailLevels.detailed}</div>
            <div className="text-sm text-muted-foreground">Detailed</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-purple-600">{status.detailLevels.ultra}</div>
            <div className="text-sm text-muted-foreground">Ultra</div>
          </div>
        </div>

        {/* File Structure */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Map className="w-4 h-4" />
            Directory Structure
          </h4>
          <div className="space-y-1">
            {status.directoryStructure.map((dir, index) => (
              <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                {dir}
              </div>
            ))}
          </div>
        </div>

        {/* Current Countries */}
        <div className="space-y-2">
          <h4 className="font-semibold">Implemented Countries</h4>
          <div className="flex flex-wrap gap-2">
            <Badge>USA (O/D/U)</Badge>
            <Badge>CAN (O/D/U)</Badge>
            <Badge>CHN (O/D)</Badge>
            <Badge>IND (O)</Badge>
            <Badge>MEX (O)</Badge>
            <Badge>RUS (O)</Badge>
            <Badge>DEU (O)</Badge>
            <Badge>FRA (O)</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            O = Overview, D = Detailed, U = Ultra
          </div>
        </div>

        {/* System Features */}
        <div className="space-y-2">
          <h4 className="font-semibold">System Features</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Multi-level detail loading
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Intelligent caching (50MB limit)
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Dynamic detail upgrading
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Performance monitoring
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Memory management
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Error handling & fallbacks
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-2">
          <h4 className="font-semibold">Next Implementation Steps</h4>
          <div className="text-sm space-y-1">
            <div>1. Complete detailed level for major countries (CHN, IND, RUS)</div>
            <div>2. Add ultra detail for strategic countries</div>
            <div>3. Implement remaining G20 countries</div>
            <div>4. Add smaller countries and territories</div>
            <div>5. Optimize file sizes and implement compression</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}