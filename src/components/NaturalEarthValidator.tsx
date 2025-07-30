import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function NaturalEarthValidator() {
  const [validationResults, setValidationResults] = useState<{
    overview: Record<string, boolean>;
    detailed: Record<string, boolean>;
  }>({
    overview: {},
    detailed: {}
  });

  const [isValidating, setIsValidating] = useState(false);

  const testFiles = ['AUS', 'BRA', 'CAN', 'CHN', 'DEU', 'FRA', 'GBR', 'IND', 'MEX', 'RUS', 'USA'];

  const validateFile = async (detailLevel: 'overview' | 'detailed', countryCode: string) => {
    try {
      const response = await fetch(`/data/boundaries/${detailLevel}/${countryCode}.json`);
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      
      // Validate Natural Earth structure
      if (data.type !== 'FeatureCollection') {
        console.warn(`❌ ${countryCode}: Invalid type, expected FeatureCollection`);
        return false;
      }
      
      if (!Array.isArray(data.features) || data.features.length === 0) {
        console.warn(`❌ ${countryCode}: No features found`);
        return false;
      }
      
      const feature = data.features[0];
      if (!feature.properties?.ISO_A3) {
        console.warn(`❌ ${countryCode}: Missing ISO_A3 property`);
        return false;
      }
      
      if (!feature.geometry || !feature.geometry.coordinates) {
        console.warn(`❌ ${countryCode}: Invalid geometry`);
        return false;
      }
      
      console.log(`✅ ${countryCode} ${detailLevel}: Valid Natural Earth file`);
      return true;
      
    } catch (error) {
      console.error(`❌ ${countryCode} ${detailLevel}: Validation failed:`, error);
      return false;
    }
  };

  const runValidation = async () => {
    setIsValidating(true);
    console.log('🌍 Starting Natural Earth validation...');
    
    const results = {
      overview: {} as Record<string, boolean>,
      detailed: {} as Record<string, boolean>
    };
    
    for (const detailLevel of ['overview', 'detailed'] as const) {
      for (const countryCode of testFiles) {
        results[detailLevel][countryCode] = await validateFile(detailLevel, countryCode);
      }
    }
    
    setValidationResults(results);
    setIsValidating(false);
    
    const totalOverview = Object.values(results.overview).filter(Boolean).length;
    const totalDetailed = Object.values(results.detailed).filter(Boolean).length;
    
    console.log(`✅ Natural Earth validation complete:`);
    console.log(`  Overview: ${totalOverview}/${testFiles.length} files valid`);
    console.log(`  Detailed: ${totalDetailed}/${testFiles.length} files valid`);
  };

  useEffect(() => {
    runValidation();
  }, []);

  return (
    <Card className="p-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Natural Earth Validator</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={runValidation}
            disabled={isValidating}
          >
            {isValidating ? 'Validating...' : 'Validate'}
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Overview Level</div>
          <div className="flex flex-wrap gap-1">
            {testFiles.map(code => (
              <Badge 
                key={code} 
                variant={validationResults.overview[code] ? 'default' : 'destructive'}
                className="text-xs"
              >
                {code}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Detailed Level</div>
          <div className="flex flex-wrap gap-1">
            {testFiles.map(code => (
              <Badge 
                key={code} 
                variant={validationResults.detailed[code] ? 'default' : 'secondary'}
                className="text-xs"
              >
                {code}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          🌍 Format: Natural Earth Admin 0 boundaries
        </div>
      </div>
    </Card>
  );
}