import React from 'react';
import { WorldMapWebGL } from './components/WorldMapWebGL';
import type { Province, MapOverlayType } from './lib/types';

// Test component to demonstrate WorldMapWebGL usage
export function WebGLMapTest() {
  const [selectedProvince, setSelectedProvince] = React.useState<string | undefined>();
  const [mapOverlay, setMapOverlay] = React.useState<MapOverlayType>('none');

  // Mock province data for testing
  const mockProvinces: Partial<Province>[] = [
    {
      id: 'usa-california',
      name: 'California',
      country: 'United States',
      coordinates: [-119.4179, 36.7783],
      population: { 
        total: 39538223,
        ethnicGroups: [
          { group: 'White', percent: 36.5 },
          { group: 'Hispanic', percent: 39.4 },
          { group: 'Asian', percent: 15.3 },
          { group: 'Other', percent: 8.8 }
        ]
      },
      economy: { 
        gdpPerCapita: 75000,
        unemployment: 4.2,
        inflation: 3.1
      },
      unrest: 2.5,
    },
    {
      id: 'usa-texas', 
      name: 'Texas',
      country: 'United States',
      coordinates: [-99.9018, 31.9686],
      population: { 
        total: 29145505,
        ethnicGroups: [
          { group: 'White', percent: 41.2 },
          { group: 'Hispanic', percent: 39.3 },
          { group: 'Black', percent: 12.9 },
          { group: 'Other', percent: 6.6 }
        ]
      },
      economy: { 
        gdpPerCapita: 65000,
        unemployment: 3.8,
        inflation: 2.9
      },
      unrest: 3.0,
    },
    {
      id: 'can-ontario',
      name: 'Ontario',
      country: 'Canada', 
      coordinates: [-85.3232, 51.2538],
      population: { 
        total: 14789778,
        ethnicGroups: [
          { group: 'European', percent: 52.1 },
          { group: 'South Asian', percent: 8.7 },
          { group: 'East Asian', percent: 7.9 },
          { group: 'Other', percent: 31.3 }
        ]
      },
      economy: { 
        gdpPerCapita: 55000,
        unemployment: 5.1,
        inflation: 2.4
      },
      unrest: 1.5,
    }
  ];

  const handleProvinceSelect = (provinceId: string | undefined) => {
    setSelectedProvince(provinceId);
    console.log('Selected province:', provinceId);
  };

  const handleOverlayChange = (overlay: MapOverlayType) => {
    setMapOverlay(overlay);
    console.log('Changed overlay to:', overlay);
  };

  return (
    <div className="w-full h-screen bg-gray-100">
      <div className="h-full p-4">
        <div className="bg-white rounded-lg shadow-lg h-full">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold text-gray-800">
              PixiJS WebGL World Map Test
            </h1>
            <p className="text-gray-600">
              Testing the WorldMapWebGL component with PixiJS rendering
            </p>
          </div>
          
          <div className="h-full" style={{ height: 'calc(100% - 80px)' }}>
            <WorldMapWebGL
              provinces={mockProvinces as Province[]}
              selectedProvince={selectedProvince}
              mapOverlay={mapOverlay}
              onProvinceSelect={handleProvinceSelect}
              onOverlayChange={handleOverlayChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebGLMapTest;
