import { useEffect, useState } from 'react';
import { getBuildings } from '../data/gameData';
import { Building } from '@/lib/types';

export function BuildingsDebug() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        setLoading(true);
        setError(null);
        const loadedBuildings = await getBuildings();
        console.log('🔍 BuildingsDebug - Raw loaded data:', loadedBuildings);
        setBuildings(loadedBuildings || []);
      } catch (err) {
        console.error('🚨 BuildingsDebug - Error loading buildings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setBuildings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBuildings();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
        <h3 className="text-sm font-semibold">Buildings Debug - Loading...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded">
        <h3 className="text-sm font-semibold text-red-800">Buildings Debug - Error</h3>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  const basicBuildings = buildings.filter(b => b.id && (b.id.startsWith('basic_') || b.id === 'infrastructure'));
  const noFeatureBuildings = buildings.filter(b => !b.requiresFeatures || b.requiresFeatures.length === 0);

  return (
    <div className="p-4 bg-blue-100 border border-blue-300 rounded">
      <h3 className="text-sm font-semibold text-blue-800">Buildings Debug</h3>
      <div className="text-xs text-blue-600 mt-2 space-y-1">
        <p><strong>Total buildings loaded:</strong> {buildings.length}</p>
        <p><strong>Basic buildings:</strong> {basicBuildings.length}</p>
        <p><strong>No feature requirement buildings:</strong> {noFeatureBuildings.length}</p>
        {basicBuildings.length > 0 && (
          <div>
            <p><strong>Basic building IDs:</strong></p>
            <ul className="ml-4 list-disc">
              {basicBuildings.slice(0, 5).map(b => (
                <li key={b.id}>{b.id}: {b.name}</li>
              ))}
            </ul>
          </div>
        )}
        {noFeatureBuildings.length > 0 && (
          <div>
            <p><strong>No-feature building IDs:</strong></p>
            <ul className="ml-4 list-disc">
              {noFeatureBuildings.slice(0, 5).map(b => (
                <li key={b.id}>{b.id}: {b.name} (features: {JSON.stringify(b.requiresFeatures || [])})</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}