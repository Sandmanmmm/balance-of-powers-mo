import { Province, Nation } from './types';

// Define inline data instead of loading from YAML files for now
// This will be replaced with proper YAML loading once the import issues are resolved

const provincesData = {
  provinces: {
    "CAN_001": {
      name: "British Columbia",
      country: "Canada",
      coordinates: [53.7267, -127.6476],
      features: ["coastal", "mountainous", "forest_rich", "temperate_climate", "urban", "scenic", "tourism", "mineral_deposits"],
      population: {
        total: 5200000,
        ethnic_groups: [
          { group: "European Canadian", percent: 58 },
          { group: "Asian Canadian", percent: 25 },
          { group: "Indigenous", percent: 6 },
          { group: "Mixed/Other", percent: 11 }
        ]
      },
      unrest: 2.8,
      infrastructure: {
        roads: 4,
        internet: 4,
        healthcare: 4,
        education: 4
      },
      resource_deposits: {
        oil: 120,
        steel: 180,
        rare_earth: 45,
        uranium: 15,
        food: 350
      },
      military: {
        stationed_units: ["CAN_NAV_1", "CAN_INF_2"],
        fortification_level: 2
      },
      resource_output: {
        energy: 1850,
        iron: 220,
        food: 480,
        technology: 245
      },
      politics: {
        party_support: {
          "Liberal": 45.2,
          "Conservative": 28.8,
          "NDP": 18.5,
          "Green": 5.1,
          "Other": 2.4
        },
        governor_approval: 62.3
      },
      economy: {
        gdp_per_capita: 58000,
        unemployment: 5.8,
        inflation: 3.5
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_002": {
      name: "Alberta",
      country: "Canada", 
      coordinates: [53.9333, -116.5765],
      features: ["oil_rich", "plains", "mountainous", "temperate_climate", "energy_production", "farmland", "flat_terrain"],
      population: {
        total: 4400000,
        ethnic_groups: [
          { group: "European Canadian", percent: 69 },
          { group: "Asian Canadian", percent: 12 },
          { group: "Indigenous", percent: 7 },
          { group: "Mixed/Other", percent: 12 }
        ]
      },
      unrest: 3.2,
      infrastructure: {
        roads: 4,
        internet: 4,
        healthcare: 4,
        education: 4
      },
      resource_deposits: {
        oil: 3500,
        steel: 85,
        rare_earth: 25,
        uranium: 180,
        food: 800
      },
      military: {
        stationed_units: ["CAN_INF_3"],
        fortification_level: 1
      },
      resource_output: {
        energy: 4200,
        iron: 95,
        food: 920,
        technology: 185
      },
      politics: {
        party_support: {
          "Conservative": 58.3,
          "Liberal": 25.1,
          "NDP": 12.8,
          "Other": 3.8
        },
        governor_approval: 48.7
      },
      economy: {
        gdp_per_capita: 78000,
        unemployment: 6.2,
        inflation: 4.1
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_003": {
      name: "Saskatchewan",
      country: "Canada",
      coordinates: [52.9399, -106.4509],
      features: ["plains", "farmland", "uranium_rich", "flat_terrain", "temperate_climate", "low_population", "agricultural"],
      population: {
        total: 1180000,
        ethnic_groups: [
          { group: "European Canadian", percent: 75 },
          { group: "Indigenous", percent: 16 },
          { group: "Asian Canadian", percent: 5 },
          { group: "Mixed/Other", percent: 4 }
        ]
      },
      unrest: 1.8,
      infrastructure: {
        roads: 3,
        internet: 3,
        healthcare: 3,
        education: 3
      },
      resource_deposits: {
        oil: 450,
        steel: 25,
        rare_earth: 10,
        uranium: 850,
        food: 1200
      },
      military: {
        stationed_units: [],
        fortification_level: 1
      },
      resource_output: {
        energy: 580,
        iron: 35,
        food: 1350,
        technology: 45
      },
      politics: {
        party_support: {
          "Conservative": 48.9,
          "NDP": 32.1,
          "Liberal": 15.2,
          "Other": 3.8
        },
        governor_approval: 55.4
      },
      economy: {
        gdp_per_capita: 52000,
        unemployment: 4.8,
        inflation: 2.9
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_004": {
      name: "Manitoba",
      country: "Canada",
      coordinates: [53.7609, -98.8139],
      features: ["plains", "farmland", "temperate_climate", "flat_terrain", "river_access", "urban"],
      population: {
        total: 1380000,
        ethnic_groups: [
          { group: "European Canadian", percent: 65 },
          { group: "Indigenous", percent: 18 },
          { group: "Asian Canadian", percent: 8 },
          { group: "Mixed/Other", percent: 9 }
        ]
      },
      unrest: 2.1,
      infrastructure: {
        roads: 3,
        internet: 3,
        healthcare: 3,
        education: 3
      },
      resource_deposits: {
        oil: 85,
        steel: 45,
        rare_earth: 8,
        uranium: 25,
        food: 650
      },
      military: {
        stationed_units: ["CAN_INF_4"],
        fortification_level: 1
      },
      resource_output: {
        energy: 480,
        iron: 55,
        food: 720,
        technology: 78
      },
      politics: {
        party_support: {
          "NDP": 38.2,
          "Conservative": 35.4,
          "Liberal": 22.1,
          "Other": 4.3
        },
        governor_approval: 51.8
      },
      economy: {
        gdp_per_capita: 49000,
        unemployment: 5.4,
        inflation: 3.2
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_005": {
      name: "Ontario",
      country: "Canada",
      coordinates: [51.2538, -85.3232],
      features: ["urban", "industrial", "high_tech", "temperate_climate", "river_access", "great_lakes", "tourism", "financial_center"],
      population: {
        total: 15000000,
        ethnic_groups: [
          { group: "European Canadian", percent: 58 },
          { group: "Asian Canadian", percent: 22 },
          { group: "Black Canadian", percent: 5 },
          { group: "Indigenous", percent: 3 },
          { group: "Mixed/Other", percent: 12 }
        ]
      },
      unrest: 3.5,
      infrastructure: {
        roads: 5,
        internet: 5,
        healthcare: 5,
        education: 5
      },
      resource_deposits: {
        oil: 95,
        steel: 320,
        rare_earth: 85,
        uranium: 180,
        food: 580
      },
      military: {
        stationed_units: ["CAN_INF_1", "CAN_AIR_1", "CAN_LOG_1"],
        fortification_level: 3
      },
      resource_output: {
        energy: 2850,
        iron: 385,
        food: 650,
        technology: 780
      },
      politics: {
        party_support: {
          "Liberal": 42.8,
          "Conservative": 35.2,
          "NDP": 17.5,
          "Green": 3.1,
          "Other": 1.4
        },
        governor_approval: 45.2
      },
      economy: {
        gdp_per_capita: 56000,
        unemployment: 5.2,
        inflation: 3.8
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_006": {
      name: "Quebec",
      country: "Canada",
      coordinates: [53.9, -72.6],
      features: ["urban", "industrial", "temperate_climate", "river_access", "hydroelectric", "forest_rich", "cultural_center", "tourism"],
      population: {
        total: 8500000,
        ethnic_groups: [
          { group: "French Canadian", percent: 78 },
          { group: "English Canadian", percent: 8 },
          { group: "Indigenous", percent: 2 },
          { group: "Other", percent: 12 }
        ]
      },
      unrest: 4.2,
      infrastructure: {
        roads: 4,
        internet: 4,
        healthcare: 4,
        education: 5
      },
      resource_deposits: {
        oil: 45,
        steel: 185,
        rare_earth: 65,
        uranium: 25,
        food: 420
      },
      military: {
        stationed_units: ["CAN_INF_5", "CAN_AIR_2"],
        fortification_level: 2
      },
      resource_output: {
        energy: 3200,
        iron: 220,
        food: 485,
        technology: 420
      },
      politics: {
        party_support: {
          "Bloc Quebecois": 32.1,
          "Liberal": 28.5,
          "Conservative": 18.9,
          "NDP": 15.2,
          "Other": 5.3
        },
        governor_approval: 38.7
      },
      economy: {
        gdp_per_capita: 51000,
        unemployment: 4.8,
        inflation: 3.1
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_007": {
      name: "New Brunswick",
      country: "Canada",
      coordinates: [46.5653, -66.4619],
      features: ["coastal", "forest_rich", "temperate_climate", "low_population", "maritime", "fishing"],
      population: {
        total: 780000,
        ethnic_groups: [
          { group: "English Canadian", percent: 65 },
          { group: "French Canadian", percent: 32 },
          { group: "Indigenous", percent: 2 },
          { group: "Other", percent: 1 }
        ]
      },
      unrest: 1.5,
      infrastructure: {
        roads: 3,
        internet: 3,
        healthcare: 3,
        education: 3
      },
      resource_deposits: {
        oil: 25,
        steel: 35,
        rare_earth: 5,
        uranium: 8,
        food: 185
      },
      military: {
        stationed_units: [],
        fortification_level: 1
      },
      resource_output: {
        energy: 285,
        iron: 42,
        food: 220,
        technology: 28
      },
      politics: {
        party_support: {
          "Liberal": 38.5,
          "Conservative": 35.8,
          "NDP": 18.2,
          "Green": 5.1,
          "Other": 2.4
        },
        governor_approval: 48.9
      },
      economy: {
        gdp_per_capita: 45000,
        unemployment: 7.2,
        inflation: 2.8
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_008": {
      name: "Nova Scotia",
      country: "Canada",
      coordinates: [44.6820, -63.7443],
      features: ["coastal", "maritime", "temperate_climate", "fishing", "tourism", "urban", "scenic"],
      population: {
        total: 980000,
        ethnic_groups: [
          { group: "English Canadian", percent: 85 },
          { group: "French Canadian", percent: 8 },
          { group: "Indigenous", percent: 3 },
          { group: "Other", percent: 4 }
        ]
      },
      unrest: 1.8,
      infrastructure: {
        roads: 3,
        internet: 4,
        healthcare: 4,
        education: 4
      },
      resource_deposits: {
        oil: 85,
        steel: 25,
        rare_earth: 8,
        uranium: 5,
        food: 220
      },
      military: {
        stationed_units: ["CAN_NAV_2"],
        fortification_level: 2
      },
      resource_output: {
        energy: 420,
        iron: 32,
        food: 285,
        technology: 58
      },
      politics: {
        party_support: {
          "Liberal": 42.1,
          "Conservative": 28.5,
          "NDP": 22.8,
          "Green": 4.8,
          "Other": 1.8
        },
        governor_approval: 52.3
      },
      economy: {
        gdp_per_capita: 48000,
        unemployment: 6.8,
        inflation: 3.2
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_009": {
      name: "Prince Edward Island",
      country: "Canada",
      coordinates: [46.5107, -63.4168],
      features: ["coastal", "small_island", "farmland", "temperate_climate", "tourism", "fishing", "scenic"],
      population: {
        total: 160000,
        ethnic_groups: [
          { group: "English Canadian", percent: 89 },
          { group: "French Canadian", percent: 5 },
          { group: "Indigenous", percent: 2 },
          { group: "Other", percent: 4 }
        ]
      },
      unrest: 0.8,
      infrastructure: {
        roads: 3,
        internet: 3,
        healthcare: 3,
        education: 3
      },
      resource_deposits: {
        oil: 0,
        steel: 2,
        rare_earth: 0,
        uranium: 0,
        food: 95
      },
      military: {
        stationed_units: [],
        fortification_level: 1
      },
      resource_output: {
        energy: 85,
        iron: 3,
        food: 120,
        technology: 8
      },
      politics: {
        party_support: {
          "Liberal": 45.2,
          "Conservative": 32.8,
          "NDP": 15.5,
          "Green": 5.2,
          "Other": 1.3
        },
        governor_approval: 58.7
      },
      economy: {
        gdp_per_capita: 43000,
        unemployment: 8.1,
        inflation: 2.9
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_010": {
      name: "Newfoundland and Labrador",
      country: "Canada",
      coordinates: [53.1355, -57.6604],
      features: ["coastal", "oil_rich", "fishing", "mineral_deposits", "cold_climate", "rugged_terrain", "low_population"],
      population: {
        total: 520000,
        ethnic_groups: [
          { group: "English Canadian", percent: 92 },
          { group: "Indigenous", percent: 5 },
          { group: "Other", percent: 3 }
        ]
      },
      unrest: 2.8,
      infrastructure: {
        roads: 2,
        internet: 3,
        healthcare: 3,
        education: 3
      },
      resource_deposits: {
        oil: 1200,
        steel: 185,
        rare_earth: 45,
        uranium: 15,
        food: 180
      },
      military: {
        stationed_units: [],
        fortification_level: 1
      },
      resource_output: {
        energy: 850,
        iron: 220,
        food: 285,
        technology: 25
      },
      politics: {
        party_support: {
          "Liberal": 48.5,
          "Conservative": 35.2,
          "NDP": 12.8,
          "Other": 3.5
        },
        governor_approval: 42.1
      },
      economy: {
        gdp_per_capita: 58000,
        unemployment: 12.8,
        inflation: 3.8
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_011": {
      name: "Yukon",
      country: "Canada",
      coordinates: [64.0685, -139.0686],
      features: ["arctic_climate", "mineral_deposits", "wilderness", "mountainous", "low_population", "cold_climate", "scenic"],
      population: {
        total: 42000,
        ethnic_groups: [
          { group: "European Canadian", percent: 69 },
          { group: "Indigenous", percent: 25 },
          { group: "Other", percent: 6 }
        ]
      },
      unrest: 1.2,
      infrastructure: {
        roads: 2,
        internet: 2,
        healthcare: 2,
        education: 2
      },
      resource_deposits: {
        oil: 25,
        steel: 85,
        rare_earth: 125,
        uranium: 45,
        food: 15
      },
      military: {
        stationed_units: [],
        fortification_level: 1
      },
      resource_output: {
        energy: 180,
        iron: 95,
        food: 25,
        technology: 12
      },
      politics: {
        party_support: {
          "Liberal": 38.5,
          "Conservative": 28.2,
          "NDP": 25.8,
          "Other": 7.5
        },
        governor_approval: 65.2
      },
      economy: {
        gdp_per_capita: 72000,
        unemployment: 4.5,
        inflation: 2.8
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_012": {
      name: "Northwest Territories",
      country: "Canada",
      coordinates: [64.8255, -124.8457],
      features: ["arctic_climate", "mineral_deposits", "wilderness", "low_population", "cold_climate", "diamond_deposits", "oil_rich"],
      population: {
        total: 45000,
        ethnic_groups: [
          { group: "Indigenous", percent: 52 },
          { group: "European Canadian", percent: 41 },
          { group: "Other", percent: 7 }
        ]
      },
      unrest: 1.8,
      infrastructure: {
        roads: 1,
        internet: 2,
        healthcare: 2,
        education: 2
      },
      resource_deposits: {
        oil: 850,
        steel: 125,
        rare_earth: 285,
        uranium: 185,
        food: 8
      },
      military: {
        stationed_units: [],
        fortification_level: 1
      },
      resource_output: {
        energy: 520,
        iron: 145,
        food: 15,
        technology: 18
      },
      politics: {
        party_support: {
          "Liberal": 35.8,
          "NDP": 32.1,
          "Conservative": 25.5,
          "Other": 6.6
        },
        governor_approval: 58.9
      },
      economy: {
        gdp_per_capita: 95000,
        unemployment: 6.2,
        inflation: 3.5
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_013": {
      name: "Nunavut",
      country: "Canada",
      coordinates: [70.2998, -83.1076],
      features: ["arctic_climate", "wilderness", "low_population", "cold_climate", "tundra", "indigenous_majority", "mineral_deposits"],
      population: {
        total: 39000,
        ethnic_groups: [
          { group: "Inuit", percent: 85 },
          { group: "European Canadian", percent: 12 },
          { group: "Other", percent: 3 }
        ]
      },
      unrest: 2.1,
      infrastructure: {
        roads: 1,
        internet: 2,
        healthcare: 2,
        education: 2
      },
      resource_deposits: {
        oil: 185,
        steel: 285,
        rare_earth: 450,
        uranium: 320,
        food: 5
      },
      military: {
        stationed_units: [],
        fortification_level: 1
      },
      resource_output: {
        energy: 285,
        iron: 325,
        food: 12,
        technology: 8
      },
      politics: {
        party_support: {
          "Liberal": 42.5,
          "NDP": 35.8,
          "Conservative": 18.2,
          "Other": 3.5
        },
        governor_approval: 72.1
      },
      economy: {
        gdp_per_capita: 68000,
        unemployment: 13.5,
        inflation: 4.2
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
    }
  }
};

// Convert data to TypeScript interfaces
export function convertProvinces(): Province[] {
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

export function convertNations(): Nation[] {
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