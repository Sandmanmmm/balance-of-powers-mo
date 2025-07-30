import { loadWorldData } from './dataLoader';
import { Nation, Province } from '../lib/types';
import yaml from 'js-yaml';

// Import static data files that don't change by region
import buildingsRaw from './buildings.yaml?raw';
import resourcesRaw from './resources.yaml?raw';
import eventsRaw from './events.yaml?raw';
import technologiesRaw from './technologies.yaml?raw';

/**
 * NEW BOUNDARY SYSTEM STRUCTURE
 * 
 * Country boundaries are now organized by detail level and ISO country codes:
 * 
 * /data/boundaries/{detailLevel}/{ISO_A3}.json
 * 
 * Examples:
 * - /data/boundaries/overview/USA.json
 * - /data/boundaries/detailed/CAN.json  
 * - /data/boundaries/ultra/CHN.json
 * 
 * Each file contains province-level boundaries for that country as:
 * Record<string, GeoJSONFeature>
 * 
 * Detail Levels:
 * - overview: Basic country shapes, good for world view
 * - detailed: More accurate boundaries with better coastlines  
 * - ultra: High-detail boundaries for close-up viewing
 * 
 * This structure allows:
 * 1. Loading only needed countries
 * 2. Progressive detail enhancement
 * 3. Efficient memory management
 * 4. Cleaner file organization
 */

// Re-export types for convenience
export type { Nation, Province };

export interface Building {
  id: string;
  name: string;
  description: string;
  category: string;
  cost: number;
  buildTime: number;
  requiresFeatures?: string[];
  produces?: Record<string, number>;
  consumes?: Record<string, number>;
  improves?: Record<string, number>;
  requirements?: Record<string, any>;
  icon?: string;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  category?: string;
  unit?: string;
  base_price?: number;
  storageLimit?: number;
  defaultValue?: number;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  trigger?: any;
  choices?: any[];
  effects?: any;
}

export interface Technology {
  id: string;
  name: string;
  description: string;
  category?: string;
  cost?: number;
  prerequisites?: string[];
  effects?: any;
}

// Game data cache with initialization tracking and memoization
let gameDataCache: {
  nations: Nation[];
  provinces: Province[];
  boundaries: Record<string, any>;
  buildings: Building[];
  resources: Resource[];
  events: GameEvent[];
  technologies: Technology[];
  isInitialized: boolean;
  loadingStats: {
    nationsFromRegions: number;
    provincesFromRegions: number;
    boundariesFromRegions: number;
    warnings: string[];
    loadTime: number;
  };
  cacheTimestamp: number;
} | null = null;

// Cache TTL for development (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Create resourcesData export for backward compatibility
let resourcesDataCache: Record<string, Resource> | null = null;

export const resourcesData: Record<string, Resource> = new Proxy({}, {
  get(target, prop: string) {
    if (!resourcesDataCache) {
      // Return empty object if not loaded yet
      return undefined;
    }
    return resourcesDataCache[prop];
  },
  ownKeys(target) {
    return resourcesDataCache ? Object.keys(resourcesDataCache) : [];
  },
  has(target, prop: string) {
    return resourcesDataCache ? prop in resourcesDataCache : false;
  }
});

/**
 * Main function to get all game data using the modular regions approach
 */
export async function getGameData() {
  // Check cache validity with TTL
  if (gameDataCache && gameDataCache.isInitialized) {
    const now = Date.now();
    const cacheAge = now - gameDataCache.cacheTimestamp;
    
    if (cacheAge < CACHE_TTL) {
      console.log(`GameData: Returning cached modular data (${(cacheAge / 1000).toFixed(1)}s old)`, {
        nations: gameDataCache.nations.length,
        provinces: gameDataCache.provinces.length,
        boundaries: Object.keys(gameDataCache.boundaries).length
      });
      return gameDataCache;
    } else {
      console.log('GameData: Cache expired, reloading...');
      gameDataCache = null;
    }
  }
  
  console.log('GameData: Loading fresh data using ONLY modular regions...');
  
  try {
    const startTime = performance.now();
    
    // Load world data using the bulletproof modular loader
    const worldData = await loadWorldData();
    
    // Load static data files
    const buildingsData = yaml.load(buildingsRaw) as { buildings: Building[] } || { buildings: [] };
    const buildings = buildingsData.buildings || [];
    const resourcesData = yaml.load(resourcesRaw) as { resources: Record<string, any> } || { resources: {} };
    const resources = Object.entries(resourcesData.resources || {}).map(([id, data]) => ({
      id,
      ...data
    })) as Resource[];
    const events = yaml.load(eventsRaw) as GameEvent[] || [];
    const technologies = yaml.load(technologiesRaw) as Technology[] || [];
    
    // Update resourcesData cache for backward compatibility
    const resourcesObj = resources.reduce((acc, resource) => {
      if (resource && resource.id) {
        acc[resource.id] = resource;
      }
      return acc;
    }, {} as Record<string, Resource>);
    resourcesDataCache = resourcesObj;
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Validate and warn about data source
    const regionsNationsCount = worldData.nations.length;
    const regionsProvincesCount = worldData.provinces.length;
    const regionsBoundariesCount = Object.keys(worldData.boundaries).length;
    
    console.log('=== MODULAR REGIONS DATA LOAD SUMMARY ===');
    console.log(`⏱️ Load Time: ${loadTime.toFixed(2)}ms`);
    console.log(`🏛️ Nations: ${regionsNationsCount} (from regions/)`);
    console.log(`🗺️ Provinces: ${regionsProvincesCount} (from regions/)`);
    console.log(`🌍 Boundaries: ${regionsBoundariesCount} (from regions/)`);
    console.log(`🏗️ Buildings: ${buildings.length} (from buildings.yaml)`);
    console.log(`📦 Resources: ${resources.length} (from resources.yaml)`);
    console.log(`📅 Events: ${events.length} (from events.yaml)`);
    console.log(`🔬 Technologies: ${technologies.length} (from technologies.yaml)`);
    console.log(`⚠️ Warnings: ${worldData.warnings.length}`);
    
    // Log any warnings
    if (worldData.warnings.length > 0) {
      console.log('=== DATA LOADING WARNINGS ===');
      worldData.warnings.forEach((warning, index) => {
        console.warn(`${index + 1}. ${warning}`);
      });
    }
    
    // Validate critical data
    if (regionsNationsCount === 0) {
      console.error('❌ CRITICAL: No nations loaded from regions!');
      throw new Error('No nations loaded from modular regions approach');
    }
    
    if (regionsProvincesCount === 0) {
      console.error('❌ CRITICAL: No provinces loaded from regions!');
      throw new Error('No provinces loaded from modular regions approach');
    }
    
    gameDataCache = {
      nations: worldData.nations,
      provinces: worldData.provinces,
      boundaries: worldData.boundaries,
      buildings,
      resources,
      events,
      technologies,
      isInitialized: true,
      cacheTimestamp: Date.now(),
      loadingStats: {
        nationsFromRegions: regionsNationsCount,
        provincesFromRegions: regionsProvincesCount,
        boundariesFromRegions: regionsBoundariesCount,
        warnings: worldData.warnings,
        loadTime
      }
    };
    
    // Success logging
    console.log('✅ GameData: Successfully cached modular regions data');
    
    // Debug specific countries
    const canada = worldData.nations.find(n => n.id === 'CAN');
    if (canada) {
      console.log('✅ Canada loaded from modular regions:', canada.name);
      const canadianProvinces = worldData.provinces.filter(p => p.country === 'Canada');
      console.log(`✅ ${canadianProvinces.length} Canadian provinces:`, canadianProvinces.map(p => p.name).slice(0, 5));
    } else {
      console.error('❌ Canada not found in modular regions data!');
    }
    
    return gameDataCache;
    
  } catch (error) {
    console.error('GameData: CRITICAL ERROR loading modular regions data:', error);
    
    // No fallback - force user to fix the modular regions approach
    throw new Error(`Failed to load modular regions data: ${error}. Please check your regions/ folder structure.`);
  }
}

/**
 * Clear cache function for development/debugging
 */
export function clearGameDataCache() {
  console.log('GameData: Clearing modular cache');
  gameDataCache = null;
}

/**
 * Get comprehensive system status
 */
export async function getSystemStatus() {
  const data = await getGameData();
  const validation = validateOnlyModularSources();
  
  return {
    dataLoaded: {
      nations: data.nations.length,
      provinces: data.provinces.length,
      boundaries: Object.keys(data.boundaries).length,
      buildings: data.buildings.length,
      resources: data.resources.length,
      events: data.events.length,
      technologies: data.technologies.length
    },
    modularValidation: validation,
    loadingStats: data.loadingStats,
    cacheInfo: {
      isInitialized: data.isInitialized,
      cacheAge: gameDataCache ? Date.now() - gameDataCache.cacheTimestamp : 0,
      cacheValid: validation.valid
    },
    sampleData: {
      nations: data.nations.slice(0, 3).map(n => ({ id: n.id, name: n.name })),
      provinces: data.provinces.slice(0, 5).map(p => ({ id: p.id, name: p.name, country: p.country }))
    }
  };
}

/**
 * Get initialization stats for debugging
 */
export function getLoadingStats() {
  return gameDataCache?.loadingStats || null;
}

/**
 * Check if any legacy data sources are being used (should always be false now)
 */
export function validateOnlyModularSources() {
  const stats = getLoadingStats();
  if (!stats) {
    return { valid: false, error: 'No data loaded yet' };
  }
  
  const allFromRegions = stats.nationsFromRegions > 0 && stats.provincesFromRegions > 0;
  
  return {
    valid: allFromRegions,
    stats: {
      nationsFromRegions: stats.nationsFromRegions,
      provincesFromRegions: stats.provincesFromRegions,
      boundariesFromRegions: stats.boundariesFromRegions,
      warnings: stats.warnings.length,
      loadTime: stats.loadTime
    },
    error: allFromRegions ? null : 'Some data not loaded from modular regions'
  };
}

// Convenience functions for individual data access
export async function getNations(): Promise<Nation[]> {
  const data = await getGameData();
  return data.nations;
}

export async function getProvinces(): Promise<Province[]> {
  const data = await getGameData();
  return data.provinces;
}

export async function getBoundaries() {
  const data = await getGameData();
  return data.boundaries;
}

export async function getBuildings() {
  const data = await getGameData();
  return data.buildings;
}

export async function getResources() {
  const data = await getGameData();
  return data.resources;
}

export async function getEvents() {
  const data = await getGameData();
  return data.events;
}

export async function getTechnologies() {
  const data = await getGameData();
  return data.technologies;
}

// Resource utility functions for backward compatibility
export function getResourceById(id: string): Resource | undefined {
  return resourcesDataCache?.[id];
}

export function getAllResources(): Resource[] {
  return resourcesDataCache ? Object.values(resourcesDataCache) : [];
}

export function getResourcesByCategory(category: string): Resource[] {
  return resourcesDataCache ? Object.values(resourcesDataCache).filter(resource => resource.category === category) : [];
}

// Specific lookup functions
export async function getNationById(id: string): Promise<Nation | undefined> {
  const nations = await getNations();
  return nations.find(nation => nation.id === id);
}

export async function getProvinceById(id: string): Promise<Province | undefined> {
  const provinces = await getProvinces();
  return provinces.find(province => province.id === id);
}

export async function getProvincesByCountry(country: string): Promise<Province[]> {
  const provinces = await getProvinces();
  return provinces.filter(province => province.country === country);
}

export async function getBuildingById(id: string): Promise<Building | undefined> {
  const buildings = await getBuildings();
  return buildings.find(building => building.id === id);
}

/**
 * Get available buildings for a province based on features and requirements
 */
export function getAvailableBuildings(
  province: Province, 
  nation: Nation, 
  completedTech: string[], 
  buildings: Building[]
): Building[] {
  if (!buildings || buildings.length === 0) {
    console.log('❌ No buildings provided to getAvailableBuildings');
    return [];
  }
  
  console.log(`🔍 Filtering ${buildings.length} buildings for province ${province.name} with features:`, province.features);
  console.log(`🏗️ Infrastructure level: ${province.infrastructure.roads}`);
  console.log(`🧪 Completed tech:`, completedTech);
  
  const filtered = buildings.filter((building, index) => {
    // Ensure we have all required data
    if (!building || !province) {
      console.log(`❌ Building ${index} or province is null/undefined`);
      return false;
    }
    
    console.log(`🔍 Checking building ${building.name} (${building.id})`);
    console.log(`  - RequiresFeatures:`, building.requiresFeatures);
    console.log(`  - Requirements:`, building.requirements);
    
    // Check feature requirements - Province must have AT LEAST ONE required feature
    if (building.requiresFeatures && Array.isArray(building.requiresFeatures) && building.requiresFeatures.length > 0) {
      const provinceFeatures = province.features || [];
      const hasAnyRequiredFeature = building.requiresFeatures.some(feature => 
        feature && provinceFeatures.includes(feature)
      );
      if (!hasAnyRequiredFeature) {
        console.log(`❌ Building ${building.name} filtered out - no matching features. Requires ANY of: [${building.requiresFeatures.join(', ')}], Province has: [${provinceFeatures.join(', ')}]`);
        return false;
      } else {
        console.log(`✅ Building ${building.name} passed feature check`);
      }
    } else {
      console.log(`✅ Building ${building.name} has no feature requirements (globally constructible)`);
    }
    // If no requiresFeatures or empty array, treat as globally constructible
    
    // Check basic requirements
    const provinceInfrastructure = province.infrastructure?.roads || 0;
    if (building.requirements?.infrastructure && provinceInfrastructure < building.requirements.infrastructure) {
      console.log(`❌ Building ${building.name} filtered out - insufficient infrastructure. Requires: ${building.requirements.infrastructure}, Province has: ${provinceInfrastructure}`);
      return false;
    } else if (building.requirements?.infrastructure) {
      console.log(`✅ Building ${building.name} passed infrastructure check - required: ${building.requirements.infrastructure}, has: ${provinceInfrastructure}`);
    }
    
    // Check technology requirements
    if (building.requirements?.technology && !(completedTech || []).includes(building.requirements.technology)) {
      console.log(`❌ Building ${building.name} filtered out - missing technology: ${building.requirements.technology}`);
      return false;
    } else if (building.requirements?.technology) {
      console.log(`✅ Building ${building.name} passed tech check`);
    }
    
    // Check special requirements (coastal, rural, etc.) - legacy support
    if (building.requirements?.coastal && !isCoastalProvince(province)) {
      console.log(`❌ Building ${building.name} filtered out - not coastal`);
      return false;
    }
    
    if (building.requirements?.rural && !isRuralProvince(province)) {
      console.log(`❌ Building ${building.name} filtered out - not rural`);
      return false;
    }
    
    console.log(`✅ Building ${building.name} passed ALL filters!`);
    return true;
  });
  
  console.log(`🎯 Filtered ${filtered.length} available buildings from ${buildings.length} total buildings for province ${province.name}`);
  console.log(`🎯 Available buildings:`, filtered.map(b => b.name));
  return filtered;
}

function isCoastalProvince(province: Province): boolean {
  // Simple heuristic - in a real game this would be in province data
  return (province.name && province.name.toLowerCase().includes('coast')) || 
         (province.name && province.name.toLowerCase().includes('port')) ||
         (province.id && province.id.includes('coastal')) ||
         (province.features && province.features.includes('coastal'));
}

function isRuralProvince(province: Province): boolean {
  // Simple heuristic - in a real game this would be in province data  
  return province.population.total < 5000000;
}

/**
 * Legacy compatibility wrapper function 
 */
export async function loadGameData(): Promise<{
  provinces: Province[];
  nations: Nation[];
  boundaries: any;
}> {
  console.log('loadGameData: Loading using modular regions approach...');
  
  const data = await getGameData();
  
  return {
    provinces: data.provinces,
    nations: data.nations,
    boundaries: data.boundaries || { features: [] }
  };
}