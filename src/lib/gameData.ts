import { Province, Nation, GameEvent } from './types';

export const sampleProvinces: Province[] = [
  {
    id: "GER_001",
    name: "Lower Saxony",
    country: "Germany",
    coordinates: [52.6367, 9.8451],
    population: {
      total: 7800000,
      ethnicGroups: [
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
      stationedUnits: ["GER_INF_4"],
      fortificationLevel: 2
    },
    resourceOutput: {
      energy: 1400,
      iron: 230,
      food: 850,
      technology: 180
    },
    politics: {
      partySupport: {
        "Social Democrats": 28.5,
        "Christian Democrats": 24.3,
        "Greens": 23.3,
        "Free Democrats": 9.2,
        "Nationalists": 14.7
      },
      governorApproval: 67.3
    },
    economy: {
      gdpPerCapita: 42000,
      unemployment: 5.1,
      inflation: 2.8
    }
  },
  {
    id: "USA_001",
    name: "California",
    country: "United States",
    coordinates: [36.7783, -119.4179],
    population: {
      total: 39500000,
      ethnicGroups: [
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
      stationedUnits: ["USA_MAR_1", "USA_AF_12"],
      fortificationLevel: 3
    },
    resourceOutput: {
      energy: 2100,
      iron: 45,
      food: 1850,
      technology: 1250
    },
    politics: {
      partySupport: {
        "Democrats": 62.1,
        "Republicans": 31.2,
        "Green Party": 4.1,
        "Libertarian": 2.6
      },
      governorApproval: 54.7
    },
    economy: {
      gdpPerCapita: 75000,
      unemployment: 7.3,
      inflation: 4.2
    }
  },
  {
    id: "CHN_001",
    name: "Guangdong",
    country: "China",
    coordinates: [23.3417, 113.4244],
    population: {
      total: 126000000,
      ethnicGroups: [
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
      stationedUnits: ["CHN_INF_7", "CHN_INF_8"],
      fortificationLevel: 2
    },
    resourceOutput: {
      energy: 1800,
      iron: 340,
      food: 950,
      technology: 890
    },
    politics: {
      partySupport: {
        "Communist Party": 89.4,
        "Independent": 10.6
      },
      governorApproval: 78.2
    },
    economy: {
      gdpPerCapita: 28000,
      unemployment: 3.8,
      inflation: 1.9
    }
  }
];

export const sampleNations: Nation[] = [
  {
    id: "GER",
    name: "Germany",
    capital: "Berlin",
    flag: "🇩🇪",
    government: {
      type: "democracy",
      leader: "Olaf Scholz",
      approval: 45.2,
      stability: 82.1
    },
    economy: {
      gdp: 4200000000000,
      debt: 2800000000000,
      inflation: 2.8,
      tradeBalance: 285000000000
    },
    military: {
      manpower: 184000,
      equipment: 78,
      doctrine: "Modern Combined Arms",
      nuclearCapability: false
    },
    technology: {
      researchPoints: 1250,
      currentResearch: ["Green Energy", "AI Systems", "Advanced Manufacturing"],
      completedTech: ["Internet", "Renewable Energy", "Precision Manufacturing"]
    },
    diplomacy: {
      allies: ["USA", "FRA", "GBR"],
      enemies: [],
      tradePartners: ["USA", "CHN", "FRA", "ITA", "GBR"]
    }
  },
  {
    id: "USA",
    name: "United States",
    capital: "Washington D.C.",
    flag: "🇺🇸",
    government: {
      type: "democracy",
      leader: "Joe Biden",
      approval: 42.8,
      stability: 68.5
    },
    economy: {
      gdp: 25400000000000,
      debt: 31400000000000,
      inflation: 4.2,
      tradeBalance: -945000000000
    },
    military: {
      manpower: 1400000,
      equipment: 95,
      doctrine: "Global Force Projection",
      nuclearCapability: true
    },
    technology: {
      researchPoints: 4850,
      currentResearch: ["Quantum Computing", "Space Technology", "Biotechnology"],
      completedTech: ["Internet", "GPS", "Stealth Technology", "Nuclear Technology"]
    },
    diplomacy: {
      allies: ["GER", "FRA", "GBR", "JPN"],
      enemies: ["CHN", "RUS"],
      tradePartners: ["CHN", "MEX", "CAN", "GER", "JPN"]
    }
  },
  {
    id: "CHN",
    name: "China",
    capital: "Beijing",
    flag: "🇨🇳",
    government: {
      type: "authoritarian",
      leader: "Xi Jinping",
      approval: 78.2,
      stability: 91.3
    },
    economy: {
      gdp: 17700000000000,
      debt: 15800000000000,
      inflation: 1.9,
      tradeBalance: 676000000000
    },
    military: {
      manpower: 2100000,
      equipment: 72,
      doctrine: "Anti-Access/Area Denial",
      nuclearCapability: true
    },
    technology: {
      researchPoints: 3200,
      currentResearch: ["5G Technology", "High-Speed Rail", "Renewable Energy"],
      completedTech: ["Internet", "Solar Technology", "Electric Vehicles"]
    },
    diplomacy: {
      allies: ["RUS", "PAK"],
      enemies: ["USA", "IND"],
      tradePartners: ["USA", "GER", "JPN", "KOR", "AUS"]
    }
  }
];

export const sampleEvents: GameEvent[] = [
  {
    id: "EVENT_001",
    type: "economic",
    title: "Tech Sector Boom",
    description: "A breakthrough in quantum computing has sparked massive investment in the technology sector.",
    affectedProvinces: ["USA_001"],
    effects: [
      { target: "USA_001", property: "economy.gdpPerCapita", change: 2500 },
      { target: "USA_001", property: "resourceOutput.technology", change: 200 }
    ],
    choices: [
      {
        text: "Increase research funding",
        effects: [
          { target: "USA", property: "technology.researchPoints", change: 500 },
          { target: "USA", property: "economy.debt", change: 50000000000 }
        ]
      },
      {
        text: "Maintain current policy",
        effects: []
      }
    ],
    triggerDate: new Date('2024-03-15'),
    duration: 90
  },
  {
    id: "EVENT_002",
    type: "political",
    title: "Environmental Protests",
    description: "Large-scale protests demand stronger action on climate change.",
    affectedProvinces: ["GER_001"],
    effects: [
      { target: "GER_001", property: "unrest", change: 2.5 },
      { target: "GER_001", property: "politics.partySupport.Greens", change: 5.2 }
    ],
    triggerDate: new Date('2024-02-20'),
    duration: 30
  }
];