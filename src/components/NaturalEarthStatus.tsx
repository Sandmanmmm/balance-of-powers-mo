import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Download,
  RefreshCw
} from '@phosphor-icons/react';

interface NaturalEarthSystemStatus {
  isConfigured: boolean;
  hasData: boolean;
  dataQuality: 'excellent' | 'good' | 'poor' | 'none';
  coverage: {
    total: number;
    major_countries: number;
    detail_levels: Record<string, number>;
  };
  performance: {
    cache_hit_rate: number;
    avg_load_time: number;
    memory_usage: number;
  };
  recommendations: string[];
  last_update: string;
}

export function NaturalEarthStatus() {
  const [status, setStatus] = useState<NaturalEarthSystemStatus>({
    isConfigured: false,
    hasData: false,
    dataQuality: 'none',
    coverage: {
      total: 0,
      major_countries: 0,
      detail_levels: {}
    },
    performance: {
      cache_hit_rate: 0,
      avg_load_time: 0,
      memory_usage: 0
    },
    recommendations: [],
    last_update: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Analyze the current Natural Earth system status
   */
  const analyzeSystem = async () => {
    setIsLoading(true);
    
    try {
      // Test system configuration
      const isConfigured = await testSystemConfiguration();
      
      // Test data availability
      const dataStatus = await testDataAvailability();
      
      // Test performance metrics
      const performanceMetrics = await testPerformance();
      
      // Generate recommendations
      const recommendations = generateRecommendations(isConfigured, dataStatus, performanceMetrics);
      
      setStatus({
        isConfigured,
        hasData: dataStatus.hasData,
        dataQuality: dataStatus.quality,
        coverage: dataStatus.coverage,
        performance: performanceMetrics,
        recommendations,
        last_update: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('System analysis failed:', error);
      setStatus(prev => ({
        ...prev,
        recommendations: [`System analysis failed: ${error instanceof Error ? error.message : String(error)}`],
        last_update: new Date().toISOString()
      }));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Test if the Natural Earth system is properly configured
   */
  const testSystemConfiguration = async (): Promise<boolean> => {
    try {
      // Check if GeographicDataManager is available
      const geoManagerTest = await import('@/managers/GeographicDataManager');
      if (!geoManagerTest.GeographicDataManager) {
        return false;
      }

      // Check if required directories exist
      const levels = ['overview', 'detailed', 'ultra'];
      for (const level of levels) {
        try {
          await fetch(`/data/boundaries/${level}/`);
        } catch {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  };

  /**
   * Test data availability and quality
   */
  const testDataAvailability = async () => {
    const majorCountries = ['USA', 'CAN', 'MEX', 'BRA', 'GBR', 'FRA', 'DEU', 'RUS', 'CHN', 'JPN', 'IND', 'AUS'];
    const levels = ['overview', 'detailed', 'ultra'];
    
    let totalFiles = 0;
    let validFiles = 0;
    let majorCountriesFound = 0;
    const detailLevels: Record<string, number> = {};

    for (const level of levels) {
      let levelFiles = 0;
      
      for (const country of majorCountries) {
        try {
          const response = await fetch(`/data/boundaries/${level}/${country}.json`);
          if (response.ok) {
            const data = await response.json();
            totalFiles++;
            levelFiles++;
            
            // Basic validation
            if (data.type === 'FeatureCollection' && Array.isArray(data.features) && data.features.length > 0) {
              validFiles++;
              if (level === 'detailed') { // Count countries only once
                majorCountriesFound++;
              }
            }
          }
        } catch {
          // File not found or invalid
        }
      }
      
      detailLevels[level] = levelFiles;
    }

    // Determine quality
    let quality: 'excellent' | 'good' | 'poor' | 'none';
    const validPercentage = totalFiles > 0 ? (validFiles / totalFiles) * 100 : 0;
    
    if (validPercentage >= 90 && majorCountriesFound >= 10) {
      quality = 'excellent';
    } else if (validPercentage >= 70 && majorCountriesFound >= 8) {
      quality = 'good';
    } else if (validPercentage > 0 || majorCountriesFound > 0) {
      quality = 'poor';
    } else {
      quality = 'none';
    }

    return {
      hasData: totalFiles > 0,
      quality,
      coverage: {
        total: totalFiles,
        major_countries: majorCountriesFound,
        detail_levels: detailLevels
      }
    };
  };

  /**
   * Test system performance
   */
  const testPerformance = async () => {
    const startTime = performance.now();
    
    try {
      // Test cache performance by loading a few countries
      const testCountries = ['USA', 'CAN', 'GBR'];
      let cacheHits = 0;
      let cacheMisses = 0;
      
      for (const country of testCountries) {
        const loadStart = performance.now();
        try {
          const response = await fetch(`/data/boundaries/overview/${country}.json`);
          if (response.ok) {
            await response.json();
            const loadTime = performance.now() - loadStart;
            if (loadTime < 50) cacheHits++; // Assume fast loads are cache hits
            else cacheMisses++;
          }
        } catch {
          cacheMisses++;
        }
      }
      
      const totalTime = performance.now() - startTime;
      const hitRate = testCountries.length > 0 ? (cacheHits / testCountries.length) * 100 : 0;
      
      return {
        cache_hit_rate: hitRate,
        avg_load_time: totalTime / testCountries.length,
        memory_usage: 0 // Would need actual memory monitoring in production
      };
      
    } catch {
      return {
        cache_hit_rate: 0,
        avg_load_time: 0,
        memory_usage: 0
      };
    }
  };

  /**
   * Generate system recommendations
   */
  const generateRecommendations = (
    isConfigured: boolean,
    dataStatus: any,
    performance: any
  ): string[] => {
    const recommendations: string[] = [];

    if (!isConfigured) {
      recommendations.push('Run the Natural Earth pipeline to set up the geographic system');
    }

    if (!dataStatus.hasData) {
      recommendations.push('Download Natural Earth boundary data using the provided scripts');
    } else {
      if (dataStatus.quality === 'poor') {
        recommendations.push('Improve data quality by re-downloading or validating boundary files');
      }
      
      if (dataStatus.coverage.major_countries < 10) {
        recommendations.push('Add more major country boundary files for better coverage');
      }
      
      if (Object.values(dataStatus.coverage.detail_levels).some((count: any) => count === 0)) {
        recommendations.push('Ensure all detail levels (overview, detailed, ultra) have data');
      }
    }

    if (performance.cache_hit_rate < 50) {
      recommendations.push('Consider implementing better caching for improved performance');
    }

    if (performance.avg_load_time > 100) {
      recommendations.push('Optimize boundary file sizes or implement progressive loading');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is well configured! Consider adding more countries for global coverage.');
    }

    return recommendations;
  };

  // Run analysis on component mount
  useEffect(() => {
    analyzeSystem();
  }, []);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'poor': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <CheckCircle className="text-green-600" />;
      case 'good': return <CheckCircle className="text-blue-600" />;
      case 'poor': return <AlertTriangle className="text-yellow-600" />;
      default: return <XCircle className="text-red-600" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe size={20} />
          Natural Earth System Status
        </CardTitle>
        <CardDescription>
          Real-time status of the geographical boundary data system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="recommendations">Actions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database size={16} />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    {status.isConfigured ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <XCircle size={16} className="text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {status.isConfigured ? 'Configured' : 'Not Configured'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText size={16} />
                    Data Quality
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    {getQualityIcon(status.dataQuality)}
                    <Badge className={getQualityColor(status.dataQuality)}>
                      {status.dataQuality.charAt(0).toUpperCase() + status.dataQuality.slice(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe size={16} />
                    Countries
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-primary">
                    {status.coverage.major_countries}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Major countries available
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Coverage Tab */}
          <TabsContent value="coverage" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Coverage by Detail Level</h3>
                <div className="space-y-3">
                  {Object.entries(status.coverage.detail_levels).map(([level, count]) => (
                    <div key={level} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{level}</span>
                        <span>{count} countries</span>
                      </div>
                      <Progress value={(count / 12) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-2">Coverage Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-lg font-bold text-primary">{status.coverage.total}</div>
                    <div className="text-xs text-muted-foreground">Total Files</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-lg font-bold text-primary">{status.coverage.major_countries}/12</div>
                    <div className="text-xs text-muted-foreground">Major Countries</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Cache Hit Rate</span>
                      <span>{status.performance.cache_hit_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={status.performance.cache_hit_rate} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-lg font-bold text-primary">
                        {status.performance.avg_load_time.toFixed(1)}ms
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Load Time</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-lg font-bold text-primary">
                        {status.performance.memory_usage.toFixed(1)}MB
                      </div>
                      <div className="text-xs text-muted-foreground">Memory Usage</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">System Recommendations</h3>
                <div className="space-y-2">
                  {status.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                      <AlertTriangle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">{recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={analyzeSystem}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                  Refresh Analysis
                </Button>
                <Button
                  onClick={() => window.open('/scripts/README.md', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <Download size={16} />
                  View Setup Guide
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-xs text-muted-foreground">
          Last updated: {new Date(status.last_update).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}