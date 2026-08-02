/* ==========================================================================
   DYNAMIC ACTION & ATTACK RENDERER
   ========================================================================== */

import { alertModal } from './modalEngine.js';

let currentActionFilter = 'all';

export function filterActions(type) {
  currentActionFilter = type;
  document.querySelectorAll('.action-filter-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`act-${type === 'bonus_action' ? 'bonus' : type}`);
  if (activeBtn) activeBtn.classList.add('active');
  renderActions();
}

export function resetTurnResources() {
  alertModal('Turn resources reset!', 'Turn Reset');
}

export function rollAction(name, formula) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const log = document.getElementById('diceLog');
  if (log) {
    log.innerHTML = `<strong style="color:var(--accent-color);">${name}:</strong> Rolled <strong>${d20}</strong> (${formula})`;
  }
}

window.rollAction = rollAction;

export function renderActions() {
  const container = document.getElementById('dynamicActionZone');
  if (!container) return;
  
  container.innerHTML = '';
  const actions = window.state?.actions || [
    { id: 'def_1', name: 'Greatsword', type: 'Attack', desc: 'Slashing melee weapon attack.', toHit: '+5', dice: '2d6+3' },
    { id: 'def_2', name: 'Second Wind', type: 'Bonus Action', desc: 'Bonus action self-heal pool.', dice: '1d10+5' }
  ];
  
  const filtered = actions.filter(act => {
    if (currentActionFilter === 'all') return true;
    if (currentActionFilter === 'attack' && act.type.toLowerCase() === 'attack') return true;
    if (currentActionFilter === 'action' && act.type.toLowerCase() === 'action') return true;
    if (currentActionFilter === 'bonus_action' && act.type.toLowerCase() === 'bonus action') return true;
    if (currentActionFilter === 'reaction' && act.type.toLowerCase() === 'reaction') return true;
    return false;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p style="font-size:0.75rem; color:var(--text-muted); padding:1rem 0; text-align:center;">No actions matching this filter.</p>`;
    return;
  }
  
  filtered.forEach(act => {
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.style.marginBottom = '0.4rem';
    card.style.display = 'flex';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'center';
    
    let toHitBtn = act.toHit ? `<button class="secondary-btn" style="font-size:0.7rem; padding:0.25rem 0.5rem; margin-right:0.3rem;" onclick="rollAction('${act.name} Hit', '${act.toHit}')">🎯 Hit ${act.toHit}</button>` : '';
    let dmgBtn = act.dice ? `<button class="secondary-btn" style="font-size:0.7rem; padding:0.25rem 0.5rem;" onclick="rollAction('${act.name} Damage', '${act.dice}')">🎲 Dmg ${act.dice}</button>` : '';
    
    card.innerHTML = `
      <div style="flex:1; padding-right:1rem;">
        <strong style="font-size:0.85rem; color:var(--text-main);">${act.name} <span style="font-size:0.65rem; color:var(--accent-color);">(${act.type.toUpperCase()})</span></strong>
        <p style="font-size:0.75rem; color:var(--text-muted); margin:0.2rem 0 0 0; line-height: 1.3;">${act.desc}</p>
      </div>
      <div style="display:flex; flex-wrap:nowrap; flex-shrink:0;">
        ${toHitBtn}
        ${dmgBtn}
      </div>
    `;
    container.appendChild(card);
  });
}