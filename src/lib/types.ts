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
  resourceOutput: Record<string, number>;
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
    readiness: number; // New: affected by resource shortages
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
    embargoes: string[]; // New: nations imposing embargoes on this nation
    sanctions: string[]; // New: nations under sanctions from this nation
  };
  resourceStockpiles: Record<string, number>; // National resource stockpiles
  resourceProduction: Record<string, number>; // Per-tick production
  resourceConsumption: Record<string, number>; // Per-tick consumption
  resourceShortages: Record<string, number>; // New: shortage severity (0-1)
  resourceEfficiency: Record<string, number>; // New: production efficiency modifiers
  tradeOffers: TradeOffer[]; // New: active trade offers from this nation
  tradeAgreements: TradeAgreement[]; // New: active trade agreements
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
  category: string;
  cost: number;
  buildTime: number; // in ticks
  produces?: Record<string, number>; // New: resources produced per tick
  consumes?: Record<string, number>; // New: resources consumed per tick
  improves?: Record<string, number>; // New: legacy effects renamed
  requiresFeatures?: string[]; // New: required province features
  requirements?: Record<string, any>; // Existing infrastructure/tech requirements
  icon?: string;
}

export interface ConstructionProject {
  id: string;
  buildingId: string;
  provinceId: string;
  startDate: string; // Changed from Date to string for serialization safety
  completionDate: string; // Changed from Date to string for serialization safety
  remainingTime: number; // in ticks
  cost: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ProvinceBuilding {
  buildingId: string;
  level: number;
  constructedDate: string; // Changed from Date to string for serialization safety
  effects: Record<string, number>;
  efficiency: number; // New: current operational efficiency (0-1)
}

export type MapOverlayType = GameState['mapOverlay'];

// Trade System Types
export interface TradeOffer {
  id: string;
  fromNation: string;
  toNation: string;
  offering: Record<string, number>; // resourceId -> amount
  requesting: Record<string, number>; // resourceId -> amount
  duration: number; // weeks
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdDate: string; // Changed from Date to string for serialization safety
  expiresDate: string; // Changed from Date to string for serialization safety
}

export interface TradeAgreement {
  id: string;
  nations: [string, string]; // two nation IDs
  terms: {
    [nationId: string]: {
      exports: Record<string, number>; // resourceId -> amount per week
      imports: Record<string, number>; // resourceId -> amount per week
    };
  };
  duration: number; // weeks remaining
  status: 'active' | 'suspended' | 'cancelled';
  startDate: string; // Changed from Date to string for serialization safety
  value: number; // economic value per week
}

export interface ResourceShortageEffect {
  resourceId: string;
  severity: number; // 0-1
  effects: {
    buildingEfficiency?: number; // modifier to building production
    militaryReadiness?: number; // modifier to military readiness
    provinceStability?: number; // modifier to province unrest
    populationGrowth?: number; // modifier to population growth
  };
}