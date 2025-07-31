// Simple test for raw imports
import { useState, useEffect } from 'react';

function RawImportTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testImports = async () => {
      const results: string[] = [];
      
      try {
        // Test each raw import individually
        const imports = [
          { name: 'buildings.yaml', path: './data/buildings.yaml?raw' },
          { name: 'resources.yaml', path: './data/resources.yaml?raw' },
          { name: 'events.yaml', path: './data/events.yaml?raw' },
          { name: 'technologies.yaml', path: './data/technologies.yaml?raw' }
        ];

        for (const imp of imports) {
          try {
            const result = await import(imp.path);
            results.push(`✅ ${imp.name}: ${typeof result.default} (${result.default?.length || 0} chars)`);
          } catch (err) {
            results.push(`❌ ${imp.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        
        setTestResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testImports();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-300 rounded-lg p-6 max-w-2xl">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Raw Import Test Failed</h1>
          <pre className="text-sm text-red-700 bg-red-100 p-4 rounded overflow-auto">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Raw Import Test</h1>
        
        <div className="space-y-2 text-left">
          {testResults.map((result, i) => (
            <div key={i} className={`p-3 rounded font-mono text-sm ${
              result.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result}
            </div>
          ))}
        </div>

        {testResults.length === 0 && (
          <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded">
            Testing raw imports...
          </div>
        )}
      </div>
    </div>
  );
}

export default RawImportTest;
