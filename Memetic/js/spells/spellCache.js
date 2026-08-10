/* ==========================================================================
   EPHEMERAL SPELL CACHE (LRU MEMORY MANAGER) (js/spells/spellCache.js)
   ========================================================================== */

class EphemeralCache {
  constructor(maxSize = 20) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Retrieve data and refresh its position as 'recently used'
   */
  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Store data. If cache exceeds maxSize, evict the oldest entry.
   */
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first item in Map)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      console.log(`[SpellCache] Evicted Ephemeral Data: ${oldestKey}`);
    }
    this.cache.set(key, value);
  }

  /**
   * Instantly free up RAM (Call this when closing the Spellbook or Resting)
   */
  flush() {
    this.cache.clear();
    console.log('[SpellCache] Memory Flushed.');
  }
}

// Export a singleton instance for the spell engine to use
export const spellCompendiumCache = new EphemeralCache(15);