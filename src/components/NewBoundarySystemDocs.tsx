import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function NewBoundarySystemDocs() {
  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Country-Based Boundary System</h2>
          <p className="text-muted-foreground">
            Balance of Powers now uses a modular boundary system organized by country and detail level
          </p>
        </div>

        {/* File Structure */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">File Structure</h3>
          <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm">
            <div className="space-y-1">
              <div>📁 /data/boundaries/</div>
              <div className="ml-4">📁 overview/</div>
              <div className="ml-8">📄 USA.json</div>
              <div className="ml-8">📄 CAN.json</div>
              <div className="ml-8">📄 CHN.json</div>
              <div className="ml-8">📄 RUS.json</div>
              <div className="ml-8">📄 FRA.json</div>
              <div className="ml-4">📁 detailed/</div>
              <div className="ml-8">📄 USA.json</div>
              <div className="ml-8">📄 ...</div>
              <div className="ml-4">📁 ultra/</div>
              <div className="ml-8">📄 USA.json</div>
              <div className="ml-8">📄 ...</div>
            </div>
          </div>
        </div>

        {/* Detail Levels */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Detail Levels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Overview</h4>
                <Badge variant="secondary">Level 1</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Basic country shapes optimized for world view. Fast loading and minimal memory usage.
              </p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Detailed</h4>
                <Badge variant="secondary">Level 2</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                More accurate boundaries with better coastlines. Good for regional viewing.
              </p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Ultra</h4>
                <Badge variant="secondary">Level 3</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                High-detail boundaries for close-up viewing. Maximum accuracy with larger file sizes.
              </p>
            </Card>
          </div>
        </div>

        {/* Data Format */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Data Format</h3>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Each country file contains province-level boundaries as a Record&lt;string, GeoJSONFeature&gt;:
            </p>
            <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`{
  "USA_001": {
    "type": "Feature",
    "properties": {
      "id": "USA_001",
      "name": "California"
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[...coordinates...]]]
    }
  },
  "USA_002": {
    "type": "Feature",
    "properties": {
      "id": "USA_002", 
      "name": "Texas"
    },
    "geometry": { ... }
  }
}`}</pre>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">System Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-700">🚀 Performance</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Load only needed countries</li>
                <li>• Progressive detail enhancement</li>
                <li>• Intelligent memory caching</li>
                <li>• Faster initial loading</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-blue-700">🛠️ Maintainability</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• One file per country per detail level</li>
                <li>• Easy to update individual countries</li>
                <li>• Clear file organization</li>
                <li>• Supports future expansion</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Usage Example</h3>
          <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{`import { geographicDataManager } from '../managers/GeographicDataManager';

// Load USA boundaries at overview detail
const usaBoundaries = await geographicDataManager
  .loadNationBoundaries('USA', 'overview');

// Upgrade to detailed view
await geographicDataManager
  .upgradeNationDetail('USA', 'detailed');`}</pre>
          </div>
        </div>

        {/* Migration Status */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">🔄 Migration Status</h4>
          <p className="text-sm text-blue-700">
            The system supports both the new country-based structure and legacy regional files for backwards compatibility. 
            New boundary data should use the country-based format for optimal performance.
          </p>
        </div>
      </div>
    </Card>
  );
}