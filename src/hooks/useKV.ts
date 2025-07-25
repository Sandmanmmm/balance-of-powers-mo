import { useState, useEffect, useCallback } from 'react';

// Check if spark.kv is available, otherwise use localStorage
function getStorageBackend() {
  if (typeof window !== 'undefined' && (window as any).spark?.kv) {
    return (window as any).spark.kv;
  }
  
  // Fallback to localStorage with similar API
  return {
    async get<T>(key: string): Promise<T | undefined> {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : undefined;
      } catch {
        return undefined;
      }
    },
    async set<T>(key: string, value: T): Promise<void> {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    },
    async delete(key: string): Promise<void> {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Failed to delete from localStorage:', error);
      }
    }
  };
}

export function useKV<T>(key: string, defaultValue: T): [
  T,
  (value: T | ((current: T) => T)) => void,
  () => void
] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial value from KV store
  useEffect(() => {
    async function loadValue() {
      try {
        const storage = getStorageBackend();
        const stored = await storage.get<T>(key);
        if (stored !== undefined) {
          setValue(stored);
        }
        setIsLoaded(true);
      } catch (error) {
        console.error(`Failed to load KV value for key "${key}":`, error);
        setIsLoaded(true);
      }
    }

    loadValue();
  }, [key]);

  // Update function
  const updateValue = useCallback(async (newValue: T | ((current: T) => T)) => {
    try {
      const finalValue = typeof newValue === 'function' 
        ? (newValue as (current: T) => T)(value)
        : newValue;
      
      setValue(finalValue);
      const storage = getStorageBackend();
      await storage.set(key, finalValue);
    } catch (error) {
      console.error(`Failed to update KV value for key "${key}":`, error);
    }
  }, [key, value]);

  // Delete function
  const deleteValue = useCallback(async () => {
    try {
      setValue(defaultValue);
      const storage = getStorageBackend();
      await storage.delete(key);
    } catch (error) {
      console.error(`Failed to delete KV value for key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [value, updateValue, deleteValue];
}