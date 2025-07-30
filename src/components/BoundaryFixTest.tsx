import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface BoundaryInfo {
  source: string;
  provinces: number;
  countries: Set<string>;
}

export function BoundaryFixTest() {
  const [boundaryInfo, setBoundaryInfo] = useState<BoundaryInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const testBoundaryLoading = async () => {
      setIsLoading(true);
      const results: BoundaryInfo[] = [];

      // Test legacy boundary files
      const legacyFiles = [
        '/data/legacy_backup/province-boundaries.json',
        '/data/legacy_backup/province-boundaries_usa.json', 
        '/data/legacy_backup/province-boundaries_china.json',
        '/data/legacy_backup/province-boundaries_russia.json',
        '/data/legacy_backup/province-boundaries_europe_west.json'
      ];

      for (const file of legacyFiles) {
        try {
          const response = await fetch(file);
          if (response.ok) {
            const data = await response.json();
            if (data && data.features) {
              const countries = new Set(
                data.features.map((f: any) => f.properties?.country).filter(Boolean)
              );
              results.push({
                source: file.split('/').pop() || file,
                provinces: data.features.length,
                countries
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to test ${file}:`, error);
        }
      }

      setBoundaryInfo(results);
      setIsLoading(false);
    };

    testBoundaryLoading();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Testing Boundary File Access...</h3>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Boundary Files Status</h3>
      <div className="space-y-2">
        {boundaryInfo.map((info, index) => (
          <div key={index} className="text-sm">
            <div className="font-medium">{info.source}</div>
            <div className="text-muted-foreground">
              {info.provinces} provinces from {info.countries.size} countries
            </div>
            <div className="text-xs text-muted-foreground">
              Countries: {Array.from(info.countries).join(', ')}
            </div>
          </div>
        ))}
      </div>
      {boundaryInfo.length === 0 && (
        <p className="text-sm text-red-600">❌ No boundary files accessible</p>
      )}
      {boundaryInfo.length > 0 && (
        <p className="text-sm text-green-600 mt-2">
          ✅ {boundaryInfo.reduce((sum, info) => sum + info.provinces, 0)} total provinces available
        </p>
      )}
    </Card>
  );
}