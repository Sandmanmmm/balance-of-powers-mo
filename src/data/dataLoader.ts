import yaml from 'js-yaml';
import { Province, Nation } from '../lib/types';

// Helper functions to convert raw YAML data to TypeScript interfaces
function convertRawNation(id: string, rawData: any): Nation {
  return {
    id,
    name: rawData.name || id,
    capital: rawData.capital || '',
    flag: rawData.flag || '',
    government: {
      type: rawData.government?.type || 'democracy',
      leader: rawData.government?.leader || 'Unknown',
      approval: rawData.government?.approval || 50,
      stability: rawData.government?.stability || 50
    },
    economy: {
      gdp: rawData.economy?.gdp || 0,
      debt: rawData.economy?.debt || 0,
      inflation: rawData.economy?.inflation || 0,
      tradeBalance: rawData.economy?.trade_balance || rawData.economy?.tradeBalance || 0,
      treasury: rawData.economy?.treasury || 0
    },
    military: {
      manpower: rawData.military?.manpower || 0,
      equipment: rawData.military?.equipment || 0,
      readiness: rawData.military?.readiness || 100,
      doctrine: rawData.military?.doctrine || 'Standard',
      nuclearCapability: rawData.military?.nuclear_capability || rawData.military?.nuclearCapability || false
    },
    technology: {
      researchPoints: rawData.technology?.researchPoints || rawData.technology?.research_points || 0,
      currentResearch: rawData.technology?.currentResearch || rawData.technology?.current_research || [],
      completedTech: rawData.technology?.completedTech || rawData.technology?.completed_tech || [],
      level: rawData.technology?.level || rawData.technology?.tech_level || 1.0
    },
    diplomacy: {
      allies: rawData.diplomacy?.allies || [],
      enemies: rawData.diplomacy?.enemies || [],
      embargoes: rawData.diplomacy?.embargoes || [],
      sanctions: rawData.diplomacy?.sanctions || [],
      tradePartners: rawData.diplomacy?.tradePartners || rawData.diplomacy?.trade_partners || []
    },
    resourceStockpiles: rawData.resourceStockpiles || rawData.resource_stockpiles || {},
    resourceProduction: rawData.resourceProduction || rawData.resource_production || {},
    resourceConsumption: rawData.resourceConsumption || rawData.resource_consumption || {},
    resourceShortages: rawData.resourceShortages || rawData.resource_shortages || {},
    resourceEfficiency: rawData.resourceEfficiency || rawData.resource_efficiency || { overall: 1.0 },
    tradeOffers: rawData.tradeOffers || rawData.trade_offers || [],
    tradeAgreements: rawData.tradeAgreements || rawData.trade_agreements || []
  };
}

function convertRawProvince(id: string, rawData: any): Province {
  return {
    id,
    name: rawData.name || id,
    country: rawData.country || 'Unknown',
    coordinates: rawData.coordinates || [0, 0] as [number, number],
    features: rawData.features || [],
    population: {
      total: rawData.population?.total || 0,
      ethnicGroups: (rawData.population?.ethnic_groups || []).map((group: any) => ({
        group: group.group || 'Unknown',
        percent: group.percent || 0
      }))
    },
    unrest: rawData.unrest || 0,
    infrastructure: {
      roads: rawData.infrastructure?.roads || 1,
      internet: rawData.infrastructure?.internet || 1,
      healthcare: rawData.infrastructure?.healthcare || 1,
      education: rawData.infrastructure?.education || 1
    },
    resourceDeposits: rawData.resource_deposits || rawData.resourceDeposits || {},
    military: {
      stationedUnits: (rawData.military?.stationed_units || []).map((unitData: any) => {
        if (typeof unitData === 'string') {
          return { id: unitData, strength: Math.floor(Math.random() * 100) + 50 };
        } else {
          return { id: unitData.id || 'unknown', strength: unitData.strength || 50 };
        }
      }),
      fortificationLevel: rawData.military?.fortification_level || rawData.military?.fortificationLevel || 1
    },
    resourceOutput: {
      energy: rawData.resource_output?.energy || rawData.resourceOutput?.energy || 0,
      iron: rawData.resource_output?.iron || rawData.resourceOutput?.iron || 0,
      food: rawData.resource_output?.food || rawData.resourceOutput?.food || 0,
      technology: rawData.resource_output?.technology || rawData.resourceOutput?.technology || 0
    },
    politics: {
      partySupport: rawData.politics?.party_support || rawData.politics?.partySupport || {},
      governorApproval: rawData.politics?.governor_approval || rawData.politics?.governorApproval || 50
    },
    economy: {
      gdpPerCapita: rawData.economy?.gdp_per_capita || rawData.economy?.gdpPerCapita || 0,
      unemployment: rawData.economy?.unemployment || 0,
      inflation: rawData.economy?.inflation || 0
    },
    buildings: rawData.buildings || [],
    constructionProjects: rawData.construction_projects || rawData.constructionProjects || []
  };
}

export interface WorldData {
  nations: Nation[];
  provinces: Province[];
  boundaries: Record<string, any>;
}

// Use import.meta.glob to dynamically load all region files from both root and regions subdirectories
const nationModules = import.meta.glob([
  '../data/nations_*.yaml',
  '../data/regions/**/nations_*.yaml'
], { as: 'raw' });

const provinceModules = import.meta.glob([
  '../data/provinces_*.yaml', 
  '../data/regions/**/provinces_*.yaml'
], { as: 'raw' });

const boundariesModules = import.meta.glob([
  '../data/province-boundaries_*.json',
  '../data/regions/**/province-boundaries_*.json'
]);

export async function loadWorldData(): Promise<WorldData> {
  console.log('DataLoader: Starting world data loading...');
  
  const nations: Nation[] = [];
  const provinces: Province[] = [];
  const boundaries: Record<string, any> = {};

  try {
    console.log('DataLoader: Loading nation files...');
    // Load all nation files
    for (const path in nationModules) {
      try {
        console.log(`DataLoader: Loading nation file: ${path}`);
        const raw = await nationModules[path]();
        const parsed = yaml.load(raw) as any;
        
        // Handle different YAML structures
        let nationsToAdd: any[] = [];
        
        if (parsed && typeof parsed === 'object') {
          if (parsed.nations) {
            // Handle structure like: { nations: { CAN: {...}, USA: {...} } }
            const nationsObj = parsed.nations;
            if (typeof nationsObj === 'object') {
              nationsToAdd = Object.entries(nationsObj).map(([id, data]) => 
                convertRawNation(id, data)
              );
            }
          } else if (Array.isArray(parsed)) {
            // Handle array structure: [{ id: "CAN", ... }, ...]
            nationsToAdd = parsed;
          } else {
            // Handle single nation object
            nationsToAdd = [parsed];
          }
        }
        
        nations.push(...nationsToAdd);
        console.log(`DataLoader: Successfully loaded ${nationsToAdd.length} nations from ${path}`);
      } catch (error) {
        console.error(`DataLoader: Error loading nation file ${path}:`, error);
      }
    }

    console.log('DataLoader: Loading province files...');
    // Load all province files
    for (const path in provinceModules) {
      try {
        console.log(`DataLoader: Loading province file: ${path}`);
        const raw = await provinceModules[path]();
        const parsed = yaml.load(raw) as any;
        
        // Handle different YAML structures
        let provincesToAdd: any[] = [];
        
        if (parsed && typeof parsed === 'object') {
          if (parsed.provinces) {
            // Handle structure like: { provinces: { CAN_001: {...}, CAN_002: {...} } }
            const provincesObj = parsed.provinces;
            if (typeof provincesObj === 'object') {
              provincesToAdd = Object.entries(provincesObj).map(([id, data]) => 
                convertRawProvince(id, data)
              );
            }
          } else if (Array.isArray(parsed)) {
            // Handle array structure: [{ id: "CAN_001", ... }, ...]
            provincesToAdd = parsed;
          } else {
            // Handle single province object
            provincesToAdd = [parsed];
          }
        }
        
        provinces.push(...provincesToAdd);
        console.log(`DataLoader: Successfully loaded ${provincesToAdd.length} provinces from ${path}`);
      } catch (error) {
        console.error(`DataLoader: Error loading province file ${path}:`, error);
      }
    }

    console.log('DataLoader: Loading boundary files...');
    // Load all boundary files
    for (const path in boundariesModules) {
      try {
        console.log(`DataLoader: Loading boundary file: ${path}`);
        const mod = await boundariesModules[path]() as any;
        
        // Handle different boundary file structures
        if (mod.default) {
          Object.assign(boundaries, mod.default);
        } else {
          Object.assign(boundaries, mod);
        }
        
        console.log(`DataLoader: Successfully loaded ${path}`);
      } catch (error) {
        console.error(`DataLoader: Error loading boundary file ${path}:`, error);
      }
    }

    console.log(`DataLoader: Finished loading world data. Nations: ${nations.length}, Provinces: ${provinces.length}, Boundaries: ${Object.keys(boundaries).length}`);
    
    // Validate the loaded data
    if (nations.length === 0) {
      console.warn('DataLoader: No nations loaded!');
    }
    
    if (provinces.length === 0) {
      console.warn('DataLoader: No provinces loaded!');
    }
    
    if (Object.keys(boundaries).length === 0) {
      console.warn('DataLoader: No boundaries loaded!');
    }

    return {
      nations,
      provinces,
      boundaries
    };
    
  } catch (error) {
    console.error('DataLoader: Critical error during world data loading:', error);
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