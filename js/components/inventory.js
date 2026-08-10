/* ==========================================================================
   DYNAMIC INVENTORY, CONTAINER & EQUIPMENT RENDERER
   ========================================================================== */

import { rawScores } from '../Core/state.js';
import { openModal } from '../core/modalEngine.js';

let currentInvMode = 'personal';
let currentContainerFilter = 'all';
let customContainers = [];

export function setInventoryMode(mode) {
  currentInvMode = mode;
  document.querySelectorAll('.inv-mode-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(`btn-inv-${mode}`);
  if (btn) btn.classList.add('active');
  renderInventory();
}

export function filterContainer(containerName) {
  currentContainerFilter = containerName;
  renderInventory();
}

export function promptAddContainer() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:0.6rem;">
      <label style="font-size:0.8rem; color:var(--text-muted);">New Container Name:</label>
      <input type="text" id="containerNameInput" autocomplete="off" data-dashlane-disabled="true" data-form-type="other" placeholder="e.g. Quiver, Component Pouch, Chest" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
    </div>
  `;
  openModal('Add Custom Container', html, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: 'Add Container', class: '', onclick: () => {
        const name = document.getElementById('containerNameInput')?.value.trim();
        if (name && !customContainers.includes(name)) {
          customContainers.push(name);
          currentContainerFilter = name;
          renderInventory();
        }
        closeModal(true);
      } 
    }
  ]);
}

export function deleteContainer(containerName) {
  if (containerName === 'On Person' || containerName === 'Equipped') return;

  customContainers = customContainers.filter(c => c !== containerName);

  if (window.state?.inventory) {
    window.state.inventory.forEach(item => {
      if (item.container === containerName) {
        item.container = 'On Person';
      }
    });
  }

  if (currentContainerFilter === containerName) {
    currentContainerFilter = 'all';
  }

  renderInventory();
}

export function promptAddItem() {
  const items = window.state?.inventory || [];
  const existingContainers = Array.from(new Set([
    'On Person',
    ...customContainers,
    ...items.map(i => i.container).filter(Boolean)
  ]));

  const containerOptions = existingContainers.map(c => `<option value="${c}">${c}</option>`).join('');

  const html = `
    <div style="display:flex; flex-direction:column; gap:0.6rem;" data-dashlane-disabled="true">
      <div>
        <label style="font-size:0.8rem; color:var(--text-muted);">Item Name:</label>
        <input type="text" id="itemNameInput" autocomplete="off" data-dashlane-disabled="true" data-form-type="other" placeholder="e.g. Wand of Magic Missiles, Euclid Duck" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
      </div>

      <div style="display:flex; gap:0.5rem;">
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--text-muted);">Item Type:</label>
          <select id="itemTypeInput" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
            <option value="gear">Gear / Item</option>
            <option value="weapon">Weapon</option>
            <option value="armor">Armor / Shield</option>
            <option value="potion">Potion / Consumable</option>
            <option value="scroll">Scroll / Magic</option>
            <option value="wondrous">Wondrous Item</option>
          </select>
        </div>
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--text-muted);">Action Economy:</label>
          <select id="itemActionTypeInput" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
            <option value="Action">Action</option>
            <option value="Attack">Attack</option>
            <option value="Bonus Action">Bonus Action</option>
            <option value="Reaction">Reaction</option>
            <option value="Misc">Misc / Special</option>
          </select>
        </div>
      </div>

      <!-- USES & RECHARGE ROW -->
      <div style="display:flex; gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.4rem; border-radius:6px; border:1px solid rgba(255,255,255,0.05);">
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--accent-color); font-weight:bold;">Max Uses (0 = None):</label>
          <input type="number" id="itemMaxUsesInput" value="0" min="0" autocomplete="off" data-dashlane-disabled="true" data-form-type="other" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
        </div>
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--accent-color); font-weight:bold;">Recharge Trigger:</label>
          <select id="itemRechargeTriggerInput" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
            <option value="none">None / Consumable</option>
            <option value="dawn">🌅 Dawn</option>
            <option value="noon">☀️ Noon</option>
            <option value="dusk">🌇 Dusk</option>
            <option value="midnight">🌙 Midnight</option>
            <option value="short_rest">☕ Short Rest</option>
            <option value="long_rest">⛺ Long Rest</option>
            <option value="specific">↻ Specific / GM</option>
          </select>
        </div>
      </div>

      <div style="display:flex; gap:0.5rem;">
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--text-muted);">Rarity Tier:</label>
          <select id="itemRarityInput" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
            <option value="common">Common</option>
            <option value="uncommon">Uncommon (Green)</option>
            <option value="rare">Rare (Blue)</option>
            <option value="very-rare">Very Rare (Purple)</option>
            <option value="legendary">Legendary (Orange)</option>
            <option value="artifact">Artifact (Rainbow)</option>
          </select>
        </div>
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--text-muted);">Container:</label>
          <select id="itemContainerInput" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
            ${containerOptions}
          </select>
        </div>
      </div>

      <div style="display:flex; gap:0.5rem;">
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--text-muted);">Qty / Weight:</label>
          <div style="display:flex; gap:0.2rem;">
            <input type="number" id="itemQtyInput" value="1" placeholder="Qty" style="width:50%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
            <input type="number" id="itemWeightInput" value="1" step="0.1" placeholder="Lbs" style="width:50%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
          </div>
        </div>
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--text-muted);">Damage / Dice:</label>
          <input type="text" id="itemDiceInput" placeholder="e.g. 1d8+3" autocomplete="off" data-dashlane-disabled="true" data-form-type="other" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:0.5rem; margin:0.2rem 0;">
        <input type="checkbox" id="itemAttuneInput" style="width:auto; cursor:pointer;" />
        <label for="itemAttuneInput" style="font-size:0.8rem; color:var(--accent-color); cursor:pointer; font-weight:bold;">Requires Attunement (🔮)</label>
      </div>

      <div>
        <label style="font-size:0.8rem; color:var(--text-muted);">Magical Effects & Notes:</label>
        <textarea id="itemNotesInput" autocomplete="off" data-dashlane-disabled="true" data-form-type="other" placeholder="Describe magical properties..." style="width:100%; height:60px; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main); font-size:0.75rem;"></textarea>
      </div>
    </div>
  `;

  openModal('Add Equipment Item', html, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: 'Add Item', class: '', onclick: () => {
        const name = document.getElementById('itemNameInput')?.value.trim();
        const type = document.getElementById('itemTypeInput')?.value || 'gear';
        const actionType = document.getElementById('itemActionTypeInput')?.value || 'Action';
        const rarity = document.getElementById('itemRarityInput')?.value || 'common';
        const container = document.getElementById('itemContainerInput')?.value || 'On Person';
        const maxUses = parseInt(document.getElementById('itemMaxUsesInput')?.value) || 0;
        const rechargeTrigger = document.getElementById('itemRechargeTriggerInput')?.value || 'none';
        const qty = parseInt(document.getElementById('itemQtyInput')?.value) || 1;
        const weight = parseFloat(document.getElementById('itemWeightInput')?.value) || 0;
        const dice = document.getElementById('itemDiceInput')?.value.trim() || '';
        const attunable = document.getElementById('itemAttuneInput')?.checked || false;
        const notes = document.getElementById('itemNotesInput')?.value.trim() || '';

        if (name) {
          if (!window.state) window.state = {};
          if (!window.state.inventory) window.state.inventory = [];
          
          const autoEquip = (type === 'weapon' || dice.length > 0 || maxUses > 0);

          window.state.inventory.push({
            id: 'item_' + Date.now(),
            name, qty, weight, type, actionType, rarity, container,
            maxUses, currentUses: 0, rechargeTrigger,
            dice, attunable, attuned: false, notes, 
            equipped: autoEquip,
            isParty: currentInvMode === 'party'
          });
          renderInventory();
        }
        closeModal(true);
      } 
    }
  ]);
}

export function toggleItemUse(id, newUses) {
  const item = window.state?.inventory?.find(i => i.id === id);
  if (item) {
    item.currentUses = newUses;
    syncEquippedActions();
    renderInventory();
    if (typeof window.renderActions === 'function') window.renderActions();
  }
}

export function syncEquippedActions() {
  if (!window.state) return;
  
  const customActions = (window.state.actions || []).filter(a => !a.id?.startsWith('eq_atk_'));
  
  const actionableItems = (window.state.inventory || []).filter(i => {
    const hasDice = Boolean(i.dice && i.dice.trim());
    const hasUses = Boolean(i.maxUses && i.maxUses > 0);
    const isEquippedWeapon = Boolean(i.equipped && i.type === 'weapon');
    
    return hasDice || hasUses || isEquippedWeapon;
  });
  
  const itemActions = actionableItems.map(item => ({
    id: 'eq_atk_' + item.id,
    name: item.name,
    type: item.actionType || (item.type === 'weapon' ? 'Attack' : 'Action'),
    desc: item.notes || `${item.type.toUpperCase()} action.`,
    dice: item.dice || '',
    maxUses: item.maxUses || 0,
    currentUses: item.currentUses || 0,
    rechargeTrigger: item.rechargeTrigger || 'none',
    toHit: item.toHit || '+0'
  }));

  window.state.actions = [...customActions, ...itemActions];
}

export function toggleEquipItem(id) {
  const item = window.state?.inventory?.find(i => i.id === id);
  if (item) {
    item.equipped = !item.equipped;
    syncEquippedActions();
    renderInventory();
    if (typeof window.renderActions === 'function') window.renderActions();
  }
}

export function toggleAttuneItem(id) {
  const item = window.state?.inventory?.find(i => i.id === id);
  if (item && item.attunable) {
    item.attuned = !item.attuned;
    renderInventory();
  }
}

export function deleteItem(id) {
  if (window.state?.inventory) {
    window.state.inventory = window.state.inventory.filter(i => i.id !== id);
    syncEquippedActions();
    renderInventory();
    if (typeof window.renderActions === 'function') window.renderActions();
  }
}

export function changeItemContainer(id, newContainer) {
  const item = window.state?.inventory?.find(i => i.id === id);
  if (item) {
    item.container = newContainer;
    renderInventory();
  }
}

export function toggleGemsDrawer() {
  const drawer = document.getElementById('gemsDrawer');
  if (drawer) {
    drawer.classList.toggle('open');
  }
}

export function promptAddCustomCurrency() {
  openModal('Custom Currency', '<p style="font-size:0.8rem; color:var(--text-muted);">Custom currency tracking active.</p>', [
    { label: 'Close', class: 'secondary-btn', onclick: () => closeModal(false) }
  ]);
}

export function promptAddGem() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:0.6rem;">
      <div>
        <label style="font-size:0.8rem; color:var(--text-muted);">Valuable / Gem Name:</label>
        <input type="text" id="gemNameInput" placeholder="e.g. Flawless Ruby, Silver Chalice, Pearl" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
      </div>

      <div style="display:flex; gap:0.5rem;">
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--text-muted);">Quantity:</label>
          <input type="number" id="gemQtyInput" value="1" min="1" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
        </div>
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--text-muted);">Value Each (GP):</label>
          <input type="number" id="gemValInput" value="50" min="0" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
        </div>
      </div>
    </div>
  `;

  openModal('Add Valuable or Gem', html, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: 'Add Valuable', class: '', onclick: () => {
        const name = document.getElementById('gemNameInput')?.value.trim();
        const qty = parseInt(document.getElementById('gemQtyInput')?.value) || 1;
        const val = parseFloat(document.getElementById('gemValInput')?.value) || 0;

        if (name) {
          if (!window.state) window.state = {};
          if (!window.state.gemsAndValuables) window.state.gemsAndValuables = [];

          window.state.gemsAndValuables.push({ id: 'gem_' + Date.now(), name, qty, value: val });
          
          renderGemsList();
          calculateTotalGold();
        }
        closeModal(true);
      } 
    }
  ]);
}

export function renderGemsList() {
  const container = document.getElementById('gemsListZone');
  const countBadge = document.getElementById('gemsCount');
  if (!container) return;

  const gems = window.state?.gemsAndValuables || [];
  if (countBadge) countBadge.innerText = gems.length;

  container.innerHTML = '';

  if (gems.length === 0) {
    container.innerHTML = `<p style="font-size:0.75rem; color:var(--text-muted); text-align:center;">No jewels or art objects recorded.</p>`;
    return;
  }

  gems.forEach((gem, idx) => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.padding = '0.3rem 0.5rem';
    item.style.background = 'rgba(0,0,0,0.2)';
    item.style.borderRadius = '4px';
    item.style.fontSize = '0.75rem';

    item.innerHTML = `
      <div>
        <strong style="color:var(--text-main);">${gem.name}</strong> 
        <span style="color:var(--accent-color);">x${gem.qty}</span>
        <span style="color:var(--text-muted);"> (${gem.value} GP ea)</span>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <strong style="color:var(--accent-color);">${gem.value * gem.qty} GP</strong>
        <button style="background:none; border:none; color:var(--text-muted); cursor:pointer;" onclick="deleteGem(${idx})">✕</button>
      </div>
    `;
    container.appendChild(item);
  });
}

export function deleteGem(idx) {
  if (window.state?.gemsAndValuables) {
    window.state.gemsAndValuables.splice(idx, 1);
    renderGemsList();
    calculateTotalGold();
  }
}

function sanitizeNotesText(htmlStr) {
  if (!htmlStr) return '';
  return htmlStr.replace(/<hr\s*\/?>/gi, '').replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim();
}

export function renderInventory() {
  syncEquippedActions();

  const listZone = document.getElementById('inventoryListZone');
  const filterBar = document.getElementById('containerFilterBar');
  if (!listZone) return;

  const items = window.state?.inventory || [];

  const detectedContainers = Array.from(new Set([
    ...customContainers,
    ...items.map(i => i.container).filter(Boolean)
  ]));

  if (detectedContainers.length === 0) detectedContainers.push('On Person');

  if (filterBar) {
    filterBar.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = `action-filter-btn ${currentContainerFilter === 'all' ? 'active' : ''}`;
    allBtn.innerText = '📦 All Items';
    allBtn.onclick = () => filterContainer('all');
    filterBar.appendChild(allBtn);

    detectedContainers.forEach(cName => {
      const pillGroup = document.createElement('div');
      pillGroup.style.display = 'inline-flex';
      pillGroup.style.alignItems = 'center';
      pillGroup.style.gap = '2px';

      const btn = document.createElement('button');
      btn.className = `action-filter-btn ${currentContainerFilter === cName ? 'active' : ''}`;
      
      const count = items.filter(i => (i.container || 'On Person') === cName).length;
      btn.innerText = `🎒 ${cName} (${count})`;
      btn.onclick = () => filterContainer(cName);
      pillGroup.appendChild(btn);

      if (cName !== 'On Person' && cName !== 'Equipped') {
        const delContainerBtn = document.createElement('button');
        delContainerBtn.className = 'item-action-btn delete-btn';
        delContainerBtn.style.padding = '0.1rem 0.35rem';
        delContainerBtn.style.fontSize = '0.6rem';
        delContainerBtn.innerText = '✕';
        delContainerBtn.onclick = (e) => { e.stopPropagation(); deleteContainer(cName); };
        pillGroup.appendChild(delContainerBtn);
      }
      filterBar.appendChild(pillGroup);
    });

    const addContBtn = document.createElement('button');
    addContBtn.className = 'secondary-btn';
    addContBtn.style.fontSize = '0.65rem';
    addContBtn.style.padding = '0.2rem 0.5rem';
    addContBtn.style.marginLeft = 'auto';
    addContBtn.innerText = '➕ Container';
    addContBtn.onclick = () => promptAddContainer();
    filterBar.appendChild(addContBtn);
  }

  listZone.innerHTML = '';

  const filteredItems = items.filter(item => {
    if (currentInvMode === 'personal' && item.isParty) return false;
    if (currentInvMode === 'party' && !item.isParty) return false;
    const itemContainer = item.container || 'On Person';
    if (currentContainerFilter !== 'all' && itemContainer !== currentContainerFilter) return false;
    return true;
  });

  if (filteredItems.length === 0) {
    listZone.innerHTML = `<p style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding: 1.5rem 0;">No items in this container view. Click '+ Add Item' or select another container.</p>`;
  } else {
    filteredItems.forEach(item => {
      const card = document.createElement('div');
      const itemRarity = item.rarity || 'common';
      const isDepleted = item.maxUses > 0 && item.currentUses >= item.maxUses;
      
      card.className = `panel-card rarity-${itemRarity} ${isDepleted ? 'depleted' : ''}`;
      card.style.marginBottom = '0.35rem';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '0.3rem';
      card.style.padding = '0.55rem 0.8rem';

      const containerTag = item.container ? `<span class="container-badge" style="margin-left:0.4rem;">🎒 ${item.container}</span>` : '';
      const diceTag = item.dice ? `<span class="buff-tag" style="font-size:0.65rem; color:var(--accent-color); font-weight:bold;">🎲 ${item.dice}</span>` : '';
      const rarityBadge = `<span class="rarity-badge badge-${itemRarity}">${itemRarity.replace('-', ' ')}</span>`;
      
      const equipBtnClass = item.equipped ? 'item-action-btn active-equipped' : 'item-action-btn';
      const attuneBtnClass = item.attuned ? 'item-action-btn active-attuned' : 'item-action-btn';

      const selectOptions = detectedContainers.map(c => `<option value="${c}" ${item.container === c ? 'selected' : ''}>${c}</option>`).join('');
      let attuneControl = item.attunable ? `<button class="${attuneBtnClass}" style="height:26px; max-height:26px; line-height:1;" onclick="toggleAttuneItem('${item.id}')">${item.attuned ? '🔮 ATTUNED' : '🔮 ATTUNE'}</button>` : '';

      let usesHTML = '';
      if (item.maxUses > 0) {
        let bubbles = '';
        for (let i = 1; i <= item.maxUses; i++) {
          let filled = (i <= item.currentUses) ? 'filled' : '';
          bubbles += `<div class="use-bubble ${filled}" onclick="toggleItemUse('${item.id}', ${i === item.currentUses ? i - 1 : i})"></div>`;
        }

        let rText = item.rechargeTrigger ? item.rechargeTrigger.replace('_', ' ') : 'none';
        let rIcon = '↻';
        if (item.rechargeTrigger === 'dawn') rIcon = '🌅';
        else if (item.rechargeTrigger === 'noon') rIcon = '☀️';
        else if (item.rechargeTrigger === 'dusk') rIcon = '🌇';
        else if (item.rechargeTrigger === 'midnight') rIcon = '🌙';
        else if (item.rechargeTrigger === 'short_rest') rIcon = '☕';
        else if (item.rechargeTrigger === 'long_rest') rIcon = '⛺';
        else if (item.rechargeTrigger === 'none') rIcon = '❌';

        const tagClass = isDepleted ? 'recharge-badge depleted-badge' : 'recharge-badge';
        const tagLabel = isDepleted ? `🔒 LOCKOUT (${rText})` : `${rIcon} ${item.maxUses - item.currentUses}/${item.maxUses} USES`;

        usesHTML = `
          <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.3rem;">
            <span class="${tagClass}">${tagLabel}</span>
            <div class="uses-tracker-group" style="margin:0;">${bubbles}</div>
          </div>
        `;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; min-height:36px;">
          <div style="flex:1; padding-right:0.8rem;">
            <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
              <strong style="font-size:0.85rem; color:var(--text-main); ${isDepleted ? 'text-decoration: line-through;' : ''}">${item.name}</strong>
              <span style="font-size:0.75rem; color:var(--accent-color); font-weight:bold;">x${item.qty}</span>
              ${rarityBadge}
              ${containerTag}
              ${diceTag}
            </div>
            ${usesHTML}
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.15rem;">
              ${(item.type || 'GEAR').toUpperCase()} • ${item.weight || 0} lbs each (${((item.weight || 0) * item.qty).toFixed(1)} lbs total)
            </div>
          </div>
          
          <div style="display:flex; align-items:center; gap:0.4rem; flex-shrink:0; align-self:center; height:26px; max-height:26px;">
            <select style="font-size:0.65rem; padding:0.15rem 0.3rem; height:26px; max-height:26px;" onchange="changeItemContainer('${item.id}', this.value)">
              ${selectOptions}
            </select>
            ${attuneControl}
            <button class="${equipBtnClass}" style="height:26px; max-height:26px; line-height:1;" onclick="toggleEquipItem('${item.id}')">
              ${item.equipped ? '⚡ EQUIPPED' : 'EQUIP'}
            </button>
            <button class="item-action-btn delete-btn" style="height:26px; max-height:26px; width:26px; padding:0; display:inline-flex; align-items:center; justify-content:center; line-height:1;" title="Delete Item" onclick="deleteItem('${item.id}')">✕</button>
          </div>
        </div>
        ${item.notes ? `<details style="margin-top:0.2rem; font-size:0.72rem; color:var(--text-muted);"><summary style="cursor:pointer; color:var(--accent-color); font-size:0.68rem; font-weight:bold; user-select:none;">📖 Rules & Info</summary><p style="margin-top:0.3rem; line-height:1.35; background:rgba(0,0,0,0.2); padding:0.4rem 0.6rem; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">${sanitizeNotesText(item.notes)}</p></details>` : ''}
      `;
      listZone.appendChild(card);
    });
  }

  let totalWeight = 0;
  let attunedCount = 0;

  items.forEach(item => {
    if (!item.isParty) totalWeight += (item.weight || 0) * (item.qty || 1);
    if (item.attuned) attunedCount++;
  });

  const strScore = rawScores?.STR || 10;
  if (document.getElementById('displayCarryWeight')) document.getElementById('displayCarryWeight').innerText = `${totalWeight.toFixed(1)} lbs`;
  if (document.getElementById('displayMaxWeight')) document.getElementById('displayMaxWeight').innerText = `${strScore * 15} lbs`;
  if (document.getElementById('displayAttunement')) document.getElementById('displayAttunement').innerText = `${attunedCount} / 3`;
}

/* ==========================================================================
   SMART COIN & VALUABLES CALCULATOR
   ========================================================================== */

export function calculateTotalGold() {
  const cp = parseInt(document.getElementById('coin-cp')?.value) || 0;
  const sp = parseInt(document.getElementById('coin-sp')?.value) || 0;
  const ep = parseInt(document.getElementById('coin-ep')?.value) || 0;
  const gp = parseInt(document.getElementById('coin-gp')?.value) || 0;
  const pp = parseInt(document.getElementById('coin-pp')?.value) || 0;

  let totalGP = (cp * 0.01) + (sp * 0.1) + (ep * 0.5) + gp + (pp * 10);

  const gems = window.state?.gemsAndValuables || [];
  const gemsTotal = gems.reduce((acc, gem) => acc + ((gem.value || 0) * (gem.qty || 1)), 0);

  totalGP += gemsTotal;

  const displayEl = document.getElementById('displayTotalGold');
  if (displayEl) {
    displayEl.innerText = `${totalGP.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} GP`;
  }

  if (!window.state) window.state = {};
  window.state.walletState = { cp, sp, ep, gp, pp };
}

export function autoConsolidateCoins() {
  let cp = parseInt(document.getElementById('coin-cp')?.value) || 0;
  let sp = parseInt(document.getElementById('coin-sp')?.value) || 0;
  let ep = parseInt(document.getElementById('coin-ep')?.value) || 0;
  let gp = parseInt(document.getElementById('coin-gp')?.value) || 0;
  let pp = parseInt(document.getElementById('coin-pp')?.value) || 0;

  sp += Math.floor(cp / 10);
  cp = cp % 10;

  gp += Math.floor(sp / 10);
  sp = sp % 10;

  gp += Math.floor(ep / 2);
  ep = ep % 2;

  pp += Math.floor(gp / 10);
  gp = gp % 10;

  if (document.getElementById('coin-cp')) document.getElementById('coin-cp').value = cp;
  if (document.getElementById('coin-sp')) document.getElementById('coin-sp').value = sp;
  if (document.getElementById('coin-ep')) document.getElementById('coin-ep').value = ep;
  if (document.getElementById('coin-gp')) document.getElementById('coin-gp').value = gp;
  if (document.getElementById('coin-pp')) document.getElementById('coin-pp').value = pp;

  calculateTotalGold();
}

export function promptLootTransaction() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:0.6rem;">
      <p style="font-size:0.8rem; color:var(--text-muted);">Quickly add or deduct coins from your wallet:</p>
      
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">
        <div>
          <label style="font-size:0.75rem; color:var(--text-muted);">Operation:</label>
          <select id="lootOp" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
            <option value="add">➕ Add Loot (+)</option>
            <option value="sub">➖ Spend / Pay (-)</option>
          </select>
        </div>
        <div>
          <label style="font-size:0.75rem; color:var(--text-muted);">Denomination:</label>
          <select id="lootDenom" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
            <option value="gp">GP (Gold)</option>
            <option value="sp">SP (Silver)</option>
            <option value="cp">CP (Copper)</option>
            <option value="pp">PP (Platinum)</option>
            <option value="ep">EP (Electrum)</option>
          </select>
        </div>
      </div>

      <div>
        <label style="font-size:0.75rem; color:var(--text-muted);">Amount:</label>
        <input type="number" id="lootAmt" value="50" min="1" autocomplete="off" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
      </div>
    </div>
  `;

  openModal('Loot / Wallet Transaction', html, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: 'Apply Transaction', class: '', onclick: () => {
        const op = document.getElementById('lootOp')?.value;
        const denom = document.getElementById('lootDenom')?.value || 'gp';
        const amt = parseInt(document.getElementById('lootAmt')?.value) || 0;

        const coinInput = document.getElementById(`coin-${denom}`);
        if (coinInput) {
          let curr = parseInt(coinInput.value) || 0;
          if (op === 'add') curr += amt;
          if (op === 'sub') curr = Math.max(0, curr - amt);
          coinInput.value = curr;
          calculateTotalGold();
        }
        closeModal(true);
      } 
    }
  ]);
}

// Global Exports
window.renderInventory = renderInventory;
window.setInventoryMode = setInventoryMode;
window.filterContainer = filterContainer;
window.promptAddContainer = promptAddContainer;
window.deleteContainer = deleteContainer;
window.promptAddItem = promptAddItem;
window.syncEquippedActions = syncEquippedActions;
window.toggleEquipItem = toggleEquipItem;
window.toggleAttuneItem = toggleAttuneItem;
window.deleteItem = deleteItem;
window.changeItemContainer = changeItemContainer;
window.toggleGemsDrawer = toggleGemsDrawer;
window.promptAddCustomCurrency = promptAddCustomCurrency;
window.promptAddGem = promptAddGem;
window.toggleItemUse = toggleItemUse;
window.renderGemsList = renderGemsList;
window.deleteGem = deleteGem;
window.calculateTotalGold = calculateTotalGold;
window.autoConsolidateCoins = autoConsolidateCoins;
window.promptLootTransaction = promptLootTransaction;