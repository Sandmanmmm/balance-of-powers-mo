import { DetailLevel, GeoJSONFeatureCollection, GeoJSONFeature } from '@/types/geo';

interface CacheEntry {
  data: GeoJSONFeatureCollection;
  size: number;
  timestamp: number;
}

interface LoadStats {
  totalFiles: number;
  totalSize: number;
  loadTime: number;
  errors: string[];
}

export class GeographicDataManager {
  private cache = new Map<string, CacheEntry>();
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private loadingPromises = new Map<string, Promise<GeoJSONFeatureCollection>>();
  private loadStats: LoadStats = {
    totalFiles: 0,
    totalSize: 0,
    loadTime: 0,
    errors: []
  };

  /**
   * Generate cache key for a region/detail combination
   */
  private getCacheKey(region: string, detailLevel: DetailLevel): string {
    return `${region}_${detailLevel}`;
  }

  /**
   * Estimate memory usage of an object using JSON.stringify
   */
  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate for UTF-16
    } catch {
      return 0;
    }
  }

  /**
   * Remove oldest entries from cache until under size limit
   */
  private evictOldEntries(): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    let totalSize = entries.reduce((sum, [, entry]) => sum + entry.size, 0);

    while (totalSize > this.MAX_CACHE_SIZE && entries.length > 0) {
      const [key, entry] = entries.shift()!;
      this.cache.delete(key);
      totalSize -= entry.size;
      console.log(`🗑️ Evicted cache entry: ${key} (${(entry.size / 1024 / 1024).toFixed(1)}MB)`);
    }
  }

  /**
   * Load boundary data for a specific country at a given detail level
   */
  async loadCountryBoundaries(countryCode: string, detailLevel: DetailLevel): Promise<GeoJSONFeatureCollection> {
    const cacheKey = this.getCacheKey(countryCode, detailLevel);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit: ${cacheKey}`);
      return cached.data;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(cacheKey);
    if (existingPromise) {
      console.log(`⏳ Waiting for existing load: ${cacheKey}`);
      return existingPromise;
    }

    // Start new load
    const loadPromise = this.performLoad(countryCode, detailLevel, cacheKey);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Perform the actual file load and cache storage
   */
  private async performLoad(countryCode: string, detailLevel: DetailLevel, cacheKey: string): Promise<GeoJSONFeatureCollection> {
    const startTime = performance.now();
    const filePath = `/data/boundaries/${detailLevel}/${countryCode}.json`;

    try {
      console.log(`🌍 Loading ${detailLevel} boundaries for ${countryCode}...`);
      
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      
      let data: GeoJSONFeatureCollection;
      
      // Check if it's already a FeatureCollection or if it's a Record<string, GeoJSONFeature>
      if (rawData.type === 'FeatureCollection') {
        data = rawData;
      } else if (typeof rawData === 'object' && !Array.isArray(rawData)) {
        // Convert Record<string, GeoJSONFeature> to FeatureCollection
        const features = Object.entries(rawData).map(([id, feature]: [string, any]) => {
          if (feature && feature.type === 'Feature') {
            // Ensure properties exist and include the ID
            if (!feature.properties) {
              feature.properties = {};
            }
            feature.properties.id = feature.properties.id || id;
            return feature;
          }
          return null;
        }).filter(Boolean) as GeoJSONFeature[];
        
        data = {
          type: 'FeatureCollection',
          features
        };
      } else {
        throw new Error(`Invalid data structure in ${filePath}: expected FeatureCollection or Record<string, Feature>`);
      }
      
      // Validate the data structure
      if (!data || !data.features || !Array.isArray(data.features)) {
        throw new Error(`Invalid GeoJSON structure in ${filePath}`);
      }

      // Cache the result
      const size = this.estimateSize(data);
      this.cache.set(cacheKey, {
        data,
        size,
        timestamp: Date.now()
      });

      // Update stats
      const loadTime = performance.now() - startTime;
      this.loadStats.totalFiles++;
      this.loadStats.totalSize += size;
      this.loadStats.loadTime += loadTime;

      console.log(`✅ Loaded ${countryCode} ${detailLevel}: ${data.features.length} features, ${(size / 1024).toFixed(1)}KB, ${loadTime.toFixed(1)}ms`);

      // Evict old entries if needed
      this.evictOldEntries();

      return data;

    } catch (error) {
      const errorMsg = `Failed to load ${filePath}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`❌ ${errorMsg}`);
      this.loadStats.errors.push(errorMsg);
      
      // Return empty collection on error
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
  }

  /**
   * Upgrade a region to higher detail level
   */
  async upgradeRegionDetail(countryCode: string, targetLevel: DetailLevel): Promise<GeoJSONFeatureCollection> {
    const currentLevels: DetailLevel[] = ['overview', 'detailed', 'ultra'];
    const targetIndex = currentLevels.indexOf(targetLevel);
    
    if (targetIndex === -1) {
      throw new Error(`Invalid detail level: ${targetLevel}`);
    }

    // Load the target level
    return this.loadCountryBoundaries(countryCode, targetLevel);
  }

  /**
   * Get current cache statistics
   */
  getCacheStats() {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      entryCount: this.cache.size,
      totalSize,
      totalSizeMB: totalSize / 1024 / 1024,
      maxSizeMB: this.MAX_CACHE_SIZE / 1024 / 1024,
      utilizationPercent: (totalSize / this.MAX_CACHE_SIZE) * 100,
      loadStats: { ...this.loadStats }
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Geographic cache cleared');
  }

  /**
   * Check if a country is cached at a specific detail level
   */
  isCached(countryCode: string, detailLevel: DetailLevel): boolean {
    return this.cache.has(this.getCacheKey(countryCode, detailLevel));
  }

  /**
   * Get available countries in cache
   */
  getCachedCountries(): Array<{ country: string; detailLevel: DetailLevel }> {
    return Array.from(this.cache.keys()).map(key => {
      const [country, detailLevel] = key.split('_');
      return { country, detailLevel: detailLevel as DetailLevel };
    });
  }

  /**
   * Preload multiple countries at a specific detail level
   */
  async preloadCountries(countryCodes: string[], detailLevel: DetailLevel): Promise<void> {
    console.log(`🚀 Preloading ${countryCodes.length} countries at ${detailLevel} detail...`);
    
    const promises = countryCodes.map(code => 
      this.loadCountryBoundaries(code, detailLevel).catch(error => {
        console.warn(`Failed to preload ${code}:`, error);
        return null;
      })
    );

    await Promise.all(promises);
    console.log(`✅ Preload complete`);
  }
}

// Global instance
export const geoManager = new GeographicDataManager();