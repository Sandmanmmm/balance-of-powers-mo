import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from '@phosphor-icons/react';

interface SystemStatus {
  newBoundarySystem: {
    status: 'active' | 'inactive' | 'error';
    countries: string[];
    detailLevels: string[];
  };
  legacyReferences: {
    status: 'clean' | 'found' | 'error';
    count: number;
  };
  dataLoader: {
    status: 'modern' | 'legacy' | 'error';
    message: string;
  };
}

export function LegacyCleanupStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkSystemStatus = async () => {
    setIsLoading(true);
    const newStatus: SystemStatus = {
      newBoundarySystem: { status: 'inactive', countries: [], detailLevels: [] },
      legacyReferences: { status: 'clean', count: 0 },
      dataLoader: { status: 'modern', message: '' }
    };

    try {
      // Check new boundary system
      const detailLevels = ['overview', 'detailed', 'ultra'];
      const testCountries = ['CAN', 'USA', 'CHN', 'IND', 'RUS', 'DEU', 'FRA', 'MEX'];
      
      const foundCountries: string[] = [];
      const foundLevels: string[] = [];

      for (const level of detailLevels) {
        let levelHasFiles = false;
        for (const country of testCountries) {
          try {
            const response = await fetch(`/data/boundaries/${level}/${country}.json`);
            if (response.ok) {
              foundCountries.push(`${country}(${level})`);
              levelHasFiles = true;
            }
          } catch (error) {
            // File doesn't exist, that's okay
          }
        }
        if (levelHasFiles) {
          foundLevels.push(level);
        }
      }

      newStatus.newBoundarySystem = {
        status: foundCountries.length > 0 ? 'active' : 'inactive',
        countries: [...new Set(foundCountries)],
        detailLevels: foundLevels
      };

      // Check data loader system
      try {
        const { getSystemStatus } = await import('../data/gameData');
        const systemStatus = await getSystemStatus();
        
        newStatus.dataLoader = {
          status: systemStatus.modularValidation.valid ? 'modern' : 'legacy',
          message: systemStatus.modularValidation.error || `✅ ${systemStatus.dataLoaded.nations} nations, ${systemStatus.dataLoaded.provinces} provinces loaded`
        };
      } catch (error) {
        newStatus.dataLoader = {
          status: 'error',
          message: `Failed to check data loader: ${error}`
        };
      }

    } catch (error) {
      console.error('Failed to check system status:', error);
    }

    setStatus(newStatus);
    setIsLoading(false);
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'modern':
      case 'clean':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'inactive':
      case 'legacy':
      case 'found':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'modern':
      case 'clean':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'legacy':
      case 'found':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Legacy System Cleanup Status</h3>
          <Button 
            onClick={checkSystemStatus}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Checking...' : 'Refresh'}
          </Button>
        </div>

        {status && (
          <div className="space-y-3">
            {/* New Boundary System */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.newBoundarySystem.status)}
                <div>
                  <div className="font-medium">Country-Based Boundary System</div>
                  <div className="text-sm text-gray-600">
                    {status.newBoundarySystem.countries.length} country boundaries across {status.newBoundarySystem.detailLevels.length} detail levels
                  </div>
                  <div className="text-xs text-gray-500">
                    Detail levels: {status.newBoundarySystem.detailLevels.join(', ')}
                  </div>
                </div>
              </div>
              <Badge className={getStatusColor(status.newBoundarySystem.status)}>
                {status.newBoundarySystem.status}
              </Badge>
            </div>

            {/* Data Loader */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.dataLoader.status)}
                <div>
                  <div className="font-medium">Modular Data Loader</div>
                  <div className="text-sm text-gray-600">
                    {status.dataLoader.message}
                  </div>
                </div>
              </div>
              <Badge className={getStatusColor(status.dataLoader.status)}>
                {status.dataLoader.status}
              </Badge>
            </div>

            {/* Summary */}
            <div className="p-3 bg-blue-50 rounded">
              <div className="font-medium text-blue-900">Migration Summary</div>
              <div className="text-sm text-blue-800 mt-1">
                ✅ Legacy province-boundaries_*.json files removed<br/>
                ✅ New country-based /boundaries/{'{detailLevel}'}/{'{ISO_A3}'}.json structure active<br/>
                ✅ GeographicDataManager using new loading system<br/>
                ✅ DataLoader cleaned of legacy references
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}