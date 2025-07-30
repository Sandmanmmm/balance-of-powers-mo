import { useEffect, useState } from 'react';
import { getBuildings, getAvailableBuildings } from '../data/gameData';
import { useGameState } from '../hooks/useGameState';

export function BuildingAvailabilityDebug() {
  const { provinces, nations, getSelectedProvince, getSelectedNation } = useGameState();
  const [buildingData, setBuildingData] = useState<{
    totalBuildings: number;
    buildingsWithNoFeatures: number;
    sampleBuildingsNoFeatures: { id: string; name: string; }[];
    basicBuildings: { id: string; name: string; infrastructureReq: any; }[];
    availableForCurrentProvince: number;
    availableBuildings: { id: string; name: string; }[];
    error?: string;
  } | null>(null);
  
  const selectedProvince = getSelectedProvince();
  const selectedNation = getSelectedNation();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const buildings = await getBuildings();
        const data = {
          totalBuildings: buildings?.length || 0,
          buildingsWithNoFeatures: buildings?.filter(b => 
            !b.requiresFeatures || 
            (Array.isArray(b.requiresFeatures) && b.requiresFeatures.length === 0)
          ).length || 0,
          sampleBuildingsNoFeatures: buildings?.filter(b => 
            !b.requiresFeatures || 
            (Array.isArray(b.requiresFeatures) && b.requiresFeatures.length === 0)
          ).slice(0, 5).map(b => ({ id: b.id, name: b.name })) || [],
          basicBuildings: buildings?.filter(b => b.id?.startsWith('basic_')).map(b => ({ 
            id: b.id, 
            name: b.name,
            infrastructureReq: b.requirements?.infrastructure || 0
          })) || [],
          availableForCurrentProvince: 0,
          availableBuildings: [] as { id: string; name: string; }[]
        };
        
        if (selectedProvince && selectedNation) {
          const completedTech = selectedNation.technology?.completedTech || [];
          const available = getAvailableBuildings(selectedProvince, selectedNation, completedTech, buildings);
          data.availableForCurrentProvince = available?.length || 0;
          data.availableBuildings = available?.map(b => ({ id: b.id, name: b.name })) || [] as { id: string; name: string; }[];
        }
        
        setBuildingData(data);
      } catch (error) {
        console.error('Building debug error:', error);
        setBuildingData({
          totalBuildings: 0,
          buildingsWithNoFeatures: 0,
          sampleBuildingsNoFeatures: [],
          basicBuildings: [],
          availableForCurrentProvince: 0,
          availableBuildings: [] as { id: string; name: string; }[],
          error: error.message
        });
      }
    };
    
    fetchData();
  }, [selectedProvince?.id, selectedNation?.id]);
  
  if (!buildingData) {
    return <div className="p-4 bg-gray-100 rounded">Loading building debug...</div>;
  }
  
  return (
    <div className="p-4 bg-gray-100 rounded text-xs space-y-2">
      <h4 className="font-bold">Building System Debug</h4>
      
      {buildingData.error ? (
        <div className="text-red-600">Error: {buildingData.error}</div>
      ) : (
        <>
          <div>Total buildings loaded: {buildingData.totalBuildings}</div>
          <div>Buildings with no feature requirements: {buildingData.buildingsWithNoFeatures}</div>
          <div>Basic buildings: {buildingData.basicBuildings?.length || 0}</div>
          
          {selectedProvince && (
            <>
              <div className="font-medium">Province: {selectedProvince.name}</div>
              <div>Features: {selectedProvince.features?.join(', ') || 'none'}</div>
              <div>Infrastructure: {selectedProvince.infrastructure?.roads || 0}</div>
              <div>Available buildings: {buildingData.availableForCurrentProvince || 0}</div>
            </>
          )}
          
          <details className="mt-2">
            <summary className="cursor-pointer font-medium">Sample Buildings (No Features)</summary>
            <div className="mt-1 space-y-1">
              {buildingData.sampleBuildingsNoFeatures?.map((b: any) => (
                <div key={b.id}>{b.id}: {b.name}</div>
              ))}
            </div>
          </details>
          
          <details className="mt-2">
            <summary className="cursor-pointer font-medium">Basic Buildings</summary>
            <div className="mt-1 space-y-1">
              {buildingData.basicBuildings?.map((b: any) => (
                <div key={b.id}>{b.id}: {b.name} (infra: {b.infrastructureReq})</div>
              ))}
            </div>
          </details>
          
          {selectedProvince && buildingData.availableBuildings && (
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Available for Current Province</summary>
              <div className="mt-1 space-y-1">
                {buildingData.availableBuildings.map((b: any) => (
                  <div key={b.id}>{b.id}: {b.name}</div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}