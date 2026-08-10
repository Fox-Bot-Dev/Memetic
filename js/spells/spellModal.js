/* ==========================================================================
   DUAL-LAYER SPELL MODIFIER & COMPENDIUM ADD MODAL (js/spells/spellModal.js)
   ========================================================================== */

import { openModal, closeModal } from '../core/modalEngine.js';
import { spellCompendiumCache } from './spellCache.js';
import { spellDatabase } from './database/index.js';

// --------------------------------------------------------------------------
// 1. MODIFY EXISTING SPELL MODAL
// --------------------------------------------------------------------------
export function promptSpellModification(spell) {
  if (!spell.originalData) {
    spell.originalData = {
      desc: spell.desc || 'No original description found.',
      dice: spell.dice || '',
      level: spell.level,
      school: spell.school || '',
      castingTime: spell.castingTime || '',
      range: spell.range || '',
      duration: spell.duration || '',
      save: spell.save || ''
    };
  }

  const orig = spell.originalData;
  const isActive = spell.isHomebrew ? 'checked' : '';

  const html = `
    <style>
      .modal-box:has(#hbDesc) {
        width: 820px !important;
        max-width: 95vw !important;
      }
    </style>
    
    <div style="display:flex; flex-direction:column; gap:0.8rem;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <p style="font-size:0.75rem; color:var(--text-muted); margin:0;">
          Modifying <strong style="color:var(--text-main);">${spell.name}</strong>. The original SRD baseline is preserved below.
        </p>
        <label style="font-size:0.75rem; color:var(--accent-color); font-weight:bold; display:flex; align-items:center; gap:0.4rem; cursor:pointer; background:var(--bg-secondary); padding:0.3rem 0.6rem; border:1px solid var(--accent-color); border-radius:4px;">
          <input type="checkbox" id="homebrewToggleActive" ${isActive} style="cursor:pointer;" />
          Apply Homebrew Override
        </label>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: stretch;">
        <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:6px; padding:0.6rem; display:flex; flex-direction:column;">
          <strong style="font-size:0.8rem; color:var(--text-main); margin-bottom:0.4rem; display:block;">📝 Spell Description & Effects</strong>
          <textarea id="hbDesc" style="width:100%; flex:1; min-height:220px; padding:0.5rem; font-size:0.75rem; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-primary); color:var(--text-main); resize:vertical; line-height:1.4;">${spell.desc || ''}</textarea>
        </div>

        <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:6px; padding:0.6rem; display:flex; flex-direction:column; gap:0.6rem;">
          <strong style="font-size:0.8rem; color:var(--text-main); display:block;">⚙️ Mechanical Attributes</strong>
          
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.6rem;">
            <div>
              <label style="font-size:0.65rem; color:var(--text-muted);">Spell Level:</label>
              <input type="text" id="hbLevel" value="${spell.level !== undefined ? spell.level : ''}" style="width:100%; padding:0.3rem; font-size:0.75rem;" />
            </div>
            <div>
              <label style="font-size:0.65rem; color:var(--text-muted);">School / Type:</label>
              <input type="text" id="hbSchool" value="${spell.school || ''}" style="width:100%; padding:0.3rem; font-size:0.75rem;" />
            </div>
            
            <div>
              <label style="font-size:0.65rem; color:var(--text-muted);">Casting Time:</label>
              <input type="text" id="hbTime" value="${spell.castingTime || ''}" style="width:100%; padding:0.3rem; font-size:0.75rem;" />
            </div>
            <div>
              <label style="font-size:0.65rem; color:var(--text-muted);">Range:</label>
              <input type="text" id="hbRange" value="${spell.range || ''}" style="width:100%; padding:0.3rem; font-size:0.75rem;" />
            </div>

            <div>
              <label style="font-size:0.65rem; color:var(--text-muted);">Duration:</label>
              <input type="text" id="hbDuration" value="${spell.duration || ''}" style="width:100%; padding:0.3rem; font-size:0.75rem;" />
            </div>
            <div>
              <label style="font-size:0.65rem; color:var(--text-muted);">Save / Target:</label>
              <input type="text" id="hbSave" value="${spell.save || ''}" placeholder="e.g. DEX, CON" style="width:100%; padding:0.3rem; font-size:0.75rem;" />
            </div>
            
            <div style="grid-column: span 2;">
              <label style="font-size:0.65rem; color:var(--text-muted);">Damage / Healing / Dice Formula:</label>
              <input type="text" id="hbDice" value="${spell.dice || ''}" placeholder="e.g. 8d6 Fire" style="width:100%; padding:0.3rem; font-size:0.75rem;" />
            </div>
          </div>
        </div>
      </div>

      <div style="background:rgba(0,0,0,0.25); border:1px dashed var(--border-color); border-radius:6px; padding:0.6rem; margin-top:0.2rem;">
        <strong style="font-size:0.7rem; color:var(--text-muted); margin-bottom:0.3rem; display:block;">📜 Original Baseline Rules (Immutable)</strong>
        <div style="font-size:0.7rem; color:var(--text-muted); line-height:1.4; white-space:pre-wrap; max-height:100px; overflow-y:auto; padding-right:0.4rem;">${orig.desc}</div>
      </div>
    </div>
  `;

  openModal(`Modify: ${spell.name}`, html, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { 
      label: 'Save Changes', 
      class: '', 
      onclick: () => {
        saveSpellModifications(spell);
        closeModal(true);
      } 
    }
  ]);
}

function saveSpellModifications(spell) {
  const isActive = document.getElementById('homebrewToggleActive')?.checked;

  if (isActive) {
    spell.isHomebrew = true;
    spell.desc = document.getElementById('hbDesc')?.value;
    spell.school = document.getElementById('hbSchool')?.value;
    spell.castingTime = document.getElementById('hbTime')?.value;
    spell.range = document.getElementById('hbRange')?.value;
    spell.duration = document.getElementById('hbDuration')?.value;
    spell.dice = document.getElementById('hbDice')?.value;
    spell.save = document.getElementById('hbSave')?.value;
    
    const newLevel = document.getElementById('hbLevel')?.value;
    spell.level = isNaN(parseInt(newLevel)) ? newLevel : parseInt(newLevel);
  } else {
    spell.isHomebrew = false;
    spell.desc = spell.originalData.desc;
    spell.dice = spell.originalData.dice;
    spell.level = spell.originalData.level;
    spell.school = spell.originalData.school;
    spell.castingTime = spell.originalData.castingTime;
    spell.range = spell.originalData.range;
    spell.duration = spell.originalData.duration;
    spell.save = spell.originalData.save;
  }

  if (window.state?.spells) {
    const idx = window.state.spells.findIndex(s => String(s.id) === String(spell.id));
    if (idx !== -1) window.state.spells[idx] = spell;
  }

  const cachedSpells = spellCompendiumCache.get('active_spellbook');
  if (cachedSpells) {
    const idx = cachedSpells.findIndex(s => String(s.id) === String(spell.id));
    if (idx !== -1) cachedSpells[idx] = spell;
  }

  if (typeof window.renderSpellbook === 'function') {
    window.renderSpellbook();
  }
}

// --------------------------------------------------------------------------
// 2. COMPENDIUM +ADD SPELL BROWSER MODAL
// --------------------------------------------------------------------------
export function promptAddSpellModal() {
  const html = `
    <style>
      .modal-box:has(#compendiumSearchInput) {
        width: 800px !important;
        max-width: 95vw !important;
      }
      .compendium-select {
        flex: 1; padding: 0.45rem; font-size: 0.75rem; 
        background: var(--bg-primary); border: 1px solid var(--border-color); 
        color: var(--text-main); border-radius: 4px; outline: none;
      }
    </style>
    
    <div style="display:flex; flex-direction:column; gap:0.6rem;">
      <p style="font-size:0.75rem; color:var(--text-muted); margin:0;">
        Search the compendium by keyword, school, damage type, or saving throw.
      </p>

      <!-- ROW 1: Search & Level -->
      <div style="display:flex; gap:0.5rem; align-items:center;">
        <input type="text" id="compendiumSearchInput" placeholder="🔍 Search spells by name or description..." 
               oninput="window.renderCompendiumSearchResults()" 
               style="flex:2; padding:0.45rem 0.8rem; font-size:0.8rem; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-main); border-radius:4px; outline:none;" />
        
        <select id="compendiumLevelFilter" class="compendium-select" style="flex:1;" onchange="window.renderCompendiumSearchResults()">
          <option value="ALL">All Levels</option>
          <option value="0">Cantrips</option>
          <option value="1">1st Level</option>
          <option value="2">2nd Level</option>
          <option value="3">3rd Level</option>
          <option value="4">4th Level</option>
          <option value="5">5th Level</option>
          <option value="6">6th Level</option>
          <option value="7">7th Level</option>
          <option value="8">8th Level</option>
          <option value="9">9th Level</option>
        </select>
      </div>

      <!-- ROW 2: Granular Filters -->
      <div style="display:flex; gap:0.5rem; align-items:center;">
        <select id="compendiumSchoolFilter" class="compendium-select" onchange="window.renderCompendiumSearchResults()">
          <option value="ALL">Any School</option>
          <option value="abjuration">Abjuration</option>
          <option value="conjuration">Conjuration</option>
          <option value="divination">Divination</option>
          <option value="enchantment">Enchantment</option>
          <option value="evocation">Evocation</option>
          <option value="illusion">Illusion</option>
          <option value="necromancy">Necromancy</option>
          <option value="transmutation">Transmutation</option>
        </select>
        
        <select id="compendiumDamageFilter" class="compendium-select" onchange="window.renderCompendiumSearchResults()">
          <option value="ALL">Any Damage / Effect</option>
          <option value="acid">Acid</option>
          <option value="bludgeoning">Bludgeoning</option>
          <option value="cold">Cold</option>
          <option value="fire">Fire</option>
          <option value="force">Force</option>
          <option value="lightning">Lightning</option>
          <option value="necrotic">Necrotic</option>
          <option value="piercing">Piercing</option>
          <option value="poison">Poison</option>
          <option value="psychic">Psychic</option>
          <option value="radiant">Radiant</option>
          <option value="slashing">Slashing</option>
          <option value="thunder">Thunder</option>
          <option value="healing">Healing / Temp HP</option>
          <option value="charm">Charmed</option>
          <option value="frighten">Frightened</option>
        </select>

        <select id="compendiumSaveFilter" class="compendium-select" onchange="window.renderCompendiumSearchResults()">
          <option value="ALL">Any Save / Target</option>
          <option value="str">Strength (STR)</option>
          <option value="dex">Dexterity (DEX)</option>
          <option value="con">Constitution (CON)</option>
          <option value="int">Intelligence (INT)</option>
          <option value="wis">Wisdom (WIS)</option>
          <option value="cha">Charisma (CHA)</option>
          <option value="attack">Spell Attack</option>
        </select>
      </div>

      <div id="compendiumResultsZone" style="display:flex; flex-direction:column; gap:0.4rem; max-height:380px; overflow-y:auto; padding-right:4px; border:1px solid var(--border-color); border-radius:6px; padding:0.6rem; background:var(--bg-secondary);">
        <!-- Dynamic Compendium Search Results Render Here -->
      </div>
    </div>
  `;

  openModal('✨ Add Spell to Sheet', html, [
    { label: 'Done', class: 'secondary-btn', onclick: () => closeModal(true) }
  ]);

  setTimeout(() => {
    window.renderCompendiumSearchResults();
  }, 50);
}

window.renderCompendiumSearchResults = function() {
  const container = document.getElementById('compendiumResultsZone');
  if (!container) return;

  const searchTerm = (document.getElementById('compendiumSearchInput')?.value || '').toLowerCase().trim();
  const levelFilter = document.getElementById('compendiumLevelFilter')?.value || 'ALL';
  const schoolFilter = document.getElementById('compendiumSchoolFilter')?.value || 'ALL';
  const damageFilter = document.getElementById('compendiumDamageFilter')?.value || 'ALL';
  const saveFilter = document.getElementById('compendiumSaveFilter')?.value || 'ALL';

  const compendium = [...spellDatabase, ...(window.state?.spells || [])];
  const activeSpellIds = new Set((window.state?.spells || []).map(s => String(s.name).toLowerCase()));

  // Deduplicate spells with identical names to clean up D&DBeyond noise
  const uniqueCompendiumMap = new Map();
  compendium.forEach(s => {
      if (s.name) uniqueCompendiumMap.set(s.name.toLowerCase(), s);
  });
  const uniqueCompendium = Array.from(uniqueCompendiumMap.values());

  let matches = uniqueCompendium.filter(s => {
    const descLower = (s.desc || '').toLowerCase();
    const diceLower = (s.dice || '').toLowerCase();
    
    // 1. Text Match
    const textPass = !searchTerm || (s.name || '').toLowerCase().includes(searchTerm) || descLower.includes(searchTerm) || (s.school || '').toLowerCase().includes(searchTerm);

    // 2. Level Match
    let levelPass = true;
    if (levelFilter !== 'ALL') {
      if (levelFilter === '0') levelPass = s.level === 0 || s.level === 'Cantrip';
      else levelPass = String(s.level) === String(levelFilter);
    }

    // 3. School Match
    let schoolPass = true;
    if (schoolFilter !== 'ALL') {
      schoolPass = (s.school || '').toLowerCase().includes(schoolFilter);
    }

    // 4. Damage / Effect Match
    let damagePass = true;
    if (damageFilter !== 'ALL') {
      if (damageFilter === 'healing') {
        damagePass = descLower.includes('hit point') || descLower.includes('heal') || descLower.includes('temp');
      } else if (damageFilter === 'charm') {
        damagePass = descLower.includes('charm');
      } else if (damageFilter === 'frighten') {
        damagePass = descLower.includes('frighten') || descLower.includes('fear');
      } else {
        damagePass = descLower.includes(damageFilter) || diceLower.includes(damageFilter);
      }
    }

    // 5. Save / Attack Match
    let savePass = true;
    if (saveFilter !== 'ALL') {
      const saveStr = (s.save || '').toLowerCase();
      if (saveFilter === 'attack') {
        savePass = descLower.includes('spell attack') || s.attack === true;
      } else {
        const fullStat = { 'str': 'strength', 'dex': 'dexterity', 'con': 'constitution', 'int': 'intelligence', 'wis': 'wisdom', 'cha': 'charisma' }[saveFilter];
        savePass = saveStr.includes(saveFilter) || descLower.includes(`${fullStat} saving throw`) || descLower.includes(`${saveFilter} save`);
      }
    }

    return textPass && levelPass && schoolPass && damagePass && savePass;
  });

  if (matches.length === 0) {
    container.innerHTML = `<p style="font-size:0.75rem; color:var(--text-muted); text-align:center; margin:1rem 0;">No matching compendium spells found.</p>`;
    return;
  }

  container.innerHTML = matches.slice(0, 30).map(s => {
    const isAlreadyKnown = activeSpellIds.has(String(s.name).toLowerCase());
    const lvlStr = s.level === 0 || s.level === 'Cantrip' ? 'Cantrip' : `Level ${s.level}`;

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:4px;">
        <div style="flex:1; padding-right:0.6rem;">
          <strong style="font-size:0.8rem; color:var(--text-main);">${s.name}</strong>
          <small style="color:var(--text-muted); margin-left:0.4rem; font-size:0.65rem;">${lvlStr} • ${s.school || 'Magic'}</small>
          <p style="font-size:0.7rem; color:var(--text-muted); margin:2px 0 0 0; line-height:1.2; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${s.desc || ''}</p>
        </div>
        <button class="secondary-btn" style="font-size:0.65rem; padding:0.25rem 0.6rem; white-space:nowrap; border-color:${isAlreadyKnown ? 'var(--border-color)' : 'var(--accent-color)'}; color:${isAlreadyKnown ? 'var(--text-muted)' : 'var(--accent-color)'};" ${isAlreadyKnown ? 'disabled' : ''} onclick="window.addSpellFromCompendium('${s.id}')">
          ${isAlreadyKnown ? '✓ Known' : '➕ Add'}
        </button>
      </div>
    `;
  }).join('');
};

window.addSpellFromCompendium = function(spellId) {
const compendium = [...spellDatabase, ...(window.state?.spells || [])];
  const targetSpell = compendium.find(s => String(s.id) === String(spellId));

  if (targetSpell) {
    if (!window.state) window.state = {};
    if (!window.state.spells) window.state.spells = [];

    const cloned = JSON.parse(JSON.stringify(targetSpell));
    cloned.id = 'sp_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    window.state.spells.push(cloned);

    const activeCache = spellCompendiumCache.get('active_spellbook');
    if (activeCache) activeCache.push(cloned);

    window.renderCompendiumSearchResults();
    if (typeof window.renderSpellbook === 'function') window.renderSpellbook();
  }
};

window.promptSpellModification = promptSpellModification;
window.promptAddSpellModal = promptAddSpellModal;