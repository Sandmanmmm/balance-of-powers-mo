import { Province, Nation, GameEvent, Unit, Technology, Building, Resource } from './types';
import { loadBuildingsFromYAML, loadProvincesFromYAML, loadNationsFromYAML } from './yamlLoader';

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
    base_price: 0
  },
  consumer_goods: {
    id: 'consumer_goods',
    name: "Consumer Goods",
    category: "economic",
    description: "Products for civilian population satisfaction",
    unit: "units",
    base_price: 25
  },
  food: {
    id: 'food',
    name: "Food",
    category: "basic",
    description: "Essential for population survival and growth",
    unit: "tons",
    base_price: 5
  },
  water: {
    id: 'water',
    name: "Water",
    category: "basic",
    description: "Essential for agriculture and population",
    unit: "liters",
    base_price: 0.01
  },
  uranium: {
    id: 'uranium',
    name: "Uranium",
    category: "strategic",
    description: "Nuclear fuel and weapons material",
    unit: "kg",
    base_price: 50000
  },
  semiconductors: {
    id: 'semiconductors',
    name: "Semiconductors",
    category: "technology",
    description: "Core components for modern electronics",
    unit: "units",
    base_price: 500
  }
};

// Define inline data instead of loading from YAML files for now
// This will be replaced with proper YAML loading once the import issues are resolved

const provincesData = {
  provinces: {
    "CAN_001": {
      name: "British Columbia",
      country: "Canada",
      coordinates: [53.7267, -127.6476],
      features: ["mountainous", "coastal", "tech_hub", "scenic", "tourism", "fishing_grounds", "forest", "temperate_climate"],
      population: {
        total: 5200000,
        ethnic_groups: [
          { group: "European Canadian", percent: 52.4 },
          { group: "Chinese", percent: 12.3 },
          { group: "South Asian", percent: 8.7 },
          { group: "Indigenous", percent: 5.9 },
          { group: "Filipino", percent: 3.8 },
          { group: "Other", percent: 16.9 }
        ]
      },
      unrest: 2.8,
      infrastructure: {
        roads: 3,
        internet: 4,
        healthcare: 4,
        education: 4
      },
      resource_deposits: {
        oil: 200,
        steel: 450,
        rare_earth: 180,
        uranium: 25,
        food: 850
      },
      military: {
        stationed_units: ["CAN_NAV_1", "CAN_INF_2"],
        fortification_level: 2
      },
      resource_output: {
        energy: 2200,
        iron: 380,
        food: 1450,
        technology: 280
      },
      politics: {
        party_support: {
          "Liberal": 28.3,
          "Conservative": 22.8,
          "NDP": 26.1,
          "Green": 15.4,
          "Other": 7.4
        },
        governor_approval: 64.2
      },
      economy: {
        gdp_per_capita: 58000,
        unemployment: 5.8,
        inflation: 3.2
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_002": {
      name: "Alberta",
      country: "Canada", 
      coordinates: [53.9333, -116.5765],
      features: ["plains", "oil_rich", "flat_terrain", "cold_climate", "farmland", "energy_hub"],
      population: {
        total: 4400000,
        ethnic_groups: [
          { group: "European Canadian", percent: 68.2 },
          { group: "Indigenous", percent: 6.8 },
          { group: "South Asian", percent: 6.3 },
          { group: "Chinese", percent: 4.2 },
          { group: "Filipino", percent: 3.1 },
          { group: "Other", percent: 11.4 }
        ]
      },
      unrest: 4.1,
      infrastructure: {
        roads: 3,
        internet: 3,
        healthcare: 3,
        education: 3
      },
      resource_deposits: {
        oil: 15000,
        steel: 280,
        rare_earth: 45,
        uranium: 350,
        food: 1200
      },
      military: {
        stationed_units: ["CAN_INF_3"],
        fortification_level: 1
      },
      resource_output: {
        energy: 4800,
        iron: 220,
        food: 1800,
        technology: 180
      },
      politics: {
        party_support: {
          "Conservative": 52.3,
          "Liberal": 18.2,
          "NDP": 15.8,
          "Other": 13.7
        },
        governor_approval: 71.5
      },
      economy: {
        gdp_per_capita: 78000,
        unemployment: 4.2,
        inflation: 3.8
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_005": {
      name: "Ontario",
      country: "Canada",
      coordinates: [51.2538, -85.3232],
      features: ["urban", "tech_hub", "industrial", "farmland", "river_access", "temperate_climate"],
      population: {
        total: 14800000,
        ethnic_groups: [
          { group: "European Canadian", percent: 48.9 },
          { group: "South Asian", percent: 12.6 },
          { group: "Chinese", percent: 8.8 },
          { group: "Black", percent: 4.7 },
          { group: "Filipino", percent: 3.2 },
          { group: "Indigenous", percent: 2.8 },
          { group: "Other", percent: 19.0 }
        ]
      },
      unrest: 3.5,
      infrastructure: {
        roads: 4,
        internet: 5,
        healthcare: 4,
        education: 5
      },
      resource_deposits: {
        oil: 50,
        steel: 800,
        rare_earth: 120,
        uranium: 2800,
        food: 1800
      },
      military: {
        stationed_units: ["CAN_INF_1", "CAN_AIR_1", "CAN_LOG_1"],
        fortification_level: 2
      },
      resource_output: {
        energy: 3200,
        iron: 650,
        food: 2200,
        technology: 850
      },
      politics: {
        party_support: {
          "Liberal": 38.2,
          "Conservative": 28.4,
          "NDP": 18.7,
          "Green": 7.8,
          "Other": 6.9
        },
        governor_approval: 59.8
      },
      economy: {
        gdp_per_capita: 62000,
        unemployment: 6.1,
        inflation: 3.1
      },
      buildings: [],
      construction_projects: []
    },
    "GER_001": {
      name: "Lower Saxony",
      country: "Germany",
      coordinates: [52.6367, 9.8451],
      features: ["plains", "industrial", "river_access", "temperate_climate", "urban", "tech_hub", "farmland"],
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
      resource_deposits: {
        oil: 0,
        steel: 150,
        rare_earth: 10,
        uranium: 0,
        food: 500
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
      },
      buildings: [],
      construction_projects: []
    },
    "USA_001": {
      name: "California",
      country: "United States",
      coordinates: [36.7783, -119.4179],
      features: ["coastal", "high_tech", "urban", "scenic", "tourism", "sunny", "desert", "tech_hub", "fishing_grounds"],
      population: {
        total: 39500000,
        ethnic_groups: [
          { group: "White", percent: 37 },
          { group: "Hispanic", percent: 39 },
          { group: "Asian", percent: 15 },
          { group: "Black", percent: 6 },
          { group: "Other", percent: 3 }
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
      },
      buildings: [],
      construction_projects: []
    },
    "CHN_001": {
      name: "Guangdong",
      country: "China",
      coordinates: [23.3417, 113.4244],
      features: ["coastal", "subtropical_climate", "manufacturing", "high_density", "urban", "river_delta", "industrial", "fishing_grounds"],
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
      },
      buildings: [],
      construction_projects: []
    },
    "GER_002": {
      name: "Bavaria",
      country: "Germany",
      coordinates: [48.7904, 11.4979],
      features: ["mountainous", "scenic", "tourism", "agricultural", "cold_climate", "farmland"],
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
      },
      buildings: [],
      construction_projects: []
    },
    "USA_002": {
      name: "Texas",
      country: "United States",
      coordinates: [31.9686, -99.9018],
      features: ["plains", "desert", "oil_rich", "flat_terrain", "sunny", "windy", "farmland"],
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
      },
      buildings: [],
      construction_projects: []
    },
    "AUS_001": {
      name: "Western Australia Mining",
      country: "Australia", 
      coordinates: [-26.0, 121.0],
      features: ["mineral_deposits", "rare_earth_deposits", "desert", "sunny", "radioactive_deposits", "flat_terrain", "low_population", "wilderness", "coastal", "fishing_grounds"],
      population: {
        total: 1800000,
        ethnic_groups: [
          { group: "Anglo-Australian", percent: 68 },
          { group: "Aboriginal", percent: 12 },
          { group: "Asian", percent: 15 },
          { group: "Other", percent: 5 }
        ]
      },
      unrest: 1.8,
      infrastructure: {
        roads: 2,
        internet: 3,
        healthcare: 3,
        education: 3
      },
      resource_deposits: {
        oil: 100,
        steel: 2000,
        rare_earth: 800,
        uranium: 400,
        food: 150
      },
      military: {
        stationed_units: [],
        fortification_level: 1
      },
      resource_output: {
        energy: 800,
        iron: 450,
        food: 200,
        technology: 85
      },
      politics: {
        party_support: {
          "Labor": 38.2,
          "Liberal": 42.8,
          "Greens": 12.5,
          "Other": 6.5
        },
        governor_approval: 69.3
      },
      economy: {
        gdp_per_capita: 65000,
        unemployment: 5.2,
        inflation: 2.1
      },
      buildings: [],
      construction_projects: []
    },
    "JPN_001": {
      name: "Tokyo Metropolitan",
      country: "Japan", 
      coordinates: [35.6762, 139.6503],
      features: ["urban", "high_density", "tech_hub", "coastal", "high_tech", "earthquake_prone", "fishing_grounds"],
      population: {
        total: 14000000,
        ethnic_groups: [
          { group: "Japanese", percent: 97.1 },
          { group: "Chinese", percent: 1.2 },
          { group: "Korean", percent: 0.9 },
          { group: "Other", percent: 0.8 }
        ]
      },
      unrest: 1.5,
      infrastructure: {
        roads: 5,
        internet: 5,
        healthcare: 5,
        education: 5
      },
      resource_deposits: {
        oil: 0,
        steel: 0,
        rare_earth: 15,
        uranium: 0,
        food: 50
      },
      military: {
        stationed_units: ["JPN_SDF_1"],
        fortification_level: 3
      },
      resource_output: {
        energy: 2200,
        iron: 20,
        food: 300,
        technology: 1800
      },
      politics: {
        party_support: {
          "Liberal Democratic": 45.2,
          "Constitutional Democratic": 28.1,
          "Innovation": 12.3,
          "Communist": 8.9,
          "Other": 5.5
        },
        governor_approval: 58.7
      },
      economy: {
        gdp_per_capita: 48000,
        unemployment: 2.8,
        inflation: 1.2
      },
      buildings: [],
      construction_projects: []
    },
    "NOR_001": {
      name: "Northern Norway",
      country: "Norway",
      coordinates: [69.0, 18.0],
      features: ["mountainous", "cold_climate", "oil_rich", "coastal", "low_population", "geothermal_activity", "fishing_grounds"],
      population: {
        total: 500000,
        ethnic_groups: [
          { group: "Norwegian", percent: 88.2 },
          { group: "Sami", percent: 8.5 },
          { group: "Other", percent: 3.3 }
        ]
      },
      unrest: 0.8,
      infrastructure: {
        roads: 2,
        internet: 4,
        healthcare: 4,
        education: 4
      },
      resource_deposits: {
        oil: 800,
        steel: 200,
        rare_earth: 50,
        uranium: 0,
        food: 100
      },
      military: {
        stationed_units: [],
        fortification_level: 1
      },
      resource_output: {
        energy: 400,
        iron: 80,
        food: 200,
        technology: 60
      },
      politics: {
        party_support: {
          "Labour": 35.2,
          "Conservative": 28.1,
          "Centre": 18.3,
          "Progress": 12.9,
          "Other": 5.5
        },
        governor_approval: 72.4
      },
      economy: {
        gdp_per_capita: 82000,
        unemployment: 3.1,
        inflation: 2.9
      },
      buildings: [],
      construction_projects: []
    }
  }
};

const nationsData = {
  nations: {
    "CAN": {
      name: "Canada",
      capital: "Ottawa",
      flag: "🇨🇦",
      government: {
        type: "democracy" as const,
        leader: "Justin Trudeau",
        approval: 58.3,
        stability: 76.5,
        ruling_party: "Liberal Party",
        ideology: "Liberal Democracy",
        election_cycle: 4,
        last_election: "2021-09-20"
      },
      economy: {
        gdp: 1988000000000,
        debt: 1200000000000,
        inflation: 3.4,
        trade_balance: 12500000000,
        treasury: 280000000000,
        currency: "CAD",
        interest_rate: 5.0,
        sectors: {
          manufacturing: 10.2,
          services: 70.8,
          agriculture: 1.7,
          technology: 5.3,
          resources: 12.0
        }
      },
      military: {
        manpower: 67000,
        equipment: 72,
        doctrine: "Peacekeeping and Defense",
        nuclear_capability: false,
        military_spending_gdp: 1.32,
        conscription: false,
        reserve_forces: 19000
      },
      technology: {
        research_points: 980,
        current_research: ["Clean Energy", "Arctic Technology", "AI Development"],
        completed_tech: ["Internet", "Renewable Energy", "Resource Extraction", "Cold Weather Technology", "Peacekeeping Systems"],
        tech_level: 8.1,
        research_spending_gdp: 1.8
      },
      diplomacy: {
        allies: ["USA", "GBR", "FRA", "GER", "AUS", "JPN"],
        enemies: [],
        trade_partners: ["USA", "CHN", "MEX", "GBR", "GER", "JPN", "KOR"],
        international_relations: {
          NATO: "member",
          G7: "member",
          UN_Security_Council: false,
          Commonwealth: "member"
        }
      },
      provinces: ["CAN_001", "CAN_002", "CAN_003", "CAN_004", "CAN_005", "CAN_006", "CAN_007", "CAN_008", "CAN_009", "CAN_010", "CAN_011", "CAN_012", "CAN_013"],
      demographics: {
        population: 38000000,
        median_age: 41.1,
        birth_rate: 1.47,
        life_expectancy: 82.4,
        literacy_rate: 99.0,
        urbanization: 81.6
      },
      resourceStockpiles: {
        oil: 55000,
        electricity: 42000,
        steel: 45000,
        rare_earth: 8500,
        manpower: 1850000,
        research: 980,
        consumer_goods: 38000,
        food: 125000,
        uranium: 15000,
        semiconductors: 4200
      },
      resourceProduction: {
        oil: 1200,
        electricity: 800,
        steel: 250,
        rare_earth: 45,
        manpower: 850,
        research: 95,
        consumer_goods: 180,
        food: 2800,
        uranium: 120,
        semiconductors: 25
      },
      resourceConsumption: {
        oil: 420,
        electricity: 650,
        steel: 180,
        rare_earth: 20,
        manpower: 380,
        research: 0,
        consumer_goods: 850,
        food: 1200,
        uranium: 8,
        semiconductors: 65
      }
    },
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
        treasury: 850000000000,
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
      },
      resourceStockpiles: {
        oil: 25000,
        electricity: 15000,
        steel: 85000,
        rare_earth: 2500,
        manpower: 2800000,
        research: 1250,
        consumer_goods: 45000,
        food: 120000,
        uranium: 150,
        semiconductors: 8500
      },
      resourceProduction: {
        oil: 0,
        electricity: 0,
        steel: 0,
        rare_earth: 0,
        manpower: 1000,
        research: 100,
        consumer_goods: 0,
        food: 0,
        uranium: 0,
        semiconductors: 0
      },
      resourceConsumption: {
        oil: 800,
        electricity: 1200,
        steel: 400,
        rare_earth: 50,
        manpower: 500,
        research: 0,
        consumer_goods: 1500,
        food: 2800,
        uranium: 5,
        semiconductors: 200
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
        treasury: 2100000000000,
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
      },
      resourceStockpiles: {
        oil: 180000,
        electricity: 85000,
        steel: 320000,
        rare_earth: 12000,
        manpower: 14500000,
        research: 4850,
        consumer_goods: 180000,
        food: 580000,
        uranium: 4500,
        semiconductors: 28000
      },
      resourceProduction: {
        oil: 0,
        electricity: 0,
        steel: 0,
        rare_earth: 0,
        manpower: 3500,
        research: 500,
        consumer_goods: 0,
        food: 0,
        uranium: 0,
        semiconductors: 0
      },
      resourceConsumption: {
        oil: 4200,
        electricity: 6800,
        steel: 1800,
        rare_earth: 280,
        manpower: 2200,
        research: 0,
        consumer_goods: 8500,
        food: 15000,
        uranium: 35,
        semiconductors: 1200
      }
    },
    "AUS": {
      name: "Australia",
      capital: "Canberra",
      flag: "🇦🇺",
      government: {
        type: "democracy" as const,
        leader: "Anthony Albanese",
        approval: 51.2,
        stability: 78.4,
        ruling_party: "Labor",
        ideology: "Social Democracy",
        election_cycle: 3,
        last_election: "2022-05-21"
      },
      economy: {
        gdp: 1550000000000,
        debt: 560000000000,
        inflation: 3.1,
        trade_balance: 45000000000,
        treasury: 180000000000
      },
      military: {
        manpower: 85000,
        equipment: 82,
        doctrine: "Regional Defense",
        nuclear_capability: false
      },
      technology: {
        research_points: 850,
        current_research: ["Mining Technology", "Renewable Energy", "Defense Systems"],
        completed_tech: ["Internet", "Mining Automation", "Solar Technology", "Military Communications"],
        tech_level: 7.8
      },
      diplomacy: {
        allies: ["USA", "GBR", "NZL", "JPN"],
        enemies: [],
        trade_partners: ["CHN", "JPN", "USA", "KOR", "IND", "GBR"]
      },
      resourceStockpiles: {
        oil: 35000,
        electricity: 25000,
        steel: 180000,
        rare_earth: 45000,
        manpower: 1200000,
        research: 850,
        consumer_goods: 28000,
        food: 85000,
        uranium: 28000,
        semiconductors: 3500
      },
      resourceProduction: {
        oil: 0,
        electricity: 0,
        steel: 0,
        rare_earth: 0,
        manpower: 400,
        research: 85,
        consumer_goods: 0,
        food: 0,
        uranium: 0,
        semiconductors: 0
      },
      resourceConsumption: {
        oil: 180,
        electricity: 350,
        steel: 120,
        rare_earth: 25,
        manpower: 150,
        research: 0,
        consumer_goods: 800,
        food: 1200,
        uranium: 2,
        semiconductors: 45
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
    features: data.features || [], // Add features array
    population: {
      total: data.population.total,
      ethnicGroups: data.population.ethnic_groups.map(group => ({
        group: group.group,
        percent: group.percent
      }))
    },
    unrest: data.unrest,
    infrastructure: data.infrastructure,
    resourceDeposits: data.resource_deposits || {}, // Add resource deposits
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
    },
    buildings: data.buildings || [],
    constructionProjects: data.construction_projects || []
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
      tradeBalance: data.economy.trade_balance || data.economy.tradeBalance,
      treasury: data.economy.treasury
    },
    military: {
      manpower: data.military.manpower,
      equipment: data.military.equipment,
      readiness: data.military.readiness || 100,
      doctrine: data.military.doctrine,
      nuclearCapability: data.military.nuclear_capability ?? data.military.nuclearCapability ?? false
    },
    technology: {
      researchPoints: data.technology.research_points ?? data.technology.researchPoints ?? 0,
      currentResearch: data.technology.current_research ?? data.technology.currentResearch ?? [],
      completedTech: data.technology.completed_tech ?? data.technology.completedTech ?? [],
      level: data.technology.tech_level ?? data.technology.level ?? 1.0
    },
    diplomacy: {
      allies: data.diplomacy.allies || [],
      enemies: data.diplomacy.enemies || [],
      embargoes: data.diplomacy.embargoes || [],
      sanctions: data.diplomacy.sanctions || [],
      tradePartners: data.diplomacy.trade_partners ?? data.diplomacy.tradePartners ?? []
    },
    resourceStockpiles: data.resourceStockpiles || data.resource_stockpiles || {},
    resourceProduction: data.resourceProduction || data.resource_production || {},
    resourceConsumption: data.resourceConsumption || data.resource_consumption || {},
    resourceShortages: data.resourceShortages || data.resource_shortages || {},
    resourceEfficiency: data.resourceEfficiency || data.resource_efficiency || { overall: 1.0 },
    tradeOffers: data.tradeOffers || data.trade_offers || [],
    tradeAgreements: data.tradeAgreements || data.trade_agreements || []
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

function convertBuildings(): Building[] {
  const buildingData = [
    // === RESOURCE PRODUCERS ===
    {
      id: "oil_well",
      name: "Oil Well",
      description: "Extracts crude oil from underground deposits",
      category: "extraction" as const,
      cost: 2500,
      buildTime: 180,
      produces: { oil: 80 },
      consumes: { electricity: 15, manpower: 60, steel: 3 },
      improves: { resource_extraction: 1, employment: 200 },
      requiresFeatures: ["oil_rich"],
      requirements: { infrastructure: 2 },
      icon: "🛢️"
    },
    {
      id: "offshore_oil_rig",
      name: "Offshore Oil Platform",
      description: "Deep sea oil extraction platform",
      category: "extraction" as const,
      cost: 8000,
      buildTime: 400,
      produces: { oil: 200 },
      consumes: { electricity: 50, manpower: 180, steel: 15 },
      improves: { resource_extraction: 3, employment: 600 },
      requiresFeatures: ["coastal", "oil_rich"],
      requirements: { infrastructure: 3, technology: "offshore_drilling" },
      icon: "🏗️"
    },
    {
      id: "iron_mine",
      name: "Iron Mine",
      description: "Extracts iron ore for steel production",
      category: "extraction" as const,
      cost: 1800,
      buildTime: 150,
      produces: { steel: 30 },
      consumes: { electricity: 25, manpower: 120, oil: 8 },
      improves: { resource_extraction: 1, employment: 400 },
      requiresFeatures: ["mineral_deposits"],
      requirements: { infrastructure: 2 },
      icon: "⛏️"
    },
    {
      id: "food_farm",
      name: "Agricultural Farm",
      description: "Large-scale food production facility",
      category: "agriculture" as const,
      cost: 800,
      buildTime: 90,
      produces: { food: 1200 },
      consumes: { manpower: 50, electricity: 8, oil: 12 },
      improves: { food_security: 2, employment: 400 },
      requiresFeatures: ["farmland"],
      requirements: { infrastructure: 1 },
      icon: "🚜"
    },
    {
      id: "solar_farm",
      name: "Solar Power Farm",
      description: "Large-scale renewable energy generation",
      category: "energy" as const,
      cost: 3500,
      buildTime: 200,
      produces: { electricity: 150 },
      consumes: { manpower: 30, semiconductors: 5 },
      improves: { clean_energy: 3, energy_security: 1 },
      requiresFeatures: ["desert", "sunny"],
      requirements: { infrastructure: 2, technology: "renewable_energy" },
      icon: "☀️"
    },
    {
      id: "wind_farm",
      name: "Wind Power Farm",
      description: "Wind turbine electricity generation",
      category: "energy" as const,
      cost: 2800,
      buildTime: 180,
      produces: { electricity: 120 },
      consumes: { manpower: 25, steel: 8 },
      improves: { clean_energy: 2, energy_security: 1 },
      requiresFeatures: ["windy", "plains"],
      requirements: { infrastructure: 2, technology: "renewable_energy" },
      icon: "💨"
    },
    {
      id: "fishing_fleet",
      name: "Commercial Fishing Fleet",
      description: "Maritime food production operation",
      category: "agriculture" as const,
      cost: 1500,
      buildTime: 120,
      produces: { food: 800 },
      consumes: { manpower: 80, oil: 20, steel: 5 },
      improves: { food_security: 1, employment: 300 },
      requiresFeatures: ["coastal", "fishing_grounds"],
      requirements: { infrastructure: 2 },
      icon: "🎣"
    },
    
    // === RESOURCE PROCESSORS ===
    {
      id: "power_plant",
      name: "Thermal Power Plant",
      description: "Converts oil and coal into electricity",
      category: "energy" as const,
      cost: 4000,
      buildTime: 300,
      produces: { electricity: 300 },
      consumes: { oil: 50, manpower: 100, steel: 8 },
      improves: { energy_output: 5, pollution: 4 },
      requiresFeatures: ["industrial"],
      requirements: { infrastructure: 3, technology: "power_generation" },
      icon: "⚡"
    },
    {
      id: "nuclear_plant",
      name: "Nuclear Power Plant",
      description: "High-efficiency nuclear energy generation",
      category: "energy" as const,
      cost: 15000,
      buildTime: 600,
      produces: { electricity: 1000 },
      consumes: { uranium: 3, manpower: 250, steel: 20 },
      improves: { energy_security: 8, clean_energy: 5 },
      requiresFeatures: ["strategic_location"],
      requirements: { infrastructure: 4, technology: "nuclear_power" },
      icon: "⚛️"
    },
    {
      id: "semiconductor_fab",
      name: "Semiconductor Fabrication Plant",
      description: "Advanced chip manufacturing facility",
      category: "technology" as const,
      cost: 12000,
      buildTime: 450,
      produces: { semiconductors: 25 },
      consumes: { electricity: 150, rare_earth: 15, manpower: 300 },
      improves: { tech_industry: 4, high_tech_exports: 3 },
      requiresFeatures: ["high_tech", "urban"],
      requirements: { infrastructure: 4, technology: "advanced_manufacturing" },
      icon: "🔬"
    },
    
    // === FLEXIBLE BUILDINGS ===
    {
      id: "trade_center",
      name: "Trade Center",
      description: "Commercial hub for business and commerce",
      category: "commercial" as const,
      cost: 1800,
      buildTime: 140,
      produces: { consumer_goods: 35 },
      consumes: { electricity: 20, manpower: 80 },
      improves: { trade_efficiency: 0.15, gdp_modifier: 0.08, employment: 500 },
      requiresFeatures: ["urban"],
      requirements: { infrastructure: 2 },
      icon: "🏢"
    },
    {
      id: "logistics_hub",
      name: "Logistics Hub", 
      description: "Transportation and distribution center",
      category: "infrastructure" as const,
      cost: 2400,
      buildTime: 160,
      produces: {},
      consumes: { electricity: 15, manpower: 120, oil: 25 },
      improves: { transportation_efficiency: 0.2, trade_capacity: 5, military_logistics: 2 },
      requiresFeatures: ["flat_terrain"],
      requirements: { infrastructure: 2 },
      icon: "📦"
    },
    {
      id: "desalination_plant",
      name: "Desalination Plant",
      description: "Converts seawater to fresh water",
      category: "infrastructure" as const,
      cost: 5000,
      buildTime: 280,
      produces: { water: 500 },
      consumes: { electricity: 80, manpower: 60 },
      improves: { water_security: 3, population_capacity: 0.1 },
      requiresFeatures: ["coastal"],
      requirements: { infrastructure: 3, technology: "water_treatment" },
      icon: "💧"
    },
    {
      id: "spaceport",
      name: "Spaceport",
      description: "Launch facility for space missions",
      category: "aerospace" as const,
      cost: 20000,
      buildTime: 500,
      produces: { research: 80 },
      consumes: { electricity: 200, manpower: 400, rare_earth: 20, oil: 100 },
      improves: { space_capability: 5, scientific_prestige: 8, tech_advancement: 0.3 },
      requiresFeatures: ["flat_terrain", "low_population"],
      requirements: { infrastructure: 4, technology: "space_technology" },
      icon: "🚀"
    },
    
    // === EXISTING BUILDINGS (UPDATED) ===
    {
      id: "civilian_factory",
      name: "Civilian Factory",
      description: "Mass production of consumer goods and materials",
      category: "industrial" as const,
      cost: 1000,
      buildTime: 120,
      produces: { consumer_goods: 25, steel: 8 },
      consumes: { electricity: 30, manpower: 120, oil: 10 },
      improves: { industry: 2, gdp_modifier: 0.1, employment: 400 },
      requiresFeatures: ["industrial"],
      requirements: { infrastructure: 2 },
      icon: "🏭"
    },
    {
      id: "university",
      name: "University",
      description: "Advances research and technology development",
      category: "research" as const,
      cost: 2000,
      buildTime: 240,
      produces: { research: 30 },
      consumes: { electricity: 15, manpower: 200 },
      improves: { research_speed: 0.15, stability: 1, employment: 800 },
      requiresFeatures: ["urban"],
      requirements: { infrastructure: 3 },
      icon: "🎓"
    },
    {
      id: "hospital",
      name: "Hospital",
      description: "Improves public health and population growth",
      category: "civilian" as const,
      cost: 1200,
      buildTime: 150,
      produces: {},
      consumes: { electricity: 10, manpower: 120, consumer_goods: 5 },
      improves: { population_growth: 0.02, stability: 3, healthcare_level: 1 },
      requiresFeatures: ["urban"],
      requirements: { infrastructure: 2 },
      icon: "🏥"
    },
    {
      id: "port",
      name: "Port",
      description: "Facilitates trade and naval operations",
      category: "infrastructure" as const,
      cost: 2500,
      buildTime: 200,
      produces: { consumer_goods: 20 },
      consumes: { electricity: 15, manpower: 60, steel: 5 },
      improves: { trade_efficiency: 0.2, naval_capacity: 5, gdp_modifier: 0.08 },
      requiresFeatures: ["coastal"],
      requirements: { infrastructure: 2 },
      icon: "⚓"
    },
    {
      id: "airport",
      name: "Airport",
      description: "Enables air transport and military aviation",
      category: "infrastructure" as const,
      cost: 4000,
      buildTime: 250,
      produces: {},
      consumes: { electricity: 30, manpower: 100, oil: 20 },
      improves: { air_capacity: 10, trade_efficiency: 0.1, stability: 1 },
      requiresFeatures: ["plains"],
      requirements: { infrastructure: 3, technology: "aviation" },
      icon: "✈️"
    },
    {
      id: "infrastructure",
      name: "Infrastructure",
      description: "Roads, communications, and basic utilities",
      category: "infrastructure" as const,
      cost: 800,
      buildTime: 90,
      produces: {},
      consumes: { manpower: 50, steel: 3 },
      improves: { infrastructure: 1, stability: 2, gdp_modifier: 0.05 },
      requiresFeatures: [], // No specific features required
      requirements: {},
      icon: "🛣️"
    },
    {
      id: "nature_preserve",
      name: "Nature Preserve",
      description: "Protected natural area for conservation",
      category: "environmental" as const,
      cost: 1500,
      buildTime: 100,
      produces: {},
      consumes: { manpower: 30 },
      improves: { biodiversity: 5, tourism_income: 2, environmental_quality: 4, pollution: -2 },
      requiresFeatures: ["scenic", "wilderness"],
      requirements: { infrastructure: 1 },
      icon: "🌲"
    },
    {
      id: "submarine_base",
      name: "Naval Submarine Base",
      description: "Military submarine operations facility",
      category: "military" as const,
      cost: 8500,
      buildTime: 320,
      produces: {},
      consumes: { electricity: 60, manpower: 250, steel: 15, oil: 30 },
      improves: { naval_power: 8, strategic_depth: 3, military_prestige: 2 },
      requiresFeatures: ["coastal"],
      requirements: { infrastructure: 3, technology: "submarine_technology" },
      icon: "🚢"
    },
    {
      id: "ski_resort",
      name: "Ski Resort",
      description: "Mountain tourism and recreation facility",
      category: "tourism" as const,
      cost: 3200,
      buildTime: 200,
      produces: { consumer_goods: 15 },
      consumes: { electricity: 25, manpower: 80 },
      improves: { tourism_income: 8, employment: 300, local_happiness: 2 },
      requiresFeatures: ["mountainous", "cold_climate"],
      requirements: { infrastructure: 2 },
      icon: "⛷️"
    },
    {
      id: "mining_complex",
      name: "Large Mining Complex",
      description: "Comprehensive mineral extraction facility",
      category: "extraction" as const,
      cost: 6000,
      buildTime: 300,
      produces: { steel: 80, rare_earth: 25 },
      consumes: { electricity: 120, manpower: 400, oil: 40 },
      improves: { resource_extraction: 5, employment: 1200 },
      requiresFeatures: ["mineral_deposits", "radioactive_deposits"],
      requirements: { infrastructure: 3 },
      icon: "⛏️"
    },
    {
      id: "data_center",
      name: "Data Center",
      description: "High-performance computing and cloud services",
      category: "technology" as const,
      cost: 4500,
      buildTime: 180,
      produces: { research: 40, semiconductors: 8 },
      consumes: { electricity: 180, manpower: 120, rare_earth: 12 },
      improves: { digital_infrastructure: 4, tech_advancement: 0.2 },
      requiresFeatures: ["tech_hub", "urban"],
      requirements: { infrastructure: 4, technology: "advanced_computing" },
      icon: "💻"
    },
    {
      id: "beach_resort",
      name: "Beach Resort",
      description: "Coastal tourism and entertainment complex",
      category: "tourism" as const,
      cost: 2800,
      buildTime: 160,
      produces: { consumer_goods: 20 },
      consumes: { electricity: 30, manpower: 100 },
      improves: { tourism_income: 6, employment: 400, coastal_development: 2 },
      requiresFeatures: ["coastal", "sunny"],
      requirements: { infrastructure: 2 },
      icon: "🏖️"
    },
    {
      id: "vertical_farm",
      name: "Vertical Farm",
      description: "High-tech indoor agriculture facility",
      category: "agriculture" as const,
      cost: 3500,
      buildTime: 140,
      produces: { food: 800 },
      consumes: { electricity: 80, manpower: 60, semiconductors: 3 },
      improves: { food_security: 4, urban_sustainability: 3, water_efficiency: 2 },
      requiresFeatures: ["urban", "tech_hub"],
      requirements: { infrastructure: 3, technology: "biotechnology" },
      icon: "🌱"
    },
    {
      id: "thermal_plant",
      name: "Geothermal Power Plant",
      description: "Clean energy from underground heat sources",
      category: "energy" as const,
      cost: 5500,
      buildTime: 280,
      produces: { electricity: 400 },
      consumes: { manpower: 80, steel: 12 },
      improves: { clean_energy: 4, energy_security: 3, environmental_quality: 1 },
      requiresFeatures: ["mountainous", "geothermal_activity"],
      requirements: { infrastructure: 3, technology: "renewable_energy" },
      icon: "🌋"
    },
    {
      id: "cattle_ranch",
      name: "Cattle Ranch",
      description: "Large-scale livestock farming operation",
      category: "agriculture" as const,
      cost: 1200,
      buildTime: 80,
      produces: { food: 600 },
      consumes: { manpower: 40, oil: 8 },
      improves: { food_security: 2, employment: 200, rural_development: 1 },
      requiresFeatures: ["plains", "farmland"],
      requirements: { infrastructure: 1 },
      icon: "🐄"
    },
    {
      id: "oil_refinery",
      name: "Oil Refinery",
      description: "Processes crude oil into fuel and chemicals",
      category: "industrial" as const,
      cost: 4800,
      buildTime: 240,
      produces: { consumer_goods: 30, electricity: 50 },
      consumes: { oil: 120, manpower: 180, steel: 10 },
      improves: { industrial_capacity: 3, energy_independence: 2 },
      requiresFeatures: ["oil_rich", "industrial"],
      requirements: { infrastructure: 3 },
      icon: "🏭"
    }
  ];

  return buildingData.map(building => ({
    id: building.id,
    name: building.name,
    description: building.description,
    category: building.category,
    cost: building.cost,
    buildTime: building.buildTime,
    produces: building.produces || {},
    consumes: building.consumes || {},
    improves: building.improves || {},
    requiresFeatures: building.requiresFeatures || [],
    requirements: building.requirements || {},
    icon: building.icon
  }));
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

// Initialize async data loading
let loadedBuildings: Building[] = [];
let loadedProvinces: Province[] = [];
let loadedNations: Nation[] = [];
let isDataInitialized = false;

// Initialize data loading
async function initializeGameData() {
  if (isDataInitialized) {
    console.log('Game data already initialized');
    return;
  }
  
  try {
    console.log('Initializing game data from YAML files...');
    
    // Load all data in parallel
    const [buildings, provinces, nations] = await Promise.all([
      loadBuildingsFromYAML(),
      loadProvincesFromYAML(), 
      loadNationsFromYAML()
    ]);
    
    loadedBuildings = buildings;
    loadedProvinces = provinces;
    loadedNations = nations;
    isDataInitialized = true;
    
    console.log(`Successfully loaded ${buildings.length} buildings, ${provinces.length} provinces, ${nations.length} nations from YAML`);
    
    // Log Canada specifically to confirm it's loaded
    const canada = nations.find(n => n.id === 'CAN');
    if (canada) {
      console.log(`✓ Canada loaded: ${canada.name} with ${canada.government?.leader}`);
      const canadianProvinces = provinces.filter(p => p.country === 'Canada');
      console.log(`✓ ${canadianProvinces.length} Canadian provinces loaded:`, canadianProvinces.map(p => p.name));
    } else {
      console.warn('⚠ Canada not found in loaded nations');
    }
    
  } catch (error) {
    console.error('Failed to load game data from YAML:', error);
    console.log('Using fallback hardcoded data...');
    // Fallback to hardcoded data
    loadedBuildings = convertBuildings();
    loadedProvinces = convertProvinces();
    loadedNations = convertNations();
    isDataInitialized = true;
  }
}

// Initialize immediately
initializeGameData();

// Export the converted data
export const sampleProvinces: Province[] = [];
export const sampleNations: Nation[] = [];
export const sampleEvents: GameEvent[] = convertEvents();
export const gameUnits: Unit[] = convertUnits();
export const sampleTechnologies: Technology[] = convertTechnologies();
export const gameBuildings: Building[] = [];

// Getter functions that return loaded data
export async function getProvinces(): Promise<Province[]> {
  // Make sure data is initialized first
  if (!isDataInitialized) {
    await initializeGameData();
  }
  
  const result = loadedProvinces.length > 0 ? loadedProvinces : convertProvinces();
  console.log(`getProvinces() returning ${result.length} provinces`);
  return result;
}

export async function getNations(): Promise<Nation[]> {
  // Make sure data is initialized first
  if (!isDataInitialized) {
    await initializeGameData();
  }
  
  const result = loadedNations.length > 0 ? loadedNations : convertNations();
  console.log(`getNations() returning ${result.length} nations`);
  return result;
}

export function getBuildings(): Building[] {
  const buildings = loadedBuildings.length > 0 ? loadedBuildings : convertBuildings();
  console.log(`getBuildings() returning ${buildings.length} buildings`);
  return buildings;
}

// Log successful data loading
console.log(`Loaded ${sampleProvinces.length} provinces, ${sampleNations.length} nations, ${sampleEvents.length} events, ${gameUnits.length} units, ${sampleTechnologies.length} technologies, ${gameBuildings.length} buildings, ${Object.keys(resourcesData).length} resources`);

// Export data access functions
export function getProvinceById(id: string): Province | undefined {
  const provinces = getProvinces();
  return provinces.find(province => province.id === id);
}

export function getNationById(id: string): Nation | undefined {
  const nations = getNations();
  return nations.find(nation => nation.id === id);
}

export function getProvincesByCountry(country: string): Province[] {
  const provinces = getProvinces();
  return provinces.filter(province => province.country === country);
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

export function getBuildingById(id: string): Building | undefined {
  const buildings = getBuildings();
  return buildings.find(building => building.id === id);
}

export function getBuildingsByCategory(category: string): Building[] {
  const buildings = getBuildings();
  return buildings.filter(building => building.category === category);
}

export function getAvailableBuildings(province: Province, nation: Nation, completedTech: string[]): Building[] {
  const buildings = getBuildings();
  if (!buildings || buildings.length === 0) {
    console.log('No buildings loaded in game data');
    return [];
  }
  
  console.log(`Filtering buildings for province ${province.name} with features:`, province.features);
  console.log(`Infrastructure level: ${province.infrastructure.roads}`);
  console.log(`Completed tech:`, completedTech);
  
  const filtered = buildings.filter(building => {
    // Ensure we have all required data
    if (!building || !province) {
      return false;
    }
    
    // Check feature requirements - Province must have ALL required features
    if (building.requiresFeatures && Array.isArray(building.requiresFeatures) && building.requiresFeatures.length > 0) {
      const provinceFeatures = province.features || [];
      const hasAllRequiredFeatures = building.requiresFeatures.every(feature => 
        feature && provinceFeatures.includes(feature)
      );
      if (!hasAllRequiredFeatures) {
        const missingFeatures = building.requiresFeatures.filter(feature => 
          feature && !provinceFeatures.includes(feature)
        );
        console.log(`Building ${building.name} filtered out - missing features: ${missingFeatures.join(', ')}. Requires: ${building.requiresFeatures.join(', ')}, Province has: ${provinceFeatures.join(', ')}`);
        return false;
      }
    }
    // If no requiresFeatures, treat as globally constructible
    
    // Check basic requirements
    if (building.requirements?.infrastructure && province.infrastructure.roads < building.requirements.infrastructure) {
      console.log(`Building ${building.name} filtered out - insufficient infrastructure. Requires: ${building.requirements.infrastructure}, Province has: ${province.infrastructure.roads}`);
      return false;
    }
    
    // Check technology requirements
    if (building.requirements?.technology && !(completedTech || []).includes(building.requirements.technology)) {
      console.log(`Building ${building.name} filtered out - missing technology: ${building.requirements.technology}`);
      return false;
    }
    
    // Check special requirements (coastal, rural, etc.) - legacy support
    if (building.requirements?.coastal && !isCoastalProvince(province)) {
      console.log(`Building ${building.name} filtered out - not coastal`);
      return false;
    }
    
    if (building.requirements?.rural && !isRuralProvince(province)) {
      console.log(`Building ${building.name} filtered out - not rural`);
      return false;
    }
    
    console.log(`Building ${building.name} passed all filters`);
    return true;
  });
  
  console.log(`Filtered ${filtered.length} available buildings from ${buildings.length} total buildings for province ${province.name}`);
  return filtered;
}

export function getResourceById(id: string): Resource | undefined {
  return resourcesData[id];
}

export function getAllResources(): Resource[] {
  return Object.values(resourcesData);
}

export function getResourcesByCategory(category: string): Resource[] {
  return Object.values(resourcesData).filter(resource => resource.category === category);
}

function isCoastalProvince(province: Province): boolean {
  // Simple heuristic - in a real game this would be in province data
  return (province.name && province.name.toLowerCase().includes('coast')) || 
         (province.name && province.name.toLowerCase().includes('port')) ||
         (province.id && province.id.includes('coastal'));
}

function isRuralProvince(province: Province): boolean {
  // Simple heuristic - in a real game this would be in province data  
  return province.population.total < 5000000;
}

export function validateGameData(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const provinces = getProvinces();
  const nations = getNations();

  // Validate provinces
  if (provinces.length === 0) {
    errors.push('No provinces loaded');
  }

  // Validate nations
  if (nations.length === 0) {
    errors.push('No nations loaded');
  }

  // Check that each province references a valid nation
  provinces.forEach(province => {
    if (!nations.find(nation => nation.name === province.country)) {
      errors.push(`Province ${province.id} references unknown country: ${province.country}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}