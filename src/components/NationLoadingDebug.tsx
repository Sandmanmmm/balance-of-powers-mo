import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function NationLoadingDebug() {
  const [nationData, setNationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadNationData = async () => {
    setLoading(true);
    try {
      const { loadWorldData } = await import('../data/dataLoader');
      const worldData = await loadWorldData();
      setNationData({
        nationCount: worldData.nations.length,
        provinceCount: worldData.provinces.length,
        boundaryCount: Object.keys(worldData.boundaries).length,
        nations: worldData.nations.map((n: any) => ({ id: n.id, name: n.name, region: n.region || 'Unknown' })),
        boundaries: Object.keys(worldData.boundaries)
      });
    } catch (error) {
      console.error('Failed to load world data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNationData();
  }, []);

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Nation Loading Debug</h2>
      
      <Button 
        onClick={loadNationData} 
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Loading...' : 'Reload Data'}
      </Button>

      {nationData && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-100 p-3 rounded">
              <strong>Nations: {nationData.nationCount}</strong>
            </div>
            <div className="bg-green-100 p-3 rounded">
              <strong>Provinces: {nationData.provinceCount}</strong>
            </div>
            <div className="bg-yellow-100 p-3 rounded">
              <strong>Boundaries: {nationData.boundaryCount}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold mb-2">Nations by Region:</h3>
              <div className="max-h-60 overflow-y-auto text-sm">
                {nationData.nations.reduce((regions: any, nation: any) => {
                  if (!regions[nation.region]) regions[nation.region] = [];
                  regions[nation.region].push(nation);
                  return regions;
                }, {}) && Object.entries(nationData.nations.reduce((regions: any, nation: any) => {
                  if (!regions[nation.region]) regions[nation.region] = [];
                  regions[nation.region].push(nation);
                  return regions;
                }, {})).map(([region, nations]: [string, any]) => (
                  <div key={region} className="mb-2">
                    <strong>{region}: {nations.length}</strong>
                    <div className="ml-2 text-xs">
                      {nations.map((n: any) => `${n.id}(${n.name})`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">Available Boundaries:</h3>
              <div className="max-h-60 overflow-y-auto text-sm">
                {nationData.boundaries.slice(0, 50).join(', ')}
                {nationData.boundaries.length > 50 && '...'}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
