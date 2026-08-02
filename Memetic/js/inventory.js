/* ==========================================================================
   DYNAMIC INVENTORY & EQUIPMENT RENDERER
   ========================================================================== */

import { openModal, closeModal } from './modalEngine.js';

let currentInvMode = 'personal';

export function setInventoryMode(mode) {
  currentInvMode = mode;
  document.querySelectorAll('.inv-mode-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(`btn-inv-${mode}`);
  if (btn) btn.classList.add('active');
  renderInventory();
}

export function promptAddItem() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:0.6rem;">
      <label style="font-size:0.8rem; color:var(--text-muted);">Item Name:</label>
      <input type="text" id="itemNameInput" placeholder="e.g. Potion of Healing, Longsword" style="width:100%; padding:0.4rem;" />
      <div style="display:flex; gap:0.5rem;">
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--text-muted);">Qty:</label>
          <input type="number" id="itemQtyInput" value="1" style="width:100%; padding:0.4rem;" />
        </div>
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--text-muted);">Weight (lbs):</label>
          <input type="number" id="itemWeightInput" value="1" style="width:100%; padding:0.4rem;" />
        </div>
      </div>
    </div>
  `;
  openModal('Add Equipment Item', html, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: 'Add Item', class: '', onclick: () => {
        const name = document.getElementById('itemNameInput')?.value.trim();
        const qty = parseInt(document.getElementById('itemQtyInput')?.value) || 1;
        const weight = parseFloat(document.getElementById('itemWeightInput')?.value) || 0;
        if (name) {
          if (!window.state) window.state = {};
          if (!window.state.inventory) window.state.inventory = [];
          window.state.inventory.push({
            id: 'item_' + Date.now(), name, qty, weight, type: 'gear', equipped: false, isParty: currentInvMode === 'party'
          });
          renderInventory();
        }
        closeModal(true);
      } 
    }
  ]);
}

export function toggleGemsDrawer() {
  const drawer = document.getElementById('gemsDrawer');
  if (drawer) {
    drawer.style.display = drawer.style.display === 'block' ? 'none' : 'block';
  }
}

export function promptAddCustomCurrency() {
  openModal('Custom Currency', '<p style="font-size:0.8rem; color:var(--text-muted);">Custom currency tracking active.</p>', [
    { label: 'Close', class: 'secondary-btn', onclick: () => closeModal(false) }
  ]);
}

export function promptAddGem() {
  openModal('Add Valuable', '<p style="font-size:0.8rem; color:var(--text-muted);">Enter jewel or art piece details.</p>', [
    { label: 'Close', class: 'secondary-btn', onclick: () => closeModal(false) }
  ]);
}

export function renderInventory() {
  const container = document.getElementById('inventoryListZone');
  if (!container) return;
  
  container.innerHTML = '';
  const items = window.state?.inventory || [];
  
  if (items.length === 0) {
    container.innerHTML = `<p style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding: 1rem 0;">Inventory is empty. Import a character or click '+ Add Item'.</p>`;
    return;
  }

  let totalWeight = 0;

  items.forEach(item => {
    if (!item.isParty) {
      totalWeight += (item.weight || 0) * (item.qty || 1);
    }

    if (currentInvMode === 'personal' && item.isParty) return;
    if (currentInvMode === 'party' && !item.isParty) return;

    const card = document.createElement('div');
    card.className = 'panel-card';
    card.style.marginBottom = '0.3rem';
    card.style.display = 'flex';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'center';

    const equipTag = item.equipped 
        ? `<span class="buff-tag" style="font-size:0.65rem; color:var(--accent-color);">EQUIPPED</span>` 
        : '';

    card.innerHTML = `
      <div style="flex:1;">
        <strong style="font-size:0.85rem; color:var(--text-main);">${item.name}</strong>
        <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.5rem;">x${item.qty}</span>
        <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.1rem;">
          ${(item.type || 'GEAR').toUpperCase()} • ${item.weight || 0} lbs
        </div>
      </div>
      <div>
        ${equipTag}
      </div>
    `;
    container.appendChild(card);
  });

  const weightEl = document.getElementById('displayCarryWeight');
  if (weightEl) weightEl.innerText = `${totalWeight.toFixed(1)} lbs`;
}