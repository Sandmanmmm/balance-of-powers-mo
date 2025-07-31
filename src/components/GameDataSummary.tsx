import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Globe, MapPin, Building, Flag } from 'lucide-react';
import { loadWorldData } from '../data/dataLoader';
import { useGameState } from '../hooks/useGameState';

interface LoadingSummary {
  nations: { count: number; regions: string[]; samples: string[] };
  provinces: { count: number; regions: string[]; samples: string[] };
  boundaries: { files: number; countries: string[] };
  resources: string[];
  buildings: string[];
  loadTime: number;
}

export function GameDataSummary() {
  const [summary, setSummary] = useState<LoadingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { nations, provinces, isInitialized } = useGameState();

  const generateSummary = async () => {
    setIsLoading(true);
    
    try {
      const worldData = await loadWorldData();
      
      // Analyze nations
      const nationRegions = [...new Set(worldData.nations.map(n => {
        // Try to determine region from ID patterns
        if (['USA', 'CAN', 'MEX'].includes(n.id)) return 'North America';
        if (['CHN', 'JPN', 'KOR'].includes(n.id)) return 'East Asia';
        if (['RUS'].includes(n.id)) return 'Russia';
        if (['IND'].includes(n.id)) return 'South Asia';
        if (['GBR', 'FRA', 'DEU'].includes(n.id)) return 'Europe';
        return 'Other';
      }))];
      
      const nationSamples = worldData.nations.slice(0, 8).map(n => n.name).filter(Boolean);
      
      // Analyze provinces  
      const provinceRegions = [...new Set(worldData.provinces.map(p => {
        if (p.country?.includes('Canada')) return 'Canada';
        if (p.country?.includes('United States') || p.country?.includes('USA')) return 'USA';
        if (p.country?.includes('China')) return 'China';
        if (p.country?.includes('India')) return 'India';
        if (p.country?.includes('Russia')) return 'Russia';
        return p.country || 'Unknown';
      }))].slice(0, 6);
      
      const provinceSamples = worldData.provinces.slice(0, 8).map(p => p.name).filter(Boolean);
      
      // Check boundary data
      const boundaryCountries = ['CAN', 'USA', 'CHN', 'RUS', 'IND', 'FRA', 'DEU', 'GBR'];
      let boundaryFiles = 0;
      
      for (const country of boundaryCountries) {
        try {
          const response = await fetch(`/data/boundaries/overview/${country}.json`);
          if (response.ok) boundaryFiles++;
        } catch (e) {
          // Silent fail for missing files
        }
      }
      
      setSummary({
        nations: {
          count: worldData.nations.length,
          regions: nationRegions,
          samples: nationSamples
        },
        provinces: {
          count: worldData.provinces.length,
          regions: provinceRegions,
          samples: provinceSamples
        },
        boundaries: {
          files: boundaryFiles,
          countries: boundaryCountries.slice(0, boundaryFiles)
        },
        resources: ['Oil', 'Food', 'Water', 'Electricity', 'Manpower'], // Static for now
        buildings: ['Farm', 'Factory', 'Power Plant', 'Oil Well'], // Static for now
        loadTime: worldData.loadingStats?.totalTime || 0
      });
      
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isInitialized) {
      generateSummary();
    }
  }, [isInitialized]);

  if (!summary && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Game Data Summary
          </CardTitle>
          <CardDescription>
            Click to analyze the loaded game data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generateSummary} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Analyze Game Data
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Game Data Summary
          <Button
            onClick={generateSummary}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Comprehensive overview of loaded game content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Analyzing data...
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* Nations */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  <span className="font-medium">Nations</span>
                  <Badge variant="default">{summary.nations.count}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Regions: {summary.nations.regions.join(', ')}
                </div>
                <div className="text-xs text-muted-foreground">
                  Examples: {summary.nations.samples.slice(0, 4).join(', ')}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">Provinces</span>
                  <Badge variant="default">{summary.provinces.count}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Countries: {summary.provinces.regions.join(', ')}
                </div>
                <div className="text-xs text-muted-foreground">
                  Examples: {summary.provinces.samples.slice(0, 3).join(', ')}
                </div>
              </div>
            </div>
            
            {/* Boundaries and Systems */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">Boundaries</span>
                  <Badge variant="default">{summary.boundaries.files}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Available: {summary.boundaries.countries.join(', ')}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">Game Systems</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Resources: {summary.resources.slice(0, 3).join(', ')}...
                </div>
                <div className="text-xs text-muted-foreground">
                  Buildings: {summary.buildings.slice(0, 3).join(', ')}...
                </div>
              </div>
            </div>
            
            {/* Performance */}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Load Time: {Math.round(summary.loadTime)}ms</span>
                <span>State: {isInitialized ? '✅ Ready' : '⏳ Loading'}</span>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}