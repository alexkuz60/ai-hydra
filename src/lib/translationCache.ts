/**
 * Translation Cache
 * 
 * Caches translations in sessionStorage during the editing session.
 * Keys are hashes of the original text, values are the translations.
 */

const CACHE_KEY = 'hydra_translation_cache';
const MAX_CACHE_SIZE = 50; // Maximum number of cached translations

interface CacheEntry {
  originalText: string;
  translation: string;
  targetLang: string;
  timestamp: number;
}

interface TranslationCache {
  entries: Record<string, CacheEntry>;
  version: number;
}

const CACHE_VERSION = 1;

/**
 * Generate a simple hash for cache key
 */
function generateHash(text: string, targetLang: string): string {
  // Simple hash based on first/last chars + length + targetLang
  const normalized = text.trim().toLowerCase();
  const hash = `${targetLang}_${normalized.length}_${normalized.slice(0, 20)}_${normalized.slice(-20)}`;
  return btoa(unescape(encodeURIComponent(hash))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

/**
 * Get the translation cache from sessionStorage
 */
function getCache(): TranslationCache {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return { entries: {}, version: CACHE_VERSION };
    
    const cache: TranslationCache = JSON.parse(raw);
    if (cache.version !== CACHE_VERSION) {
      sessionStorage.removeItem(CACHE_KEY);
      return { entries: {}, version: CACHE_VERSION };
    }
    
    return cache;
  } catch (e) {
    console.error('[TranslationCache] Error reading cache:', e);
    return { entries: {}, version: CACHE_VERSION };
  }
}

/**
 * Save the cache to sessionStorage
 */
function saveCache(cache: TranslationCache): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('[TranslationCache] Error saving cache:', e);
  }
}

/**
 * Get a cached translation
 */
export function getCachedTranslation(originalText: string, targetLang: string): string | null {
  const cache = getCache();
  const hash = generateHash(originalText, targetLang);
  const entry = cache.entries[hash];
  
  if (entry && entry.originalText === originalText.trim() && entry.targetLang === targetLang) {
    console.log('[TranslationCache] Cache hit for', targetLang, 'translation');
    return entry.translation;
  }
  
  return null;
}

/**
 * Cache a translation
 */
export function cacheTranslation(originalText: string, translation: string, targetLang: string): void {
  try {
    const cache = getCache();
    const hash = generateHash(originalText, targetLang);
    
    // Limit cache size by removing oldest entries
    const entries = Object.entries(cache.entries);
    if (entries.length >= MAX_CACHE_SIZE) {
      // Sort by timestamp and remove oldest
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE + 1);
      toRemove.forEach(([key]) => delete cache.entries[key]);
    }
    
    cache.entries[hash] = {
      originalText: originalText.trim(),
      translation,
      targetLang,
      timestamp: Date.now(),
    };
    
    saveCache(cache);
    console.log('[TranslationCache] Cached translation for', targetLang);
  } catch (e) {
    console.error('[TranslationCache] Error caching translation:', e);
  }
}

/**
 * Get multiple cached translations at once
 * Returns a map of original text to translation (only found items)
 */
export function getCachedTranslations(texts: string[], targetLang: string): Map<string, string> {
  const result = new Map<string, string>();
  const cache = getCache();
  
  for (const text of texts) {
    const hash = generateHash(text, targetLang);
    const entry = cache.entries[hash];
    
    if (entry && entry.originalText === text.trim() && entry.targetLang === targetLang) {
      result.set(text, entry.translation);
    }
  }
  
  if (result.size > 0) {
    console.log(`[TranslationCache] Found ${result.size}/${texts.length} translations in cache`);
  }
  
  return result;
}

/**
 * Cache multiple translations at once
 */
export function cacheTranslations(translations: Array<{ original: string; translation: string }>, targetLang: string): void {
  try {
    const cache = getCache();
    
    for (const { original, translation } of translations) {
      const hash = generateHash(original, targetLang);
      cache.entries[hash] = {
        originalText: original.trim(),
        translation,
        targetLang,
        timestamp: Date.now(),
      };
    }
    
    // Limit cache size
    const entries = Object.entries(cache.entries);
    if (entries.length > MAX_CACHE_SIZE) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => delete cache.entries[key]);
    }
    
    saveCache(cache);
    console.log(`[TranslationCache] Cached ${translations.length} translations`);
  } catch (e) {
    console.error('[TranslationCache] Error caching translations:', e);
  }
}

/**
 * Clear all cached translations
 */
export function clearTranslationCache(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY);
    console.log('[TranslationCache] Cache cleared');
  } catch (e) {
    console.error('[TranslationCache] Error clearing cache:', e);
  }
}
