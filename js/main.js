/* ==========================================================================
   MEMETIC CODEX ENGINE - MAIN ENTRY POINT
   ========================================================================== */

// 1. Core Infrastructure & Core Engines
import './core/state.js';
import './core/autosave.js';
import { executeRoll, rollCustomDice, setRollMode, toggleGMCritMode } from './core/diceEngine.js';
import { openModal, closeModal, alertModal, confirmModal } from './core/modalEngine.js';

// 2. Logic Engines
import { announceToScreenReader } from './engines/accessibilityEngine.js';
import './engines/hpEngine.js';
import './engines/rechargeEngine.js';
import './engines/resourceEngine.js';
import './engines/sequenceEngine.js';

// 3. UI Components & Importers
import './components/actions.js';
import './components/buckets.js';
import './components/features.js';
import './components/inventory.js';
import './components/skills.js';
import './components/gmModule.js';
import './components/dndbImporter.js';
import { renderSpellbook } from './components/spells.js';

// 4. Sources, Species & Classes
import './sources/sourceManager.js';
import './species/speciesEngine.js';
import './classes/subclassEngine.js';
import { initBaselineSource } from './sources/sourceManager.js';

/* ==========================================================================
   GLOBAL WINDOW BINDINGS (For Inline HTML Handlers)
   ========================================================================== */

// Bind explicitly imported Engine functions
window.openModal = openModal;
window.closeModal = closeModal;
window.alertModal = alertModal;
window.confirmModal = confirmModal;
window.announceToScreenReader = announceToScreenReader;

window.executeRoll = executeRoll;
window.rollSkill = executeRoll; // Alias for legacy buttons
window.rollCustomDice = rollCustomDice;
window.setRollMode = setRollMode;
window.toggleGMCritMode = toggleGMCritMode;

// Safe Dummy Fallbacks for Unfinished Features
const dummyFunc = (name) => () => console.log(`[Stub] ${name} clicked (Not yet implemented)`);
window.gmAdjustPlayerHP = dummyFunc('gmAdjustPlayerHP');
window.inspectPlayerSheet = dummyFunc('inspectPlayerSheet');
window.gmModifyAttunement = dummyFunc('gmModifyAttunement');
window.triggerRestShockwave = dummyFunc('triggerRestShockwave');

/* ==========================================================================
   UI NAVIGATION & DRAWER CONTROLS
   ========================================================================== */

window.switchView = function(viewId) {
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active');
    panel.setAttribute('aria-hidden', 'true');
  });

  document.querySelectorAll('.tab-nubbin').forEach(tab => {
    tab.classList.remove('active');
    tab.setAttribute('aria-selected', 'false');
  });

  if (viewId === 'view-spells') {
  renderSpellbook();
}
  const targetPanel = document.getElementById(viewId);
  if (targetPanel) {
    targetPanel.classList.add('active');
    targetPanel.removeAttribute('aria-hidden');
  }
  
  const targetTab = document.getElementById(viewId.replace('view-', 'nub-'));
  if (targetTab) {
    targetTab.classList.add('active');
    targetTab.setAttribute('aria-selected', 'true');

    const tabName = targetTab.innerText || 'Tab View';
    if (typeof window.announceToScreenReader === 'function') {
      window.announceToScreenReader(`Switched to ${tabName} view.`);
    }
  }
};

window.toggleCogMenu = function() {
  const cogMenu = document.getElementById('cogMenu');
  if (cogMenu) {
    cogMenu.style.display = (cogMenu.style.display === 'flex' || cogMenu.style.display === 'block') ? 'none' : 'flex';
  }
};

window.toggleGeminiDrawer = function() {
  const drawer = document.getElementById('geminiDrawer');
  if (drawer) {
    drawer.style.display = (drawer.style.display === 'block') ? 'none' : 'block';
  }
};

window.promptAddBuff = function() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:0.6rem;">
      <label style="font-size:0.8rem; color:var(--text-muted);">Effect Name:</label>
      <input type="text" id="buffNameInput" placeholder="e.g. Bless, Haste, Poisoned" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" style="width:100%; padding:0.4rem;" />
    </div>
  `;
  openModal('Add Active Effect', html, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: 'Add Effect', class: '', onclick: () => {
        const name = document.getElementById('buffNameInput')?.value.trim();
        if (name) {
          if (!window.state) window.state = {};
          if (!window.state.buffs) window.state.buffs = [];
          window.state.buffs.push(name);
          renderBuffs();
        }
        closeModal(true);
      } 
    }
  ]);
};

function renderBuffs() {
  const container = document.getElementById('buffsContainer');
  if (!container) return;
  container.innerHTML = '';
  const buffs = window.state?.buffs || [];
  if (buffs.length === 0) {
    container.innerHTML = `<p style="font-size:0.75rem; color:var(--text-muted);">No active effects.</p>`;
    return;
  }
  buffs.forEach((buff, idx) => {
    const tag = document.createElement('div');
    tag.className = 'buff-tag';
    tag.style.display = 'inline-flex';
    tag.style.justifyContent = 'space-between';
    tag.style.alignItems = 'center';
    tag.style.marginRight = '0.4rem';
    tag.innerHTML = `
      <span>⚡ ${buff}</span>
      <button style="background:none; border:none; color:var(--text-muted); cursor:pointer; margin-left:0.5rem;" aria-label="Remove Effect ${buff}" onclick="removeBuff(${idx})">✕</button>
    `;
    container.appendChild(tag);
  });
}

window.removeBuff = function(idx) {
  if (window.state?.buffs) {
    window.state.buffs.splice(idx, 1);
    renderBuffs();
  }
};

/* ==========================================================================
   THEME, SETTINGS & INITIALIZATION
   ========================================================================== */

export function applyTheme(themeValue) {
  const root = document.documentElement;
  const body = document.body;

  if (themeValue !== 'oramer-k-canrac') {
    body.classList.remove('oramer-k-canrac');
  }

  localStorage.setItem('memetic-theme', themeValue);

  if (themeValue === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'high-fantasy-dark' : 'parchment-light');
  } else {
    root.setAttribute('data-theme', themeValue);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initAccessibilitySuite === 'function') initAccessibilitySuite();
  initBaselineSource();

  const themeSelect = document.getElementById('themeSelect');
  const savedTheme = localStorage.getItem('memetic-theme') || 'system';
  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
  }
  applyTheme(savedTheme);

  const opacitySlider = document.getElementById('opacitySlider');
  const appFrame = document.getElementById('appFrame');
  if (opacitySlider && appFrame) {
    opacitySlider.addEventListener('input', (e) => {
      appFrame.style.opacity = e.target.value;
    });
  }

  const uploadBgBtn = document.getElementById('uploadBgBtn');
  const bgInput = document.getElementById('bgInput');
  if (uploadBgBtn && bgInput) {
    uploadBgBtn.addEventListener('click', () => bgInput.click());
    bgInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.body.style.backgroundImage = `url('${event.target.result}')`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  ['coin-cp', 'coin-sp', 'coin-ep', 'coin-gp', 'coin-pp'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', () => {
        if (typeof window.calculateTotalGold === 'function') {
          window.calculateTotalGold();
        }
      });
    }
  });

  if (typeof window.renderAbilityScores === 'function') window.renderAbilityScores();
  if (typeof window.renderSkills === 'function') window.renderSkills();
  renderBuffs();
  if (typeof window.renderResourcePools === 'function') window.renderResourcePools();
  if (typeof window.calculateTotalGold === 'function') window.calculateTotalGold();

  if (localStorage.getItem('memetic-theme') === 'oramer-k-canrac') {
    document.body.classList.add('oramer-k-canrac');
  }
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (localStorage.getItem('memetic-theme') === 'system') applyTheme('system');
});

/* ==========================================================================
   NUBBIN DOCK DRAG & DROP REORDERING ENGINE
   ========================================================================== */

let draggedNubbin = null;

export function handleNubbinDragStart(e) {
  draggedNubbin = e.currentTarget;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', e.currentTarget.id);
  e.currentTarget.classList.add('dragging');
}

export function handleNubbinDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

export function handleNubbinDrop(e) {
  e.preventDefault();
  const target = e.currentTarget;

  if (draggedNubbin && target && target !== draggedNubbin && target.classList.contains('draggable-tab')) {
    const dock = document.getElementById('nubbinDock');
    const allTabs = Array.from(dock.querySelectorAll('.draggable-tab'));
    
    const draggedIndex = allTabs.indexOf(draggedNubbin);
    const targetIndex = allTabs.indexOf(target);

    if (draggedIndex < targetIndex) {
      target.after(draggedNubbin);
    } else {
      target.before(draggedNubbin);
    }

    saveNubbinOrder();
  }

  if (draggedNubbin) {
    draggedNubbin.classList.remove('dragging');
    draggedNubbin = null;
  }
}

function saveNubbinOrder() {
  const dock = document.getElementById('nubbinDock');
  if (!dock) return;
  const draggableTabs = Array.from(dock.querySelectorAll('.draggable-tab'));
  const orderIds = draggableTabs.map(tab => tab.id);
  localStorage.setItem('memetic_nubbin_order', JSON.stringify(orderIds));
}

export function restoreNubbinOrder() {
  const savedOrder = localStorage.getItem('memetic_nubbin_order');
  if (!savedOrder) return;

  try {
    const orderIds = JSON.parse(savedOrder);
    const dock = document.getElementById('nubbinDock');
    const divider = document.getElementById('dockDivider');

    if (!dock || !divider) return;

    orderIds.forEach(id => {
      const tab = document.getElementById(id);
      if (tab && tab.classList.contains('draggable-tab')) {
        divider.before(tab);
      }
    });
  } catch (err) {
    console.error('Failed to restore nubbin order', err);
  }
}

window.handleNubbinDragStart = handleNubbinDragStart;
window.handleNubbinDragOver = handleNubbinDragOver;
window.handleNubbinDrop = handleNubbinDrop;

document.addEventListener('DOMContentLoaded', restoreNubbinOrder);