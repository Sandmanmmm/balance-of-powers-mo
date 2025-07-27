import { useEffect, useState } from 'react';
import { getAllResources } from '../data/gameData';

export function ResourcesDebug() {
  const [resources, setResources] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const resourcesList = getAllResources();
      setResources(resourcesList);
      setLoaded(true);
      console.log('ResourcesDebug: Loaded', resourcesList.length, 'resources');
    } catch (error) {
      console.error('ResourcesDebug: Failed to load resources:', error);
    }
  }, []);

  return (
    <div className="p-4 bg-card border rounded">
      <h3 className="font-bold mb-2">Resources Debug</h3>
      <p>Loaded: {String(loaded)}</p>
      <p>Count: {resources.length}</p>
      {resources.slice(0, 3).map(resource => (
        <div key={resource?.id} className="text-xs">
          {resource?.id}: {resource?.name}
        </div>
      ))}
    </div>
  );
}