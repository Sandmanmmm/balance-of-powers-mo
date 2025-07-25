import { Province, Nation, GameEvent, Unit, Technology } from './types';

// Define inline data instead of loading from YAML files for now
// This will be replaced with proper YAML loading once the import issues are resolved

const provincesData = {
  provinces: {
    "GER_001": {
      name: "Lower Saxony",
      country: "Germany",
      coordinates: [52.6367, 9.8451],
      population: {
        total: 7800000,
        ethnic_groups: [
          { group: "German", percent: 93 },
          { group: "Turkish", percent: 5 },
          { group: "Other", percent: 2 }
        ]
      },
      unrest: 4.2,
      infrastructure: {
        roads: 3,
        internet: 4,
        healthcare: 4,
        education: 4
      },
      military: {
        stationed_units: ["GER_INF_4", "GER_LOG_2"],
        fortification_level: 2
      },
      resource_output: {
        energy: 1400,
        iron: 230,
        food: 850,
        technology: 180
      },
      politics: {
        party_support: {
          "Social Democrats": 28.5,
          "Christian Democrats": 24.3,
          "Greens": 23.3,
          "Free Democrats": 9.2,
          "Nationalists": 14.7
        },
        governor_approval: 67.3
      },
      economy: {
        gdp_per_capita: 42000,
        unemployment: 5.1,
        inflation: 2.8
      }
    },
    "USA_001": {
      name: "California",
      country: "United States",
      coordinates: [36.7783, -119.4179],
      population: {
        total: 39500000,
        ethnic_groups: [
          { group: "White", percent: 36.5 },
          { group: "Hispanic", percent: 39.4 },
          { group: "Asian", percent: 15.5 },
          { group: "Black", percent: 6.5 },
          { group: "Other", percent: 2.1 }
        ]
      },
      unrest: 6.8,
      infrastructure: {
        roads: 3,
        internet: 5,
        healthcare: 3,
        education: 4
      },
      military: {
        stationed_units: ["USA_MAR_1", "USA_AF_12", "USA_NAVY_PAC_3"],
        fortification_level: 3
      },
      resource_output: {
        energy: 2100,
        iron: 45,
        food: 1850,
        technology: 1250
      },
      politics: {
        party_support: {
          "Democrats": 62.1,
          "Republicans": 31.2,
          "Green Party": 4.1,
          "Libertarian": 2.6
        },
        governor_approval: 54.7
      },
      economy: {
        gdp_per_capita: 75000,
        unemployment: 7.3,
        inflation: 4.2
      }
    },
    "CHN_001": {
      name: "Guangdong",
      country: "China",
      coordinates: [23.3417, 113.4244],
      population: {
        total: 126000000,
        ethnic_groups: [
          { group: "Han Chinese", percent: 97.8 },
          { group: "Zhuang", percent: 1.2 },
          { group: "Other", percent: 1.0 }
        ]
      },
      unrest: 2.1,
      infrastructure: {
        roads: 4,
        internet: 4,
        healthcare: 3,
        education: 3
      },
      military: {
        stationed_units: ["CHN_INF_7", "CHN_INF_8", "CHN_MISSILE_1"],
        fortification_level: 2
      },
      resource_output: {
        energy: 1800,
        iron: 340,
        food: 950,
        technology: 890
      },
      politics: {
        party_support: {
          "Communist Party": 89.4,
          "Independent": 10.6
        },
        governor_approval: 78.2
      },
      economy: {
        gdp_per_capita: 28000,
        unemployment: 3.8,
        inflation: 1.9
      }
    },
    "GER_002": {
      name: "Bavaria",
      country: "Germany",
      coordinates: [48.7904, 11.4979],
      population: {
        total: 13200000,
        ethnic_groups: [
          { group: "German", percent: 91.2 },
          { group: "Turkish", percent: 3.8 },
          { group: "Austrian", percent: 2.1 },
          { group: "Other", percent: 2.9 }
        ]
      },
      unrest: 3.7,
      infrastructure: {
        roads: 4,
        internet: 4,
        healthcare: 5,
        education: 5
      },
      military: {
        stationed_units: ["GER_INF_2", "GER_AIR_1"],
        fortification_level: 1
      },
      resource_output: {
        energy: 980,
        iron: 120,
        food: 1200,
        technology: 340
      },
      politics: {
        party_support: {
          "Christian Democrats": 35.2,
          "Social Democrats": 22.1,
          "Greens": 18.7,
          "Free Democrats": 12.3,
          "Nationalists": 11.7
        },
        governor_approval: 71.8
      },
      economy: {
        gdp_per_capita: 48000,
        unemployment: 3.9,
        inflation: 2.6
      }
    },
    "USA_002": {
      name: "Texas",
      country: "United States",
      coordinates: [31.9686, -99.9018],
      population: {
        total: 30000000,
        ethnic_groups: [
          { group: "White", percent: 41.2 },
          { group: "Hispanic", percent: 40.2 },
          { group: "Black", percent: 12.9 },
          { group: "Asian", percent: 4.9 },
          { group: "Other", percent: 0.8 }
        ]
      },
      unrest: 5.3,
      infrastructure: {
        roads: 2,
        internet: 3,
        healthcare: 2,
        education: 3
      },
      military: {
        stationed_units: ["USA_INF_5", "USA_AF_7", "USA_BORDER_1"],
        fortification_level: 2
      },
      resource_output: {
        energy: 3200,
        iron: 180,
        food: 2100,
        technology: 420
      },
      politics: {
        party_support: {
          "Republicans": 52.7,
          "Democrats": 43.8,
          "Libertarian": 2.1,
          "Green Party": 1.4
        },
        governor_approval: 49.2
      },
      economy: {
        gdp_per_capita: 62000,
        unemployment: 4.1,
        inflation: 3.8
      }
    }
  }
};

const nationsData = {
  nations: {
    "GER": {
      name: "Germany",
      capital: "Berlin",
      flag: "🇩🇪",
      government: {
        type: "democracy" as const,
        leader: "Olaf Scholz",
        approval: 45.2,
        stability: 82.1,
        ruling_party: "Social Democrats",
        ideology: "Social Democracy",
        election_cycle: 4,
        last_election: "2021-09-26"
      },
      economy: {
        gdp: 4200000000000,
        debt: 2800000000000,
        inflation: 2.8,
        trade_balance: 285000000000,
        currency: "EUR",
        interest_rate: 2.1,
        sectors: {
          manufacturing: 23.2,
          services: 69.1,
          agriculture: 0.9,
          technology: 6.8
        }
      },
      military: {
        manpower: 184000,
        equipment: 78,
        doctrine: "Modern Combined Arms",
        nuclear_capability: false,
        military_spending_gdp: 1.53,
        conscription: false,
        reserve_forces: 30000
      },
      technology: {
        research_points: 1250,
        current_research: ["Green Energy", "AI Systems", "Advanced Manufacturing"],
        completed_tech: ["Internet", "Renewable Energy", "Precision Manufacturing", "Industrial Automation", "Nuclear Power"],
        tech_level: 8.5,
        research_spending_gdp: 3.1
      },
      diplomacy: {
        allies: ["USA", "FRA", "GBR", "ITA", "POL"],
        enemies: [],
        trade_partners: ["USA", "CHN", "FRA", "ITA", "GBR", "NLD", "AUT"],
        international_relations: {
          EU: "member",
          NATO: "member",
          UN_Security_Council: false
        }
      },
      provinces: ["GER_001", "GER_002"],
      demographics: {
        population: 83200000,
        median_age: 47.8,
        birth_rate: 1.59,
        life_expectancy: 81.2,
        literacy_rate: 99.0,
        urbanization: 77.5
      }
    },
    "USA": {
      name: "United States",
      capital: "Washington D.C.",
      flag: "🇺🇸",
      government: {
        type: "democracy" as const,
        leader: "Joe Biden",
        approval: 42.8,
        stability: 68.5,
        ruling_party: "Democrats",
        ideology: "Liberal Democracy",
        election_cycle: 4,
        last_election: "2020-11-03"
      },
      economy: {
        gdp: 25400000000000,
        debt: 31400000000000,
        inflation: 4.2,
        trade_balance: -945000000000,
        currency: "USD",
        interest_rate: 5.25,
        sectors: {
          manufacturing: 12.1,
          services: 80.2,
          agriculture: 0.9,
          technology: 6.8
        }
      },
      military: {
        manpower: 1400000,
        equipment: 95,
        doctrine: "Global Force Projection",
        nuclear_capability: true,
        military_spending_gdp: 3.5,
        conscription: false,
        reserve_forces: 800000,
        nuclear_warheads: 5550
      },
      technology: {
        research_points: 4850,
        current_research: ["Quantum Computing", "Space Technology", "Biotechnology", "Advanced AI", "Hypersonic Weapons"],
        completed_tech: ["Internet", "GPS", "Stealth Technology", "Nuclear Technology", "Satellite Communications", "Advanced Semiconductors"],
        tech_level: 9.2,
        research_spending_gdp: 3.4
      },
      diplomacy: {
        allies: ["GER", "FRA", "GBR", "JPN", "KOR", "AUS", "CAN"],
        enemies: ["CHN", "RUS", "IRN", "PRK"],
        trade_partners: ["CHN", "MEX", "CAN", "GER", "JPN", "GBR", "KOR"],
        international_relations: {
          EU: "partner",
          NATO: "founding_member",
          UN_Security_Council: true
        }
      },
      provinces: ["USA_001", "USA_002"],
      demographics: {
        population: 333000000,
        median_age: 38.5,
        birth_rate: 1.7,
        life_expectancy: 78.9,
        literacy_rate: 99.0,
        urbanization: 82.7
      }
    }
  }
};

// Convert data to TypeScript interfaces
function convertProvinces(): Province[] {
  return Object.entries(provincesData.provinces).map(([id, data]) => ({
    id,
    name: data.name,
    country: data.country,
    coordinates: data.coordinates as [number, number],
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
      stationedUnits: data.military.stationed_units.map(unitId => ({
        id: unitId,
        strength: Math.floor(Math.random() * 100) + 50 // Random strength 50-150
      })),
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
      completedTech: data.technology.completed_tech,
      level: data.technology.tech_level
    },
    diplomacy: {
      allies: data.diplomacy.allies,
      enemies: data.diplomacy.enemies,
      tradePartners: data.diplomacy.trade_partners
    }
  }));
}

function convertEvents(): GameEvent[] {
  const eventData = [
    {
      id: "EVENT_001",
      type: "economic" as const,
      title: "Tech Sector Boom",
      description: "A breakthrough in quantum computing has sparked massive investment in the technology sector, attracting global talent and capital.",
      affectedProvinces: ["USA_001"],
      effects: [
        { target: "USA_001", property: "economy.gdp_per_capita", change: 2500 },
        { target: "USA_001", property: "resource_output.technology", change: 200 },
        { target: "USA_001", property: "unrest", change: -0.5 }
      ],
      triggerConditions: [
        { type: "tech_level", target: "USA", threshold: 9.0 },
        { type: "random", probability: 0.15 }
      ],
      duration: 90,
      frequency: "rare"
    },
    {
      id: "EVENT_002",
      type: "political" as const,
      title: "Environmental Protests",
      description: "Large-scale climate protests sweep across major cities, demanding immediate action on carbon emissions and renewable energy transition.",
      affectedProvinces: ["GER_001", "GER_002"],
      effects: [
        { target: "GER_001", property: "unrest", change: 2.5 },
        { target: "GER_002", property: "unrest", change: 1.8 }
      ],
      triggerConditions: [
        { type: "season", value: "spring" },
        { type: "province_unrest", target: "GER_001", threshold: 3.0 }
      ],
      duration: 30,
      frequency: "common"
    },
    {
      id: "EVENT_003",
      type: "military" as const,
      title: "Joint Military Exercise",
      description: "NATO allies conduct large-scale joint military exercises, testing new equipment and coordination protocols.",
      affectedProvinces: ["GER_001", "USA_002"],
      effects: [
        { target: "GER", property: "military.equipment", change: 5 },
        { target: "USA", property: "military.equipment", change: 3 }
      ],
      triggerConditions: [
        { type: "diplomatic_status", nations: ["GER", "USA"], status: "allied" },
        { type: "random", probability: 0.25 }
      ],
      duration: 14,
      frequency: "uncommon"
    },
    {
      id: "EVENT_004",
      type: "economic" as const,
      title: "Energy Crisis",
      description: "Global energy prices spike due to supply chain disruptions and geopolitical tensions, affecting industrial production.",
      affectedProvinces: ["GER_001", "GER_002", "USA_002"],
      effects: [
        { target: "GER_001", property: "economy.inflation", change: 1.8 },
        { target: "GER_002", property: "economy.inflation", change: 1.5 },
        { target: "USA_002", property: "economy.inflation", change: 2.1 }
      ],
      triggerConditions: [
        { type: "random", probability: 0.1 }
      ],
      duration: 120,
      frequency: "uncommon"
    }
  ];

  return eventData.map(event => ({
    id: event.id,
    type: event.type,
    title: event.title,
    description: event.description,
    affectedProvinces: event.affectedProvinces,
    effects: event.effects,
    triggerConditions: event.triggerConditions,
    duration: event.duration,
    frequency: event.frequency
  }));
}

// Convert additional data types
function convertUnits(): Unit[] {
  // For now, return empty units array 
  return [];
}

function convertTechnologies(): Technology[] {
  const techData = [
    {
      id: "internet",
      name: "Internet Infrastructure",
      category: "computing",
      tier: 1,
      researchCost: 500,
      yearAvailable: 1990,
      prerequisites: [],
      description: "Global network communication infrastructure enabling data exchange and connectivity.",
      effects: [
        { type: "province_modifier", target: "infrastructure.internet", value: 1 },
        { type: "research_speed", value: 0.05 }
      ],
      unlocks: ["advanced_computing", "digital_communications"]
    },
    {
      id: "advanced_computing",
      name: "Advanced Computing",
      category: "computing",
      tier: 2,
      researchCost: 800,
      yearAvailable: 1995,
      prerequisites: ["internet"],
      description: "High-performance computing systems and advanced processors.",
      effects: [
        { type: "resource_output", target: "technology", value: 50 },
        { type: "research_speed", value: 0.1 }
      ],
      unlocks: ["ai_systems", "quantum_computing"]
    },
    {
      id: "ai_systems",
      name: "AI Systems",
      category: "computing",
      tier: 3,
      researchCost: 1200,
      yearAvailable: 2000,
      prerequisites: ["advanced_computing"],
      description: "Artificial intelligence systems for automation and decision support.",
      effects: [
        { type: "resource_output", target: "technology", value: 100 },
        { type: "military_efficiency", value: 0.15 },
        { type: "economic_efficiency", value: 0.08 }
      ],
      unlocks: ["machine_learning", "autonomous_systems"]
    },
    {
      id: "renewable_energy",
      name: "Renewable Energy",
      category: "energy",
      tier: 1,
      researchCost: 600,
      yearAvailable: 1990,
      prerequisites: [],
      description: "Solar, wind, and other renewable energy sources.",
      effects: [
        { type: "resource_output", target: "energy", value: 100 },
        { type: "environmental_impact", value: -0.2 }
      ],
      unlocks: ["advanced_solar", "wind_technology"]
    },
    {
      id: "green_energy",
      name: "Green Energy",
      category: "energy",
      tier: 2,
      researchCost: 900,
      yearAvailable: 2000,
      prerequisites: ["renewable_energy"],
      description: "Efficient and environmentally friendly energy systems.",
      effects: [
        { type: "resource_output", target: "energy", value: 200 },
        { type: "environmental_impact", value: -0.4 },
        { type: "public_approval", value: 0.05 }
      ],
      unlocks: ["fusion_power", "energy_storage"]
    },
    {
      id: "precision_manufacturing",
      name: "Precision Manufacturing",
      category: "manufacturing",
      tier: 1,
      researchCost: 400,
      yearAvailable: 1990,
      prerequisites: [],
      description: "High-precision automated manufacturing processes.",
      effects: [
        { type: "resource_output", target: "iron", value: 50 },
        { type: "manufacturing_efficiency", value: 0.1 }
      ],
      unlocks: ["advanced_manufacturing", "robotics"]
    },
    {
      id: "stealth_technology",
      name: "Stealth Technology",
      category: "military",
      tier: 2,
      researchCost: 1000,
      yearAvailable: 1995,
      prerequisites: ["advanced_materials"],
      description: "Technology to reduce detection by radar and other sensors.",
      effects: [
        { type: "military_effectiveness", value: 0.2 },
        { type: "air_superiority", value: 0.3 }
      ],
      unlocks: ["advanced_stealth", "electronic_warfare"]
    },
    {
      id: "biotechnology",
      name: "Biotechnology",
      category: "medical",
      tier: 3,
      researchCost: 1400,
      yearAvailable: 2000,
      prerequisites: ["genetic_research", "advanced_computing"],
      description: "Advanced biological and genetic engineering technologies.",
      effects: [
        { type: "healthcare_quality", value: 0.3 },
        { type: "life_expectancy", value: 2.5 },
        { type: "agricultural_yield", value: 0.2 }
      ],
      unlocks: ["gene_therapy", "synthetic_biology"]
    }
  ];

  return techData.map(tech => ({
    id: tech.id,
    name: tech.name,
    category: tech.category,
    tier: tech.tier,
    researchCost: tech.researchCost,
    yearAvailable: tech.yearAvailable,
    prerequisites: tech.prerequisites,
    description: tech.description,
    effects: tech.effects,
    unlocks: tech.unlocks
  }));
}

// Data validation and initialization
console.log('Initializing Balance of Powers game data...');

// Export the converted data
export const sampleProvinces: Province[] = convertProvinces();
export const sampleNations: Nation[] = convertNations();
export const sampleEvents: GameEvent[] = convertEvents();
export const gameUnits: Unit[] = convertUnits();
export const sampleTechnologies: Technology[] = convertTechnologies();

// Log successful data loading
console.log(`Loaded ${sampleProvinces.length} provinces, ${sampleNations.length} nations, ${sampleEvents.length} events, ${gameUnits.length} units, ${sampleTechnologies.length} technologies`);

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
  return sampleTechnologies.find(tech => tech.id === id);
}

export function getTechnologiesByCategory(category: string): Technology[] {
  return sampleTechnologies.filter(tech => tech.category === category);
}

export function getAvailableTechnologies(currentYear: number, completedTech: string[]): Technology[] {
  return sampleTechnologies.filter(tech => 
    tech.yearAvailable <= currentYear && 
    !completedTech.includes(tech.id) &&
    tech.prerequisites.every(prereq => completedTech.includes(prereq))
  );
}

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

  return {
    valid: errors.length === 0,
    errors
  };
}