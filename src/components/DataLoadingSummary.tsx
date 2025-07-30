import React from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Warning, Clock, Database } from '@phosphor-icons/react';

interface LoadingSummary {
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  totalNations: number;
  totalProvinces: number;
  totalBoundaries: number;
  loadTime: number;
}

interface DataLoadingSummaryProps {
  warnings: string[];
  summary: LoadingSummary;
  isVisible?: boolean;
}

export function DataLoadingSummary({ warnings, summary, isVisible = false }: DataLoadingSummaryProps) {
  if (!isVisible) return null;

  const successRate = summary.totalFiles > 0 ? (summary.successfulFiles / summary.totalFiles) * 100 : 0;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Database size={20} className="text-primary" />
        <h3 className="font-semibold">Data Loading Summary</h3>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" />
          <span>Load Time: {summary.loadTime.toFixed(2)}ms</span>
        </div>
        <div className="flex items-center gap-2">
          {successRate >= 75 ? (
            <CheckCircle size={16} className="text-green-500" />
          ) : (
            <Warning size={16} className="text-yellow-500" />
          )}
          <span>Success Rate: {successRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* File Statistics */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Badge variant="outline" className="justify-center">
          {summary.successfulFiles}/{summary.totalFiles} Files
        </Badge>
        <Badge variant="outline" className="justify-center">
          {summary.totalNations} Nations
        </Badge>
        <Badge variant="outline" className="justify-center">
          {summary.totalProvinces} Provinces
        </Badge>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Warning size={16} className="text-yellow-500" />
            <span className="text-sm font-medium">Warnings ({warnings.length})</span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {warnings.slice(0, 5).map((warning, index) => (
              <Alert key={index} className="py-2">
                <AlertDescription className="text-xs">
                  {warning}
                </AlertDescription>
              </Alert>
            ))}
            {warnings.length > 5 && (
              <p className="text-xs text-muted-foreground">
                ... and {warnings.length - 5} more warnings
              </p>
            )}
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      <details className="text-xs">
        <summary className="cursor-pointer text-primary hover:underline">
          View Detailed Breakdown
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <strong>Loaded Data:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Nations: {summary.totalNations}</li>
              <li>• Provinces: {summary.totalProvinces}</li>
              <li>• Boundaries: {summary.totalBoundaries}</li>
            </ul>
          </div>
          <div>
            <strong>File Processing:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Successful: {summary.successfulFiles}</li>
              <li>• Failed: {summary.failedFiles}</li>
              <li>• Total: {summary.totalFiles}</li>
            </ul>
          </div>
        </div>
      </details>
    </Card>
  );
}