/**
 * Model Availability Cache
 * 
 * Caches unavailable OpenRouter models in localStorage with TTL.
 * Models are marked unavailable when they return 404 errors.
 */

const CACHE_KEY = 'hydra_unavailable_models';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

interface CacheEntry {
  modelId: string;
  errorCode: number;
  errorMessage: string;
  timestamp: number;
}

interface ModelCache {
  entries: CacheEntry[];
  version: number;
}

const CACHE_VERSION = 1;

/**
 * Get cached unavailable models
 */
export function getUnavailableModels(): CacheEntry[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    
    const cache: ModelCache = JSON.parse(raw);
    if (cache.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return [];
    }
    
    const now = Date.now();
    // Filter out expired entries
    const validEntries = cache.entries.filter(e => now - e.timestamp < CACHE_TTL_MS);
    
    // Update cache if we removed any expired entries
    if (validEntries.length !== cache.entries.length) {
      saveCache(validEntries);
    }
    
    return validEntries;
  } catch (e) {
    console.error('[ModelCache] Error reading cache:', e);
    return [];
  }
}

/**
 * Check if a specific model is marked as unavailable
 */
export function isModelUnavailable(modelId: string): boolean {
  const entries = getUnavailableModels();
  return entries.some(e => e.modelId === modelId);
}

/**
 * Get list of unavailable model IDs
 */
export function getUnavailableModelIds(): string[] {
  return getUnavailableModels().map(e => e.modelId);
}

/**
 * Mark a model as unavailable
 */
export function markModelUnavailable(
  modelId: string, 
  errorCode: number, 
  errorMessage: string
): void {
  try {
    const entries = getUnavailableModels();
    
    // Check if already exists
    const existingIndex = entries.findIndex(e => e.modelId === modelId);
    
    const newEntry: CacheEntry = {
      modelId,
      errorCode,
      errorMessage,
      timestamp: Date.now(),
    };
    
    if (existingIndex >= 0) {
      // Update existing entry
      entries[existingIndex] = newEntry;
    } else {
      // Add new entry
      entries.push(newEntry);
    }
    
    saveCache(entries);
  } catch (e) {
    console.error('[ModelCache] Error saving cache:', e);
  }
}

/**
 * Mark a model as available (remove from cache)
 */
export function markModelAvailable(modelId: string): void {
  try {
    const entries = getUnavailableModels();
    const filteredEntries = entries.filter(e => e.modelId !== modelId);
    
    if (filteredEntries.length !== entries.length) {
      saveCache(filteredEntries);
    }
  } catch (e) {
    console.error('[ModelCache] Error updating cache:', e);
  }
}

/**
 * Clear all cached unavailable models
 */
export function clearModelCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.error('[ModelCache] Error clearing cache:', e);
  }
}

/**
 * Parse error response and detect unavailable models
 * Returns true if the error indicates the model is unavailable (404)
 */
export function parseModelError(modelId: string, error: string): { isUnavailable: boolean; errorCode: number } {
  // Check for "No endpoints found" (404)
  if (error.includes('"code":404') || error.includes('No endpoints found')) {
    return { isUnavailable: true, errorCode: 404 };
  }
  
  // Check for rate limiting (429) - temporarily unavailable, don't cache
  if (error.includes('"code":429') || error.includes('rate-limited')) {
    return { isUnavailable: false, errorCode: 429 };
  }
  
  // Check for payment required (402)
  if (error.includes('"code":402') || error.includes('spend limit')) {
    return { isUnavailable: true, errorCode: 402 };
  }
  
  return { isUnavailable: false, errorCode: 0 };
}

// Internal helper
function saveCache(entries: CacheEntry[]): void {
  const cache: ModelCache = {
    entries,
    version: CACHE_VERSION,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}
