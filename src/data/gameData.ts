import { loadWorldData } from './dataLoader';
import { Nation, Province } from '../lib/types';
import yaml from 'js-yaml';

// Import static data files that don't change by region
import buildingsRaw from './buildings.yaml?raw';
import resourcesRaw from './resources.yaml?raw';

// Re-export types for convenience
export type { Nation, Province };

export interface Building {
  id: string;
  name: string;
  cost: number;
  buildTime: number;
  requiresFeatures?: string[];
  produces?: Record<string, number>;
  consumes?: Record<string, number>;
  improves?: Record<string, number>;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  storageLimit?: number;
  defaultValue?: number;
}

// Initialize game data
let gameDataCache: {
  nations: Nation[];
  provinces: Province[];
  boundaries: Record<string, any>;
  buildings: Building[];
  resources: Resource[];
} | null = null;

export async function getGameData() {
  if (gameDataCache) {
    console.log('GameData: Returning cached data');
    return gameDataCache;
  }
  
  console.log('GameData: Loading fresh data using modular loader...');
  
  try {
    // Load world data using the modular loader
    const worldData = await loadWorldData();
    
    // Load static data files
    const buildings = yaml.load(buildingsRaw) as Building[] || [];
    const resources = yaml.load(resourcesRaw) as Resource[] || [];
    
    gameDataCache = {
      nations: worldData.nations,
      provinces: worldData.provinces,
      boundaries: worldData.boundaries,
      buildings,
      resources
    };
    
    console.log('GameData: Successfully cached modular data:', {
      nations: gameDataCache.nations.length,
      provinces: gameDataCache.provinces.length,
      boundaries: Object.keys(gameDataCache.boundaries).length,
      buildings: gameDataCache.buildings.length,
      resources: gameDataCache.resources.length
    });
    
    return gameDataCache;
    
  } catch (error) {
    console.error('GameData: Critical error loading modular data:', error);
    
    // Return minimal fallback data
    gameDataCache = {
      nations: [],
      provinces: [],
      boundaries: {},
      buildings: [],
      resources: []
    };
    
    return gameDataCache;
  }
}

// Clear cache function for development/debugging
export function clearGameDataCache() {
  console.log('GameData: Clearing cache');
  gameDataCache = null;
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