/* ==========================================================================
   DYNAMIC RESOURCE POOLS ENGINE & UNIFIED HUD
   ========================================================================== */

import { openModal, closeModal, alertModal } from '../core/modalEngine.js';

export function promptAddResourcePool() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:0.6rem;">
      <div>
        <label style="font-size:0.8rem; color:var(--text-muted);">Resource Pool Name:</label>
        <input type="text" id="poolNameInput" placeholder="e.g. Hemovar, Ki Points, Sorcery Points, Superiority Dice" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
      </div>

      <div style="display:flex; gap:0.5rem;">
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--accent-color); font-weight:bold;">Max Capacity:</label>
          <input type="number" id="poolMaxInput" value="5" min="1" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
        </div>
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--accent-color); font-weight:bold;">Recharge Trigger:</label>
          <select id="poolRechargeInput" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
            <option value="short_rest">☕ Short Rest</option>
            <option value="long_rest">⛺ Long Rest</option>
            <option value="dawn">🌅 Dawn</option>
            <option value="none">❌ Manual / None</option>
          </select>
        </div>
      </div>
    </div>
  `;

  openModal('Add Custom Resource Pool', html, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: 'Create Pool', class: '', onclick: () => {
        const name = document.getElementById('poolNameInput')?.value.trim();
        const max = parseInt(document.getElementById('poolMaxInput')?.value) || 1;
        const rechargeTrigger = document.getElementById('poolRechargeInput')?.value || 'long_rest';

        if (name) {
          if (!window.state) window.state = {};
          if (!window.state.pools) window.state.pools = [];
          window.state.pools.push({
            id: 'pool_' + Date.now(),
            name,
            current: max,
            max,
            rechargeTrigger
          });
          renderResourcePools();
        }
        closeModal(true);
      } 
    }
  ]);
}

export function adjustResourcePool(poolId, delta) {
  if (!window.state?.pools) return;
  const pool = window.state.pools.find(p => p.id === poolId);
  if (pool) {
    pool.current = Math.min(parseInt(pool.max), Math.max(0, parseInt(pool.current) + delta));
    renderResourcePools();
  }
}

export function deleteResourcePool(poolId) {
  if (window.state?.pools) {
    window.state.pools = window.state.pools.filter(p => p.id !== poolId);
    renderResourcePools();
  }
}

export function parseRulesAndInject() {
  const rulesText = document.getElementById('rulesInput')?.value.trim();
  if (!rulesText) {
    alertModal('Please enter rule text to extract mechanics (e.g. "Blood Knight gains Hemovar (Max 10)").', 'Injector Empty');
    return;
  }

  if (!window.state) window.state = {};
  if (!window.state.pools) window.state.pools = [];

  const regex = /([A-Za-z0-9\s]+?)\s*\((?:Max:?\s*)?(\d+)\)/gi;
  let match;
  let count = 0;

  while ((match = regex.exec(rulesText)) !== null) {
    const name = match[1].replace(/(gains|has|gets)\s+/gi, '').trim();
    const max = parseInt(match[2]);

    if (name && max > 0) {
      const existing = window.state.pools.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.max = max;
        existing.current = max;
      } else {
        window.state.pools.push({
          id: 'pool_' + Date.now() + '_' + count,
          name,
          current: max,
          max,
          rechargeTrigger: 'long_rest'
        });
      }
      count++;
    }
  }

  renderResourcePools();

  if (count > 0) {
    alertModal(`Successfully extracted and injected ${count} resource pool(s)! Check your Character Sheet.`, 'Mechanics Injected');
  } else {
    alertModal('No explicit resource patterns found. Try formatted text like: "Blood Knight gains Hemovar (Max 10)".', 'Extraction Info');
  }
}

export function renderResourcePools() {
  const container = document.getElementById('dynamicResourceZone');
  if (!container) return;

  const parentCard = container.closest('.card');
  const customPools = window.state?.pools || [];
  
  const featurePools = (window.state?.features || []).filter(f => (parseInt(f.maxUses) > 0 || parseInt(f.uses?.max) > 0));
  const actionPools = (window.state?.actions || []).filter(a => (parseInt(a.maxUses) > 0 || parseInt(a.uses?.max) > 0));
  const itemPools = (window.state?.inventory || []).filter(i => (parseInt(i.maxUses) > 0 || parseInt(i.uses?.max) > 0));

  // NOTE: Spell slots excluded here so they don't clog up the main sheet! 
  // They are tracked cleanly inside the Spellbook tab header.

  const totalTrackersCount = customPools.length + featurePools.length + actionPools.length + itemPools.length;

  if (totalTrackersCount === 0) {
    if (parentCard) parentCard.style.display = 'none';
    return;
  }

  if (parentCard) parentCard.style.display = 'block';
  container.innerHTML = '';

  const headerBar = document.createElement('div');
  headerBar.style.display = 'flex';
  headerBar.style.justifyContent = 'space-between';
  headerBar.style.alignItems = 'center';
  headerBar.style.marginBottom = '0.5rem';
  headerBar.innerHTML = `
    <span style="font-size:0.75rem; color:var(--text-muted); font-weight:bold;">Active Resource Trackers (${totalTrackersCount})</span>
    <button class="secondary-btn" style="font-size:0.65rem; padding:0.2rem 0.5rem;" onclick="promptAddResourcePool()">➕ Add Custom Pool</button>
  `;
  container.appendChild(headerBar);

  const listWrapper = document.createElement('div');
  listWrapper.style.display = 'flex';
  listWrapper.style.flexDirection = 'column';
  listWrapper.style.gap = '0.4rem';

  customPools.forEach(pool => {
    const card = createTrackerCard(pool.name, parseInt(pool.current), parseInt(pool.max), pool.rechargeTrigger, () => deleteResourcePool(pool.id), (delta) => adjustResourcePool(pool.id, delta));
    listWrapper.appendChild(card);
  });

  actionPools.forEach(act => {
    const max = parseInt(act.maxUses || act.uses?.max) || 1;
    const used = parseInt(act.currentUses || act.uses?.value) || 0;
    const current = Math.max(0, max - used);
    const card = createTrackerCard(act.name, current, max, act.rechargeTrigger || 'long_rest', null, (delta) => {
      act.currentUses = Math.min(max, Math.max(0, used - delta));
      if (typeof window.renderActions === 'function') window.renderActions();
      renderResourcePools();
    });
    listWrapper.appendChild(card);
  });

  featurePools.forEach(feat => {
    const max = parseInt(feat.maxUses || feat.uses?.max) || 1;
    const used = parseInt(feat.currentUses || feat.uses?.value) || 0;
    const current = Math.max(0, max - used);
    const card = createTrackerCard(feat.name, current, max, feat.rechargeTrigger || 'long_rest', null, () => {
      if (typeof window.toggleFeatureUse === 'function') window.toggleFeatureUse(feat.id || feat.name);
      renderResourcePools();
    });
    listWrapper.appendChild(card);
  });

  itemPools.forEach(item => {
    const max = parseInt(item.maxUses || item.uses?.max) || 1;
    const used = parseInt(item.currentUses || item.uses?.value) || 0;
    const current = Math.max(0, max - used);
    const card = createTrackerCard(item.name, current, max, item.rechargeTrigger || 'long_rest', null, () => {
      if (typeof window.toggleItemUse === 'function') window.toggleItemUse(item.id || item.name);
      renderResourcePools();
    });
  });

  container.appendChild(listWrapper);
}

function createTrackerCard(name, current, max, rechargeTrigger, onDelete, onAdjust) {
  const card = document.createElement('div');
  card.className = 'panel-card';
  card.style.display = 'flex';
  card.style.justifyContent = 'space-between';
  card.style.alignItems = 'center';
  card.style.padding = '0.5rem 0.8rem';

  const pct = max > 0 ? Math.round((current / max) * 100) : 100;
  let rIcon = '☕';
  if (rechargeTrigger === 'long_rest') rIcon = '⛺';
  else if (rechargeTrigger === 'dawn') rIcon = '🌅';
  else if (rechargeTrigger === 'none') rIcon = '❌';

  card.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.6rem; flex:1;">
      <div>
        <strong style="font-size:0.85rem; color:var(--text-main);">${name}</strong>
        <div style="font-size:0.65rem; color:var(--text-muted);">${rIcon} ${(rechargeTrigger || 'long_rest').replace('_', ' ')}</div>
      </div>
      
      <div style="flex:1; max-width: 140px; margin: 0 0.8rem;">
        <div style="display:flex; justify-content:space-between; font-size:0.7rem; margin-bottom:2px; font-weight:bold;">
          <span style="color:var(--accent-color);">${current} / ${max}</span>
          <span style="color:var(--text-muted);">${pct}%</span>
        </div>
        <div style="width:100%; height:8px; background:var(--bg-primary); border-radius:4px; overflow:hidden; border:1px solid var(--border-color);">
          <div style="width:${pct}%; height:100%; background:var(--accent-color); transition:width 0.2s ease;"></div>
        </div>
      </div>
    </div>

    <div style="display:flex; align-items:center; gap:0.3rem;">
      <button class="secondary-btn btn-minus" style="width:28px; height:26px; padding:0; display:inline-flex; align-items:center; justify-content:center; font-weight:bold;">-</button>
      <button class="secondary-btn btn-plus" style="width:28px; height:26px; padding:0; display:inline-flex; align-items:center; justify-content:center; font-weight:bold;">+</button>
      ${onDelete ? `<button class="item-action-btn delete-btn btn-del" style="height:26px; width:26px; padding:0; display:inline-flex; align-items:center; justify-content:center; margin-left:0.3rem;" title="Delete Pool">✕</button>` : ''}
    </div>
  `;

  card.querySelector('.btn-minus')?.addEventListener('click', () => onAdjust(-1));
  card.querySelector('.btn-plus')?.addEventListener('click', () => onAdjust(1));
  card.querySelector('.btn-del')?.addEventListener('click', onDelete);

  return card;
}

window.renderResourcePools = renderResourcePools;
window.promptAddResourcePool = promptAddResourcePool;
window.adjustResourcePool = adjustResourcePool;
window.deleteResourcePool = deleteResourcePool;
window.parseRulesAndInject = parseRulesAndInject;