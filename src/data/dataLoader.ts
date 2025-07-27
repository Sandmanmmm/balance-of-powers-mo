import yaml from 'js-yaml';
import { Province, Nation } from '../lib/types';

// Helper functions to convert raw YAML data to TypeScript interfaces
function convertRawNation(id: string, rawData: any): Nation {
  try {
    // Ensure rawData is valid
    if (!rawData || typeof rawData !== 'object') {
      console.warn(`convertRawNation: Invalid raw data for nation ${id}:`, typeof rawData);
      rawData = {};
    }

    return {
      id,
      name: rawData.name || id,
      capital: rawData.capital || '',
      flag: rawData.flag || '',
      government: {
        type: rawData.government?.type || 'democracy',
        leader: rawData.government?.leader || 'Unknown',
        approval: Number(rawData.government?.approval) || 50,
        stability: Number(rawData.government?.stability) || 50
      },
      economy: {
        gdp: Number(rawData.economy?.gdp) || 0,
        debt: Number(rawData.economy?.debt) || 0,
        inflation: Number(rawData.economy?.inflation) || 0,
        tradeBalance: Number(rawData.economy?.trade_balance || rawData.economy?.tradeBalance) || 0,
        treasury: Number(rawData.economy?.treasury) || 0
      },
      military: {
        manpower: Number(rawData.military?.manpower) || 0,
        equipment: Number(rawData.military?.equipment) || 0,
        readiness: Number(rawData.military?.readiness) || 100,
        doctrine: rawData.military?.doctrine || 'Standard',
        nuclearCapability: Boolean(rawData.military?.nuclear_capability || rawData.military?.nuclearCapability)
      },
      technology: {
        researchPoints: Number(rawData.technology?.researchPoints || rawData.technology?.research_points) || 0,
        currentResearch: Array.isArray(rawData.technology?.currentResearch || rawData.technology?.current_research) 
          ? (rawData.technology?.currentResearch || rawData.technology?.current_research) 
          : [],
        completedTech: Array.isArray(rawData.technology?.completedTech || rawData.technology?.completed_tech) 
          ? (rawData.technology?.completedTech || rawData.technology?.completed_tech) 
          : [],
        level: Number(rawData.technology?.level || rawData.technology?.tech_level) || 1.0
      },
      diplomacy: {
        allies: Array.isArray(rawData.diplomacy?.allies) ? rawData.diplomacy.allies : [],
        enemies: Array.isArray(rawData.diplomacy?.enemies) ? rawData.diplomacy.enemies : [],
        embargoes: Array.isArray(rawData.diplomacy?.embargoes) ? rawData.diplomacy.embargoes : [],
        sanctions: Array.isArray(rawData.diplomacy?.sanctions) ? rawData.diplomacy.sanctions : [],
        tradePartners: Array.isArray(rawData.diplomacy?.tradePartners || rawData.diplomacy?.trade_partners) 
          ? (rawData.diplomacy?.tradePartners || rawData.diplomacy?.trade_partners) 
          : []
      },
      resourceStockpiles: rawData.resourceStockpiles || rawData.resource_stockpiles || rawData.resources?.stockpiles || {},
      resourceProduction: rawData.resourceProduction || rawData.resource_production || {},
      resourceConsumption: rawData.resourceConsumption || rawData.resource_consumption || {},
      resourceShortages: rawData.resourceShortages || rawData.resource_shortages || {},
      resourceEfficiency: rawData.resourceEfficiency || rawData.resource_efficiency || { overall: 1.0 },
      tradeOffers: rawData.tradeOffers || rawData.trade_offers || [],
      tradeAgreements: rawData.tradeAgreements || rawData.trade_agreements || []
    };
  } catch (error) {
    console.error(`convertRawNation: Error converting nation ${id}:`, error);
    throw error;
  }
}

function convertRawProvince(id: string, rawData: any): Province {
  try {
    // Ensure rawData is valid
    if (!rawData || typeof rawData !== 'object') {
      console.warn(`convertRawProvince: Invalid raw data for province ${id}:`, typeof rawData);
      rawData = {};
    }

    return {
      id,
      name: rawData.name || id,
      country: rawData.country || 'Unknown',
      coordinates: Array.isArray(rawData.coordinates) && rawData.coordinates.length >= 2 
        ? [Number(rawData.coordinates[0]) || 0, Number(rawData.coordinates[1]) || 0] as [number, number]
        : [0, 0] as [number, number],
      features: Array.isArray(rawData.features) ? rawData.features : [],
      population: {
        total: Number(rawData.population?.total) || 0,
        ethnicGroups: Array.isArray(rawData.population?.ethnic_groups) 
          ? rawData.population.ethnic_groups.map((group: any) => ({
              group: group?.group || 'Unknown',
              percent: Number(group?.percent) || 0
            }))
          : []
      },
      unrest: Number(rawData.unrest) || 0,
      infrastructure: {
        roads: Number(rawData.infrastructure?.roads) || 1,
        internet: Number(rawData.infrastructure?.internet) || 1,
        healthcare: Number(rawData.infrastructure?.healthcare) || 1,
        education: Number(rawData.infrastructure?.education) || 1
      },
      resourceDeposits: rawData.resource_deposits || rawData.resourceDeposits || {},
      military: {
        stationedUnits: Array.isArray(rawData.military?.stationed_units) 
          ? rawData.military.stationed_units.map((unitData: any) => {
              if (typeof unitData === 'string') {
                return { id: unitData, strength: Math.floor(Math.random() * 100) + 50 };
              } else if (unitData && typeof unitData === 'object') {
                return { 
                  id: unitData.id || 'unknown', 
                  strength: Number(unitData.strength) || 50 
                };
              } else {
                return { id: 'unknown', strength: 50 };
              }
            })
          : [],
        fortificationLevel: Number(rawData.military?.fortification_level || rawData.military?.fortificationLevel) || 1
      },
      resourceOutput: rawData.resource_output || rawData.resourceOutput || {},
      politics: {
        partySupport: rawData.politics?.party_support || rawData.politics?.partySupport || {},
        governorApproval: Number(rawData.politics?.governor_approval || rawData.politics?.governorApproval) || 50
      },
      economy: {
        gdpPerCapita: Number(rawData.economy?.gdp_per_capita || rawData.economy?.gdpPerCapita) || 0,
        unemployment: Number(rawData.economy?.unemployment) || 0,
        inflation: Number(rawData.economy?.inflation) || 0
      },
      buildings: Array.isArray(rawData.buildings) ? rawData.buildings : [],
      constructionProjects: Array.isArray(rawData.construction_projects || rawData.constructionProjects) 
        ? (rawData.construction_projects || rawData.constructionProjects) 
        : []
    };
  } catch (error) {
    console.error(`convertRawProvince: Error converting province ${id}:`, error);
    throw error;
  }
}

export interface WorldData {
  nations: Nation[];
  provinces: Province[];
  boundaries: Record<string, any>;
}

// Use import.meta.glob to dynamically load all region files from both root and regions subdirectories
const nationModules = import.meta.glob([
  '../data/nations_*.yaml',
  '../data/regions/**/nations_*.yaml',
  '../data/regions/*/nations_*.yaml'
], { as: 'raw' });

const provinceModules = import.meta.glob([
  '../data/provinces_*.yaml', 
  '../data/regions/**/provinces_*.yaml',
  '../data/regions/*/provinces_*.yaml'
], { as: 'raw' });

const boundariesModules = import.meta.glob([
  '../data/province-boundaries_*.json',
  '../data/regions/**/province-boundaries_*.json',
  '../data/regions/*/province-boundaries_*.json'
]);

export async function loadWorldData(): Promise<WorldData> {
  console.log('DataLoader: Starting world data loading...');
  console.log('DataLoader: Available files debug:');
  debugAvailableFiles();
  
  const nations: Nation[] = [];
  const provinces: Province[] = [];
  const boundaries: Record<string, any> = {};
  
  let totalNationFiles = 0;
  let successfulNationFiles = 0;
  let totalProvinceFiles = 0;
  let successfulProvinceFiles = 0;
  let totalBoundaryFiles = 0;
  let successfulBoundaryFiles = 0;

  try {
    // LOAD NATION FILES
    console.log('DataLoader: Loading nation files...');
    totalNationFiles = Object.keys(nationModules).length;
    console.log(`DataLoader: Found ${totalNationFiles} nation files to process`);
    
    for (const path in nationModules) {
      try {
        console.log(`DataLoader: Processing nation file: ${path}`);
        const rawContent = await nationModules[path]();
        
        if (!rawContent || typeof rawContent !== 'string' || rawContent.trim().length === 0) {
          console.warn(`DataLoader: Empty or invalid content in ${path}`);
          continue;
        }
        
        let parsedData: any;
        try {
          parsedData = yaml.load(rawContent);
        } catch (yamlError) {
          console.error(`DataLoader: YAML parsing failed for ${path}:`, yamlError);
          continue;
        }
        
        if (!parsedData || typeof parsedData !== 'object') {
          console.warn(`DataLoader: Parsed data is not an object in ${path}`);
          continue;
        }
        
        let nationsToAdd: Nation[] = [];
        
        // Handle different YAML structures
        if (parsedData.nations && typeof parsedData.nations === 'object') {
          // Standard structure: { nations: { CAN: {...}, USA: {...} } }
          nationsToAdd = Object.entries(parsedData.nations).map(([id, data]) => {
            try {
              return convertRawNation(id, data);
            } catch (conversionError) {
              console.error(`DataLoader: Failed to convert nation ${id}:`, conversionError);
              return null;
            }
          }).filter(Boolean) as Nation[];
        } else if (Array.isArray(parsedData)) {
          // Array structure: [{ id: "CAN", ... }, ...]
          nationsToAdd = parsedData.map((nationData: any, index: number) => {
            try {
              const id = nationData.id || nationData.name?.toLowerCase().replace(/\s+/g, '_') || `nation_${index}`;
              return convertRawNation(id, nationData);
            } catch (conversionError) {
              console.error(`DataLoader: Failed to convert nation at index ${index}:`, conversionError);
              return null;
            }
          }).filter(Boolean) as Nation[];
        } else if (parsedData.id || parsedData.name) {
          // Single nation object
          try {
            const id = parsedData.id || parsedData.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
            nationsToAdd = [convertRawNation(id, parsedData)];
          } catch (conversionError) {
            console.error(`DataLoader: Failed to convert single nation in ${path}:`, conversionError);
          }
        }
        
        if (nationsToAdd.length > 0) {
          nations.push(...nationsToAdd);
          successfulNationFiles++;
          console.log(`DataLoader: ✓ Successfully loaded ${nationsToAdd.length} nations from ${path}: ${nationsToAdd.map(n => n.id).join(', ')}`);
        } else {
          console.warn(`DataLoader: No valid nations found in ${path}`);
        }
        
      } catch (error) {
        console.error(`DataLoader: ❌ Critical error processing nation file ${path}:`, error);
      }
    }

    // LOAD PROVINCE FILES
    console.log('DataLoader: Loading province files...');
    totalProvinceFiles = Object.keys(provinceModules).length;
    console.log(`DataLoader: Found ${totalProvinceFiles} province files to process`);
    
    for (const path in provinceModules) {
      try {
        console.log(`DataLoader: Processing province file: ${path}`);
        const rawContent = await provinceModules[path]();
        
        if (!rawContent || typeof rawContent !== 'string' || rawContent.trim().length === 0) {
          console.warn(`DataLoader: Empty or invalid content in ${path}`);
          continue;
        }
        
        let parsedData: any;
        try {
          parsedData = yaml.load(rawContent);
        } catch (yamlError) {
          console.error(`DataLoader: YAML parsing failed for ${path}:`, yamlError);
          continue;
        }
        
        if (!parsedData || typeof parsedData !== 'object') {
          console.warn(`DataLoader: Parsed data is not an object in ${path}`);
          continue;
        }
        
        let provincesToAdd: Province[] = [];
        
        // Handle different YAML structures
        if (parsedData.provinces && typeof parsedData.provinces === 'object') {
          // Standard structure: { provinces: { CAN_001: {...}, CAN_002: {...} } }
          provincesToAdd = Object.entries(parsedData.provinces).map(([id, data]) => {
            try {
              return convertRawProvince(id, data);
            } catch (conversionError) {
              console.error(`DataLoader: Failed to convert province ${id}:`, conversionError);
              return null;
            }
          }).filter(Boolean) as Province[];
        } else if (Array.isArray(parsedData)) {
          // Array structure: [{ id: "CAN_001", ... }, ...]
          provincesToAdd = parsedData.map((provinceData: any, index: number) => {
            try {
              const id = provinceData.id || provinceData.name?.toLowerCase().replace(/\s+/g, '_') || `province_${index}`;
              return convertRawProvince(id, provinceData);
            } catch (conversionError) {
              console.error(`DataLoader: Failed to convert province at index ${index}:`, conversionError);
              return null;
            }
          }).filter(Boolean) as Province[];
        } else if (parsedData.id || parsedData.name) {
          // Single province object
          try {
            const id = parsedData.id || parsedData.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
            provincesToAdd = [convertRawProvince(id, parsedData)];
          } catch (conversionError) {
            console.error(`DataLoader: Failed to convert single province in ${path}:`, conversionError);
          }
        }
        
        if (provincesToAdd.length > 0) {
          provinces.push(...provincesToAdd);
          successfulProvinceFiles++;
          console.log(`DataLoader: ✓ Successfully loaded ${provincesToAdd.length} provinces from ${path}: ${provincesToAdd.slice(0, 3).map(p => p.id).join(', ')}${provincesToAdd.length > 3 ? '...' : ''}`);
        } else {
          console.warn(`DataLoader: No valid provinces found in ${path}`);
        }
        
      } catch (error) {
        console.error(`DataLoader: ❌ Critical error processing province file ${path}:`, error);
      }
    }

    // LOAD BOUNDARY FILES
    console.log('DataLoader: Loading boundary files...');
    totalBoundaryFiles = Object.keys(boundariesModules).length;
    console.log(`DataLoader: Found ${totalBoundaryFiles} boundary files to process`);
    
    for (const path in boundariesModules) {
      try {
        console.log(`DataLoader: Processing boundary file: ${path}`);
        const moduleResult = await boundariesModules[path]() as any;
        
        // Handle different boundary file structures
        let boundaryData = moduleResult.default || moduleResult;
        
        if (!boundaryData) {
          console.warn(`DataLoader: No boundary data found in ${path}`);
          continue;
        }
        
        if (boundaryData && boundaryData.type === 'FeatureCollection' && Array.isArray(boundaryData.features)) {
          // GeoJSON FeatureCollection format
          let featuresAdded = 0;
          boundaryData.features.forEach((feature: any) => {
            if (feature && feature.properties && feature.properties.id) {
              boundaries[feature.properties.id] = feature;
              featuresAdded++;
            }
          });
          if (featuresAdded > 0) {
            successfulBoundaryFiles++;
            console.log(`DataLoader: ✓ Successfully loaded ${featuresAdded} boundary features from ${path}`);
          } else {
            console.warn(`DataLoader: No valid features found in ${path}`);
          }
        } else if (boundaryData && typeof boundaryData === 'object') {
          // Direct object format
          const keysAdded = Object.keys(boundaryData).length;
          if (keysAdded > 0) {
            Object.assign(boundaries, boundaryData);
            successfulBoundaryFiles++;
            console.log(`DataLoader: ✓ Successfully loaded ${keysAdded} boundary objects from ${path}`);
          } else {
            console.warn(`DataLoader: Empty boundary object in ${path}`);
          }
        } else {
          console.warn(`DataLoader: Unsupported boundary format in ${path}, type: ${typeof boundaryData}`);
        }
        
      } catch (error) {
        console.error(`DataLoader: ❌ Critical error processing boundary file ${path}:`, error);
      }
    }

    // FINAL SUMMARY
    console.log(`\n=== DataLoader Summary ===`);
    console.log(`Nations: ${successfulNationFiles}/${totalNationFiles} files processed, ${nations.length} nations loaded`);
    console.log(`Provinces: ${successfulProvinceFiles}/${totalProvinceFiles} files processed, ${provinces.length} provinces loaded`);
    console.log(`Boundaries: ${successfulBoundaryFiles}/${totalBoundaryFiles} files processed, ${Object.keys(boundaries).length} boundaries loaded`);
    
    // Additional validation
    if (nations.length === 0) {
      console.warn('DataLoader: ⚠️ No nations loaded!');
    } else {
      console.log(`DataLoader: ✓ Loaded nations: ${nations.map(n => n.id).join(', ')}`);
    }
    
    if (provinces.length === 0) {
      console.warn('DataLoader: ⚠️ No provinces loaded!');
    } else {
      console.log(`DataLoader: ✓ Sample provinces: ${provinces.slice(0, 5).map(p => p.id).join(', ')}${provinces.length > 5 ? '...' : ''}`);
    }
    
    if (Object.keys(boundaries).length === 0) {
      console.warn('DataLoader: ⚠️ No boundaries loaded!');
    }

    return {
      nations,
      provinces,
      boundaries
    };
    
  } catch (error) {
    console.error('DataLoader: ❌ Critical error during world data loading:', error);
    throw error;
  }
}

// Helper function to get available region files
export function getAvailableRegions(): string[] {
  const nationPaths = Object.keys(nationModules);
  const provincePaths = Object.keys(provinceModules);
  const boundaryPaths = Object.keys(boundariesModules);
  
  // Extract region names from file paths
  const regions = new Set<string>();
  
  [...nationPaths, ...provincePaths, ...boundaryPaths].forEach(path => {
    const match = path.match(/.*?([a-z_]+)\.(?:yaml|json)$/);
    if (match && match[1]) {
      regions.add(match[1]);
    }
  });
  
  return Array.from(regions);
}

// Debug function to show what files are detected
export function debugAvailableFiles(): void {
  console.log('DataLoader Debug - Available files:');
  console.log('Nation files:', Object.keys(nationModules));
  console.log('Province files:', Object.keys(provinceModules));
  console.log('Boundary files:', Object.keys(boundariesModules));
  console.log('Detected regions:', getAvailableRegions());
}