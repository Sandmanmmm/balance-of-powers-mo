import { useEffect, useState } from 'react';
import { getResources } from '../data/gameData';

export function ResourcesDebug() {
  const [resources, setResources] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const resourcesList = await getResources();
        setResources(Array.isArray(resourcesList) ? resourcesList : []);
        setLoaded(true);
        console.log('ResourcesDebug: Loaded', Array.isArray(resourcesList) ? resourcesList.length : 0, 'resources');
      } catch (error) {
        console.error('ResourcesDebug: Failed to load resources:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    };
    
    loadResources();
  }, []);

  return (
    <div className="p-4 bg-card border rounded">
      <h3 className="font-bold mb-2">Resources Debug</h3>
      <p>Loaded: {String(loaded)}</p>
      <p>Count: {resources.length}</p>
      {error && <p className="text-red-500">Error: {error}</p>}
      {resources.slice(0, 3).map(resource => (
        <div key={resource?.id} className="text-xs">
          {resource?.id}: {resource?.name}
        </div>
      ))}
    </div>
  );
}