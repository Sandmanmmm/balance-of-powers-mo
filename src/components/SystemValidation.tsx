import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Zap } from '@phosphor-icons/react';
import { geographicDataManager, type DetailLevel } from '../managers/GeographicDataManager';

interface SystemValidationProps {
  className?: string;
}

interface ValidationResult {
  nationCode: string;
  detailLevel: DetailLevel;
  status: 'success' | 'failed' | 'loading';
  provinceCount?: number;
  loadTime?: number;
  error?: string;
}

export function SystemValidation({ className }: SystemValidationProps) {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<{
    total: number;
    success: number;
    failed: number;
    avgLoadTime: number;
  }>({ total: 0, success: 0, failed: 0, avgLoadTime: 0 });

  const testSuite = [
    { nationCode: 'USA', detailLevel: 'overview' as DetailLevel },
    { nationCode: 'CAN', detailLevel: 'overview' as DetailLevel },
    { nationCode: 'CHN', detailLevel: 'overview' as DetailLevel },
    { nationCode: 'RUS', detailLevel: 'overview' as DetailLevel },
    { nationCode: 'FRA', detailLevel: 'overview' as DetailLevel },
    { nationCode: 'USA', detailLevel: 'detailed' as DetailLevel },
    { nationCode: 'CAN', detailLevel: 'detailed' as DetailLevel },
  ];

  const runValidation = async () => {
    setIsRunning(true);
    setResults([]);
    
    console.log('🧪 Starting boundary system validation...');
    
    const newResults: ValidationResult[] = [];
    
    for (const test of testSuite) {
      const result: ValidationResult = {
        ...test,
        status: 'loading'
      };
      
      newResults.push(result);
      setResults([...newResults]);
      
      try {
        const startTime = performance.now();
        
        console.log(`Testing ${test.nationCode} at ${test.detailLevel} detail...`);
        const boundaries = await geographicDataManager.loadNationBoundaries(
          test.nationCode, 
          test.detailLevel
        );
        
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        result.status = 'success';
        result.provinceCount = Object.keys(boundaries).length;
        result.loadTime = loadTime;
        
        console.log(`✅ ${test.nationCode}/${test.detailLevel}: ${result.provinceCount} provinces in ${loadTime.toFixed(2)}ms`);
        
      } catch (error) {
        result.status = 'failed';
        result.error = String(error);
        console.error(`❌ ${test.nationCode}/${test.detailLevel}:`, error);
      }
      
      setResults([...newResults]);
    }
    
    // Calculate summary
    const successResults = newResults.filter(r => r.status === 'success');
    const failedResults = newResults.filter(r => r.status === 'failed');
    const avgLoadTime = successResults.length > 0 
      ? successResults.reduce((sum, r) => sum + (r.loadTime || 0), 0) / successResults.length
      : 0;
    
    setSummary({
      total: newResults.length,
      success: successResults.length,
      failed: failedResults.length,
      avgLoadTime
    });
    
    setIsRunning(false);
    console.log('🎯 Validation complete!', {
      success: successResults.length,
      failed: failedResults.length,
      avgLoadTime: avgLoadTime.toFixed(2) + 'ms'
    });
  };

  const clearCache = () => {
    geographicDataManager.clearCache();
    console.log('🧹 Cache cleared');
  };

  useEffect(() => {
    // Auto-run validation on mount
    runValidation();
  }, []);

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-green-500" size={16} />;
      case 'failed': return <XCircle className="text-red-500" size={16} />;
      case 'loading': return <Clock className="text-blue-500 animate-pulse" size={16} />;
    }
  };

  const getStatusColor = (status: ValidationResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-50 text-green-700';
      case 'failed': return 'bg-red-50 text-red-700';
      case 'loading': return 'bg-blue-50 text-blue-700';
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Boundary System Validation</h3>
            <p className="text-sm text-muted-foreground">
              Testing country-based boundary loading across detail levels
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearCache}
              disabled={isRunning}
            >
              Clear Cache
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={runValidation}
              disabled={isRunning}
            >
              {isRunning ? 'Running...' : 'Run Tests'}
            </Button>
          </div>
        </div>

        {/* Summary */}
        {summary.total > 0 && (
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.success}</div>
              <div className="text-xs text-muted-foreground">Success</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {summary.avgLoadTime.toFixed(0)}ms
              </div>
              <div className="text-xs text-muted-foreground">Avg Load</div>
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="space-y-2">
          <h4 className="font-medium">Test Results</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div 
                key={`${result.nationCode}-${result.detailLevel}-${index}`}
                className={`flex items-center justify-between p-3 rounded ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="font-medium">
                      {result.nationCode}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {result.detailLevel}
                      </Badge>
                    </div>
                    {result.status === 'success' && (
                      <div className="text-xs opacity-75">
                        {result.provinceCount} provinces • {result.loadTime?.toFixed(2)}ms
                      </div>
                    )}
                    {result.status === 'failed' && (
                      <div className="text-xs opacity-75">
                        {result.error}
                      </div>
                    )}
                  </div>
                </div>
                {result.status === 'success' && result.loadTime && result.loadTime < 100 && (
                  <Zap className="text-green-600" size={16} title="Fast load" />
                )}
              </div>
            ))}
            
            {results.length === 0 && !isRunning && (
              <div className="text-center text-muted-foreground p-4">
                No tests run yet. Click "Run Tests" to start validation.
              </div>
            )}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-slate-50 p-4 rounded">
          <h4 className="font-medium mb-2">New Boundary System Active</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>📁 Structure: /data/boundaries/{'{detailLevel}'}/{'{ISO_A3}'}.json</div>
            <div>🗂️ Format: Record&lt;string, GeoJSONFeature&gt;</div>
            <div>⚡ Features: Progressive loading, intelligent caching, automatic fallback</div>
            <div>🎯 Detail Levels: overview, detailed, ultra</div>
          </div>
        </div>
      </div>
    </Card>
  );
}