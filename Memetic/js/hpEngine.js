/* ==========================================================================
   MEMETIC HEALTH & RECOVERY ENGINE
   ========================================================================== */

import { hpState } from './state.js';
import { openModal, alertModal } from './modalEngine.js';

export function getEffectiveMaxHP() { 
  return Math.max(1, hpState.baseMax - hpState.necroticDrain); 
}

export function updateHPDisplay() {
  const hpElem = document.getElementById('displayHP');
  const necroticElem = document.getElementById('displayNecroticTag');
  const tempHPElem = document.getElementById('displayTempHPTag');

  if (hpElem) hpElem.innerText = `${hpState.current} / ${getEffectiveMaxHP()}`;

  if (necroticElem) {
    if (hpState.necroticDrain > 0) {
      necroticElem.innerText = `[☠️-${hpState.necroticDrain}]`;
      necroticElem.style.display = 'inline-block';
    } else { 
      necroticElem.style.display = 'none'; 
    }
  }

  if (tempHPElem) {
    if (hpState.tempHP > 0) {
      tempHPElem.innerText = `[+${hpState.tempHP} Temp]`;
      tempHPElem.style.display = 'inline-block';
    } else { 
      tempHPElem.style.display = 'none'; 
    }
  }
}

export function applyHealing(amount) {
  hpState.current = Math.min(getEffectiveMaxHP(), hpState.current + amount);
  updateHPDisplay();
}

export function applyDamage(amount) {
  let remaining = amount;
  if (hpState.tempHP > 0) {
    if (hpState.tempHP >= remaining) { 
      hpState.tempHP -= remaining; 
      remaining = 0; 
    } else { 
      remaining -= hpState.tempHP; 
      hpState.tempHP = 0; 
    }
  }
  if (remaining > 0) hpState.current = Math.max(0, hpState.current - remaining);
  updateHPDisplay();
}

export function promptAdjustHP() {
  openModal("Health & HP Engine", `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.4rem;">
      <div>
        <label>Adjustment Type:</label>
        <select id="hpAdjType">
          <option value="heal">Standard Healing (+HP)</option>
          <option value="damage">Take Damage (-HP)</option>
          <option value="temp">Grant Temporary / Bonus HP</option>
          <option value="necrotic">Apply Necrotic Drain (-Max HP)</option>
          <option value="cure_necrotic">Cure Necrotic Drain</option>
        </select>
      </div>
      <div><label>Amount:</label><input type="number" id="hpAdjAmount" value="5" min="1" /></div>
    </div>
  `, [
    { label: "Cancel", onclick: () => {} },
    { label: "Apply HP Change", onclick: () => {
      const type = document.getElementById('hpAdjType').value;
      const amt = parseInt(document.getElementById('hpAdjAmount').value) || 0;

      if (type === 'heal') applyHealing(amt);
      if (type === 'damage') applyDamage(amt);
      if (type === 'temp') { hpState.tempHP = Math.max(hpState.tempHP, amt); updateHPDisplay(); }
      if (type === 'necrotic') { hpState.necroticDrain += amt; hpState.current = Math.min(getEffectiveMaxHP(), hpState.current); updateHPDisplay(); }
      if (type === 'cure_necrotic') { hpState.necroticDrain = Math.max(0, hpState.necroticDrain - amt); updateHPDisplay(); }
    }}
  ]);
}

export function gmAdjustPlayerHP(playerName) {
  openModal(`GM Control: ${playerName}`, `
    <div><label>Intervention Type:</label><select id="gmHpType"><option value="heal">Heal Player (+HP)</option><option value="damage">Damage Player (-HP)</option></select></div>
    <div style="margin-top:0.4rem;"><label>Amount:</label><input type="number" id="gmHpAmt" value="10" /></div>
  `, [
    { label: "Cancel", onclick: () => {} },
    { label: "Execute", onclick: () => {
      const amt = parseInt(document.getElementById('gmHpAmt').value) || 0;
      if (document.getElementById('gmHpType').value === 'heal') applyHealing(amt); else applyDamage(amt);
      alertModal(`Applied to ${playerName}!`);
    }}
  ]);
}