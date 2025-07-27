import { Province, Nation, GameEvent, Unit, Technology, Building, Resource } from './types';
import { loadBuildingsFromYAML, loadProvincesFromYAML, loadNationsFromYAML } from './yamlLoader';

/**
 * Modular Regional Data Loader for Balance of Powers
 * 
 * This system organizes world data into manageable regional chunks:
 * - Superpowers (USA, Russia, China, India) get their own files
 * - Other regions are grouped geographically
 * 
 * Benefits:
 * - Smaller file sizes for better IDE performance
 * - Easier collaborative editing
 * - Regional expertise can be applied
 * - Selective loading capabilities for large maps
 */

// Define the regional structure
const REGIONAL_DATA_CONFIG = {
  superpowers: [
    { name: 'usa', nations: 'nations_usa.yaml', provinces: 'provinces_usa.yaml', boundaries: 'province-boundaries_usa.json' },
    { name: 'china', nations: 'nations_china.yaml', provinces: 'provinces_china.yaml', boundaries: 'province-boundaries_china.json' },
    { name: 'russia', nations: 'nations_russia.yaml', provinces: 'provinces_russia.yaml', boundaries: 'province-boundaries_russia.json' },
    { name: 'india', nations: 'nations_india.yaml', provinces: 'provinces_india.yaml', boundaries: 'province-boundaries_india.json' }
  ],
  regions: [
    { name: 'north_america', nations: 'nations_north_america.yaml', provinces: 'provinces_north_america.yaml', boundaries: 'province-boundaries_north_america.json' },
    { name: 'europe_west', nations: 'nations_europe_west.yaml', provinces: 'provinces_europe_west.yaml', boundaries: 'province-boundaries_europe_west.json' },
    { name: 'europe_east', nations: 'nations_europe_east.yaml', provinces: 'provinces_europe_east.yaml', boundaries: 'province-boundaries_europe_east.json' },
    { name: 'southeast_asia', nations: 'nations_southeast_asia.yaml', provinces: 'provinces_southeast_asia.yaml', boundaries: 'province-boundaries_southeast_asia.json' },
    { name: 'south_asia', nations: 'nations_south_asia.yaml', provinces: 'provinces_south_asia.yaml', boundaries: 'province-boundaries_south_asia.json' },
    { name: 'middle_east', nations: 'nations_middle_east.yaml', provinces: 'provinces_middle_east.yaml', boundaries: 'province-boundaries_middle_east.json' },
    { name: 'north_africa', nations: 'nations_north_africa.yaml', provinces: 'provinces_north_africa.yaml', boundaries: 'province-boundaries_north_africa.json' },
    { name: 'sub_saharan_africa', nations: 'nations_sub_saharan_africa.yaml', provinces: 'provinces_sub_saharan_africa.yaml', boundaries: 'province-boundaries_sub_saharan_africa.json' },
    { name: 'south_america', nations: 'nations_south_america.yaml', provinces: 'provinces_south_america.yaml', boundaries: 'province-boundaries_south_america.json' },
    { name: 'oceania', nations: 'nations_oceania.yaml', provinces: 'provinces_oceania.yaml', boundaries: 'province-boundaries_oceania.json' },
    { name: 'central_asia', nations: 'nations_central_asia.yaml', provinces: 'provinces_central_asia.yaml', boundaries: 'province-boundaries_central_asia.json' }
  ]
};

// Resource definitions
export const resourcesData: Record<string, Resource> = {
  oil: {
    id: 'oil',
    name: "Oil",
    category: "strategic",
    description: "Essential for military units and industrial production",
    unit: "barrels",
    base_price: 60
  },
  electricity: {
    id: 'electricity',
    name: "Electricity",
    category: "infrastructure",
    description: "Powers modern civilization and industry",
    unit: "MWh",
    base_price: 50
  },
  steel: {
    id: 'steel',
    name: "Steel",
    category: "industrial",
    description: "Critical for construction and military equipment",
    unit: "tons",
    base_price: 800
  },
  rare_earth: {
    id: 'rare_earth',
    name: "Rare Earth Elements",
    category: "strategic",
    description: "Essential for advanced technology and electronics",
    unit: "kg",
    base_price: 15000
  },
  manpower: {
    id: 'manpower',
    name: "Manpower",
    category: "population",
    description: "Available workforce for military and industry",
    unit: "people",
    base_price: 0
  },
  research: {
    id: 'research',
    name: "Research Points",
    category: "knowledge",
    description: "Scientific progress and technological advancement",
    unit: "points",
    base_price: 100
  },
  food: {
    id: 'food',
    name: "Food",
    category: "basic",
    description: "Essential for population sustenance and stability",
    unit: "tons",
    base_price: 500
  },
  water: {
    id: 'water',
    name: "Water",
    category: "basic",
    description: "Fundamental resource for all life and industry",
    unit: "million liters",
    base_price: 10
  },
  uranium: {
    id: 'uranium',
    name: "Uranium",
    category: "strategic",
    description: "Nuclear fuel and weapons material",
    unit: "kg",
    base_price: 45000
  },
  technology: {
    id: 'technology',
    name: "Technology",
    category: "knowledge",
    description: "Advanced manufacturing and innovation capacity",
    unit: "points",
    base_price: 1500
  }
};

// Cache for loaded data
let loadedNations: Nation[] | null = null;
let loadedProvinces: Province[] | null = null;
let loadedBoundaries: any | null = null;

// Clear cache function for debugging
export function clearDataCache() {
  loadedNations = null;
  loadedProvinces = null;
  loadedBoundaries = null;
  console.log('Data cache cleared');
}

/**
 * Loads nation data from all regional files
 */
async function loadAllNations(): Promise<Nation[]> {
  if (loadedNations) {
    return loadedNations;
  }

  console.log('Loading nations from modular regional files...');
  const allNations: Nation[] = [];

  // Load superpowers
  for (const region of REGIONAL_DATA_CONFIG.superpowers) {
    try {
      console.log(`Attempting to load nations from superpowers/${region.nations}`);
      const nationsYaml = await import(`../data/regions/superpowers/${region.nations}?raw`);
      const nationData = await loadNationsFromYAML(nationsYaml.default);
      allNations.push(...nationData);
      console.log(`✓ Loaded ${nationData.length} nations from ${region.name}`);
    } catch (error) {
      console.warn(`⚠ Could not load nations from ${region.name}:`, error);
    }
  }

  // Load regional nations  
  for (const region of REGIONAL_DATA_CONFIG.regions) {
    try {
      console.log(`Attempting to load nations from ${region.name}/${region.nations}`);
      const nationsYaml = await import(`../data/regions/${region.name}/${region.nations}?raw`);
      const nationData = await loadNationsFromYAML(nationsYaml.default);
      allNations.push(...nationData);
      console.log(`✓ Loaded ${nationData.length} nations from ${region.name}`);
    } catch (error) {
      console.warn(`⚠ Could not load nations from ${region.name}:`, error);
      console.error('Full error:', error);
    }
  }

  loadedNations = allNations;
  console.log(`Total nations loaded: ${allNations.length}`);
  return allNations;
}

/**
 * Loads province data from all regional files
 */
async function loadAllProvinces(): Promise<Province[]> {
  if (loadedProvinces) {
    return loadedProvinces;
  }

  console.log('Loading provinces from modular regional files...');
  const allProvinces: Province[] = [];

  // Load superpower provinces
  for (const region of REGIONAL_DATA_CONFIG.superpowers) {
    try {
      console.log(`Attempting to load provinces from superpowers/${region.provinces}`);
      const provincesYaml = await import(`../data/regions/superpowers/${region.provinces}?raw`);
      const provinceData = await loadProvincesFromYAML(provincesYaml.default);
      allProvinces.push(...provinceData);
      console.log(`✓ Loaded ${provinceData.length} provinces from ${region.name}`);
    } catch (error) {
      console.warn(`⚠ Could not load provinces from ${region.name}:`, error);
      console.error('Full error:', error);
    }
  }

  // Load regional provinces
  for (const region of REGIONAL_DATA_CONFIG.regions) {
    try {
      console.log(`Attempting to load provinces from ${region.name}/${region.provinces}`);
      const provincesYaml = await import(`../data/regions/${region.name}/${region.provinces}?raw`);
      const provinceData = await loadProvincesFromYAML(provincesYaml.default);
      allProvinces.push(...provinceData);
      console.log(`✓ Loaded ${provinceData.length} provinces from ${region.name}`);
    } catch (error) {
      console.warn(`⚠ Could not load provinces from ${region.name}:`, error);
      console.error('Full error:', error);
    }
  }

  loadedProvinces = allProvinces;
  console.log(`Total provinces loaded: ${allProvinces.length}`);
  return allProvinces;
}

/**
 * Loads province boundary data from all regional files
 */
async function loadAllBoundaries(): Promise<any> {
  if (loadedBoundaries) {
    return loadedBoundaries;
  }

  console.log('Loading province boundaries from modular regional files...');
  const allFeatures: any[] = [];

  // Load superpower boundaries
  for (const region of REGIONAL_DATA_CONFIG.superpowers) {
    try {
      const boundariesJson = await import(`../data/regions/superpowers/${region.boundaries}?raw`);
      const boundaryData = JSON.parse(boundariesJson.default);
      if (boundaryData.features) {
        allFeatures.push(...boundaryData.features);
        console.log(`✓ Loaded ${boundaryData.features.length} boundaries from ${region.name}`);
      }
    } catch (error) {
      console.warn(`⚠ Could not load boundaries from ${region.name}:`, error);
    }
  }

  // Load regional boundaries
  for (const region of REGIONAL_DATA_CONFIG.regions) {
    try {
      const boundariesJson = await import(`../data/regions/${region.name}/${region.boundaries}?raw`);
      const boundaryData = JSON.parse(boundariesJson.default);
      if (boundaryData.features) {
        allFeatures.push(...boundaryData.features);
        console.log(`✓ Loaded ${boundaryData.features.length} boundaries from ${region.name}`);
      }
    } catch (error) {
      console.warn(`⚠ Could not load boundaries from ${region.name}:`, error);
    }
  }

  loadedBoundaries = {
    type: "FeatureCollection",
    features: allFeatures
  };

  console.log(`Total boundary features loaded: ${allFeatures.length}`);
  return loadedBoundaries;
}

// Fallback to legacy data if modular data fails
async function loadLegacyData(): Promise<{ nations: Nation[], provinces: Province[], boundaries: any }> {
  console.log('Loading legacy data as fallback...');
  
  try {
    // Load legacy nations
    const nationsYaml = await import('../data/nations.yaml?raw');
    const nations = await loadNationsFromYAML(nationsYaml.default);

    // Load legacy provinces  
    const provincesYaml = await import('../data/provinces.yaml?raw');
    const provinces = await loadProvincesFromYAML(provincesYaml.default);

    // Load legacy boundaries
    const boundariesJson = await import('../data/province-boundaries.json?raw');
    const boundaries = JSON.parse(boundariesJson.default);

    console.log('✓ Legacy data loaded successfully');
    console.log(`✓ Nations: ${nations.length}, Provinces: ${provinces.length}, Boundaries: ${boundaries.features?.length || 0}`);
    return { nations, provinces, boundaries };
  } catch (error) {
    console.error('Failed to load legacy data:', error);
    throw error;
  }
}

/**
 * Main data loading function - tries modular first, falls back to legacy
 */
export async function loadGameData() {
  console.log('Starting game data load...');
  
  try {
    // Try loading modular data first
    console.log('Attempting to load modular regional data...');
    const [nations, provinces, boundaries] = await Promise.all([
      loadAllNations(),
      loadAllProvinces(), 
      loadAllBoundaries()
    ]);

    // Validate we have some data
    if (nations.length === 0 && provinces.length === 0) {
      throw new Error('No modular data found, falling back to legacy');
    }

    console.log('✓ Modular data loading completed successfully');
    return { nations, provinces, boundaries };

  } catch (error) {
    console.warn('Modular data loading failed, trying legacy fallback:', error);
    return await loadLegacyData();
  }
}

// Load shared game data files (these remain centralized)
export async function loadBuildingsData(): Promise<Building[]> {
  const buildingsYaml = await import('../data/buildings.yaml?raw');
  return await loadBuildingsFromYAML(buildingsYaml.default);
}

export async function loadEventsData(): Promise<GameEvent[]> {
  // Events data loader - placeholder for now
  return [];
}

export async function loadTechnologiesData(): Promise<Technology[]> {
  // Technologies data loader - placeholder for now  
  return [];
}

export async function loadUnitsData(): Promise<Unit[]> {
  // Units data loader - placeholder for now
  return [];
}

// Export everything for backward compatibility
export {
  loadAllNations as loadNations,
  loadAllProvinces as loadProvinces,
  loadAllBoundaries as loadBoundaries
};