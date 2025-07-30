import React, { useState, useEffect } from 'react';
import { NaturalEarthStatus } from './NaturalEarthStatus';
import { BoundarySystemTest } from './BoundarySystemTest';

export function FinalSystemStatus() {
  const [activeTab, setActiveTab] = useState<'status' | 'testing'>('status');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 border rounded-lg bg-card">
        <h2 className="text-xl font-bold mb-2">🌍 Natural Earth Data Pipeline</h2>
        <p className="text-sm text-muted-foreground">
          Complete boundary data system with real Natural Earth geographic data, 
          supporting three detail levels (overview, detailed, ultra) for major world countries.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 text-sm rounded ${
            activeTab === 'status' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          📊 Pipeline Status
        </button>
        <button
          onClick={() => setActiveTab('testing')}
          className={`px-4 py-2 text-sm rounded ${
            activeTab === 'testing' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          🧪 System Testing
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'status' && <NaturalEarthStatus />}
        {activeTab === 'testing' && <BoundarySystemTest />}
      </div>

      {/* Implementation Notes */}
      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-2">🔧 Implementation Summary</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div>
            <strong>✅ Completed:</strong> Created modular Natural Earth pipeline with automated boundary processing
          </div>
          <div>
            <strong>✅ Data Structure:</strong> Organized boundaries by detail level (/data/boundaries/overview|detailed|ultra/)
          </div>
          <div>
            <strong>✅ Geographic Manager:</strong> Integrated with existing system for dynamic loading and caching
          </div>
          <div>
            <strong>✅ Validation:</strong> Built comprehensive validation and status reporting tools
          </div>
          <div>
            <strong>✅ File Format:</strong> Standardized GeoJSON with enhanced metadata and game-specific data
          </div>
          <div>
            <strong>⏳ Next Steps:</strong> Add more countries, optimize performance, integrate provincial boundaries
          </div>
        </div>
      </div>

      {/* File Structure Reference */}
      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-2">📁 File Structure</h3>
        <div className="text-xs font-mono text-muted-foreground space-y-1">
          <div>📂 /data/boundaries/</div>
          <div>├── 📂 overview/     <span className="text-muted-foreground"># Low detail for world view</span></div>
          <div>│   ├── 📄 USA.json</div>
          <div>│   ├── 📄 CAN.json</div>
          <div>│   └── 📄 ...</div>
          <div>├── 📂 detailed/     <span className="text-muted-foreground"># Medium detail for regions</span></div>
          <div>│   ├── 📄 USA.json</div>
          <div>│   └── 📄 ...</div>
          <div>├── 📂 ultra/        <span className="text-muted-foreground"># High detail for strategy</span></div>
          <div>│   ├── 📄 USA.json</div>
          <div>│   └── 📄 ...</div>
          <div>└── 📄 pipeline-summary.json</div>
        </div>
      </div>

      {/* Script References */}
      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-2">🛠️ Available Scripts</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div><code className="text-xs bg-muted px-1 rounded">scripts/natural-earth-complete.js</code> - Full pipeline orchestrator</div>
          <div><code className="text-xs bg-muted px-1 rounded">scripts/simple-natural-earth.js</code> - Data download and processing</div>
          <div><code className="text-xs bg-muted px-1 rounded">scripts/validate-natural-earth.js</code> - Data validation and enhancement</div>
          <div><code className="text-xs bg-muted px-1 rounded">scripts/natural-earth-status.js</code> - Status reporting</div>
          <div><code className="text-xs bg-muted px-1 rounded">scripts/enhance-boundaries.js</code> - Manual boundary enhancement</div>
        </div>
      </div>
    </div>
  );
}