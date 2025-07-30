import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { geographicDataManager } from '../managers/GeographicDataManager';
import { DetailLevel } from '../types/geo';

export function GeoTestComponent() {
  const [status, setStatus] = useState('Initializing...');
  const [stats, setStats] = useState<any>(null);

  const testGeoManager = async () => {
    try {
      setStatus('Testing GeographicDataManager...');
      
      // Test basic stats
      const initialStats = geographicDataManager.getStats();
      console.log('Initial stats:', initialStats);
      setStats(initialStats);
      
      setStatus('✅ GeographicDataManager test completed successfully');
    } catch (error) {
      console.error('GeographicDataManager test failed:', error);
      setStatus(`❌ Test failed: ${error}`);
    }
  };

  useEffect(() => {
    testGeoManager();
  }, []);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-2">GeographicDataManager Test</h3>
      <div className="text-xs text-muted-foreground mb-2">{status}</div>
      {stats && (
        <div className="text-xs space-y-1">
          <div>Cache Size: {stats.currentCacheSize} bytes</div>
          <div>Entries: {stats.cacheEntries}</div>
          <div>Hit Ratio: {(stats.hitRatio * 100).toFixed(1)}%</div>
        </div>
      )}
      <Button size="sm" onClick={testGeoManager} className="mt-2">
        Retest
      </Button>
    </Card>
  );
}