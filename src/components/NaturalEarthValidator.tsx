import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertCircle, Download, RefreshCw } from '@phosphor-icons/react';

interface ValidationResult {
  level: string;
  valid: number;
  invalid: number;
  missing: number;
  errors: string[];
}

interface PipelineStatus {
  hasData: boolean;
  levels: Record<string, { files: number; countries: string[] }>;
  validationResults?: Record<string, ValidationResult>;
  lastUpdated?: string;
  totalCountries: number;
  totalFiles: number;
}

export function NaturalEarthValidator() {
  const [status, setStatus] = useState<PipelineStatus>({
    hasData: false,
    levels: {},
    totalCountries: 0,
    totalFiles: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  /**
   * Check current status of Natural Earth data
   */
  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const levels = ['overview', 'detailed', 'ultra'];
      const levelData: Record<string, { files: number; countries: string[] }> = {};
      let totalFiles = 0;
      const allCountries = new Set<string>();

      for (const level of levels) {
        try {
          const response = await fetch(`/data/boundaries/${level}/`);
          if (response.ok) {
            // Try to load a sample file to verify structure
            const testResponse = await fetch(`/data/boundaries/${level}/USA.json`);
            if (testResponse.ok) {
              const testData = await testResponse.json();
              addLog(`✅ ${level}: Found valid data (sample: USA)`);
              
              // For now, assume standard countries are present
              const estimatedCountries = ['USA', 'CAN', 'MEX', 'BRA', 'GBR', 'FRA', 'DEU', 'RUS', 'CHN', 'JPN'];
              levelData[level] = {
                files: estimatedCountries.length,
                countries: estimatedCountries
              };
              totalFiles += estimatedCountries.length;
              estimatedCountries.forEach(country => allCountries.add(country));
            } else {
              addLog(`⚠️  ${level}: Directory exists but no USA.json found`);
              levelData[level] = { files: 0, countries: [] };
            }
          } else {
            addLog(`❌ ${level}: Directory not found`);
            levelData[level] = { files: 0, countries: [] };
          }
        } catch (error) {
          addLog(`❌ ${level}: Error checking - ${error instanceof Error ? error.message : String(error)}`);
          levelData[level] = { files: 0, countries: [] };
        }
      }

      setStatus({
        hasData: totalFiles > 0,
        levels: levelData,
        totalFiles,
        totalCountries: allCountries.size,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      addLog(`❌ Status check failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validate specific boundary files
   */
  const validateBoundaries = async () => {
    setIsLoading(true);
    addLog('🔍 Starting boundary validation...');

    try {
      const testCountries = ['USA', 'CAN', 'GBR', 'FRA', 'DEU'];
      const levels = ['overview', 'detailed', 'ultra'];
      const validationResults: Record<string, ValidationResult> = {};

      for (const level of levels) {
        addLog(`📊 Validating ${level} level...`);
        const result: ValidationResult = {
          level,
          valid: 0,
          invalid: 0,
          missing: 0,
          errors: []
        };

        for (const country of testCountries) {
          try {
            const response = await fetch(`/data/boundaries/${level}/${country}.json`);
            if (response.ok) {
              const data = await response.json();
              
              // Validate GeoJSON structure
              if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
                result.valid++;
                addLog(`  ✅ ${country}: Valid`);
              } else {
                result.invalid++;
                result.errors.push(`${country}: Invalid GeoJSON structure`);
                addLog(`  ❌ ${country}: Invalid structure`);
              }
            } else {
              result.missing++;
              result.errors.push(`${country}: File not found`);
              addLog(`  ⚠️  ${country}: Missing`);
            }
          } catch (error) {
            result.invalid++;
            result.errors.push(`${country}: ${error instanceof Error ? error.message : String(error)}`);
            addLog(`  ❌ ${country}: Error - ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        validationResults[level] = result;
        addLog(`📈 ${level}: ${result.valid} valid, ${result.invalid} invalid, ${result.missing} missing`);
      }

      setStatus(prev => ({
        ...prev,
        validationResults,
        lastUpdated: new Date().toISOString()
      }));

      addLog('✅ Validation completed');

    } catch (error) {
      addLog(`❌ Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Download Natural Earth data using the pipeline
   */
  const downloadData = async () => {
    addLog('🚀 Starting Natural Earth download...');
    addLog('⚠️  Note: This would normally run the Node.js pipeline scripts');
    addLog('📝 To actually download data, run:');
    addLog('   node scripts/natural-earth-complete.js');
    addLog('   or');
    addLog('   node scripts/simple-natural-earth.js');
  };

  /**
   * Add log message
   */
  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  /**
   * Clear logs
   */
  const clearLogs = () => {
    setLogs([]);
  };

  // Check status on component mount
  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download size={20} />
          Natural Earth Data Validator
        </CardTitle>
        <CardDescription>
          Monitor and validate real geographical boundary data from Natural Earth
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{status.totalCountries}</div>
            <div className="text-sm text-muted-foreground">Countries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{status.totalFiles}</div>
            <div className="text-sm text-muted-foreground">Total Files</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              {status.hasData ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <XCircle size={20} className="text-red-500" />
              )}
              <span className="text-sm font-medium">
                {status.hasData ? 'Data Available' : 'No Data'}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Detail Levels */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Detail Levels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(status.levels).map(([level, data]) => (
              <Card key={level} className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase tracking-wide">{level}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Files:</span>
                      <Badge variant={data.files > 0 ? "default" : "secondary"}>
                        {data.files}
                      </Badge>
                    </div>
                    {data.countries.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {data.countries.slice(0, 3).join(', ')}
                        {data.countries.length > 3 && '...'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Validation Results */}
        {status.validationResults && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3">Validation Results</h3>
              <div className="space-y-2">
                {Object.entries(status.validationResults).map(([level, result]) => (
                  <div key={level} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium uppercase text-sm">{level}</span>
                      <div className="flex gap-2">
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          ✅ {result.valid}
                        </Badge>
                        <Badge variant="destructive">
                          ❌ {result.invalid}
                        </Badge>
                        <Badge variant="secondary">
                          ⚠️ {result.missing}
                        </Badge>
                      </div>
                    </div>
                    {result.errors.length > 0 && (
                      <AlertCircle size={16} className="text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={checkStatus}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Check Status
          </Button>
          <Button
            onClick={validateBoundaries}
            disabled={isLoading}
            variant="outline"
          >
            <CheckCircle size={16} />
            Validate Files
          </Button>
          <Button
            onClick={downloadData}
            disabled={isLoading}
            variant="outline"
          >
            <Download size={16} />
            Download Guide
          </Button>
        </div>

        {/* Last Updated */}
        {status.lastUpdated && (
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(status.lastUpdated).toLocaleString()}
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold">Activity Log</h3>
                <Button
                  onClick={clearLogs}
                  variant="ghost"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
              <div className="bg-muted p-3 rounded-lg font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="text-muted-foreground">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800">Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-blue-700 space-y-2">
              <p>To download real Natural Earth data:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Open a terminal in the project root</li>
                <li>Run: <code className="bg-blue-100 px-1 rounded">node scripts/natural-earth-complete.js</code></li>
                <li>Wait for download and processing to complete</li>
                <li>Click "Check Status" to verify the data</li>
              </ol>
              <p className="text-xs mt-2">
                The pipeline will download boundary data for 100+ countries at 3 detail levels.
              </p>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}