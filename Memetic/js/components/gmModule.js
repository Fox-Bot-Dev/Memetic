/**
 * ==========================================================================
 * MEMETIC CODEX - GM ENGINE & SESSION HOST MODULE (js/components/gmModule.js)
 * ==========================================================================
 */

import { alertModal } from '../core/modalEngine.js';

// Internal GM State
const gmState = {
  isGM: false,
  isHost: false,
  connectedPlayers: new Map(), // socketId/peerId -> Player Character State
  sharedLoot: [],
  sharedJournal: [],
  activeCombat: {
    inCombat: false,
    round: 1,
    turnIndex: 0,
    initiativeOrder: [] // The central array for the harvested combat tracker
  },
  customRulesets: []
};

/**
 * Toggle GM Mode local authorization & UI view
 */
export function toggleGMRole(enabled) {
  gmState.isGM = enabled;

  const gmLockedElements = document.querySelectorAll('.gm-locked');
  gmLockedElements.forEach(el => { el.style.display = enabled ? 'flex' : 'none'; });

  const attunementBtn = document.getElementById('gmAddAttunementBtn');
  if (attunementBtn) attunementBtn.style.display = enabled ? 'inline-block' : 'none';

  console.log(`[Memetic GM Core] GM Mode ${enabled ? 'ACTIVATED 👁️' : 'DEACTIVATED'}`);
}

export function initializeGMSessionHost(sessionKey) {
  gmState.isHost = true;
  console.log(`[Memetic Host] Hosting session key: ${sessionKey}`);
}

export function inspectPlayerSheet(playerId) {
  if (!gmState.isGM) return;
  const playerData = gmState.connectedPlayers.get(playerId);
  if (!playerData) { console.warn(`[GM Module] Player ID ${playerId} not found.`); return; }
  console.log(`[GM Module] Opening Remote Sheet: ${playerData.name}`);
}

/**
 * Combat Tracker Engine - UI Toggle
 */
export function toggleGMCombatMode() {
  if (!gmState.isGM) return;
  
  gmState.activeCombat.inCombat = !gmState.activeCombat.inCombat;
  const btn = document.getElementById('gmCombatToggleBtn');
  const badge = document.getElementById('combatStatusBadge');
  const trackerBox = document.getElementById('gmCombatTrackerContainer'); 

  if (gmState.activeCombat.inCombat) {
    if (btn) btn.textContent = '⏹️ End Combat Session';
    if (badge) badge.innerHTML = 'Mode: <strong style="color:var(--debuff-color);">Combat ⚔️</strong>';
    if (trackerBox) trackerBox.style.display = 'block';
    renderGMCombatTracker();
  } else {
    if (btn) btn.textContent = '⚔️ Start Combat Mode';
    if (badge) badge.innerHTML = 'Mode: <strong>Exploration</strong>';
    if (trackerBox) trackerBox.style.display = 'none';
  }
}

export function toggleIsolatedClassSlots(enabled) {
  if (!window.state) window.state = {};
  window.state.isolatedClassSlots = enabled;

  console.log(`[GM Module] Isolated Class Spell Slots: ${enabled ? 'ACTIVE' : 'INACTIVE (RAW Shared Pool)'}`);
  
  // Re-render spellbook to immediately shift UI layout
  if (typeof window.renderSpellbook === 'function') {
    window.renderSpellbook();
  }
}
  window.toggleIsolatedClassSlots = toggleIsolatedClassSlots;
/**
 * ==========================================================================
 * HARVESTED INITIATIVE & HEALTH TRACKER LOGIC
 * ==========================================================================
 */

function getHealthColor(currentHp, maxHp) {
  if (currentHp > maxHp) return '#ffffff'; 
  if (maxHp <= 0) return 'hsl(0, 0%, 10%)';
  const pct = Math.max(0, Math.min(1, currentHp / maxHp));
  const hue = pct * 120;
  const lightness = 8 + (pct * 37); 
  const saturation = pct < 0.1 ? 10 : 85;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function addGMCombatant() {
  const name = document.getElementById('gmInitName')?.value || 'Unknown';
  const init = parseInt(document.getElementById('gmInitRoll')?.value) || 0;
  const hp = parseInt(document.getElementById('gmInitHP')?.value) || 10;
  const type = document.getElementById('gmInitType')?.value || 'Enemy';

  gmState.activeCombat.initiativeOrder.push({
    id: Date.now(),
    name, init, type,
    baseMaxHp: hp, currentHp: hp, tempHp: 0, necroticDmg: 0, damageTaken: 0,
    statusEffects: []
  });

  document.getElementById('gmInitName').value = '';
  document.getElementById('gmInitRoll').value = '';
  document.getElementById('gmInitHP').value = '';

  sortGMInitiative();
}

function sortGMInitiative() {
  gmState.activeCombat.initiativeOrder.sort((a, b) => b.init - a.init);
  renderGMCombatTracker();
}

export function adjustGMCombatantHp(id, amount) {
  const char = gmState.activeCombat.initiativeOrder.find(c => c.id === id);
  if (!char) return;

  if (amount < 0) { // Taking Damage (Temp HP soaks first)
    let dmg = Math.abs(amount);
    char.damageTaken += dmg; 
    if (char.tempHp > 0) {
      if (dmg <= char.tempHp) { char.tempHp -= dmg; dmg = 0; } 
      else { dmg -= char.tempHp; char.tempHp = 0; }
    }
    char.currentHp -= dmg;
  } else { // Healing
    char.currentHp += amount;
  }
  renderGMCombatTracker();
}

export function setGMCombatantTempHp(id, val) {
  const char = gmState.activeCombat.initiativeOrder.find(c => c.id === id);
  if (char) { char.tempHp = parseInt(val) || 0; renderGMCombatTracker(); }
}

export function setGMCombatantNecrotic(id, val) {
  const char = gmState.activeCombat.initiativeOrder.find(c => c.id === id);
  if (char) {
    char.necroticDmg = parseInt(val) || 0;
    const effectiveMax = char.baseMaxHp - char.necroticDmg;
    if (char.currentHp > effectiveMax) char.currentHp = effectiveMax;
    renderGMCombatTracker();
  }
}

export function addGMCombatantStatus(id, inputElem, event) {
  if (event.key === 'Enter' && inputElem.value.trim() !== '') {
    event.preventDefault();
    const char = gmState.activeCombat.initiativeOrder.find(c => c.id === id);
    if (char) {
      char.statusEffects.push(inputElem.value.trim());
      renderGMCombatTracker();
    }
  }
}

export function removeGMCombatantStatus(charId, index) {
  const char = gmState.activeCombat.initiativeOrder.find(c => c.id === charId);
  if (char) { char.statusEffects.splice(index, 1); renderGMCombatTracker(); }
}

export function removeGMCombatant(id) {
  gmState.activeCombat.initiativeOrder = gmState.activeCombat.initiativeOrder.filter(c => c.id !== id);
  renderGMCombatTracker();
}

export function clearGMCombatants() {
  if (confirm("Clear all combatants?")) {
    gmState.activeCombat.initiativeOrder = [];
    renderGMCombatTracker();
  }
}

function renderGMCombatTracker() {
  const list = document.getElementById('gmCombatantList');
  if (!list) return;
  list.innerHTML = '';

  gmState.activeCombat.initiativeOrder.forEach(c => {
    const effectiveMaxHp = Math.max(1, c.baseMaxHp - c.necroticDmg);
    const isOverMax = c.currentHp > effectiveMaxHp;
    const hpPct = Math.max(0, Math.min(100, Math.round((c.currentHp / effectiveMaxHp) * 100)));
    const hpColor = getHealthColor(c.currentHp, effectiveMaxHp);
    const isEnemy = c.type.toLowerCase() === 'enemy';

    list.innerHTML += `
      <div style="background:var(--bg-primary); border:1px solid var(--border-color); border-left:6px solid ${hpColor}; border-radius:6px; padding:0.6rem; display:flex; flex-direction:column; gap:0.4rem; position:relative; overflow:hidden;">
        
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1.1rem; font-weight:900; background:var(--bg-secondary); padding:0.2rem 0.5rem; border-radius:4px; border:1px solid var(--border-color);">${c.init}</span>
            <div>
              <strong style="color:var(--text-main); font-size:0.9rem;">${c.name}</strong>
              <span style="font-size:0.6rem; text-transform:uppercase; margin-left:0.3rem; color:${isEnemy ? 'var(--debuff-color, #ef4444)' : 'var(--accent-color)'};">${c.type}</span>
            </div>
          </div>
          <button style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem;" onclick="removeGMCombatant(${c.id})">&times;</button>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-top:0.2rem;">
          <div style="display:flex; gap:0.2rem; align-items:center;">
            <button class="secondary-btn" style="padding:0.15rem 0.4rem; font-size:0.65rem;" onclick="adjustGMCombatantHp(${c.id}, -5)">-5</button>
            <button class="secondary-btn" style="padding:0.15rem 0.4rem; font-size:0.65rem;" onclick="adjustGMCombatantHp(${c.id}, -1)">-1</button>
            <span style="font-size:0.85rem; font-weight:bold; min-width:65px; text-align:center; color:${isOverMax ? '#fff' : 'var(--text-main)'};">
              ${c.currentHp} ${c.tempHp > 0 ? `<span style="color:#22d3ee; font-size:0.65rem;">(+${c.tempHp})</span>` : ''} / ${effectiveMaxHp}
            </span>
            <button class="secondary-btn" style="padding:0.15rem 0.4rem; font-size:0.65rem;" onclick="adjustGMCombatantHp(${c.id}, 1)">+1</button>
            <button class="secondary-btn" style="padding:0.15rem 0.4rem; font-size:0.65rem;" onclick="adjustGMCombatantHp(${c.id}, 5)">+5</button>
          </div>
          
          <div style="display:flex; gap:0.3rem; align-items:center;">
             <label style="font-size:0.6rem; color:var(--text-muted);">Temp:</label>
             <input type="number" value="${c.tempHp || ''}" style="width:40px; padding:0.1rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-main);" onchange="setGMCombatantTempHp(${c.id}, this.value)" />
             <label style="font-size:0.6rem; color:var(--text-muted);">Necro:</label>
             <input type="number" value="${c.necroticDmg || ''}" style="width:40px; padding:0.1rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-main);" onchange="setGMCombatantNecrotic(${c.id}, this.value)" />
          </div>
        </div>

        <div style="width:100%; height:4px; background:var(--bg-secondary); border-radius:2px; overflow:hidden; margin-top:0.2rem;">
           <div style="width:${isOverMax ? 100 : hpPct}%; height:100%; background:${hpColor}; transition:width 0.3s ease;"></div>
        </div>

        <div style="display:flex; align-items:center; gap:0.4rem; margin-top:0.2rem;">
          <input type="text" placeholder="+ Status (Enter)" style="padding:0.2rem; font-size:0.65rem; width:100px; background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-main);" onkeydown="addGMCombatantStatus(${c.id}, this, event)" />
          <div style="display:flex; flex-wrap:wrap; gap:0.2rem;">
            ${c.statusEffects.map((effect, idx) => `
              <span style="background:var(--bg-secondary); border:1px solid var(--border-color); font-size:0.6rem; padding:0.1rem 0.3rem; border-radius:4px;">${effect} <span style="color:var(--debuff-color, #ef4444); cursor:pointer; margin-left:2px;" onclick="removeGMCombatantStatus(${c.id}, ${idx})">&times;</span></span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  });
}

/**
 * Golden Ticket Rules Injector Engine
 */
export function parseGoldenTicketRules(rawText) {
  if (!gmState.isGM) {
    alertModal('GM authorization required to inject rulesets.', 'Access Denied');
    return;
  }
  if (!rawText.trim()) return;

  try {
    console.log('[Golden Ticket] Extracting rules mechanics...');
    gmState.customRulesets.push({ id: `rule_${Date.now()}`, timestamp: new Date().toISOString(), raw: rawText });
    alertModal('Custom mechanics extracted and bound to active world session!', 'Rules Manifested');
  } catch (err) {
    console.error('[Golden Ticket Error]', err);
    alertModal('Failed to parse injected rules syntax.', 'Extraction Error');
  }
}

// Global Bindings
window.toggleGMRole = toggleGMRole;
window.toggleGMCombatMode = toggleGMCombatMode;
window.parseGoldenTicketRules = parseGoldenTicketRules;

// Combat Tracker Bindings
window.addGMCombatant = addGMCombatant;
window.adjustGMCombatantHp = adjustGMCombatantHp;
window.setGMCombatantTempHp = setGMCombatantTempHp;
window.setGMCombatantNecrotic = setGMCombatantNecrotic;
window.addGMCombatantStatus = addGMCombatantStatus;
window.removeGMCombatantStatus = removeGMCombatantStatus;
window.removeGMCombatant = removeGMCombatant;
window.clearGMCombatants = clearGMCombatants;