import { useEffect, useRef } from 'react';
import { GameState, Province, Nation } from '../lib/types';

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

    const updateInterval = 1000 / gameState.timeSpeed; // Base update every second, modified by speed

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeDelta = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      // Calculate days to advance based on time speed
      // 1 real second = 1 game day at 1x speed
      const daysToAdvance = (timeDelta / 1000) * gameState.timeSpeed;

      if (daysToAdvance >= 1) {
        onAdvanceTime(Math.floor(daysToAdvance));
        
        // Run simulation updates
        simulateProvinces(provinces, onUpdateProvince);
        simulateNations(nations, onUpdateNation);
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
  onUpdateProvince: (provinceId: string, updates: Partial<Province>) => void
) {
  provinces.forEach(province => {
    // Simple simulation: slightly random changes to various metrics
    const updates: Partial<Province> = {};

    // Economic growth/decline
    const economicChange = (Math.random() - 0.5) * 0.1; // -5% to +5% change
    if (Math.random() < 0.1) { // 10% chance of economic update per cycle
      updates.economy = {
        ...province.economy,
        gdpPerCapita: Math.max(1000, province.economy.gdpPerCapita * (1 + economicChange))
      };
    }

    // Unrest changes based on economic conditions and random events
    if (Math.random() < 0.05) { // 5% chance of unrest change
      const unrestChange = (Math.random() - 0.5) * 0.5; // -0.25 to +0.25
      // Economic conditions affect unrest
      const economicFactor = province.economy.unemployment > 8 ? 0.1 : 
                           province.economy.unemployment < 4 ? -0.1 : 0;
      updates.unrest = Math.max(0, Math.min(10, province.unrest + unrestChange + economicFactor));
    }

    // Population growth
    if (Math.random() < 0.02) { // 2% chance of population change
      const growthRate = 0.001; // Small growth
      updates.population = {
        ...province.population,
        total: Math.floor(province.population.total * (1 + growthRate))
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
  onUpdateNation: (nationId: string, updates: Partial<Nation>) => void
) {
  nations.forEach(nation => {
    const updates: Partial<Nation> = {};

    // Government approval changes
    if (Math.random() < 0.1) { // 10% chance of approval change
      const approvalChange = (Math.random() - 0.5) * 2; // -1 to +1
      // Economic conditions affect approval
      const economicFactor = nation.economy.inflation > 4 ? -0.5 : 
                           nation.economy.tradeBalance > 0 ? 0.3 : 0;
      
      const newApproval = Math.max(0, Math.min(100, nation.government.approval + approvalChange + economicFactor));
      
      updates.government = {
        ...nation.government,
        approval: newApproval
      };
    }

    // Economic changes
    if (Math.random() < 0.08) { // 8% chance of economic update
      const gdpChange = (Math.random() - 0.5) * 0.02; // -1% to +1%
      const inflationChange = (Math.random() - 0.5) * 0.1; // -0.05% to +0.05%
      
      updates.economy = {
        ...nation.economy,
        gdp: Math.max(nation.economy.gdp * 0.5, nation.economy.gdp * (1 + gdpChange)),
        inflation: Math.max(0, Math.min(20, nation.economy.inflation + inflationChange))
      };
    }

    // Research progress
    if (Math.random() < 0.15) { // 15% chance of research progress
      const researchGain = Math.floor(Math.random() * 50) + 10; // 10-60 research points
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