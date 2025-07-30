/**
 * GeographicDataManager - Advanced province boundary data management
 * 
 * Features:
 * - Multi-level detail loading (overview, detailed, ultra)
 * - Intelligent memory caching with size limits
 * - Dynamic detail upgrading
 * - Cache eviction based on memory usage
 */

export type DetailLevel = 'overview' | 'detailed' | 'ultra';

export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    id: string;
    name?: string;
    [key: string]: any;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

interface CacheEntry {
  data: GeoJSONFeatureCollection;
  detailLevel: DetailLevel;
  size: number; // Estimated size in bytes
  lastAccessed: number;
  loadTime: number;
}

interface LoadingStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  totalBytesLoaded: number;
  averageLoadTime: number;
  evictedEntries: number;
}

export class GeographicDataManager {
  private cache = new Map<string, CacheEntry>();
  private loadingPromises = new Map<string, Promise<GeoJSONFeatureCollection>>();
  private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB
  private stats: LoadingStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalBytesLoaded: 0,
    averageLoadTime: 0,
    evictedEntries: 0
  };

  /**
   * Load region data at specified detail level
   */
  async loadRegion(region: string, detailLevel: DetailLevel = 'overview'): Promise<GeoJSONFeatureCollection> {
    const cacheKey = `${region}_${detailLevel}`;
    this.stats.totalRequests++;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      cached.lastAccessed = Date.now();
      this.stats.cacheHits++;
      console.log(`📦 GeographicDataManager: Cache hit for ${cacheKey}`);
      return cached.data;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(cacheKey);
    if (existingPromise) {
      console.log(`⏳ GeographicDataManager: Already loading ${cacheKey}, waiting...`);
      return existingPromise;
    }

    // Start new load
    this.stats.cacheMisses++;
    const loadPromise = this._fetchRegionData(region, detailLevel);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const data = await loadPromise;
      
      // Calculate size and create cache entry
      const dataStr = JSON.stringify(data);
      const size = dataStr.length * 2; // Rough estimate for UTF-16
      const entry: CacheEntry = {
        data,
        detailLevel,
        size,
        lastAccessed: Date.now(),
        loadTime: Date.now()
      };

      // Update stats
      this.stats.totalBytesLoaded += size;
      this.stats.averageLoadTime = (this.stats.averageLoadTime * (this.stats.cacheMisses - 1) + 
        (Date.now() - entry.loadTime)) / this.stats.cacheMisses;

      // Check cache size and evict if needed
      await this._ensureCacheSize(size);
      
      // Add to cache
      this.cache.set(cacheKey, entry);
      console.log(`✅ GeographicDataManager: Loaded and cached ${cacheKey} (${this._formatBytes(size)})`);
      
      return data;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Upgrade a region to higher detail level
   */
  async upgradeRegionDetail(region: string, newDetailLevel: DetailLevel): Promise<GeoJSONFeatureCollection> {
    console.log(`🔄 GeographicDataManager: Upgrading ${region} to ${newDetailLevel} detail`);
    
    // Remove any existing cache entries for this region
    const keysToRemove = Array.from(this.cache.keys()).filter(key => key.startsWith(`${region}_`));
    for (const key of keysToRemove) {
      this.cache.delete(key);
      console.log(`🗑️ GeographicDataManager: Removed cached ${key} for upgrade`);
    }

    // Load at new detail level
    return this.loadRegion(region, newDetailLevel);
  }

  /**
   * Get all cached regions with their detail levels
   */
  getCachedRegions(): Array<{region: string; detailLevel: DetailLevel; size: number; lastAccessed: number}> {
    const regions: Array<{region: string; detailLevel: DetailLevel; size: number; lastAccessed: number}> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      const [region] = key.split('_');
      regions.push({
        region,
        detailLevel: entry.detailLevel,
        size: entry.size,
        lastAccessed: entry.lastAccessed
      });
    }
    
    return regions.sort((a, b) => b.lastAccessed - a.lastAccessed);
  }

  /**
   * Clear cache for specific region or all regions
   */
  clearCache(region?: string): void {
    if (region) {
      const keysToRemove = Array.from(this.cache.keys()).filter(key => key.startsWith(`${region}_`));
      for (const key of keysToRemove) {
        this.cache.delete(key);
      }
      console.log(`🧹 GeographicDataManager: Cleared cache for region ${region}`);
    } else {
      this.cache.clear();
      console.log('🧹 GeographicDataManager: Cleared entire cache');
    }
  }

  /**
   * Get cache and loading statistics
   */
  getStats(): LoadingStats & {
    currentCacheSize: number;
    cacheEntries: number;
    hitRatio: number;
  } {
    const currentCacheSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    const hitRatio = this.stats.totalRequests > 0 
      ? this.stats.cacheHits / this.stats.totalRequests 
      : 0;

    return {
      ...this.stats,
      currentCacheSize,
      cacheEntries: this.cache.size,
      hitRatio
    };
  }

  /**
   * Private: Fetch region data from server
   */
  private async _fetchRegionData(region: string, detailLevel: DetailLevel): Promise<GeoJSONFeatureCollection> {
    const url = `/data/boundaries/provinces/${region}/${detailLevel}.json`;
    
    console.log(`🌍 GeographicDataManager: Fetching ${url}`);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate basic GeoJSON structure
      if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        throw new Error(`Invalid GeoJSON structure in ${url}`);
      }
      
      console.log(`📊 GeographicDataManager: Loaded ${data.features.length} features from ${url}`);
      return data as GeoJSONFeatureCollection;
      
    } catch (error) {
      console.error(`❌ GeographicDataManager: Failed to load ${url}:`, error);
      
      // Return empty collection as fallback
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
  }

  /**
   * Private: Ensure cache doesn't exceed size limit
   */
  private async _ensureCacheSize(newEntrySize: number): Promise<void> {
    const currentSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    const targetSize = this.maxCacheSize - newEntrySize;
    
    if (currentSize <= targetSize) {
      return; // No eviction needed
    }
    
    console.log(`🚨 GeographicDataManager: Cache size ${this._formatBytes(currentSize)} exceeds limit, evicting...`);
    
    // Sort entries by last accessed time (oldest first)
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);
    
    let evictedSize = 0;
    let evictedCount = 0;
    
    for (const { key, entry } of entries) {
      if (currentSize - evictedSize <= targetSize) {
        break;
      }
      
      this.cache.delete(key);
      evictedSize += entry.size;
      evictedCount++;
      this.stats.evictedEntries++;
      
      console.log(`🗑️ GeographicDataManager: Evicted ${key} (${this._formatBytes(entry.size)})`);
    }
    
    console.log(`✅ GeographicDataManager: Evicted ${evictedCount} entries, freed ${this._formatBytes(evictedSize)}`);
  }

  /**
   * Private: Format bytes for human-readable output
   */
  private _formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Singleton instance
export const geographicDataManager = new GeographicDataManager();