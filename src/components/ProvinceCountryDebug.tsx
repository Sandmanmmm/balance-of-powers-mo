import { useEffect, useState } from 'react';
import { useGameState } from '../hooks/useGameState';

export function ProvinceCountryDebug() {
  const { provinces, nations } = useGameState();
  const [countryStats, setCountryStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (Array.isArray(provinces) && provinces.length > 0) {
      const stats: Record<string, number> = {};
      
      provinces.forEach(province => {
        const country = province.country || 'Unknown';
        stats[country] = (stats[country] || 0) + 1;
      });
      
      setCountryStats(stats);
      
      console.log('🌍 Province Countries Debug:', {
        totalProvinces: provinces.length,
        countryStats: stats,
        countries: Object.keys(stats),
        sampleProvinces: provinces.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          country: p.country
        }))
      });
    }
  }, [provinces]);

  if (!Array.isArray(provinces) || provinces.length === 0) {
    return (
      <div className="bg-red-100 border border-red-300 rounded p-4 text-sm">
        <h3 className="font-bold text-red-800">No Province Data</h3>
        <p className="text-red-700">Provinces array is empty or not loaded</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-100 border border-blue-300 rounded p-4 text-sm">
      <h3 className="font-bold text-blue-800 mb-2">Province Countries ({provinces.length} total)</h3>
      <div className="space-y-1">
        {Object.entries(countryStats)
          .sort(([,a], [,b]) => b - a)
          .map(([country, count]) => (
            <div key={country} className="flex justify-between">
              <span className="text-blue-700">{country}:</span>
              <span className="text-blue-900 font-medium">{count} provinces</span>
            </div>
          ))}
      </div>
    </div>
  );
}