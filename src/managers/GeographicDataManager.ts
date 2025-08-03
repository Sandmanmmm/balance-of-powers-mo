import { DetailLevel, GeoJSONFeatureCollection, GeoJSONFeature } from '@/types/geo';
import * as geobuf from 'geobuf';
import Pbf from 'pbf';

// Re-export types for convenience
export type { DetailLevel, GeoJSONFeatureCollection, GeoJSONFeature } from '@/types/geo';

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

  // Map ISO country codes to folder names for province boundaries
  private readonly countryCodeToFolderMap: Record<string, string> = {
    'usa': 'usa',
    'can': 'canada', 
    'chn': 'china',
    'ind': 'india',
    'rus': 'russia',
    'mex': 'mexico',
    // Europe regions
    'deu': 'europe_west', // Germany
    'fra': 'europe_west', // France  
    'gbr': 'europe_west', // United Kingdom
    'ita': 'europe_west', // Italy
    'esp': 'europe_west', // Spain
    'pol': 'europe_east', // Poland
    'cze': 'europe_east', // Czech Republic
    'hun': 'europe_east', // Hungary
  };

  /**
   * Get the correct folder name for province boundaries
   */
  private getProvinceFolderName(countryCode: string): string {
    const lowerCode = countryCode.toLowerCase();
    return this.countryCodeToFolderMap[lowerCode] || lowerCode;
  }

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
   * @alias loadNationBoundaries
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
   * Map detail levels to actual directory names
   */
  private getCountryBoundariesPath(detailLevel: DetailLevel): string {
    const levelMap: Record<DetailLevel, string> = {
      'low': 'overview',        // Map "low" to "overview" directory (no low dir exists)
      'overview': 'overview',
      'detailed': 'detailed', 
      'ultra': 'ultra'
    };
    return levelMap[detailLevel] || 'overview';
  }

  /**
   * Perform the actual file load and cache storage
   */
  private async performLoad(countryCode: string, detailLevel: DetailLevel, cacheKey: string): Promise<GeoJSONFeatureCollection> {
    const startTime = performance.now();
    const actualPath = this.getCountryBoundariesPath(detailLevel);
    const filePath = `/data/boundaries/${actualPath}/${countryCode}.json`;

    try {
      console.log(`🌍 Loading ${detailLevel} boundaries for ${countryCode} from ${filePath}...`);
      
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      
      let data: GeoJSONFeatureCollection;
      
      // Validate and normalize the data structure
      if (rawData.type === 'FeatureCollection') {
        // Natural Earth format - use as-is
        data = rawData;
        
        // Ensure all features have proper IDs
        data.features.forEach((feature, index) => {
          if (!feature.properties) {
            feature.properties = {};
          }
          if (!feature.properties.id) {
            feature.properties.id = feature.properties.ISO_A3 || feature.properties.NAME || `feature_${index}`;
          }
        });
        
      } else if (typeof rawData === 'object' && !Array.isArray(rawData)) {
        // Legacy Record<string, GeoJSONFeature> format - convert to FeatureCollection
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
    const currentLevels: DetailLevel[] = ['low', 'overview', 'detailed', 'ultra'];
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
   * Clear cached province data for a specific country
   */
  clearProvinceCache(countryCode: string): void {
    const keysToDelete: string[] = [];
    
    // Find all cache keys for this country (using new cache key format)
    for (const key of this.cache.keys()) {
      if (key.startsWith(`provinces_${countryCode}_`)) {
        keysToDelete.push(key);
      }
    }
    
    // Delete the entries
    for (const key of keysToDelete) {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        console.log(`🗑️ Cleared province cache: ${key} (${(entry.size / 1024 / 1024).toFixed(1)}MB)`);
      }
    }
    
    if (keysToDelete.length > 0) {
      console.log(`✅ Cleared ${keysToDelete.length} province cache entries for ${countryCode}`);
    }
  }

  /**
   * Alias for loadCountryBoundaries for backwards compatibility
   * Returns data as Record<string, GeoJSONFeature> to match legacy expectations
   */
  async loadNationBoundaries(countryCode: string, detailLevel: DetailLevel): Promise<Record<string, GeoJSONFeature>> {
    const featureCollection = await this.loadCountryBoundaries(countryCode, detailLevel);
    
    // Convert FeatureCollection to Record<string, GeoJSONFeature>
    const result: Record<string, GeoJSONFeature> = {};
    featureCollection.features.forEach((feature, index) => {
      const id = feature.properties?.id || feature.properties?.name || `feature_${index}`;
      result[id] = feature;
    });
    
    return result;
  }

  /**
   * Alias for upgradeRegionDetail for backwards compatibility
   * Returns data as Record<string, GeoJSONFeature> to match legacy expectations
   */
  async upgradeNationDetail(countryCode: string, targetLevel: DetailLevel): Promise<Record<string, GeoJSONFeature>> {
    const featureCollection = await this.upgradeRegionDetail(countryCode, targetLevel);
    
    // Convert FeatureCollection to Record<string, GeoJSONFeature>
    const result: Record<string, GeoJSONFeature> = {};
    featureCollection.features.forEach((feature, index) => {
      const id = feature.properties?.id || feature.properties?.name || `feature_${index}`;
      result[id] = feature;
    });
    
    return result;
  }

  /**
   * Load province-level boundaries for a specific country
   * This loads internal subdivisions (states/provinces) rather than country outlines
   */
  async loadProvinceBoundaries(countryCode: string, detailLevel: DetailLevel): Promise<GeoJSONFeatureCollection> {
    // Use the actual path in cache key to ensure different quality levels are cached separately
    const actualDetailLevel = this.getProvinceBoundariesPath(detailLevel);
    const cacheKey = `provinces_${countryCode}_${actualDetailLevel}`;

    console.log(`🔍 PROVINCE LOADING DEBUG:`);
    console.log(`  - Requested: ${countryCode} at ${detailLevel}`);
    console.log(`  - Mapped to: ${actualDetailLevel}`);
    console.log(`  - Cache key: ${cacheKey}`);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit: ${cacheKey} (requested: ${detailLevel} -> actual: ${actualDetailLevel})`);
      return cached.data;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(cacheKey);
    if (existingPromise) {
      console.log(`⏳ Waiting for existing province load: ${cacheKey}`);
      return existingPromise;
    }

    // Start new load
    const loadPromise = this.performProvinceLoad(countryCode, detailLevel, cacheKey);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * TEST METHOD - Remove after debugging
   */
  async testProvinceURL(countryCode: string, detailLevel: DetailLevel): Promise<void> {
    const folderName = this.getProvinceFolderName(countryCode);
    const filePath = `/data/boundaries/provinces/${folderName}/${detailLevel}.json`;
    console.log(`🧪 TEST: Trying to fetch ${filePath}...`);
    
    try {
      const response = await fetch(filePath);
      console.log(`🧪 TEST: Response status: ${response.status} ${response.statusText}`);
      console.log(`🧪 TEST: Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const text = await response.text();
        console.log(`🧪 TEST: Response length: ${text.length} characters`);
        console.log(`🧪 TEST: First 200 chars:`, text.substring(0, 200));
      }
    } catch (error) {
      console.error(`🧪 TEST: Error:`, error);
    }
  }

  /**
   * Map detail levels to actual directory names for province boundaries
   */
  private getProvinceBoundariesPath(detailLevel: DetailLevel): string {
    const levelMap: Record<DetailLevel, string> = {
      'low': 'low',            // Map "low" to "low" file (simplified boundaries)
      'overview': 'overview',   // Map "overview" to "overview" file  
      'detailed': 'detailed',   // Map "detailed" to "detailed" file
      'ultra': 'ultra'         // Map "ultra" to "ultra" file
    };
    return levelMap[detailLevel] || 'overview';
  }

  /**
   * Perform the actual province file load and cache storage
   */
  private async performProvinceLoad(countryCode: string, detailLevel: DetailLevel, cacheKey: string): Promise<GeoJSONFeatureCollection> {
    const startTime = performance.now();
    
    // Use the folder mapping to get the correct path
    const folderName = this.getProvinceFolderName(countryCode);
    const actualDetailLevel = this.getProvinceBoundariesPath(detailLevel);
    const filePath = `/data/boundaries/provinces/${folderName}/${actualDetailLevel}.json`;

    try {
      console.log(`🏛️ Loading ${detailLevel} province boundaries for ${countryCode} from ${filePath}...`);
      console.log(`🔍 PROVINCE DEBUG: countryCode="${countryCode}", folderName="${folderName}", detailLevel="${detailLevel}" -> actualPath="${actualDetailLevel}"`);
      
      const response = await fetch(filePath);
      console.log(`📡 Fetch response for ${filePath}: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error(`❌ Failed to load ${filePath}: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      let data: GeoJSONFeatureCollection;
      
      // Handle different data formats
      if (rawData.type === 'FeatureCollection') {
        // Standard FeatureCollection format (USA, Canada)
        data = rawData;
      } else if (typeof rawData === 'object' && !rawData.type) {
        // Record format (China) - convert to FeatureCollection
        console.log(`🔄 Converting Record format to FeatureCollection for ${countryCode}`);
        data = {
          type: 'FeatureCollection',
          features: Object.values(rawData)
        };
      } else {
        throw new Error(`Invalid province data format: expected FeatureCollection or Record, got ${rawData.type || typeof rawData}`);
      }

      // Ensure all features have proper IDs and filter by country
      const countryPrefix = countryCode.toUpperCase();
      let filteredFeatures = data.features;
      
      console.log(`🔍 Debug province filtering for ${countryCode}:`);
      console.log(`  - Country prefix: ${countryPrefix}`);
      console.log(`  - Original feature count: ${filteredFeatures.length}`);
      console.log(`  - Sample feature IDs:`, filteredFeatures.slice(0, 3).map(f => f.properties?.id));
      
      // Filter features to only include those matching the requested country
      if (countryPrefix) {
        const originalCount = filteredFeatures.length;
        console.log(`🔍 DEBUG FILTERING: countryPrefix="${countryPrefix}", looking for prefix "${countryPrefix}_"`);
        console.log(`🔍 DEBUG FILTERING: First 5 feature IDs before filtering:`, filteredFeatures.slice(0, 5).map(f => `"${f.properties?.id}"`));
        
        filteredFeatures = data.features.filter(feature => {
          const featureId = feature.properties?.id || '';
          const featureName = feature.properties?.name || '';
          
          console.log(`🔍 DEBUG FILTERING: Checking feature ID "${featureId}", starts with "${countryPrefix}_"? ${featureId.startsWith(countryPrefix + '_')}`);
          
          // Match by ID prefix (e.g., "USA_001" for USA)
          if (featureId.startsWith(countryPrefix + '_')) {
            return true;
          }
          
          // Additional matching rules for specific countries
          if (countryPrefix === 'CHN' && (featureId.startsWith('CN_') || featureName.includes('China'))) {
            return true;
          }
          
          return false;
        });
        
        console.log(`🔍 Filtered ${originalCount} features to ${filteredFeatures.length} for country ${countryPrefix}`);
        console.log(`  - Filtered feature IDs:`, filteredFeatures.slice(0, 5).map(f => f.properties?.id));
      }
      
      // Update the data with filtered features
      data.features = filteredFeatures;
      
      data.features.forEach((feature, index) => {
        if (!feature.properties) {
          feature.properties = {};
        }
        if (!feature.properties.id) {
          feature.properties.id = feature.properties.name || `${countryCode}_province_${index}`;
        }
      });

      const loadTime = performance.now() - startTime;
      const size = this.estimateSize(data);
      
      console.log(`✅ Loaded ${data.features.length} provinces for ${countryCode} in ${loadTime.toFixed(1)}ms (${(size / 1024).toFixed(1)}KB)`);

      // Cache the result
      this.evictOldEntries();
      this.cache.set(cacheKey, {
        data,
        size,
        timestamp: Date.now()
      });

      // Update stats
      this.loadStats.totalFiles++;
      this.loadStats.totalSize += size;
      this.loadStats.loadTime += loadTime;

      return data;
      
    } catch (error) {
      console.error(`❌ Failed to load province boundaries for ${countryCode} at ${detailLevel}: ${error}`);
      console.error(`❌ Province load error details:`, error);
      this.loadStats.errors.push(`${countryCode}/${detailLevel}: ${error}`);
      
      // Return empty collection as fallback
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
  }

  /**
   * Load region data - alias for loadCountryBoundaries for backwards compatibility
   * Returns data as Record<string, GeoJSONFeature> to match legacy expectations
   */
  async loadRegion(regionOrCountryCode: string, detailLevel: DetailLevel): Promise<Record<string, GeoJSONFeature>> {
    // First try to load province boundaries (internal subdivisions)
    try {
      const provinceCollection = await this.loadProvinceBoundaries(regionOrCountryCode, detailLevel);
      
      if (provinceCollection.features.length > 0) {
        console.log(`📍 Using province boundaries for ${regionOrCountryCode}: ${provinceCollection.features.length} provinces`);
        
        // Convert FeatureCollection to Record<string, GeoJSONFeature>
        const result: Record<string, GeoJSONFeature> = {};
        provinceCollection.features.forEach((feature, index) => {
          const id = feature.properties?.id || feature.properties?.name || `feature_${index}`;
          result[id] = feature;
        });
        
        return result;
      } else {
        console.log(`⚠️ Province boundaries returned 0 features for ${regionOrCountryCode}, falling back to country boundaries`);
      }
    } catch (error) {
      console.log(`ℹ️ Province boundaries failed for ${regionOrCountryCode}: ${error}, falling back to country boundaries`);
    }
    
    // Fallback to country boundaries
    console.log(`🔄 Loading country boundaries for ${regionOrCountryCode} at ${detailLevel} as fallback...`);
    const featureCollection = await this.loadCountryBoundaries(regionOrCountryCode, detailLevel);
    
    // Convert FeatureCollection to Record<string, GeoJSONFeature>
    const result: Record<string, GeoJSONFeature> = {};
    featureCollection.features.forEach((feature, index) => {
      const id = feature.properties?.id || feature.properties?.name || `feature_${index}`;
      result[id] = feature;
    });
    
    return result;
  }

  /**
   * Get stats - alias for getCacheStats for backwards compatibility
   */
  getStats() {
    return this.getCacheStats();
  }

  /**
   * Get cached regions - returns cached countries
   */
  getCachedRegions(): Array<{ region: string; detailLevel: DetailLevel }> {
    return this.getCachedCountries().map(({ country, detailLevel }) => ({
      region: country,
      detailLevel
    }));
  }

  /**
   * Clear cache for a specific region/country, or all if no region specified
   */
  clearCache(region?: string): void {
    if (region) {
      // Clear specific region - include both country and province cache entries
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(region + '_') || key.startsWith(`provinces_${region}_`)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`🧹 Geographic cache cleared for region: ${region} (${keysToDelete.length} entries)`);
    } else {
      // Clear all
      this.cache.clear();
      console.log('🧹 Geographic cache cleared');
    }
  }

  /**
   * Force clear all province cache - use when quality level changes
   */
  clearAllProvinceCache(): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith('provinces_')
    );
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🧹 Cleared ALL province cache entries: ${keysToDelete.length} entries`);
    console.log(`🧹 Cleared keys:`, keysToDelete);
  }

  /**
   * Debug method to show what's currently cached
   */
  debugCache(): void {
    const allKeys = Array.from(this.cache.keys());
    const provinceKeys = allKeys.filter(key => key.startsWith('provinces_'));
    const countryKeys = allKeys.filter(key => !key.startsWith('provinces_'));
    
    console.log(`🔍 CACHE DEBUG:`);
    console.log(`  Total cache entries: ${allKeys.length}`);
    console.log(`  Province cache entries: ${provinceKeys.length}`, provinceKeys);
    console.log(`  Country cache entries: ${countryKeys.length}`, countryKeys);
  }

  /**
   * Export method for external access to province boundaries
   */
  async loadProvinces(countryCode: string, detailLevel: DetailLevel): Promise<Record<string, GeoJSONFeature>> {
    const featureCollection = await this.loadProvinceBoundaries(countryCode, detailLevel);
    
    // Convert FeatureCollection to Record<string, GeoJSONFeature>
    const result: Record<string, GeoJSONFeature> = {};
    featureCollection.features.forEach((feature, index) => {
      const id = feature.properties?.id || feature.properties?.name || `feature_${index}`;
      result[id] = feature;
    });
    
    return result;
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

  /**
   * Parse a tile key like "detailed_40_-80" into components
   * @param tileKey - The tile key string to parse
   * @returns Object with lod (detail level), x and y coordinates
   * @throws Error if the tile key format is invalid
   */
  parseTileKey(tileKey: string): { lod: string; x: number; y: number; worldX: number; worldY: number; tileX: number; tileY: number; detailLevel: DetailLevel } {
    if (!tileKey || typeof tileKey !== 'string') {
      throw new Error(`Invalid tile key: expected string, got ${typeof tileKey}`);
    }

    const parts = tileKey.split('_');
    
    if (parts.length !== 3) {
      throw new Error(`Invalid tile key format: expected "lod_x_y", got "${tileKey}"`);
    }

    const [lod, xStr, yStr] = parts;
    
    // Validate LOD is a known detail level
    const validLODs = ['low', 'overview', 'detailed', 'ultra'];
    if (!validLODs.includes(lod)) {
      throw new Error(`Invalid LOD in tile key: expected one of [${validLODs.join(', ')}], got "${lod}"`);
    }

    // Parse coordinates
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);
    
    if (isNaN(x) || isNaN(y)) {
      throw new Error(`Invalid coordinates in tile key: x="${xStr}", y="${yStr}" (must be integers)`);
    }

    // Calculate world coordinates (these are the actual lat/lon center points)
    const worldX = x; // Longitude (x coordinate in world space)
    const worldY = y; // Latitude (y coordinate in world space)
    
    // Calculate tile coordinates (for tile index lookup)
    const tileX = Math.floor((worldX + 180) / 10);
    const tileY = Math.floor((worldY + 90) / 10);

    return {
      lod,
      x,
      y,
      worldX,
      worldY,
      tileX,
      tileY,
      detailLevel: lod as DetailLevel
    };
  }

  /**
   * Load and cache a tile from .pbf file
   * @param detailLevel - The detail level (overview, detailed, ultra)
   * @param tileKey - The tile key like "detailed_40_-80"
   * @returns Promise<GeoJSONFeatureCollection> - The decoded tile data
   */
  async loadTile(detailLevel: DetailLevel, tileKey: string): Promise<GeoJSONFeatureCollection> {
    const cacheKey = `tile_${detailLevel}_${tileKey}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`📦 Tile cache hit: ${cacheKey}`);
      return cached.data;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(cacheKey);
    if (existingPromise) {
      console.log(`⏳ Waiting for existing tile load: ${cacheKey}`);
      return existingPromise;
    }

    // Start new load
    const loadPromise = this.performTileLoad(detailLevel, tileKey, cacheKey);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Perform the actual tile loading from .pbf file
   */
  private async performTileLoad(detailLevel: DetailLevel, tileKey: string, cacheKey: string): Promise<GeoJSONFeatureCollection> {
    const startTime = performance.now();
    
    // Parse the tileKey to extract coordinates (tileKey format: "detailLevel_y_x")
    const tileKeyParts = tileKey.split('_');
    if (tileKeyParts.length !== 3) {
      throw new Error(`Invalid tileKey format: ${tileKey}. Expected format: detailLevel_y_x`);
    }
    
    const [, y, x] = tileKeyParts;
    const coordinateKey = `${y}_${x}`;
    
    // Construct the .pbf file path using just the coordinates
    const filePath = `/data/tiles/${detailLevel}/${coordinateKey}.pbf`;
    
    try {
      console.log(`🗂️ Loading tile ${tileKey} at ${detailLevel} from ${filePath}...`);
      
      // Fetch the .pbf file as ArrayBuffer
      const response = await fetch(filePath);
      
      if (!response.ok) {
        console.error(`❌ Failed to load tile ${filePath}: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to load tile ${filePath}: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log(`📥 Fetched tile ${tileKey}: ${arrayBuffer.byteLength} bytes`);

      // Decode using geobuf with error handling for unsupported geometry types
      const uint8Array = new Uint8Array(arrayBuffer);
      const pbf = new Pbf(uint8Array);
      
      let geoJSON: GeoJSONFeatureCollection;
      try {
        geoJSON = geobuf.decode(pbf) as GeoJSONFeatureCollection;
      } catch (error) {
        // Handle geobuf decoding errors (e.g., "Unimplemented type: 4")
        if (error instanceof Error && error.message.includes('Unimplemented type')) {
          console.warn(`⚠️ Geobuf decoding error in tile ${tileKey}: ${error.message}`);
          console.warn(`📄 This tile contains unsupported geometry types - returning empty collection`);
          return { type: 'FeatureCollection', features: [] };
        } else {
          // Re-throw other types of errors
          console.error(`❌ Unexpected geobuf decoding error in tile ${tileKey}:`, error);
          throw error;
        }
      }

      // Validate the decoded data
      if (!geoJSON || geoJSON.type !== 'FeatureCollection') {
        console.warn(`⚠️ Invalid GeoJSON structure in tile ${tileKey}, creating empty collection`);
        return { type: 'FeatureCollection', features: [] };
      }

      // Process features: handle GeometryCollections and filter unsupported types
      const processedFeatures: any[] = [];
      let unpackedGeometryCollections = 0;
      
      geoJSON.features.forEach((feature, featureIndex) => {
        const geometryType = feature.geometry?.type;
        
        // Handle GeometryCollection by unpacking into individual features
        if (geometryType === 'GeometryCollection') {
          const geometryCollection = feature.geometry as any;
          if (geometryCollection.geometries && Array.isArray(geometryCollection.geometries)) {
            console.log(`📦 Unpacking GeometryCollection in tile ${tileKey} with ${geometryCollection.geometries.length} sub-geometries`);
            
            geometryCollection.geometries.forEach((subGeometry: any, subIndex: number) => {
              // Only add if the sub-geometry type is supported
              const subGeometryType = subGeometry?.type;
              if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(subGeometryType || '')) {
                // Create individual feature for each sub-geometry with minimal metadata
                const newFeature = {
                  type: 'Feature',
                  geometry: subGeometry,
                  properties: feature.properties || {}  // Keep original properties but don't add extra metadata
                };
                
                processedFeatures.push(newFeature);
              } else {
                console.warn(`⚠️ Unsupported sub-geometry type in GeometryCollection: ${subGeometryType}`);
              }
            });
            
            unpackedGeometryCollections++;
          } else {
            console.warn(`⚠️ Invalid GeometryCollection structure in tile ${tileKey} - missing geometries array`);
          }
        } else {
          // Handle regular geometry types
          const supported = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(geometryType || '');
          
          if (supported) {
            processedFeatures.push(feature);
          } else if (geometryType) {
            console.warn(`⚠️ Unsupported geometry type in tile ${tileKey}: ${geometryType}`);
          }
        }
      });

      // Log GeometryCollection unpacking statistics
      if (unpackedGeometryCollections > 0) {
        console.log(`📦 Successfully unpacked ${unpackedGeometryCollections} GeometryCollection(s) in tile ${tileKey}`);
        console.log(`📊 Original features: ${geoJSON.features.length}, Processed features: ${processedFeatures.length}`);
      }

      const filteredGeoJSON: GeoJSONFeatureCollection = {
        type: 'FeatureCollection',
        features: processedFeatures
      };

      const loadTime = performance.now() - startTime;
      const size = this.estimateSize(filteredGeoJSON);
      
      console.log(`✅ Loaded tile ${tileKey} at ${detailLevel}: ${filteredGeoJSON.features.length} features in ${loadTime.toFixed(1)}ms (${(size / 1024).toFixed(1)}KB)`);

      // Cache the result
      this.evictOldEntries();
      this.cache.set(cacheKey, {
        data: filteredGeoJSON,
        size,
        timestamp: Date.now()
      });

      // Update stats
      this.loadStats.totalFiles++;
      this.loadStats.totalSize += size;
      this.loadStats.loadTime += loadTime;

      return filteredGeoJSON;
      
    } catch (error) {
      console.error(`❌ Failed to load tile ${tileKey} at ${detailLevel}: ${error}`);
      this.loadStats.errors.push(`${detailLevel}/${tileKey}: ${error}`);
      
      // Return empty collection as fallback
      const emptyCollection: GeoJSONFeatureCollection = {
        type: 'FeatureCollection',
        features: []
      };
      
      // Cache the empty result to prevent repeated failed attempts
      const size = this.estimateSize(emptyCollection);
      this.cache.set(cacheKey, {
        data: emptyCollection,
        size,
        timestamp: Date.now()
      });
      
      return emptyCollection;
    }
  }
}

// Global instance
export const geographicDataManager = new GeographicDataManager();

// Also export as geoManager for backwards compatibility
export const geoManager = geographicDataManager;