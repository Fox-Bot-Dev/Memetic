/* ==========================================================================
   MEMETIC DEDICATED DICE ENGINE & FORMULA EVALUATOR
   ========================================================================== */

let currentRollMode = 'normal'; // 'normal' | 'advantage' | 'disadvantage'
window.gmDoubleCrit = false;   // GM Toggle State

export function toggleGMCritMode(enabled) {
  window.gmDoubleCrit = enabled;
  if (typeof window.announceToScreenReader === 'function') {
    window.announceToScreenReader(`Double Crit Dice ${enabled ? 'Enabled' : 'Disabled'}`);
  }
}

export function setRollMode(mode) {
  currentRollMode = mode;
  ['norm', 'adv', 'dis'].forEach(m => {
    const btn = document.getElementById(`roll-mode-${m}`);
    if (btn) {
      btn.classList.toggle('active', 
        (m === 'norm' && mode === 'normal') ||
        (m === 'adv' && mode === 'advantage') ||
        (m === 'dis' && mode === 'disadvantage')
      );
    }
  });
}

export function evaluateDiceFormula(formulaStr, mode = currentRollMode) {
  if (!formulaStr) return { total: 0, breakdown: '0', isNat20: false, isNat1: false };

  const cleanStr = formulaStr.toLowerCase().replace(/\s+/g, '');
  const tokens = cleanStr.match(/([+-]?[^+-]+)/g) || [];
  
  let totalSum = 0;
  let breakdownParts = [];
  let isNat20 = false;
  let isNat1 = false;

  tokens.forEach((token, index) => {
    let sign = 1;
    let expr = token;

    if (token.startsWith('+')) expr = token.substring(1);
    else if (token.startsWith('-')) { sign = -1; expr = token.substring(1); }

    if (expr.includes('d')) {
      const parts = expr.split('d');
      let count = parseInt(parts[0]) || 1;
      const sides = parseInt(parts[1]) || 20;

      let subTotal = 0;
      let rolls = [];

      // Detect Nat 20 / Nat 1 on d20 checks
      if (sides === 20) {
        if (mode === 'advantage' || mode === 'disadvantage') {
          const r1 = Math.floor(Math.random() * 20) + 1;
          const r2 = Math.floor(Math.random() * 20) + 1;
          const chosen = (mode === 'advantage') ? Math.max(r1, r2) : Math.min(r1, r2);
          
          if (chosen === 20) isNat20 = true;
          if (chosen === 1) isNat1 = true;

          rolls.push(`[${r1}, ${r2} ➔ ${chosen}]`);
          subTotal += chosen;
        } else {
          const roll = Math.floor(Math.random() * 20) + 1;
          if (roll === 20) isNat20 = true;
          if (roll === 1) isNat1 = true;
          rolls.push(roll);
          subTotal += roll;
        }
      } else {
        // Double damage dice count on Crit if GM setting is ON
        if (window.gmDoubleCrit && window.lastRollWasNat20) {
          count = count * 2;
        }

        for (let i = 0; i < count; i++) {
          const roll = Math.floor(Math.random() * sides) + 1;
          rolls.push(roll);
          subTotal += roll;
        }
      }

      totalSum += (subTotal * sign);
      const signPrefix = (index > 0 && sign > 0) ? '+ ' : (sign < 0 ? '- ' : '');
      breakdownParts.push(`${signPrefix}${count}d${sides} (${rolls.join(', ')})`);

    } else {
      const num = parseInt(expr) || 0;
      totalSum += (num * sign);
      const signPrefix = (index > 0 && sign > 0) ? '+ ' : (sign < 0 ? '- ' : '');
      breakdownParts.push(`${signPrefix}${num}`);
    }
  });

  return { total: totalSum, breakdown: breakdownParts.join(' '), isNat20, isNat1 };
}

export function executeRoll(label, formula) {
  const result = evaluateDiceFormula(formula, currentRollMode);
  
  // Cache Nat 20 state for subsequent damage rolls
  window.lastRollWasNat20 = result.isNat20;

  const diceLog = document.getElementById('diceLog');
  if (diceLog) {
    // Reset animation classes
    diceLog.classList.remove('crit-success-flash', 'crit-fail-jitter');
    void diceLog.offsetWidth; // Trigger DOM reflow to restart CSS animation

    let modeTag = '';
    if (currentRollMode === 'advantage') modeTag = ' <span style="color:#2ecc71;">[ADV]</span>';
    if (currentRollMode === 'disadvantage') modeTag = ' <span style="color:#e74c3c;">[DIS]</span>';

    let resultBadge = `<span style="color:var(--accent-color); font-size:1.15rem; font-weight:bold;">${result.total}</span>`;

    if (result.isNat20) {
      resultBadge = `<span style="color:#ffd700; font-size:1.25rem; font-weight:bold; text-shadow:0 0 8px #ffd700;">👑 NAT 20! (${result.total})</span>`;
      diceLog.classList.add('crit-success-flash');
    } else if (result.isNat1) {
      resultBadge = `<span style="color:#e74c3c; font-size:1.25rem; font-weight:bold; text-shadow:0 0 8px #ff0000;">💀 NAT 1! (${result.total})</span>`;
      diceLog.classList.add('crit-fail-jitter');
    }

    diceLog.innerHTML = `
      <div style="font-size:0.85rem; color:var(--text-main);">
        🎯 <strong>${label}</strong>${modeTag}: ${resultBadge}
      </div>
      <div style="font-size:0.65rem; color:var(--text-muted); font-weight:normal; margin-top:2px;">
        ${result.breakdown} ${window.gmDoubleCrit && result.isNat20 ? '<strong style="color:#ffd700;">[CRIT MULTIPLIER READY]</strong>' : ''}
      </div>
    `;
  }

  if (typeof window.announceToScreenReader === 'function') {
    window.announceToScreenReader(`Rolled ${label}. ${result.isNat20 ? 'CRITICAL SUCCESS!' : result.isNat1 ? 'CRITICAL FAILURE!' : 'Result is ' + result.total}`);
  }

  setRollMode('normal');
}

export function rollCustomDice(sides) {
  const qty = parseInt(document.getElementById('diceQtyInput')?.value) || 1;
  const mod = parseInt(document.getElementById('diceModInput')?.value) || 0;
  
  let formula = `${qty}d${sides}`;
  if (mod > 0) formula += `+${mod}`;
  if (mod < 0) formula += `${mod}`;

  executeRoll(`Custom d${sides}`, formula);
}

// Global Exports
window.executeRoll = executeRoll;
window.rollSkill = executeRoll;
window.rollCustomDice = rollCustomDice;
window.setRollMode = setRollMode;
window.toggleGMCritMode = toggleGMCritMode;