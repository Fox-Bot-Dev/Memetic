/* ==========================================================================
   DYNAMIC ACTION ECONOMY & ATTACKS RENDERER
   ========================================================================== */

import { openModal, closeModal, alertModal } from '../core/modalEngine.js';

let currentActionFilter = 'all';

export function setActionFilter(filter) {
  currentActionFilter = filter;
  document.querySelectorAll('.action-filter-btn').forEach(btn => btn.classList.remove('active'));
  const target = document.getElementById(`filter-act-${filter}`);
  if (target) target.classList.add('active');
  renderActions();
}

export const filterActions = setActionFilter;

export function resetTurnResources() {
  console.log('[Actions] Turn resources reset.');
}

export function executeActionRoll(actId) {
  if (!window.state) return;

  const act = window.state.actions?.find(a => a.id === actId);
  if (!act) return;

  // 1. Inventory Item Action
  if (act.id.startsWith('eq_atk_') && window.state.inventory) {
    const parentItem = window.state.inventory.find(i => 'eq_atk_' + i.id === act.id);
    if (parentItem && parentItem.maxUses > 0) {
      if ((parentItem.currentUses || 0) < parentItem.maxUses) {
        parentItem.currentUses = (parentItem.currentUses || 0) + 1;

        if (typeof window.renderInventory === 'function') window.renderInventory();
        renderActions();

        if (act.dice && typeof window.rollSkill === 'function') {
          window.rollSkill(act.name, act.dice);
        }
      } else {
        alertModal(`"${parentItem.name}" is depleted! Recharge trigger: ${parentItem.rechargeTrigger.replace('_', ' ')}.`, "Action Depleted");
      }
      return;
    }
  }

  // 2. Standalone Action
  if (act.maxUses > 0) {
    if ((act.currentUses || 0) < act.maxUses) {
      act.currentUses = (act.currentUses || 0) + 1;
      renderActions();

      if (act.dice && typeof window.rollSkill === 'function') {
        window.rollSkill(act.name, act.dice);
      }
    } else {
      alertModal(`"${act.name}" is depleted!`, "Action Depleted");
    }
    return;
  }

  // 3. Unlimited Action Roll
  if (act.dice && typeof window.rollSkill === 'function') {
    window.rollSkill(act.name, act.dice);
  }
}

export function promptAddCustomAction() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:0.6rem;" data-dashlane-disabled="true">
      <label style="font-size:0.8rem; color:var(--text-muted);">Action Name:</label>
      <input type="text" id="customActName" placeholder="e.g. Uncanny Dodge, Healing Word" autocomplete="off" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
      
      <div style="display:flex; gap:0.5rem;">
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--text-muted);">Action Economy:</label>
          <select id="customActType" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
            <option value="Action">Action</option>
            <option value="Attack">Attack</option>
            <option value="Bonus Action">Bonus Action</option>
            <option value="Reaction">Reaction</option>
            <option value="Misc">Misc / Special</option>
          </select>
        </div>
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--text-muted);">Dice / Formula:</label>
          <input type="text" id="customActDice" placeholder="e.g. 1d8+3" autocomplete="off" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
        </div>
      </div>

      <div style="display:flex; gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.4rem; border-radius:6px; border:1px solid rgba(255,255,255,0.05);">
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--accent-color); font-weight:bold;">Max Uses (0 = None):</label>
          <input type="number" id="customActMaxUses" value="0" min="0" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
        </div>
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--accent-color); font-weight:bold;">Recharge:</label>
          <select id="customActRecharge" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
            <option value="short_rest">☕ Short Rest</option>
            <option value="long_rest">⛺ Long Rest</option>
            <option value="dawn">🌅 Dawn</option>
            <option value="specific">↻ Specific / GM</option>
          </select>
        </div>
      </div>

      <label style="font-size:0.8rem; color:var(--text-muted);">Description / Rules:</label>
      <textarea id="customActDesc" placeholder="Rules text..." autocomplete="off" style="width:100%; height:60px; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main); font-size:0.75rem;"></textarea>
    </div>
  `;

  openModal('Add Custom Action', html, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: 'Add Action', class: '', onclick: () => {
        const name = document.getElementById('customActName')?.value.trim();
        const type = document.getElementById('customActType')?.value || 'Action';
        const dice = document.getElementById('customActDice')?.value.trim() || '';
        const maxUses = parseInt(document.getElementById('customActMaxUses')?.value) || 0;
        const rechargeTrigger = document.getElementById('customActRecharge')?.value || 'long_rest';
        const desc = document.getElementById('customActDesc')?.value.trim() || '';

        if (name) {
          if (!window.state) window.state = {};
          if (!window.state.actions) window.state.actions = [];
          window.state.actions.push({
            id: 'act_' + Date.now(),
            name, type, dice, desc,
            maxUses, currentUses: 0, rechargeTrigger
          });
          renderActions();
        }
        closeModal(true);
      } 
    }
  ]);
}

function sanitizeActionText(htmlStr) {
  if (!htmlStr) return '';
  const level = window.state?.level || 1;
  const sneakDice = Math.ceil(level / 2);

  return htmlStr
    .replace(/\{\{scalevalue\}\}/gi, `${sneakDice}d6`)
    .replace(/\{\{classlevel\}\}/gi, level)
    .replace(/\{\{modifier:[^}]+\}\}/gi, '')
    .replace(/<hr\s*\/?>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function renderActions() {
  const container = document.getElementById('dynamicActionZone') || document.getElementById('actionsListZone');
  const filterBar = document.getElementById('actionFilterBar') || document.querySelector('.action-filter-bar');
  if (!container) return;

  const actions = window.state?.actions || [];

  if (filterBar) {
    filterBar.innerHTML = '';
    const filters = [
      { id: 'all', label: 'All' },
      { id: 'attack', label: 'Attacks' },
      { id: 'action', label: 'Actions' },
      { id: 'bonus', label: 'Bonus Actions' },
      { id: 'reaction', label: 'Reactions' },
      { id: 'misc', label: 'Misc' }
    ];

    filters.forEach(f => {
      const btn = document.createElement('button');
      btn.id = `filter-act-${f.id}`;
      btn.className = `action-filter-btn ${currentActionFilter === f.id ? 'active' : ''}`;
      
      let count = actions.length;
      if (f.id === 'attack') count = actions.filter(a => (a.type || '').toLowerCase().includes('attack')).length;
      else if (f.id === 'action') count = actions.filter(a => (a.type || '').toLowerCase() === 'action').length;
      else if (f.id === 'bonus') count = actions.filter(a => (a.type || '').toLowerCase().includes('bonus')).length;
      else if (f.id === 'reaction') count = actions.filter(a => (a.type || '').toLowerCase().includes('reaction')).length;
      else if (f.id === 'misc') count = actions.filter(a => (a.type || '').toLowerCase().includes('misc')).length;

      btn.innerText = `${f.label} (${count})`;
      btn.onclick = () => setActionFilter(f.id);
      filterBar.appendChild(btn);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'secondary-btn';
    addBtn.style.fontSize = '0.65rem';
    addBtn.style.padding = '0.2rem 0.5rem';
    addBtn.style.marginLeft = 'auto';
    addBtn.innerText = '➕ Custom Action';
    addBtn.onclick = () => promptAddCustomAction();
    filterBar.appendChild(addBtn);
  }

  container.innerHTML = '';

  // 1. Define 'filtered' FIRST so the loop can actually read it
  const filtered = actions.filter(act => {
    const actType = (act.type || 'Action').toLowerCase();
    if (currentActionFilter === 'all') return true;
    if (currentActionFilter === 'attack') return actType.includes('attack');
    if (currentActionFilter === 'action') return actType === 'action';
    if (currentActionFilter === 'bonus') return actType.includes('bonus');
    if (currentActionFilter === 'reaction') return actType.includes('reaction');
    if (currentActionFilter === 'misc') return actType.includes('misc');
    return true;
  });

  // 2. Check if empty
  if (filtered.length === 0) {
    container.innerHTML = `<p style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding: 1rem 0;">No actions in this category view.</p>`;
    return;
  }

  // Helper to format the raw rest string into clean UI text
  const formatTrigger = (trigger) => {
    if (!trigger) return 'Rest';
    if (trigger === 'short_rest') return 'Short Rest';
    if (trigger === 'long_rest') return 'Long Rest';
    if (trigger === 'dawn') return 'Dawn';
    return trigger.replace('_', ' ');
  };

  // 3. Run the loop
  filtered.forEach(act => {
    const card = document.createElement('div');
    let isDepleted = false;
    let rechargeTag = '';

    if (act.id && act.id.startsWith('eq_atk_') && window.state?.inventory) {
      const parentItem = window.state.inventory.find(i => 'eq_atk_' + i.id === act.id);
      if (parentItem && parentItem.maxUses > 0) {
        if ((parentItem.currentUses || 0) >= parentItem.maxUses) {
          isDepleted = true;
          rechargeTag = `<span class="recharge-badge depleted-badge" style="margin-left:0.4rem;">🔒 LOCKOUT (${formatTrigger(parentItem.rechargeTrigger)})</span>`;
        } else {
          rechargeTag = `<span class="recharge-badge" style="margin-left:0.4rem;">⚡ ${parentItem.maxUses - (parentItem.currentUses || 0)}/${parentItem.maxUses}</span>`;
        }
      }
    } else if (act.maxUses > 0) {
      if ((act.currentUses || 0) >= act.maxUses) {
        isDepleted = true;
        rechargeTag = `<span class="recharge-badge depleted-badge" style="margin-left:0.4rem;">🔒 LOCKOUT (${formatTrigger(act.rechargeTrigger)})</span>`;
      } else {
        rechargeTag = `<span class="recharge-badge" style="margin-left:0.4rem;">⚡ ${act.maxUses - (act.currentUses || 0)}/${act.maxUses}</span>`;
      }
    }

    card.className = `panel-card ${isDepleted ? 'depleted' : ''}`;
    card.style.marginBottom = '0.35rem';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '0.3rem';
    card.style.padding = '0.55rem 0.8rem';

    const cleanDesc = sanitizeActionText(act.desc);
    let diceTag = '';

    if (isDepleted) {
      diceTag = `<button class="secondary-btn" style="font-size:0.7rem; padding:0.15rem 0.4rem; opacity:0.4; cursor:not-allowed;" onclick="executeActionRoll('${act.id}')">🔒 Depleted</button>`;
    } else if (act.dice) {
      diceTag = `<button class="secondary-btn" style="font-size:0.7rem; padding:0.15rem 0.4rem;" onclick="executeActionRoll('${act.id}')">🎲 ${act.dice}</button>`;
    } else if (act.maxUses > 0) {
      diceTag = `<button class="secondary-btn" style="font-size:0.7rem; padding:0.15rem 0.4rem;" onclick="executeActionRoll('${act.id}')">⚡ Use</button>`;
    }

    const typeBadge = `<span class="buff-tag" style="font-size:0.6rem; text-transform:uppercase; font-weight:bold; color:var(--accent-color);">${act.type || 'ACTION'}</span>`;

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
          <strong style="font-size:0.85rem; color:var(--text-main); ${isDepleted ? 'text-decoration: line-through;' : ''}">${act.name}</strong>
          ${typeBadge}
          ${rechargeTag}
        </div>
        <div>
          ${diceTag}
        </div>
      </div>
      ${cleanDesc ? `<p style="font-size:0.72rem; color:var(--text-muted); margin:0; line-height:1.25; border-top:1px dashed var(--border-color); padding-top:0.25rem;">${cleanDesc}</p>` : ''}
    `;
    container.appendChild(card);
  });
}

// Global Bindings
window.renderActions = renderActions;
window.setActionFilter = setActionFilter;
window.filterActions = setActionFilter;
window.resetTurnResources = resetTurnResources;
window.promptAddCustomAction = promptAddCustomAction;
window.executeActionRoll = executeActionRoll;