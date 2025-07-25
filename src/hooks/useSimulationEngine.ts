import { useEffect, useRef } from 'react';
import { GameState, Province, Nation } from '../lib/types';
import { sampleProvinces, sampleNations } from '../lib/gameData';

interface UseSimulationEngineProps {
  gameState: GameState;
  provinces: Province[];
  nations: Nation[];
  onAdvanceTime: (days: number) => void;
  onUpdateProvince: (provinceId: string, updates: Partial<Province>) => void;
  onUpdateNation: (nationId: string, updates: Partial<Nation>) => void;
}

export function useSimulationEngine({
  gameState,
  provinces,
  nations,
  onAdvanceTime,
  onUpdateProvince,
  onUpdateNation
}: UseSimulationEngineProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (gameState.isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 1 real second = 1 week in game time
    const updateInterval = 1000 / gameState.timeSpeed;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeDelta = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      // Calculate weeks to advance (1 second = 1 week)
      const weeksToAdvance = (timeDelta / 1000) * gameState.timeSpeed;

      if (weeksToAdvance >= 1) {
        // Advance time by 7 days per week
        onAdvanceTime(Math.floor(weeksToAdvance) * 7);
        
        // Run simulation updates every week
        simulateProvinces(provinces, nations, Math.floor(weeksToAdvance), onUpdateProvince);
        simulateNations(nations, provinces, Math.floor(weeksToAdvance), onUpdateNation);
      }
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameState.isPaused, gameState.timeSpeed, provinces, nations, onAdvanceTime, onUpdateProvince, onUpdateNation]);
}

function simulateProvinces(
  provinces: Province[], 
  nations: Nation[],
  weeksElapsed: number,
  onUpdateProvince: (provinceId: string, updates: Partial<Province>) => void
) {
  provinces.forEach(province => {
    const updates: Partial<Province> = {};
    
    // Get the nation that owns this province
    const owningNation = nations.find(n => n.name === province.country);
    if (!owningNation) return;

    // 1. Population growth (yearly rate applied proportionally per week)
    // Assuming typical developed country growth rate of 0.5-1.5% per year
    const baseGrowthRate = 0.01; // 1% per year base rate
    const infrastructureBonus = (province.infrastructure.healthcare + province.infrastructure.education) * 0.001;
    const economicBonus = province.economy.gdpPerCapita > 50000 ? 0.002 : 
                         province.economy.gdpPerCapita > 30000 ? 0.001 : 0;
    const unrestPenalty = province.unrest > 5 ? -0.002 : 0;
    
    const annualGrowthRate = baseGrowthRate + infrastructureBonus + economicBonus + unrestPenalty;
    const weeklyGrowthRate = annualGrowthRate / 52; // Convert to weekly
    
    const populationGrowth = province.population.total * weeklyGrowthRate * weeksElapsed;
    if (Math.abs(populationGrowth) >= 1) {
      updates.population = {
        ...province.population,
        total: Math.floor(province.population.total + populationGrowth)
      };
    }

    // 2. GDP updates (based on population + infrastructure)
    const infrastructureLevel = (province.infrastructure.roads + 
                               province.infrastructure.internet + 
                               province.infrastructure.healthcare + 
                               province.infrastructure.education) / 4;
    
    const baseGdpPerCapita = province.economy.gdpPerCapita;
    const expectedGdpPerCapita = baseGdpPerCapita * (1 + (infrastructureLevel - 2.5) * 0.05); // Infrastructure bonus/penalty
    
    // GDP adjusts slowly toward expected value based on infrastructure
    const gdpAdjustmentRate = 0.02; // 2% adjustment per week toward expected
    const gdpChange = (expectedGdpPerCapita - baseGdpPerCapita) * gdpAdjustmentRate * weeksElapsed;
    
    if (Math.abs(gdpChange) >= 10) { // Only update if change is significant
      updates.economy = {
        ...province.economy,
        gdpPerCapita: Math.max(1000, baseGdpPerCapita + gdpChange)
      };
    }

    // 3. Unrest changes (+0.1/month if GDP < expected value)
    // Note: 1 month ≈ 4.33 weeks
    const monthsElapsed = weeksElapsed / 4.33;
    const currentGdp = updates.economy?.gdpPerCapita || province.economy.gdpPerCapita;
    
    if (currentGdp < expectedGdpPerCapita * 0.95) { // If GDP is 5% below expected
      const unrestIncrease = 0.1 * monthsElapsed; // +0.1 per month
      updates.unrest = Math.min(10, province.unrest + unrestIncrease);
    } else if (currentGdp > expectedGdpPerCapita * 1.05) { // If GDP is 5% above expected
      const unrestDecrease = 0.05 * monthsElapsed; // -0.05 per month (slower improvement)
      updates.unrest = Math.max(0, province.unrest - unrestDecrease);
    }

    // Random economic fluctuations (smaller scale)
    if (Math.random() < 0.1 * weeksElapsed) { // 10% chance per week
      const randomEconomicChange = (Math.random() - 0.5) * 0.02; // ±1% random change
      const currentEconomy = updates.economy || province.economy;
      updates.economy = {
        ...currentEconomy,
        gdpPerCapita: Math.max(1000, currentEconomy.gdpPerCapita * (1 + randomEconomicChange))
      };
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      onUpdateProvince(province.id, updates);
    }
  });
}

function simulateNations(
  nations: Nation[], 
  provinces: Province[],
  weeksElapsed: number,
  onUpdateNation: (nationId: string, updates: Partial<Nation>) => void
) {
  nations.forEach(nation => {
    const updates: Partial<Nation> = {};
    
    // Get provinces belonging to this nation
    const nationProvinces = provinces.filter(p => p.country === nation.name);
    if (nationProvinces.length === 0) return;

    // Calculate aggregate metrics from provinces
    const totalPopulation = nationProvinces.reduce((sum, p) => sum + p.population.total, 0);
    const avgUnrest = nationProvinces.reduce((sum, p) => sum + p.unrest, 0) / nationProvinces.length;
    const avgGdpPerCapita = nationProvinces.reduce((sum, p) => sum + (p.economy.gdpPerCapita * p.population.total), 0) / totalPopulation;

    // Government approval changes based on province conditions
    if (Math.random() < 0.2 * weeksElapsed) { // 20% chance per week
      const approvalChange = (Math.random() - 0.5) * 1; // -0.5 to +0.5 base change
      
      // Economic conditions affect approval
      const economicFactor = nation.economy.inflation > 4 ? -0.3 : 
                           nation.economy.tradeBalance > 0 ? 0.2 : 0;
      
      // Unrest affects approval
      const unrestFactor = avgUnrest > 6 ? -0.4 : avgUnrest < 3 ? 0.2 : 0;
      
      const totalChange = (approvalChange + economicFactor + unrestFactor) * weeksElapsed;
      const newApproval = Math.max(0, Math.min(100, nation.government.approval + totalChange));
      
      updates.government = {
        ...nation.government,
        approval: newApproval
      };
    }

    // National GDP update based on provincial GDP
    const expectedGdp = totalPopulation * avgGdpPerCapita;
    const gdpAdjustmentRate = 0.01; // 1% adjustment per week toward expected
    const gdpChange = (expectedGdp - nation.economy.gdp) * gdpAdjustmentRate * weeksElapsed;
    
    if (Math.abs(gdpChange) >= nation.economy.gdp * 0.001) { // Only update if change is >0.1%
      updates.economy = {
        ...nation.economy,
        gdp: Math.max(nation.economy.gdp * 0.5, nation.economy.gdp + gdpChange)
      };
    }

    // Research progress based on GDP and tech infrastructure
    const researchEfficiency = Math.max(0.5, avgGdpPerCapita / 50000); // Higher GDP = more research efficiency
    const baseResearchGain = 20 * researchEfficiency * weeksElapsed;
    const researchGain = Math.floor(baseResearchGain + (Math.random() - 0.5) * baseResearchGain * 0.3);
    
    if (researchGain > 0) {
      updates.technology = {
        ...nation.technology,
        researchPoints: nation.technology.researchPoints + researchGain
      };
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      onUpdateNation(nation.id, updates);
    }
  });
}