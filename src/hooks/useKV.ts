import { useState, useEffect, useCallback } from 'react';

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
        const stored = await spark.kv.get<T>(key);
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
      await spark.kv.set(key, finalValue);
    } catch (error) {
      console.error(`Failed to update KV value for key "${key}":`, error);
    }
  }, [key, value]);

  // Delete function
  const deleteValue = useCallback(async () => {
    try {
      setValue(defaultValue);
      await spark.kv.delete(key);
    } catch (error) {
      console.error(`Failed to delete KV value for key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [value, updateValue, deleteValue];
}