import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getGameData } from '../data/gameData';

interface LoadedDataSummary {
  nations: Array<{id: string, name: string}>;
  provinces: Array<{id: string, name: string, country: string}>;
  countriesWithProvinces: Record<string, number>;
  boundaryFiles: string[];
}

export function LoadedDataSummary() {
  const [data, setData] = useState<LoadedDataSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const gameData = await getGameData();
        
        // Count provinces by country
        const countriesWithProvinces: Record<string, number> = {};
        gameData.provinces.forEach(province => {
          const country = province.country || 'Unknown';
          countriesWithProvinces[country] = (countriesWithProvinces[country] || 0) + 1;
        });

        // Get boundary files
        const boundaryFiles = Object.keys(gameData.boundaries);

        setData({
          nations: gameData.nations.map(n => ({id: n.id, name: n.name})),
          provinces: gameData.provinces.map(p => ({id: p.id, name: p.name, country: p.country})),
          countriesWithProvinces,
          boundaryFiles
        });
      } catch (error) {
        console.error('Failed to load data summary:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loaded Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loaded Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Failed to load data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loaded Data Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Nations ({data.nations.length})</h4>
          <div className="flex flex-wrap gap-1">
            {data.nations.map(nation => (
              <Badge key={nation.id} variant="secondary" className="text-xs">
                {nation.id}: {nation.name}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Countries with Provinces</h4>
          <div className="space-y-1">
            {Object.entries(data.countriesWithProvinces).map(([country, count]) => (
              <div key={country} className="flex justify-between text-sm">
                <span>{country}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Boundary Files ({data.boundaryFiles.length})</h4>
          <div className="flex flex-wrap gap-1">
            {data.boundaryFiles.map(file => (
              <Badge key={file} variant="default" className="text-xs">
                {file}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}