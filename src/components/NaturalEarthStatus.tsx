import React, { useState, useEffect } from 'react';

interface PipelineStatus {
  generated: string;
  pipeline_version: string;
  status: string;
  summary: {
    total_files: number;
    valid_files: number;
    invalid_files: number;
    unique_countries: number;
    detail_levels: number;
  };
  levels: {
    [key: string]: {
      files: number;
      countries: string[];
      status: string;
    };
  };
  expected_countries: {
    major_powers: string[];
    regional_powers: string[];
    coverage: {
      major_powers_complete: number;
      regional_powers_complete: number;
      total_expected: number;
      total_available: number;
      coverage_percentage: number;
    };
  };
  next_steps: string[];
  recommendations: string[];
  pipeline_readiness: {
    for_development: boolean;
    for_testing: boolean;
    for_production: boolean;
    missing_for_production: string[];
  };
}

export function NaturalEarthStatus() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch('/data/boundaries/pipeline-summary.json');
        if (!response.ok) {
          throw new Error(`Failed to load status: ${response.status}`);
        }
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pipeline status');
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Loading Natural Earth status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-destructive/10 border-destructive/20">
        <div className="flex items-center gap-2">
          <span className="text-destructive">⚠️</span>
          <span className="text-sm text-destructive">Pipeline Status Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 border rounded-lg bg-muted">
        <span className="text-sm text-muted-foreground">No pipeline status available</span>
      </div>
    );
  }

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'COMPLETE': return '✅';
      case 'PARTIAL_COMPLETE': return '🔄';
      case 'PARTIAL': return '⚠️';
      default: return '❓';
    }
  };

  const getReadinessColor = (ready: boolean) => ready ? 'text-green-600' : 'text-orange-600';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Natural Earth Pipeline Status</h3>
          <span className={`text-sm font-medium ${status.status === 'PARTIAL_COMPLETE' ? 'text-orange-600' : 'text-green-600'}`}>
            {getStatusIcon(status.status)} {status.status.replace('_', ' ')}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Version {status.pipeline_version} • Generated {new Date(status.generated).toLocaleString()}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 border rounded bg-card text-center">
          <div className="text-2xl font-bold text-primary">{status.summary.total_files}</div>
          <div className="text-xs text-muted-foreground">Total Files</div>
        </div>
        <div className="p-3 border rounded bg-card text-center">
          <div className="text-2xl font-bold text-green-600">{status.summary.valid_files}</div>
          <div className="text-xs text-muted-foreground">Valid Files</div>
        </div>
        <div className="p-3 border rounded bg-card text-center">
          <div className="text-2xl font-bold text-primary">{status.summary.unique_countries}</div>
          <div className="text-xs text-muted-foreground">Countries</div>
        </div>
        <div className="p-3 border rounded bg-card text-center">
          <div className="text-2xl font-bold text-primary">{status.expected_countries.coverage.coverage_percentage}%</div>
          <div className="text-xs text-muted-foreground">Coverage</div>
        </div>
      </div>

      {/* Detail Levels */}
      <div className="p-4 border rounded-lg bg-card">
        <h4 className="font-semibold mb-3">Detail Levels</h4>
        <div className="space-y-2">
          {Object.entries(status.levels).map(([level, data]) => (
            <div key={level} className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium capitalize">{level}</span>
                <span className="text-xs text-muted-foreground">
                  {getStatusIcon(data.status)} {data.status}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">{data.files}</span> files
                <span className="text-muted-foreground ml-1">
                  ({data.countries.length} countries)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Readiness Status */}
      <div className="p-4 border rounded-lg bg-card">
        <h4 className="font-semibold mb-3">Pipeline Readiness</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Development</span>
            <span className={`text-sm font-medium ${getReadinessColor(status.pipeline_readiness.for_development)}`}>
              {status.pipeline_readiness.for_development ? '✅ Ready' : '❌ Not Ready'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Testing</span>
            <span className={`text-sm font-medium ${getReadinessColor(status.pipeline_readiness.for_testing)}`}>
              {status.pipeline_readiness.for_testing ? '✅ Ready' : '❌ Not Ready'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Production</span>
            <span className={`text-sm font-medium ${getReadinessColor(status.pipeline_readiness.for_production)}`}>
              {status.pipeline_readiness.for_production ? '✅ Ready' : '❌ Not Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-4 border rounded-lg bg-card">
        <h4 className="font-semibold mb-3">Next Steps</h4>
        <div className="space-y-1">
          {status.next_steps.slice(0, 3).map((step, index) => (
            <div key={index} className="text-sm text-muted-foreground">
              • {step}
            </div>
          ))}
        </div>
      </div>

      {/* Available Countries */}
      <div className="p-4 border rounded-lg bg-card">
        <h4 className="font-semibold mb-3">Available Countries</h4>
        <div className="space-y-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Major Powers</div>
            <div className="flex flex-wrap gap-1">
              {status.expected_countries.major_powers.map(country => {
                const hasData = Object.values(status.levels).some(level => 
                  level.countries.includes(country)
                );
                return (
                  <span 
                    key={country}
                    className={`text-xs px-2 py-1 rounded ${
                      hasData ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {country}
                  </span>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Regional Powers</div>
            <div className="flex flex-wrap gap-1">
              {status.expected_countries.regional_powers.map(country => {
                const hasData = Object.values(status.levels).some(level => 
                  level.countries.includes(country)
                );
                return (
                  <span 
                    key={country}
                    className={`text-xs px-2 py-1 rounded ${
                      hasData ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {country}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}