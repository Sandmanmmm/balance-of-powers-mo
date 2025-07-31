import { useState, useEffect, useCallback } from 'react';
// import { useKV } from '@github/spark/hooks';
import { useKV } from './useKV';
import { GameState, Province, Nation, GameEvent, MapOverlayType, ConstructionProject, Building } from '../lib/types';
import { getBuildings } from '../data/gameData';
import { loadGameData } from '../data/gameData';
import { validateBuildingPlacement } from './useSimulationEngine';

const initialGameState: GameState = {
  currentDate: new Date('1990-01-01'),
  timeSpeed: 1,
  isPaused: false,
  selectedNation: 'CAN',
  mapOverlay: 'political',
  notifications: []
};

export function useGameState() {
  // Use regular state instead of useKV to avoid type issues
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  // Temporarily use regular useState instead of useKV to test if that's the issue
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);

  // Load buildings data
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildingsData = await getBuildings();
        setBuildings(buildingsData);
        console.log('✓ Buildings loaded:', buildingsData.length);
      } catch (error) {
        console.error('❌ Failed to load buildings:', error);
      }
    };
    loadBuildings();
  }, []);

  const getBuildingById = useCallback((id: string) => {
    return buildings.find(b => b.id === id);
  }, [buildings]);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Debug: Force clear old state if it's empty
  useEffect(() => {
    if (isInitialized && Array.isArray(nations) && nations.length === 0) {
      console.warn('useGameState: Nations array is empty after initialization - clearing cache and forcing reload');
      // Clear the cache to force fresh data loading
      import('../data/gameData').then(({ clearGameDataCache }) => {
        clearGameDataCache();
      });
      setIsInitialized(false);
    }
  }, [nations, isInitialized]);

  // Debug logging
  useEffect(() => {
    console.log('useGameState - Debug Info:', {
      provincesType: typeof provinces,
      provincesIsArray: Array.isArray(provinces),
      provincesLength: Array.isArray(provinces) ? provinces.length : 'N/A',
      nationsType: typeof nations,
      nationsIsArray: Array.isArray(nations),
      nationsLength: Array.isArray(nations) ? nations.length : 'N/A',
      gameStateType: typeof gameState,
      isInitialized
    });
  }, [provinces, nations, gameState, isInitialized]);

  // Immediate initialization with YAML data on first mount
  useEffect(() => {
    if (!isInitialized) {
      console.log('Immediate initialization with YAML data');
      
      const initializeData = async () => {
        try {
          console.log('Loading game data (using modular loader)...');
          const gameData = await loadGameData();
          
          console.log('getGameData returned:', {
            provinces: gameData.provinces?.length || 0,
            nations: gameData.nations?.length || 0,
            boundaries: Object.keys(gameData.boundaries || {}).length
          });
          
          // Additional validation
          if (!gameData.provinces || !Array.isArray(gameData.provinces)) {
            console.error('Invalid provinces data returned:', typeof gameData.provinces);
            throw new Error('Invalid provinces data');
          }
          
          if (!gameData.nations || !Array.isArray(gameData.nations)) {
            console.error('Invalid nations data returned:', typeof gameData.nations);
            throw new Error('Invalid nations data');
          }
          
          if (Array.isArray(gameData.provinces) && gameData.provinces.length > 0 && 
              Array.isArray(gameData.nations) && gameData.nations.length > 0) {
            
            console.log(`Setting ${gameData.provinces.length} provinces and ${gameData.nations.length} nations`);
            const canadianProvinces = gameData.provinces.filter(p => p.country === 'Canada');
            console.log('Canadian provinces:', canadianProvinces.map(p => `${p.id}: ${p.name}`));
            console.log('Available nations:', gameData.nations.map(n => `${n.id}: ${n.name}`));
            
            setProvinces(gameData.provinces);
            
            // Ensure all nations have proper technology objects
            const safeNations = gameData.nations.map(nation => {
              if (!nation.technology) {
                console.warn(`Nation ${nation.id} missing technology object, adding defaults`);
                return {
                  ...nation,
                  technology: {
                    researchPoints: 0,
                    currentResearch: [],
                    completedTech: [],
                    level: 1
                  }
                };
              }
              return nation;
            });
            
            setNations(safeNations);
            setIsInitialized(true);
            console.log('✓ Game data initialization completed successfully');
            
            // Debug: Check if Canada nation exists
            const canadaNation = gameData.nations.find(n => n.id === 'CAN');
            if (canadaNation) {
              console.log('✓ Canada nation found:', canadaNation.name, 'with leader:', canadaNation.government?.leader);
            } else {
              console.error('❌ Canada nation not found in loaded data');
            }
          } else {
            console.error('❌ Failed to load provinces or nations - invalid data structure');
            console.error('Provinces:', typeof gameData.provinces, Array.isArray(gameData.provinces) ? gameData.provinces.length : 'NOT_ARRAY');
            console.error('Nations:', typeof gameData.nations, Array.isArray(gameData.nations) ? gameData.nations.length : 'NOT_ARRAY');
            setIsInitialized(true);
          }
        } catch (error) {
          console.error('❌ Error during game data initialization:', error);
          console.error('Error details:', error);
          setIsInitialized(true); // Still mark as initialized to prevent infinite loading
        }
      };
      
      initializeData();
    }
  }, [isInitialized]);

  // Initialize data from YAML when component mounts - DISABLED FOR NOW
  /*
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('Starting data initialization...');
        
        console.log('Loading provinces...');
        const loadedProvinces = await getProvinces();
        console.log('getProvinces returned:', loadedProvinces?.length || 0, 'provinces');
        
        if (Array.isArray(loadedProvinces) && loadedProvinces.length > 0) {
          console.log(`✓ Setting ${loadedProvinces.length} provinces in state`);
          const canadianProvinces = loadedProvinces.filter(p => p.country === 'Canada');
          console.log(`Canadian provinces:`, canadianProvinces.map(p => p.name));
          setProvinces(loadedProvinces);
        } else {
          console.error('❌ No provinces returned from getProvinces()');
          setProvinces([]);
        }
        
        console.log('Loading nations...');
        const loadedNations = await getNations();
        console.log('getNations returned:', loadedNations?.length || 0, 'nations');
        
        if (Array.isArray(loadedNations) && loadedNations.length > 0) {
          console.log(`✓ Setting ${loadedNations.length} nations in state`);
          const canadaNation = loadedNations.find(n => n.id === 'CAN');
          if (canadaNation) {
            console.log(`✓ Canada found:`, canadaNation.name, 'Leader:', canadaNation.government?.leader);
          } else {
            console.warn('⚠ Canada not found in loaded nations');
          }
          setNations(loadedNations);
        } else {
          console.error('❌ No nations returned from getNations()');
          setNations([]);
        }
        
        console.log('Data initialization completed - setting initialized to true');
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing game data:', error);
        // Still mark as initialized to prevent infinite loading
        console.log('Setting initialized to true despite error');
        setIsInitialized(true);
      }
    };
    
    // Always initialize, but only once per mount
    if (!isInitialized) {
      console.log('Initialization needed - starting async data load');
      initializeData();
    } else {
      console.log('Already initialized, skipping data load');
    }
  }, [setProvinces, setNations, isInitialized, setIsInitialized]);
  */

  // Computed game state with proper date handling
  const computedGameState = {
    ...gameState,
    currentDate: (gameState.currentDate instanceof Date) 
      ? gameState.currentDate 
      : new Date(gameState.currentDate || '1990-01-01')
  };

  // Ensure all nations have properly initialized diplomacy arrays
  useEffect(() => {
    const safeNations = Array.isArray(nations) ? nations : [];
    if (safeNations.length > 0) {
      const needsUpdate = safeNations.some(nation => {
        if (!nation) return true;
        return !nation.diplomacy?.embargoes || 
               !nation.diplomacy?.sanctions ||
               !Array.isArray(nation.diplomacy.embargoes) ||
               !Array.isArray(nation.diplomacy.sanctions) ||
               !nation.tradeOffers ||
               !nation.tradeAgreements ||
               !nation.resourceStockpiles ||
               !nation.resourceProduction ||
               !nation.resourceConsumption;
      });
      
      if (needsUpdate) {
        const fixedNations = safeNations.map(nation => {
          if (!nation) {
            console.error('Found null/undefined nation in nations array');
            return null;
          }
          return {
            ...nation,
            diplomacy: {
              ...nation.diplomacy,
              embargoes: Array.isArray(nation.diplomacy?.embargoes) ? nation.diplomacy.embargoes : [],
              sanctions: Array.isArray(nation.diplomacy?.sanctions) ? nation.diplomacy.sanctions : []
            },
            military: {
              ...nation.military,
              readiness: nation.military?.readiness ?? 100
            },
            tradeOffers: Array.isArray(nation.tradeOffers) ? nation.tradeOffers : [],
            tradeAgreements: Array.isArray(nation.tradeAgreements) ? nation.tradeAgreements : [],
            resourceStockpiles: nation.resourceStockpiles || {},
            resourceProduction: nation.resourceProduction || {},
            resourceConsumption: nation.resourceConsumption || {},
            resourceShortages: nation.resourceShortages || {},
            resourceEfficiency: nation.resourceEfficiency || { overall: 1.0 }
          };
        }).filter(Boolean) as Nation[];
        
        console.log('Fixed nation arrays for', fixedNations.length, 'nations');
        setNations(fixedNations);
      }
    }
  }, [nations, setNations]);

  // Ensure all provinces have properly initialized features arrays
  useEffect(() => {
    const safeProvinces = Array.isArray(provinces) ? provinces : [];
    if (safeProvinces.length > 0) {
      const needsUpdate = safeProvinces.some(province => {
        if (!province) return true;
        return !Array.isArray(province.features) || 
               !Array.isArray(province.buildings) || 
               !Array.isArray(province.constructionProjects);
      });
      
      if (needsUpdate) {
        const fixedProvinces = safeProvinces.map(province => {
          if (!province) {
            console.error('Found null/undefined province in provinces array');
            return null;
          }
          return {
            ...province,
            features: Array.isArray(province.features) ? province.features : [],
            buildings: Array.isArray(province.buildings) ? province.buildings : [],
            constructionProjects: Array.isArray(province.constructionProjects) ? province.constructionProjects : []
          };
        }).filter(Boolean) as Province[];
        
        console.log('Fixed province arrays for', fixedProvinces.length, 'provinces');
        setProvinces(fixedProvinces);
      }
    }
  }, [provinces, setProvinces]);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    const newState = { ...computedGameState, ...updates };
    setGameState(newState);
  }, [computedGameState, setGameState]);

  const resetGameData = useCallback(() => {
    console.log('Resetting all game data...');
    // Clear the state completely to ensure fresh start
    setProvinces([]);
    setNations([]);
    setGameState(initialGameState);
    setIsInitialized(false);
    
    // Clear the modular data cache
    import('../data/gameData').then(({ clearGameDataCache }) => {
      clearGameDataCache();
    });
    
    // Force clear localStorage as backup
    if (typeof window !== 'undefined') {
      console.log('Clearing any cached KV data...');
      // The useKV hook may be using localStorage or sessionStorage
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('provinces') || key.includes('nations') || key.includes('gameState')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Could not clear localStorage:', e);
      }
    }
  }, [setGameState]);

  const forceReload = useCallback(() => {
    console.log('useGameState: forceReload called');
    resetGameData();
    
    // Force re-initialization
    setTimeout(() => {
      setIsInitialized(false);
    }, 100);
  }, [resetGameData]);

  const selectProvince = useCallback((provinceId: string | undefined) => {
    updateGameState({ selectedProvince: provinceId });
  }, [updateGameState]);

  const selectNation = useCallback((nationId: string) => {
    updateGameState({ selectedNation: nationId });
  }, [updateGameState]);

  const setMapOverlay = useCallback((overlay: MapOverlayType) => {
    updateGameState({ mapOverlay: overlay });
  }, [updateGameState]);

  const togglePause = useCallback(() => {
    updateGameState({ isPaused: !computedGameState.isPaused });
  }, [computedGameState.isPaused, updateGameState]);

  const setTimeSpeed = useCallback((speed: number) => {
    updateGameState({ timeSpeed: speed });
  }, [updateGameState]);

  const advanceTime = useCallback((days: number) => {
    // Ensure we're working with a proper Date object
    const currentDate = computedGameState.currentDate instanceof Date 
      ? computedGameState.currentDate 
      : new Date(computedGameState.currentDate || '1990-01-01');
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    updateGameState({ currentDate: newDate });
  }, [computedGameState.currentDate, updateGameState]);

  const getProvince = useCallback((id: string) => {
    const safeProvinces = Array.isArray(provinces) ? provinces : [];
    return safeProvinces.find(p => p && p.id === id);
  }, [provinces]);

  const getNation = useCallback((id: string) => {
    const safeNations = Array.isArray(nations) ? nations : [];
    return safeNations.find(n => n && n.id === id);
  }, [nations]);

  const getSelectedProvince = useCallback(() => {
    return computedGameState.selectedProvince ? getProvince(computedGameState.selectedProvince) : undefined;
  }, [computedGameState.selectedProvince, getProvince]);

  const getSelectedNation = useCallback(() => {
    return getNation(computedGameState.selectedNation);
  }, [computedGameState.selectedNation, getNation]);

  const updateProvince = useCallback((provinceId: string, updates: Partial<Province>) => {
    setProvinces(currentProvinces => {
      const safeProvinces = Array.isArray(currentProvinces) ? currentProvinces : [];
      return safeProvinces.map(p => 
        p && p.id === provinceId ? { ...p, ...updates } : p
      );
    });
  }, [setProvinces]);

  const updateNation = useCallback((nationId: string, updates: Partial<Nation>) => {
    setNations(currentNations => {
      const safeNations = Array.isArray(currentNations) ? currentNations : [];
      return safeNations.map(n => {
        if (n && n.id === nationId) {
          // Ensure technology object is never undefined
          const mergedNation = { ...n, ...updates };
          if (!mergedNation.technology) {
            mergedNation.technology = {
              researchPoints: 0,
              currentResearch: [],
              completedTech: [],
              level: 1
            };
          }
          return mergedNation;
        }
        return n;
      });
    });
  }, [setNations]);

  const addEvent = useCallback((event: GameEvent) => {
    setEvents(currentEvents => [...currentEvents, event]);
    updateGameState({ 
      notifications: [...computedGameState.notifications, event] 
    });
  }, [setEvents, computedGameState.notifications, updateGameState]);

  const removeNotification = useCallback((eventId: string) => {
    updateGameState({
      notifications: computedGameState.notifications.filter(n => n.id !== eventId)
    });
  }, [computedGameState.notifications, updateGameState]);

  const startConstruction = useCallback((buildingId: string, provinceId: string) => {
    const building = getBuildingById(buildingId);
    const province = getProvince(provinceId);
    const nation = province ? getNation(computedGameState.selectedNation) : null;
    
    if (!building || !province || !nation) {
      throw new Error('Invalid building, province, or nation');
    }
    
    // Validate building placement using features
    const validation = validateBuildingPlacement(buildingId, province, nation);
    if (!validation.valid) {
      throw new Error(validation.reason || 'Building placement not valid');
    }
    
    if (nation.economy.treasury < building.cost) {
      throw new Error('Insufficient funds');
    }
    
    // Create construction project
    const project: ConstructionProject = {
      id: `construction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      buildingId,
      provinceId,
      startDate: new Date(computedGameState.currentDate).toISOString(),
      completionDate: new Date(new Date(computedGameState.currentDate).getTime() + building.buildTime * 7 * 24 * 60 * 60 * 1000).toISOString(), // buildTime is in weeks
      remainingTime: building.buildTime,
      cost: building.cost,
      status: 'in_progress'
    };
    
    // Deduct cost from treasury
    updateNation(computedGameState.selectedNation, {
      economy: {
        ...nation.economy,
        treasury: nation.economy.treasury - building.cost
      }
    });
    
    // Add construction project to province
    updateProvince(provinceId, {
      constructionProjects: [...(province.constructionProjects || []), project]
    });
  }, [getProvince, getNation, computedGameState.selectedNation, computedGameState.currentDate, updateNation, updateProvince, getBuildingById]);

  const cancelConstruction = useCallback((projectId: string) => {
    // Find the project to cancel
    let foundProject: ConstructionProject | null = null;
    let provinceId: string | null = null;
    
    const safeProvinces = Array.isArray(provinces) ? provinces : [];
    for (const province of safeProvinces) {
      if (!province) continue;
      const project = (province.constructionProjects || []).find(p => p && p.id === projectId);
      if (project) {
        foundProject = project;
        provinceId = province.id;
        break;
      }
    }
    
    if (!foundProject || !provinceId) {
      throw new Error('Construction project not found');
    }
    
    const nation = getNation(computedGameState.selectedNation);
    if (!nation) {
      throw new Error('Nation not found');
    }
    
    // Refund 50% of the cost
    const refund = Math.floor(foundProject.cost * 0.5);
    updateNation(computedGameState.selectedNation, {
      economy: {
        ...nation.economy,
        treasury: nation.economy.treasury + refund
      }
    });
    
    // Remove the project from the province
    const province = getProvince(provinceId);
    if (province) {
      updateProvince(provinceId, {
        constructionProjects: (province.constructionProjects || []).filter(p => p.id !== projectId)
      });
    }
  }, [provinces, getNation, computedGameState.selectedNation, updateNation, getProvince, updateProvince]);

  const processConstructionTick = useCallback(() => {
    // Process all construction projects
    const safeProvinces = Array.isArray(provinces) ? provinces : [];
    safeProvinces.forEach(province => {
      if (!province) return;
      
      const updatedProjects: ConstructionProject[] = [];
      const completedBuildings: any[] = [...(province.buildings || [])];
      
      (province.constructionProjects || []).forEach(project => {
        if (!project) return;
        
        if (project.status === 'in_progress') {
          const updatedProject = {
            ...project,
            remainingTime: project.remainingTime - 1
          };
          
          if (updatedProject.remainingTime <= 0) {
            // Construction completed
            const building = getBuildingById(project.buildingId);
            if (building) {
              completedBuildings.push({
                buildingId: project.buildingId,
                level: 1,
                constructedDate: new Date(computedGameState.currentDate).toISOString(),
                effects: building.improves || {}
              });
            }
          } else {
            updatedProjects.push(updatedProject);
          }
        } else {
          updatedProjects.push(project);
        }
      });
      
      // Update province if there were changes
      if (updatedProjects.length !== (province.constructionProjects || []).length || 
          completedBuildings.length !== (province.buildings || []).length) {
        updateProvince(province.id, {
          constructionProjects: updatedProjects,
          buildings: completedBuildings
        });
      }
    });
  }, [provinces, computedGameState.currentDate, updateProvince, getBuildingById]);

  return {
    gameState: computedGameState,
    provinces: Array.isArray(provinces) ? provinces : [],
    nations: Array.isArray(nations) ? nations : [],
    events,
    isInitialized,
    setIsInitialized,
    selectProvince,
    selectNation,
    setMapOverlay,
    togglePause,
    setTimeSpeed,
    advanceTime,
    getProvince,
    getNation,
    getSelectedProvince,
    getSelectedNation,
    updateProvince,
    updateNation,
    getBuildingById,
    addEvent,
    removeNotification,
    startConstruction,
    cancelConstruction,
    processConstructionTick,
    resetGameData,
    forceReload
  };
}