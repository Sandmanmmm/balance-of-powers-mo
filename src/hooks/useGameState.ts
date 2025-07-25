import { useState, useEffect, useCallback } from 'react';
import { useKV } from './useKV';
import { GameState, Province, Nation, GameEvent, MapOverlayType } from '../lib/types';
import { sampleProvinces, sampleNations, sampleEvents } from '../lib/gameData';

const initialGameState: GameState = {
  currentDate: new Date('1990-01-01'),
  timeSpeed: 1,
  isPaused: false,
  selectedNation: 'USA',
  mapOverlay: 'political',
  notifications: []
};

export function useGameState() {
  const [gameState, setGameState] = useKV('gameState', initialGameState);
  const [provinces, setProvinces] = useKV('provinces', sampleProvinces);
  const [nations, setNations] = useKV('nations', sampleNations);
  const [events, setEvents] = useKV('events', sampleEvents);
  
  const [localGameState, setLocalGameState] = useState<GameState>(gameState);

  useEffect(() => {
    setLocalGameState(gameState);
  }, [gameState]);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    const newState = { ...localGameState, ...updates };
    setLocalGameState(newState);
    setGameState(newState);
  }, [localGameState, setGameState]);

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
    updateGameState({ isPaused: !localGameState.isPaused });
  }, [localGameState.isPaused, updateGameState]);

  const setTimeSpeed = useCallback((speed: number) => {
    updateGameState({ timeSpeed: speed });
  }, [updateGameState]);

  const advanceTime = useCallback((days: number) => {
    const newDate = new Date(localGameState.currentDate);
    newDate.setDate(newDate.getDate() + days);
    updateGameState({ currentDate: newDate });
  }, [localGameState.currentDate, updateGameState]);

  const getProvince = useCallback((id: string) => {
    return provinces.find(p => p.id === id);
  }, [provinces]);

  const getNation = useCallback((id: string) => {
    return nations.find(n => n.id === id);
  }, [nations]);

  const getSelectedProvince = useCallback(() => {
    return localGameState.selectedProvince ? getProvince(localGameState.selectedProvince) : undefined;
  }, [localGameState.selectedProvince, getProvince]);

  const getSelectedNation = useCallback(() => {
    return getNation(localGameState.selectedNation);
  }, [localGameState.selectedNation, getNation]);

  const updateProvince = useCallback((provinceId: string, updates: Partial<Province>) => {
    setProvinces(currentProvinces => 
      currentProvinces.map(p => 
        p.id === provinceId ? { ...p, ...updates } : p
      )
    );
  }, [setProvinces]);

  const updateNation = useCallback((nationId: string, updates: Partial<Nation>) => {
    setNations(currentNations => 
      currentNations.map(n => 
        n.id === nationId ? { ...n, ...updates } : n
      )
    );
  }, [setNations]);

  const addEvent = useCallback((event: GameEvent) => {
    setEvents(currentEvents => [...currentEvents, event]);
    updateGameState({ 
      notifications: [...localGameState.notifications, event] 
    });
  }, [setEvents, localGameState.notifications, updateGameState]);

  const removeNotification = useCallback((eventId: string) => {
    updateGameState({
      notifications: localGameState.notifications.filter(n => n.id !== eventId)
    });
  }, [localGameState.notifications, updateGameState]);

  return {
    gameState: localGameState,
    provinces,
    nations,
    events,
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
    addEvent,
    removeNotification
  };
}