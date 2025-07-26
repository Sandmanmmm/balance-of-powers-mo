export interface Province {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number];
  features: string[]; // New: array of province features
  population: {
    total: number;
    ethnicGroups: Array<{
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
  resourceDeposits: Record<string, number>; // New: natural resource deposits
  military: {
    stationedUnits: Array<{
      id: string;
      strength: number;
    }>;
    fortificationLevel: number;
  };
  resourceOutput: {
    energy: number;
    iron: number;
    food: number;
    technology: number;
  };
  politics: {
    partySupport: Record<string, number>;
    governorApproval: number;
  };
  economy: {
    gdpPerCapita: number;
    unemployment: number;
    inflation: number;
  };
  buildings: ProvinceBuilding[];
  constructionProjects: ConstructionProject[];
}

export interface Nation {
  id: string;
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
    tradeBalance: number;
    treasury: number;
  };
  military: {
    manpower: number;
    equipment: number;
    doctrine: string;
    nuclearCapability: boolean;
  };
  technology: {
    researchPoints: number;
    currentResearch: string[];
    completedTech: string[];
    level: number;
  };
  diplomacy: {
    allies: string[];
    enemies: string[];
    tradePartners: string[];
  };
  resourceStockpiles: Record<string, number>; // New: national resource stockpiles
  resourceProduction: Record<string, number>; // New: per-tick production
  resourceConsumption: Record<string, number>; // New: per-tick consumption
}

export interface GameEvent {
  id: string;
  type: 'political' | 'economic' | 'military' | 'natural' | 'technological';
  title: string;
  description: string;
  affectedProvinces?: string[];
  effects: Array<{
    target: string;
    property: string;
    change: number;
    action?: string;
    value?: any;
  }>;
  choices?: Array<{
    text: string;
    effects: Array<{
      target: string;
      property: string;
      change: number;
      action?: string;
      value?: any;
    }>;
  }>;
  triggerConditions: Array<{
    type: string;
    target?: string;
    threshold?: number;
    probability?: number;
    value?: string;
    nations?: string[];
    status?: string;
  }>;
  duration?: number;
  frequency?: string;
}

export interface GameState {
  currentDate: Date;
  timeSpeed: number;
  isPaused: boolean;
  selectedProvince?: string;
  selectedNation: string;
  mapOverlay: 'none' | 'political' | 'economic' | 'military' | 'unrest' | 'resources';
  notifications: GameEvent[];
}

export interface Unit {
  id: string;
  name: string;
  type: string;
  nation: string;
  stationedProvince: string;
  strength: number;
  equipmentLevel: number;
  experience: number;
  morale: number;
  maintenanceCost: number;
  unitType: string;
  capabilities: string[];
  doctrine?: string;
  aircraftType?: string;
}

export interface Technology {
  id: string;
  name: string;
  category: string;
  tier: number;
  researchCost: number;
  yearAvailable: number;
  prerequisites: string[];
  description: string;
  effects: Array<{
    type: string;
    target?: string;
    value: number | boolean;
  }>;
  unlocks: string[];
  restrictions?: Array<{
    type: string;
    allowed?: string[];
  }>;
}

export interface Resource {
  id: string;
  name: string;
  category: 'strategic' | 'infrastructure' | 'industrial' | 'population' | 'knowledge' | 'economic' | 'basic' | 'technology';
  description: string;
  unit: string;
  base_price: number;
}

export interface Building {
  id: string;
  name: string;
  description: string;
  category: 'industrial' | 'military' | 'infrastructure' | 'research' | 'civilian' | 'energy' | 'agriculture' | 'tourism' | 'safety' | 'technology' | 'extraction' | 'environmental' | 'commercial' | 'aerospace';
  cost: number;
  buildTime: number; // in ticks
  produces: Record<string, number>; // New: resources produced per tick
  consumes: Record<string, number>; // New: resources consumed per tick
  improves: Record<string, number>; // New: legacy effects renamed
  requiresFeatures: string[]; // New: required province features
  requirements: Record<string, any>; // Existing infrastructure/tech requirements
  icon: string;
}

export interface ConstructionProject {
  id: string;
  buildingId: string;
  provinceId: string;
  startDate: Date;
  completionDate: Date;
  remainingTime: number; // in ticks
  cost: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ProvinceBuilding {
  buildingId: string;
  level: number;
  constructedDate: Date;
  effects: Record<string, number>;
}

export type MapOverlayType = GameState['mapOverlay'];