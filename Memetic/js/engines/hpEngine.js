/* ==========================================================================
   MEMETIC HEALTH & RECOVERY ENGINE
   ========================================================================== */

import { hpState } from '../core/state.js';
import { openModal } from '../core/modalEngine.js';
export function getEffectiveMaxHP() { 
  const activeState = window.hpState || hpState;
  return Math.max(1, activeState.baseMax - (activeState.necroticDrain || 0)); 
}

export function updateHPDisplay() {
  const activeState = window.hpState || hpState || { baseMax: 10, current: 10, tempHP: 0, necroticDrain: 0 };
  const hpEl = document.getElementById('displayHP');
  const satelliteEl = document.getElementById('displayHPSatellite');
  const tempTag = document.getElementById('displayTempHPTag');
  const necroticTag = document.getElementById('displayNecroticTag');

  if (!hpEl) return;

  // 1. Calculate effective max HP
  const effectiveMax = getEffectiveMaxHP();
  hpEl.innerText = `${activeState.current} / ${effectiveMax}`;

  let showSatellite = false;

  // 2. Temp HP Tag
  if (tempTag) {
    if (activeState.tempHP > 0) {
      tempTag.innerText = `+${activeState.tempHP} TEMP`;
      tempTag.style.display = 'inline-block';
      showSatellite = true;
    } else {
      tempTag.style.display = 'none';
    }
  }

  // 3. Necrotic Drain Tag
  if (necroticTag) {
    if (activeState.necroticDrain > 0) {
      necroticTag.innerText = `-${activeState.necroticDrain} MAX`;
      necroticTag.style.display = 'inline-block';
      showSatellite = true;
    } else {
      necroticTag.style.display = 'none';
    }
  }

  // 4. Toggle Satellite Companion Island Visibility
  if (satelliteEl) {
    satelliteEl.style.display = showSatellite ? 'flex' : 'none';
  }
}

export function applyHealing(amount) {
  const activeState = window.hpState || hpState;
  activeState.current = Math.min(getEffectiveMaxHP(), activeState.current + amount);
  updateHPDisplay();
}

export function applyDamage(amount) {
  const activeState = window.hpState || hpState;
  let remaining = amount;
  if (activeState.tempHP > 0) {
    if (activeState.tempHP >= remaining) { 
      activeState.tempHP -= remaining; 
      remaining = 0; 
    } else { 
      remaining -= activeState.tempHP; 
      activeState.tempHP = 0; 
    }
  }
  if (remaining > 0) activeState.current = Math.max(0, activeState.current - remaining);
  updateHPDisplay();
}

export function promptAdjustHP() {
  const activeState = window.hpState || hpState;
  openModal("Health & HP Engine", `
    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:0.8rem; align-items:center;">
      <div>
        <label style="font-size:0.8rem; color:var(--text-muted);">Adjustment Type:</label>
        <select id="hpAdjType" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
          <option value="heal">Standard Healing (+HP)</option>
          <option value="damage">Take Damage (-HP)</option>
          <option value="temp">Grant Temporary / Bonus HP</option>
          <option value="necrotic">Apply Necrotic Drain (-Max HP)</option>
          <option value="cure_necrotic">Cure Necrotic Drain</option>
        </select>
      </div>
      <div>
        <label style="font-size:0.8rem; color:var(--text-muted);">Amount:</label>
        <input type="number" id="hpAdjAmount" value="5" min="1" autocomplete="off" data-dashlane-disabled="true" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
      </div>
    </div>
  `, [
    { label: "Cancel", class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: "Apply HP Change", class: '', onclick: () => {
      const type = document.getElementById('hpAdjType').value;
      const amt = parseInt(document.getElementById('hpAdjAmount').value) || 0;

      if (type === 'heal') applyHealing(amt);
      if (type === 'damage') applyDamage(amt);
      if (type === 'temp') { activeState.tempHP = Math.max(activeState.tempHP, amt); updateHPDisplay(); }
      if (type === 'necrotic') { activeState.necroticDrain = (activeState.necroticDrain || 0) + amt; activeState.current = Math.min(getEffectiveMaxHP(), activeState.current); updateHPDisplay(); }
      if (type === 'cure_necrotic') { activeState.necroticDrain = Math.max(0, (activeState.necroticDrain || 0) - amt); updateHPDisplay(); }
      closeModal(true);
    }}
  ]);
}

export function gmAdjustPlayerHP(playerName) {
  openModal(`GM Control: ${playerName}`, `
    <div><label>Intervention Type:</label><select id="gmHpType"><option value="heal">Heal Player (+HP)</option><option value="damage">Damage Player (-HP)</option></select></div>
    <div style="margin-top:0.4rem;"><label>Amount:</label><input type="number" id="gmHpAmt" value="10" /></div>
  `, [
    { label: "Cancel", class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: "Execute", onclick: () => {
      const amt = parseInt(document.getElementById('gmHpAmt').value) || 0;
      if (document.getElementById('gmHpType').value === 'heal') applyHealing(amt); else applyDamage(amt);
      alertModal(`Applied to ${playerName}!`);
    }}
  ]);
}

// Global Bindings
window.promptAdjustHP = promptAdjustHP;
window.updateHPDisplay = updateHPDisplay;
window.applyHealing = applyHealing;
window.applyDamage = applyDamage;