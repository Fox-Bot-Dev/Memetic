/* ==========================================================================
   MULTI-CASTER SPELLBOOK TRAFFIC COP (js/components/spells.js)
   ========================================================================== */

import { spellCompendiumCache } from '../spells/spellCache.js';
import { getActiveCasterClasses, deductSpellSlot } from '../spells/spellEngine.js';
import { renderClassNubbins, renderSpellStatsHeader, renderLevelDock, renderSpellsInChunks, createSpellCardHTML } from '../spells/spellUI.js';
import { promptSpellModification } from '../spells/spellModal.js';

// Internal Router State
let activeClassFilter = 'ALL';
let activeLevelFilter = 'ALL';
let activeSearchTerm = ''; // 🔍 Search State

/**
 * Helper to check if a spell can upcast into the target level
 */
function canSpellUpcastToLevel(spell, targetLevel) {
  if (!spell.level || spell.level === 'Cantrip' || spell.level === 0) return false;
  const numericSpellLevel = parseInt(spell.level);
  const numericTargetLevel = parseInt(targetLevel);
  
  if (isNaN(numericSpellLevel) || isNaN(numericTargetLevel)) return false;
  if (numericSpellLevel > numericTargetLevel) return false; // Can't downcast
  if (numericSpellLevel === numericTargetLevel) return true; // Base level match

  // Check description for scaling keywords
  const desc = spell.desc || '';
  return /at higher level/i.test(desc) || /spell slot level above/i.test(desc) || /higher-level spell slot/i.test(desc);
}

/**
 * Helper to check if a spell is completely depleted of available slots
 */
function isSpellDepleted(spell, spellSlots, isIsolated) {
  if (!spell.level || spell.level === 0 || spell.level === 'Cantrip') return false;

  const casterCls = (spell.casterClass || 'bard').toLowerCase();
  let targetPool = spellSlots;
  if (isIsolated && spellSlots[casterCls]) targetPool = spellSlots[casterCls];

  let hasAvailableSlot = false;

  for (let i = spell.level; i <= 9; i++) {
    let sData = null;
    if (isIsolated) {
      sData = targetPool[i] || targetPool[`Level ${i}`];
    } else {
      if (spellSlots[i] !== undefined || spellSlots[`Level ${i}`] !== undefined) {
        sData = spellSlots[i] ?? spellSlots[`Level ${i}`];
      } else {
        for (const clsKey of Object.keys(spellSlots)) {
          if (typeof spellSlots[clsKey] === 'object' && spellSlots[clsKey][i] !== undefined) {
            sData = spellSlots[clsKey][i];
            break;
          }
        }
      }
    }

    if (sData) {
      const max = parseInt(sData.max ?? sData.total ?? 0) || 0;
      const used = parseInt(sData.used ?? 0) || 0;
      if (max - used > 0) {
        hasAvailableSlot = true;
        break;
      }
    }
  }

  const pactData = spellSlots['Pact'] || spellSlots['pact'] || spellSlots['PACT'];
  if (pactData) {
    const max = parseInt(pactData.max ?? pactData.total ?? 0) || 0;
    const used = parseInt(pactData.used ?? 0) || 0;
    if (max - used > 0 && (parseInt(pactData.level) || 1) >= spell.level) {
      hasAvailableSlot = true;
    }
  }

  return !hasAvailableSlot;
}

export function renderSpellbook() {
  const container = document.getElementById('spellListZone');
  if (!container) return;

  const charLevel = window.state?.level || 1;
  const pb = window.characterPB || Math.ceil(1 + (charLevel / 4));
  const scores = window.rawScores || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
  
  const spells = spellCompendiumCache.get('active_spellbook') || window.state?.spells || [];
  const spellSlots = window.state?.spellSlots || {};
  const isIsolated = window.state?.isolatedClassSlots || false;
  const showUpcast = window.state?.showUpcastSpillover || false;

  const activeCasterClasses = getActiveCasterClasses(spells, window.state?.classes);

  // 1. Dispatch to UI Factory
  renderClassNubbins(activeCasterClasses, activeClassFilter);
  renderSpellStatsHeader(activeCasterClasses, scores, pb, activeClassFilter, spellSlots, isIsolated);
  renderLevelDock(spellSlots, spells, activeClassFilter, activeLevelFilter, isIsolated);

  // 2. Filter Payload (Class, Level, AND Live Search)
  let filteredSpells = [...spells];
  
  if (activeClassFilter !== 'ALL') {
    filteredSpells = filteredSpells.filter(s => (s.casterClass || '').toLowerCase() === activeClassFilter.toLowerCase());
  }
  
  if (activeLevelFilter !== 'ALL') {
    filteredSpells = filteredSpells.filter(s => {
      if (activeLevelFilter === '0') return s.level === 0 || s.level === 'Cantrip';
      if (activeLevelFilter === 'PACT') return s.isPact || s.level === 'Pact';

      if (showUpcast) {
        return canSpellUpcastToLevel(s, activeLevelFilter);
      } else {
        return String(s.level) === String(activeLevelFilter);
      }
    });
  }

  // 🔍 KEYWORD SEARCH FILTER
  if (activeSearchTerm) {
    filteredSpells = filteredSpells.filter(s => {
      const nameMatch = (s.name || '').toLowerCase().includes(activeSearchTerm);
      const descMatch = (s.desc || '').toLowerCase().includes(activeSearchTerm);
      const schoolMatch = (s.school || '').toLowerCase().includes(activeSearchTerm);
      return nameMatch || descMatch || schoolMatch;
    });
  }

  // 3. DYNAMIC DEPLETION SINK SORTING
  filteredSpells.sort((a, b) => {
    const aDepleted = isSpellDepleted(a, spellSlots, isIsolated);
    const bDepleted = isSpellDepleted(b, spellSlots, isIsolated);

    if (aDepleted !== bDepleted) {
      return aDepleted ? 1 : -1;
    }
    return 0;
  });

  // 4. Dispatch Chunk Renderer
  const createHTML = (spell) => createSpellCardHTML(spell, charLevel, pb, scores, activeCasterClasses, spellSlots, isIsolated);
  renderSpellsInChunks(filteredSpells, container, createHTML);
}

// --------------------------------------------------------------------------
// UPCAST SPILLOVER CONTROLLER
// --------------------------------------------------------------------------
export function toggleUpcastSpillover() {
  if (!window.state) window.state = {};
  window.state.showUpcastSpillover = !window.state.showUpcastSpillover;
  renderSpellbook();
}

// --------------------------------------------------------------------------
// SEARCH CONTROLLERS
// --------------------------------------------------------------------------
export function toggleSpellSearchDrawer() {
  const drawer = document.getElementById('spellSearchDrawer');
  const icon = document.getElementById('spellSearchNubIcon');
  const text = document.getElementById('spellSearchNubText');
  const input = document.getElementById('spellSearchInput');

  if (!drawer) return;

  const isOpen = drawer.classList.toggle('open');

  if (isOpen) {
    if (icon) icon.textContent = '▲';
    if (text) text.textContent = 'CLOSE SEARCH';
    if (input) setTimeout(() => input.focus(), 150);
  } else {
    if (icon) icon.textContent = '🔍';
    if (text) text.textContent = 'SEARCH SPELLS';
    clearSpellSearch();
  }
}

export function filterSpellSearch(term) {
  activeSearchTerm = (term || '').toLowerCase().trim();
  renderSpellbook();
}

export function clearSpellSearch() {
  activeSearchTerm = '';
  const input = document.getElementById('spellSearchInput');
  if (input) input.value = '';
  renderSpellbook();
}

// --------------------------------------------------------------------------
// GLOBAL WINDOW BINDINGS
// --------------------------------------------------------------------------
export function filterSpellClass(cls) { activeClassFilter = cls; renderSpellbook(); }
export function filterSpellLevel(lvl) { activeLevelFilter = lvl; renderSpellbook(); }

export function triggerSpellModifyModal(spellId) {
  const spells = spellCompendiumCache.get('active_spellbook') || window.state?.spells || [];
  const target = spells.find(s => String(s.id) === String(spellId));
  if (target) promptSpellModification(target);
}

export function castSpellSlot(spellId, selectedLevel) {
  if (!window.state.spellSlots) window.state.spellSlots = {};
  const spells = spellCompendiumCache.get('active_spellbook') || window.state?.spells || [];
  const isIsolated = window.state?.isolatedClassSlots || false;

  const success = deductSpellSlot(spellId, selectedLevel, isIsolated, window.state.spellSlots, spells);
  if (success) {
    renderSpellbook(); 
    if (typeof window.renderResourcePools === 'function') window.renderResourcePools();
  }
}

export function rollSpellDamage(spellName, diceFormula) {
  if (typeof window.executeRoll === 'function' && diceFormula) {
    window.executeRoll(spellName, diceFormula);
  } else {
    const log = document.getElementById('diceLog');
    if (log) log.innerHTML = `<span style="color:var(--accent-color);">${spellName}</span>: Cast!`;
  }
}

window.renderSpellbook = renderSpellbook;
window.filterSpellClass = filterSpellClass;
window.filterSpellLevel = filterSpellLevel;
window.toggleUpcastSpillover = toggleUpcastSpillover;
window.toggleSpellSearchDrawer = toggleSpellSearchDrawer;
window.filterSpellSearch = filterSpellSearch;
window.clearSpellSearch = clearSpellSearch;
window.castSpellSlot = castSpellSlot;
window.rollSpellDamage = rollSpellDamage;
window.triggerSpellModifyModal = triggerSpellModifyModal;