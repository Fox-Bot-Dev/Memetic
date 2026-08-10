/* ==========================================================================
   SPELL UI RENDERING & HTML FACTORY (js/spells/spellUI.js)
   ========================================================================== */

import { casterAbilityMap, getStatMod, parseSpellSave, parseSpellAttack, parseSpellDice } from './spellEngine.js';

// Helper to extract max & used from ANY slot format (numbers, strings, or objects)
const parseSlotObj = (slot) => {
  if (typeof slot === 'number') return { max: slot, used: 0 };
  if (typeof slot === 'string' && !isNaN(parseInt(slot))) return { max: parseInt(slot), used: 0 };
  if (slot && typeof slot === 'object') {
    const m = parseInt(slot.max ?? slot.total ?? slot.slots ?? slot.quantity ?? 0) || 0;
    let u = 0;
    if (slot.used !== undefined) u = parseInt(slot.used) || 0;
    else if (slot.value !== undefined) u = Math.max(0, m - (parseInt(slot.value) || 0));
    else if (slot.current !== undefined) u = Math.max(0, m - (parseInt(slot.current) || 0));
    else if (slot.remaining !== undefined) u = Math.max(0, m - (parseInt(slot.remaining) || 0));
    return { max: m, used: u };
  }
  return { max: 0, used: 0 };
};

// --------------------------------------------------------------------------
// 1. VIEWPORT OBSERVER & VIRTUALIZATION
// --------------------------------------------------------------------------
const viewportObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.remove('off-screen');
      entry.target.classList.add('in-viewport');
    } else {
      entry.target.classList.remove('in-viewport');
      entry.target.classList.add('off-screen');
    }
  });
}, { root: null, rootMargin: '100px', threshold: 0.01 });

export function observeSpellCards(containerId = 'spellListZone') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.card').forEach(card => viewportObserver.observe(card));
}

export function renderSpellsInChunks(spells, container, createCardHTMLFunc, chunkSize = 15) {
  if (!container) return;
  container.innerHTML = ''; 

  if (!spells || spells.length === 0) {
    container.innerHTML = `<p style="font-size:0.75rem; color:var(--text-muted); padding:1rem; text-align:center; border: 1px dashed var(--border-color); border-radius:4px;">No spells found for this view.</p>`;
    return;
  }

  let index = 0;
  function renderNextChunk() {
    const end = Math.min(index + chunkSize, spells.length);
    let chunkHTML = '';
    for (let i = index; i < end; i++) {
      chunkHTML += createCardHTMLFunc(spells[i]);
    }
    container.insertAdjacentHTML('beforeend', chunkHTML);
    index = end;

    if (index < spells.length) requestAnimationFrame(renderNextChunk);
    else observeSpellCards(container.id);
  }
  renderNextChunk();
}

// --------------------------------------------------------------------------
// 2. HTML GENERATORS
// --------------------------------------------------------------------------
export function renderClassNubbins(casterClasses, activeClassFilter) {
  const tabsContainer = document.getElementById('spellClassTabs');
  if (!tabsContainer) return;

  const showUpcast = window.state?.showUpcastSpillover || false;

  const classButtons = ['ALL', ...casterClasses].map(cls => `
    <button class="spell-top-btn ${activeClassFilter.toUpperCase() === cls.toUpperCase() ? 'active' : ''}" onclick="filterSpellClass('${cls}')">
      ${cls.toUpperCase()}
    </button>
  `).join('');

  const actionGroup = `
    <div style="display:flex; gap:0.4rem; align-items:center;">
      <button class="spell-top-btn" 
              style="color:var(--accent-color); border-color:var(--accent-color);" 
              onclick="promptAddSpellModal()" 
              data-tooltip="Open Compendium Browser to add new spells to your sheet">
        ➕ ADD SPELL
      </button>
      <button class="spell-top-btn ${showUpcast ? 'active' : ''}" 
              onclick="toggleUpcastSpillover()" 
              data-tooltip="Toggle Upcast Spillover: ${showUpcast ? 'ENABLED (Showing lower-level scaling spells in higher tabs)' : 'DISABLED (Clean Mode - Showing exact base-level spells only)'}">
        <span>${showUpcast ? '⇡ UPCAST ON' : '🎯 CLEAN VIEW'}</span>
      </button>
    </div>
  `;

  tabsContainer.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
      <div style="display:flex; gap:0.35rem;">${classButtons}</div>
      ${actionGroup}
    </div>
  `;
}

export function renderLevelDock(spellSlots, spells, activeClassFilter, activeLevelFilter, isIsolated) {
  const dockContainer = document.getElementById('spellLevelDock');
  if (!dockContainer) return;

  const allLevels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'PACT', 'ALL'];
  const availableLevels = new Set(['0', 'ALL']);

  const classSpells = activeClassFilter === 'ALL' ? spells : spells.filter(s => (s.casterClass || '').toLowerCase() === activeClassFilter.toLowerCase());

  allLevels.forEach(lvl => {
    if (lvl === 'ALL' || lvl === '0') return;

    if (lvl === 'PACT') {
      const pactData = spellSlots['Pact'] || spellSlots['pact'] || spellSlots['PACT'];
      const parsedPact = parseSlotObj(pactData);
      const hasPactSpells = classSpells.some(s => s.isPact || s.level === 'Pact');
      if ((parsedPact.max > 0 || hasPactSpells) && (activeClassFilter === 'ALL' || activeClassFilter.toLowerCase() === 'warlock')) availableLevels.add('PACT');
    } else {
      let slotData = null;
      if (isIsolated && activeClassFilter !== 'ALL' && spellSlots[activeClassFilter.toLowerCase()]) {
        slotData = spellSlots[activeClassFilter.toLowerCase()][lvl];
      } else {
        if (spellSlots[lvl] !== undefined || spellSlots[`Level ${lvl}`] !== undefined) {
          slotData = spellSlots[lvl] ?? spellSlots[`Level ${lvl}`];
        } else {
          for (const clsKey of Object.keys(spellSlots)) {
             if (typeof spellSlots[clsKey] === 'object' && spellSlots[clsKey][lvl] !== undefined) {
                slotData = spellSlots[clsKey][lvl];
                break;
             }
          }
        }
      }
      const parsed = parseSlotObj(slotData);
      const hasSpellsAtLevel = classSpells.some(s => String(s.level) === String(lvl));
      if (parsed.max > 0 || hasSpellsAtLevel) availableLevels.add(lvl);
    }
  });

  const getOrdinalLabel = (lvl) => {
    if (lvl === 'ALL') return 'ALL ⚠️';
    if (lvl === '0') return 'CANT';
    if (lvl === 'PACT') return 'PACT';
    if (lvl === '1') return '1st';
    if (lvl === '2') return '2nd';
    if (lvl === '3') return '3rd';
    return `${lvl}th`;
  };

  dockContainer.innerHTML = allLevels.filter(lvl => availableLevels.has(lvl)).map(lvl => {
      let slotTag = '';
      if (lvl !== 'ALL' && lvl !== '0') {
        const slotKey = lvl === 'PACT' ? 'Pact' : lvl;
        let slotData = null;
        if (isIsolated && activeClassFilter !== 'ALL' && spellSlots[activeClassFilter.toLowerCase()]) {
           slotData = spellSlots[activeClassFilter.toLowerCase()][slotKey];
        } else {
           if (spellSlots[slotKey] !== undefined || spellSlots[`Level ${slotKey}`] !== undefined) {
             slotData = spellSlots[slotKey] ?? spellSlots[`Level ${slotKey}`];
           } else {
             for (const clsKey of Object.keys(spellSlots)) {
                if (typeof spellSlots[clsKey] === 'object' && spellSlots[clsKey][slotKey] !== undefined) {
                   slotData = spellSlots[clsKey][slotKey];
                   break;
                }
             }
           }
        }
        const parsed = parseSlotObj(slotData);
        if (parsed.max > 0) {
          const remaining = Math.max(0, parsed.max - parsed.used);
          slotTag = `<span class="spell-slot-badge ${remaining === 0 ? 'empty' : ''}">${remaining}/${parsed.max}</span>`;
        }
      }
      const isActive = String(activeLevelFilter) === String(lvl);
      return `<button class="spell-right-btn ${isActive ? 'active' : ''}" onclick="filterSpellLevel('${lvl}')">${slotTag}<span>${getOrdinalLabel(lvl)}</span></button>`;
    }).join('');
}

export function renderSpellStatsHeader(casterClasses, scores, pb, activeClassFilter, spellSlots, isIsolated) {
  const headerContainer = document.getElementById('spellStatsHeader');
  if (!headerContainer) return;

  let classesToDisplay = activeClassFilter === 'ALL' ? casterClasses : [activeClassFilter];
  if (classesToDisplay.length === 0) classesToDisplay = ['bard'];

  const createSegmentBarHTML = (remaining, totalMax) => {
    if (totalMax === 0) return `<div style="background:var(--bg-primary); height:8px; border-radius:3px; border:1px solid var(--border-color); width:100%; margin-top:0.35rem;"></div>`;
    const chunks = [];
    for (let i = 0; i < totalMax; i++) {
      const isFilled = i < remaining;
      const color = isFilled ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.08)';
      const borderColor = isFilled ? 'var(--accent-color)' : 'var(--border-color)';
      chunks.push(`<div style="flex:1; height:8px; background:${color}; border:1px solid ${borderColor}; border-radius:2px; transition:all 0.25s ease;" title="Slot ${i + 1}: ${isFilled ? 'Available' : 'Used'}"></div>`);
    }
    return `<div style="display:flex; gap:3px; width:100%; margin-top:0.35rem;">${chunks.join('')}</div>`;
  };

  if (isIsolated) {
    headerContainer.innerHTML = classesToDisplay.map(clsName => {
      const clsLower = clsName.toLowerCase();
      const mod = getStatMod(scores[casterAbilityMap[clsLower] || 'CHA'] || 10);
      const dc = 8 + pb + mod;
      const atkStr = (mod + pb) >= 0 ? `+${mod + pb}` : (mod + pb);

      let totalMax = 0; let totalUsed = 0;
      const classPool = spellSlots[clsLower] || {};
      Object.keys(classPool).forEach(k => {
        const parsed = parseSlotObj(classPool[k]);
        totalMax += parsed.max;
        totalUsed += parsed.used;
      });
      const remaining = Math.max(0, totalMax - totalUsed);

      return `
        <div class="pill-card" style="padding:0.6rem 0.8rem; border:1px solid var(--border-color); background:var(--bg-secondary); flex: 1; min-width: 190px; max-width: 280px; box-sizing: border-box;">
          <div style="font-size:0.7rem; color:var(--accent-color); font-weight:bold; text-transform:uppercase; margin-bottom:0.4rem; text-align:center;"><span>${clsName} (${casterAbilityMap[clsLower] || 'CHA'})</span></div>
          <div style="display:grid; grid-template-columns: 1fr auto 1fr; align-items:center; margin-bottom:0.4rem;">
            <div style="text-align:center;"><span style="font-size:0.6rem; color:var(--text-muted); font-weight:bold; display:block; letter-spacing:0.5px;">SAVE DC</span><span style="font-size:1.2rem; font-weight:800; color:var(--text-main); line-height:1.2;">${dc}</span></div>
            <div style="width:1px; background:var(--border-color); height:24px; opacity:0.6;"></div>
            <div style="text-align:center;"><span style="font-size:0.6rem; color:var(--text-muted); font-weight:bold; display:block; letter-spacing:0.5px;">SPELL ATK</span><span style="font-size:1.2rem; font-weight:800; color:var(--accent-color); line-height:1.2;">${atkStr}</span></div>
          </div>
          <div style="border-top:1px solid var(--border-color); padding-top:0.4rem; width:100%;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.65rem;"><span style="color:var(--text-muted); font-weight:bold;">${clsName.toUpperCase()} SLOTS</span><span style="color:var(--text-main); font-weight:bold;">${remaining} / ${totalMax}</span></div>
            ${createSegmentBarHTML(remaining, totalMax)}
          </div>
        </div>
      `;
    }).join('');
    return;
  }

  let sharedMax = 0; 
  let sharedUsed = 0;

  const processEntry = (val, key) => {
    if (!val || key.toLowerCase() === 'pact') return;
    
    if (typeof val === 'number' || typeof val === 'string' || val.max !== undefined || val.total !== undefined || val.slots !== undefined) {
      const parsed = parseSlotObj(val);
      sharedMax += parsed.max;
      sharedUsed += parsed.used;
    } else if (typeof val === 'object') {
      Object.keys(val).forEach(subKey => {
        if (subKey.toLowerCase() !== 'pact') {
          const parsed = parseSlotObj(val[subKey]);
          sharedMax += parsed.max;
          sharedUsed += parsed.used;
        }
      });
    }
  };

  if (Array.isArray(spellSlots)) {
    spellSlots.forEach((item, idx) => processEntry(item, String(idx)));
  } else {
    Object.keys(spellSlots).forEach(k => processEntry(spellSlots[k], k));
  }

  const sharedRemaining = Math.max(0, sharedMax - sharedUsed);
  const cardsHTML = classesToDisplay.map(clsName => {
    const clsLower = clsName.toLowerCase();
    const mod = getStatMod(scores[casterAbilityMap[clsLower] || 'CHA'] || 10);
    const dc = 8 + pb + mod;
    const atkStr = (mod + pb) >= 0 ? `+${mod + pb}` : (mod + pb);

    return `
      <div class="pill-card" style="padding:0.6rem 0.8rem; border:1px solid var(--border-color); background:var(--bg-secondary); flex: 1; min-width: 160px; max-width: 240px; box-sizing: border-box;">
        <div style="font-size:0.7rem; color:var(--accent-color); font-weight:bold; text-transform:uppercase; margin-bottom:0.4rem; text-align:center;"><span>${clsName} (${casterAbilityMap[clsLower] || 'CHA'})</span></div>
        <div style="display:grid; grid-template-columns: 1fr auto 1fr; align-items:center;">
          <div style="text-align:center;"><span style="font-size:0.6rem; color:var(--text-muted); font-weight:bold; display:block; letter-spacing:0.5px;">SAVE DC</span><span style="font-size:1.2rem; font-weight:800; color:var(--text-main); line-height:1.2;">${dc}</span></div>
          <div style="width:1px; background:var(--border-color); height:24px; opacity:0.6;"></div>
          <div style="text-align:center;"><span style="font-size:0.6rem; color:var(--text-muted); font-weight:bold; display:block; letter-spacing:0.5px;">SPELL ATK</span><span style="font-size:1.2rem; font-weight:800; color:var(--accent-color); line-height:1.2;">${atkStr}</span></div>
        </div>
      </div>
    `;
  }).join('');

  headerContainer.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:0.6rem; width:100%;">
      <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">${cardsHTML}</div>
      <div class="panel-card" style="padding:0.6rem 0.8rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; font-weight:bold; margin-bottom:0.2rem;"><span style="color:var(--accent-color);">⚡ SHARED MULTICLASS SPELL SLOTS</span><span style="color:var(--text-main);">${sharedRemaining} / ${sharedMax}</span></div>
        ${createSegmentBarHTML(sharedRemaining, sharedMax)}
      </div>
    </div>
  `;
}

export function createSpellCardHTML(spell, charLevel, pb, scores, activeCasterClasses, spellSlots, isIsolated) {
  let components = [];
  const casterCls = spell.casterClass || (activeCasterClasses[0] || 'bard');
  const mod = getStatMod(scores[casterAbilityMap[casterCls.toLowerCase()] || 'CHA'] || 10);
  const dc = 8 + pb + mod;
  const atkBonus = mod + pb;
  const atkStr = atkBonus >= 0 ? `+${atkBonus}` : `${atkBonus}`;
  const safeName = spell.name.replace(/'/g, "\\'");

  if (parseSpellAttack(spell)) components.push(`<button class="secondary-btn" style="font-size:0.65rem; padding:0.15rem 0.4rem; border-color:var(--accent-color); color:var(--accent-color);" title="Make Spell Attack Roll" onclick="executeRoll('${safeName} Attack', '1d20${atkStr}')">⚔️ ATK ${atkStr}</button>`);
  const saveStat = parseSpellSave(spell);
  if (saveStat) components.push(`<button class="secondary-btn" style="font-size:0.65rem; padding:0.15rem 0.4rem; border-color:var(--accent-color); color:var(--text-main);" title="${saveStat} Save Required" onclick="alertModal('Target must succeed on a DC ${dc} ${saveStat} saving throw!', '${safeName} Save')">🛡️ ${saveStat} DC ${dc}</button>`);
  const diceStr = parseSpellDice(spell, charLevel);
  if (diceStr) components.push(`<button class="secondary-btn" style="font-size:0.65rem; padding:0.15rem 0.4rem;" title="Roll ${diceStr} Damage/Effect" onclick="executeRoll('${safeName} Effect', '${diceStr}')">🎲 ${diceStr}</button>`);
  components.push(`<button class="secondary-btn" style="font-size:0.65rem; padding:0.15rem 0.4rem; border-color:var(--border-color);" title="Modify Rules or Add Homebrew Text" onclick="triggerSpellModifyModal('${spell.id}')">✏️ Modify</button>`);

  let isCardDepleted = false;
  if (spell.level > 0) {
    let validSlots = [];
    const canScale = /at higher level/i.test(spell.desc) || /spell slot level above/i.test(spell.desc) || /higher-level spell slot/i.test(spell.desc);
    const clsLower = casterCls.toLowerCase();

    let targetPool = spellSlots;
    if (isIsolated && spellSlots[clsLower]) targetPool = spellSlots[clsLower];

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
      const parsed = parseSlotObj(sData);
      if (parsed.max > 0) validSlots.push({ val: i, label: `Lvl ${i}`, rem: Math.max(0, parsed.max - parsed.used) });
    }
    
    const pactData = spellSlots['Pact'] || spellSlots['pact'] || spellSlots['PACT'];
    const parsedPact = parseSlotObj(pactData);
    if (parsedPact.max > 0 && (parseInt(pactData.level) || 1) >= spell.level) {
      validSlots.push({ val: 'Pact', label: 'Pact', rem: Math.max(0, parsedPact.max - parsedPact.used) });
    }

    if (validSlots.length === 0) {
      let baseData = targetPool[spell.level] || { max: 4, used: 0 };
      const parsedBase = parseSlotObj(baseData);
      validSlots.push({ val: spell.level, label: `Lvl ${spell.level}`, rem: Math.max(0, parsedBase.max - parsedBase.used) });
    }

    isCardDepleted = !validSlots.some(slot => slot.rem > 0);

    if (canScale) {
      const options = validSlots.map(slot => `<option value="${slot.val}" ${slot.rem === 0 ? 'disabled' : ''}>${slot.label} (${slot.rem})</option>`);
      components.push(`
        <div class="cast-action-group" style="display:flex; align-items:stretch; background:var(--bg-panel); border:1px solid var(--border-color); border-radius:4px; overflow:hidden;">
          <select class="upcast-select" id="upcast_${spell.id}" style="font-size:0.65rem; padding:0.1rem 0.2rem; background:transparent; color:var(--text-main); border:none; border-right:1px solid var(--border-color); outline:none; cursor:pointer;">${options.join('')}</select>
          <button class="secondary-btn cast-slot-btn ${isCardDepleted ? 'depleted' : ''}" style="font-size:0.65rem; padding:0.15rem 0.5rem; border:none; border-radius:0; background:transparent; box-shadow:none; color:${isCardDepleted ? 'var(--text-muted)' : 'var(--accent-color)'};" ${isCardDepleted ? 'disabled' : ''} onclick="castSpellSlot('${spell.id}', document.getElementById('upcast_${spell.id}')?.value || '${spell.level}')">${isCardDepleted ? '🔒' : '🔥 Cast'}</button>
        </div>
      `);
    } else {
      const targetSlot = validSlots.find(slot => slot.rem > 0) || validSlots[0];
      components.push(`
        <div class="cast-action-group" style="display:flex; align-items:stretch; background:var(--bg-panel); border:1px solid var(--border-color); border-radius:4px; overflow:hidden;">
          <div class="static-slot-tag" style="font-size:0.65rem; padding:0.25rem 0.4rem; color:var(--text-muted); border-right:1px solid var(--border-color);">${targetSlot.label}</div>
          <button class="secondary-btn cast-slot-btn ${isCardDepleted ? 'depleted' : ''}" style="font-size:0.65rem; padding:0.15rem 0.5rem; border:none; border-radius:0; background:transparent; box-shadow:none; color:${isCardDepleted ? 'var(--text-muted)' : 'var(--accent-color)'};" ${isCardDepleted ? 'disabled' : ''} onclick="castSpellSlot('${spell.id}', '${targetSlot.val}')">${isCardDepleted ? '🔒' : '🔥 Cast'}</button>
        </div>
      `);
    }
  } else {
    components.push(`<button class="secondary-btn" style="font-size:0.65rem; padding:0.15rem 0.5rem;" onclick="rollSpellDamage('${safeName}', '${diceStr || ''}')">✨ Cast</button>`);
  }

  return `
    <div class="card ${isCardDepleted ? 'depleted' : ''}" data-base-level="${spell.level}" data-spell-id="${spell.id}" style="margin:0; padding:0.65rem; background:var(--bg-primary); border:1px solid var(--border-color);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.4rem;">
        <div>
          <strong style="color:var(--text-main); font-size:0.85rem;">${spell.name}</strong>
          ${spell.isHomebrew ? '<span class="subclass-badge" style="font-size:0.55rem; margin-left:0.3rem;">HOMEBREW</span>' : ''}
          <small style="color:var(--text-muted); margin-left:0.4rem; font-size:0.65rem;">${spell.school ? spell.school + ' • ' : ''}${spell.castingTime || '1 Action'}</small>
        </div>
        <div style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap; justify-content:flex-end;">${components.join('')}</div>
      </div>
      <p style="font-size:0.75rem; color:var(--text-main); margin-top:0.35rem; line-height:1.3; margin-bottom:0;">${spell.desc || 'No description provided.'}</p>
    </div>
  `;
}