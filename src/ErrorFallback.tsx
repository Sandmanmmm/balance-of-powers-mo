import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";

import { Warning, ArrowClockwise } from "@phosphor-icons/react";

export const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  // Log error for debugging
  console.error('Error caught by boundary:', error);
  console.error('Error stack:', error.stack);
  
  return (
    <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-red-300 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Application Error Detected</h1>
        <p className="text-red-700 mb-4">
          The application encountered a runtime error. This error boundary caught it.
        </p>
        
        <div className="bg-gray-100 border rounded p-4 mb-6">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">Error Details:</h3>
          <pre className="text-xs text-red-600 bg-red-50 p-3 rounded border overflow-auto max-h-32 whitespace-pre-wrap">
            {error.message}
          </pre>
          {error.stack && (
            <details className="mt-2">
              <summary className="text-xs text-gray-600 cursor-pointer">Stack Trace</summary>
              <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-24 whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        
        <button 
          onClick={resetErrorBoundary} 
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
