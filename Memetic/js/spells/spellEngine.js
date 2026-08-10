/* ==========================================================================
   MAIN SPELL ENGINE CONTROLLER & MATH WORKER (js/spells/spellEngine.js)
   ========================================================================== */

import { spellCompendiumCache } from './spellCache.js';

// --------------------------------------------------------------------------
// 1. WORKER & CACHE LOGIC
// --------------------------------------------------------------------------
const worker = new Worker('./js/spells/spellWorker.js');

worker.onmessage = (e) => {
  const { status, compendiumId, data, error } = e.data;
  if (status === 'SUCCESS') {
    spellCompendiumCache.set(compendiumId, data);
    console.log(`[SpellEngine] Successfully cached ${data.length} spells for ${compendiumId}.`);
    if (typeof window.renderSpellbook === 'function') window.renderSpellbook();
  } else {
    console.error(`[SpellEngine] Worker Error: ${error}`);
  }
};

export function loadSpellCompendium(compendiumId, rawJsonString) {
  if (spellCompendiumCache.get(compendiumId)) {
    console.log(`[SpellEngine] Compendium ${compendiumId} loaded from lightning cache.`);
    return; 
  }
  worker.postMessage({ action: 'PARSE_COMPENDIUM', compendiumId: compendiumId, payload: rawJsonString });
}
window.loadSpellCompendium = loadSpellCompendium;

/**
 * Ensures imported spell slots always have explicit, numeric max & used properties
 */
export function normalizeSpellSlots(spellSlots) {
  if (!spellSlots || typeof spellSlots !== 'object') return;

  const sanitizeObj = (obj) => {
    Object.keys(obj).forEach(k => {
      const target = obj[k];
      if (target && typeof target === 'object') {
        if (target.max !== undefined) {
          target.max = parseInt(target.max) || 0;
          target.used = parseInt(target.used) || 0;
        } else {
          sanitizeObj(target); // Sanitize nested class pools
        }
      }
    });
  };

  sanitizeObj(spellSlots);
}

// --------------------------------------------------------------------------
// 2. RULES, MATH & SLOT DEDUCTION LOGIC
// --------------------------------------------------------------------------
export const casterAbilityMap = { 
  wizard: 'INT', artificer: 'INT', cleric: 'WIS', druid: 'WIS', ranger: 'WIS', 
  bard: 'CHA', paladin: 'CHA', sorcerer: 'CHA', warlock: 'CHA', add_2e: 'WIS' 
};

export function getStatMod(score) { 
  return Math.floor(((score || 10) - 10) / 2); 
}

export function getActiveCasterClasses(spells = [], stateClasses = []) {
  const activeCasterClasses = [];
  if (stateClasses && Array.isArray(stateClasses)) {
    stateClasses.forEach(c => {
      const nameLower = (c.name || '').toLowerCase();
      if (casterAbilityMap[nameLower] && !activeCasterClasses.includes(c.name)) activeCasterClasses.push(c.name);
    });
  }
  if (activeCasterClasses.length === 0) {
    spells.forEach(s => {
      if (s.casterClass && s.casterClass !== 'Class' && !activeCasterClasses.includes(s.casterClass)) activeCasterClasses.push(s.casterClass);
    });
  }
  return activeCasterClasses;
}

export function parseSpellSave(spell) {
  if (spell.save || spell.savingThrow) return (spell.save || spell.savingThrow).substring(0, 3).toUpperCase();
  const desc = spell.desc || '';
  const match = desc.match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+(?:saving throw|save)/i);
  if (match) return match[1].substring(0, 3).toUpperCase();
  if (/spell save DC/i.test(desc) || /saving throw/i.test(desc)) return 'DC';
  return null;
}

export function parseSpellAttack(spell) {
  if (spell.attack || spell.actionType === 'spell_attack') return true;
  return /spell attack/i.test(spell.desc || '');
}

export function parseSpellDice(spell, charLevel = 1) {
  if (spell.dice || spell.damage) return spell.dice || spell.damage;
  const match = (spell.desc || '').match(/(\d+d\d+)/i);
  if (!match) return null;
  let baseDice = match[1];

  if (spell.level === 0 || spell.level === 'Cantrip') {
    const diceMatch = baseDice.match(/(\d+)(d\d+)/);
    if (diceMatch) {
      const num = parseInt(diceMatch[1]);
      let multiplier = charLevel >= 17 ? 4 : (charLevel >= 11 ? 3 : (charLevel >= 5 ? 2 : 1));
      return `${num * multiplier}${diceMatch[2]}`;
    }
  }
  return baseDice;
}

export function deductSpellSlot(spellId, selectedLevel, isIsolated, spellSlots, spells) {
  const targetSpell = spells.find(s => String(s.id) === String(spellId));
  const casterCls = (targetSpell?.casterClass || 'bard').toLowerCase();
  const slotKey = selectedLevel === 'Pact' ? 'Pact' : parseInt(selectedLevel);
  let slotData = null;

  if (isIsolated) {
    if (!spellSlots[casterCls]) spellSlots[casterCls] = {};
    if (!spellSlots[casterCls][slotKey]) spellSlots[casterCls][slotKey] = { max: 4, used: 0 };
    slotData = spellSlots[casterCls][slotKey];
  } else {
    // RAW Mode:
    // 1. Check root slotData
    if (spellSlots[slotKey] || spellSlots[`Level ${slotKey}`]) {
      slotData = spellSlots[slotKey] || spellSlots[`Level ${slotKey}`];
    } 
    // 2. Check class-nested slotData (e.g. spellSlots.bard[1])
    else if (spellSlots[casterCls] && spellSlots[casterCls][slotKey]) {
      slotData = spellSlots[casterCls][slotKey];
    } 
    // 3. Fallback: Search any class sub-pool for this level slot
    else {
      for (const clsKey of Object.keys(spellSlots)) {
        if (typeof spellSlots[clsKey] === 'object' && spellSlots[clsKey][slotKey]) {
          slotData = spellSlots[clsKey][slotKey];
          break;
        }
      }
    }

    // 4. Initialize default on root if no pool was found anywhere
    if (!slotData) {
      spellSlots[slotKey] = { max: 4, used: 0 };
      slotData = spellSlots[slotKey];
    }
  }

  if (parseInt(slotData.used) < parseInt(slotData.max)) {
    slotData.used = parseInt(slotData.used) + 1;
    return true; // Deduction successful
  }
  return false; // Depleted
}