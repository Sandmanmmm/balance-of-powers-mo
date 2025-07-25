import yaml from 'js-yaml';
import { Province, Nation, GameEvent, Unit, Technology } from './types';

// Import YAML files as text
import provincesYaml from '../data/provinces.yaml?raw';
import nationsYaml from '../data/nations.yaml?raw';
import eventsYaml from '../data/events.yaml?raw';
import unitsYaml from '../data/units.yaml?raw';
import technologiesYaml from '../data/technologies.yaml?raw';

// Define YAML data structure interfaces
interface ProvinceYamlData {
  provinces: Record<string, {
    name: string;
    country: string;
    coordinates: [number, number];
    population: {
      total: number;
      ethnic_groups: Array<{
        group: string;
        percent: number;
      }>;
    };
    unrest: number;
    infrastructure: {
      roads: number;
      internet: number;
      healthcare: number;
      education: number;
    };
    military: {
      stationed_units: string[];
      fortification_level: number;
    };
    resource_output: {
      energy: number;
      iron: number;
      food: number;
      technology: number;
    };
    politics: {
      party_support: Record<string, number>;
      governor_approval: number;
    };
    economy: {
      gdp_per_capita: number;
      unemployment: number;
      inflation: number;
    };
  }>;
}

interface NationYamlData {
  nations: Record<string, {
    name: string;
    capital: string;
    flag: string;
    government: {
      type: 'democracy' | 'authoritarian' | 'totalitarian' | 'theocracy';
      leader: string;
      approval: number;
      stability: number;
    };
    economy: {
      gdp: number;
      debt: number;
      inflation: number;
      trade_balance: number;
    };
    military: {
      manpower: number;
      equipment: number;
      doctrine: string;
      nuclear_capability: boolean;
    };
    technology: {
      research_points: number;
      current_research: string[];
      completed_tech: string[];
    };
    diplomacy: {
      allies: string[];
      enemies: string[];
      trade_partners: string[];
    };
  }>;
}

interface EventYamlData {
  events: Record<string, {
    type: 'political' | 'economic' | 'military' | 'natural' | 'technological';
    title: string;
    description: string;
    affected_provinces: string[];
    effects: Array<{
      target: string;
      property: string;
      change: number;
    }>;
    choices?: Array<{
      text: string;
      effects: Array<{
        target: string;
        property: string;
        change: number;
      }>;
    }>;
    duration?: number;
  }>;
}

// Additional interfaces for new data types

// Data loading with error handling
function loadYamlData<T>(yamlContent: string, dataName: string): T {
  try {
    return yaml.load(yamlContent) as T;
  } catch (error) {
    console.error(`Failed to parse ${dataName} YAML:`, error);
    throw new Error(`Invalid YAML structure in ${dataName}`);
  }
}

// Parse YAML data with error handling
const provincesData = loadYamlData<ProvinceYamlData>(provincesYaml, 'provinces');
const nationsData = loadYamlData<NationYamlData>(nationsYaml, 'nations');
const eventsData = loadYamlData<EventYamlData>(eventsYaml, 'events');

// Convert YAML data to TypeScript interfaces
function convertProvinces(): Province[] {
  return Object.entries(provincesData.provinces).map(([id, data]) => ({
    id,
    name: data.name,
    country: data.country,
    coordinates: data.coordinates,
    population: {
      total: data.population.total,
      ethnicGroups: data.population.ethnic_groups.map(group => ({
        group: group.group,
        percent: group.percent
      }))
    },
    unrest: data.unrest,
    infrastructure: data.infrastructure,
    military: {
      stationedUnits: data.military.stationed_units,
      fortificationLevel: data.military.fortification_level
    },
    resourceOutput: {
      energy: data.resource_output.energy,
      iron: data.resource_output.iron,
      food: data.resource_output.food,
      technology: data.resource_output.technology
    },
    politics: {
      partySupport: data.politics.party_support,
      governorApproval: data.politics.governor_approval
    },
    economy: {
      gdpPerCapita: data.economy.gdp_per_capita,
      unemployment: data.economy.unemployment,
      inflation: data.economy.inflation
    }
  }));
}

function convertNations(): Nation[] {
  return Object.entries(nationsData.nations).map(([id, data]) => ({
    id,
    name: data.name,
    capital: data.capital,
    flag: data.flag,
    government: data.government,
    economy: {
      gdp: data.economy.gdp,
      debt: data.economy.debt,
      inflation: data.economy.inflation,
      tradeBalance: data.economy.trade_balance
    },
    military: {
      manpower: data.military.manpower,
      equipment: data.military.equipment,
      doctrine: data.military.doctrine,
      nuclearCapability: data.military.nuclear_capability
    },
    technology: {
      researchPoints: data.technology.research_points,
      currentResearch: data.technology.current_research,
      completedTech: data.technology.completed_tech
    },
    diplomacy: {
      allies: data.diplomacy.allies,
      enemies: data.diplomacy.enemies,
      tradePartners: data.diplomacy.trade_partners
    }
  }));
}

function convertEvents(): GameEvent[] {
  return Object.entries(eventsData.events).map(([id, data]) => ({
    id,
    type: data.type,
    title: data.title,
    description: data.description,
    affectedProvinces: data.affected_provinces,
    effects: data.effects,
    choices: data.choices,
    triggerDate: new Date('2024-01-01'), // Default trigger date
    duration: data.duration
  }));
}

// Convert additional data types
function convertUnits(): Unit[] {
  try {
    const unitsData = loadYamlData<{ units: Record<string, any> }>(unitsYaml, 'units');
    return Object.entries(unitsData.units).map(([id, data]) => ({
      id,
      name: data.name,
      type: data.type,
      nation: data.nation,
      stationedProvince: data.stationed_province,
      strength: data.strength,
      equipmentLevel: data.equipment_level,
      experience: data.experience,
      morale: data.morale,
      maintenanceCost: data.maintenance_cost,
      unitType: data.unit_type,
      capabilities: data.capabilities,
      doctrine: data.doctrine,
      aircraftType: data.aircraft_type
    }));
  } catch (error) {
    console.warn('Failed to load units data:', error);
    return [];
  }
}

function convertTechnologies(): Technology[] {
  try {
    const techData = loadYamlData<{ technologies: Record<string, any> }>(technologiesYaml, 'technologies');
    return Object.entries(techData.technologies).map(([id, data]) => ({
      id,
      name: data.name,
      category: data.category,
      tier: data.tier,
      researchCost: data.research_cost,
      yearAvailable: data.year_available,
      prerequisites: data.prerequisites || [],
      description: data.description,
      effects: data.effects || [],
      unlocks: data.unlocks || [],
      restrictions: data.restrictions
    }));
  } catch (error) {
    console.warn('Failed to load technologies data:', error);
    return [];
  }
}

// Data validation and initialization
console.log('Initializing Balance of Powers game data...');

// Export the converted data
export const sampleProvinces: Province[] = convertProvinces();
export const sampleNations: Nation[] = convertNations();
export const sampleEvents: GameEvent[] = convertEvents();
export const gameUnits: Unit[] = convertUnits();
export const gameTechnologies: Technology[] = convertTechnologies();

// Log successful data loading
console.log(`Loaded ${sampleProvinces.length} provinces, ${sampleNations.length} nations, ${sampleEvents.length} events, ${gameUnits.length} units, ${gameTechnologies.length} technologies`);

// Export data access functions
export function getProvinceById(id: string): Province | undefined {
  return sampleProvinces.find(province => province.id === id);
}

export function getNationById(id: string): Nation | undefined {
  return sampleNations.find(nation => nation.id === id);
}

export function getProvincesByCountry(country: string): Province[] {
  return sampleProvinces.filter(province => province.country === country);
}

export function getEventById(id: string): GameEvent | undefined {
  return sampleEvents.find(event => event.id === id);
}

export function getUnitById(id: string): Unit | undefined {
  return gameUnits.find(unit => unit.id === id);
}

export function getUnitsByProvince(provinceId: string): Unit[] {
  return gameUnits.filter(unit => unit.stationedProvince === provinceId);
}

export function getTechnologyById(id: string): Technology | undefined {
  return gameTechnologies.find(tech => tech.id === id);
}

export function getTechnologiesByCategory(category: string): Technology[] {
  return gameTechnologies.filter(tech => tech.category === category);
}

export function getAvailableTechnologies(currentYear: number, completedTech: string[]): Technology[] {
  return gameTechnologies.filter(tech => 
    tech.yearAvailable <= currentYear && 
    !completedTech.includes(tech.id) &&
    tech.prerequisites.every(prereq => completedTech.includes(prereq))
  );
}

// Data validation functions
export function validateGameData(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate provinces
  if (sampleProvinces.length === 0) {
    errors.push('No provinces loaded');
  }

  // Validate nations
  if (sampleNations.length === 0) {
    errors.push('No nations loaded');
  }

  // Check that each province references a valid nation
  sampleProvinces.forEach(province => {
    if (!sampleNations.find(nation => nation.name === province.country)) {
      errors.push(`Province ${province.id} references unknown country: ${province.country}`);
    }
  });

  // Check that stationed units exist
  sampleProvinces.forEach(province => {
    province.military.stationedUnits.forEach(unitId => {
      if (!gameUnits.find(unit => unit.id === unitId)) {
        errors.push(`Province ${province.id} references unknown unit: ${unitId}`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
}