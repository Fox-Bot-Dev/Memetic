/* ==========================================================================
   OFF-THREAD SPELL PARSER (WEB WORKER) (js/spells/spellWorker.js)
   ========================================================================== */

self.onmessage = function(e) {
  const { action, payload, compendiumId } = e.data;

  if (action === 'PARSE_COMPENDIUM') {
    try {
      // 1. Parse the massive JSON payload off the main UI thread
      const rawData = typeof payload === 'string' ? JSON.parse(payload) : payload;
      
      // 2. Map and trim data to strip out unnecessary bloat before sending it to RAM
      const optimizedSpells = (rawData.spells || []).map(spell => ({
        id: spell.id || crypto.randomUUID(),
        name: spell.name || 'Unknown Spell',
        level: spell.level !== undefined ? spell.level : 0,
        school: spell.school || 'Evocation',
        castingTime: spell.castingTime || '1 Action',
        range: spell.range || 'Self',
        duration: spell.duration || 'Instantaneous',
        desc: spell.desc || '',
        higherLevel: spell.higherLevel || '',
        isHomebrew: !!spell.isHomebrew,
        originalData: spell.isHomebrew ? spell.originalData : null // Used for the Dual-Layer comparison
      }));

      // 3. Send the clean, optimized array back to the main thread
      self.postMessage({
        status: 'SUCCESS',
        compendiumId: compendiumId,
        data: optimizedSpells
      });

    } catch (error) {
      self.postMessage({
        status: 'ERROR',
        error: error.message
      });
    }
  }
};