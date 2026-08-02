/* ==========================================================================
   MAIN APP CONTROLLER & MODULE INITIATOR
   ========================================================================== */

import { openModal, closeModal, alertModal } from './modalEngine.js';
import { promptAdjustHP, updateHPDisplay } from './hpEngine.js';
import { renderAbilityScores, renderSkills, setSkillSort, toggleStatDisplayFormat, promptAddSkill } from './skills.js'; 
import { renderActions, filterActions, resetTurnResources } from './actions.js';
import { renderFeatures, promptAddFeature } from './features.js';
import { renderInventory, setInventoryMode, promptAddItem, toggleGemsDrawer, promptAddCustomCurrency, promptAddGem } from './inventory.js';
import { promptDnDBeyondURLImport, executeDnDBeyondFetch, enableManualEntry } from './dndbImporter.js';
import { loadBucket } from './buckets.js';

/* ==========================================================================
   GLOBAL WINDOW BINDINGS (For Inline HTML Handlers)
   ========================================================================== */

// Modals & HP
window.openModal = openModal;
window.closeModal = closeModal;
window.alertModal = alertModal;
window.promptAdjustHP = promptAdjustHP;
window.updateHPDisplay = updateHPDisplay;

// Character & Skills
window.renderAbilityScores = renderAbilityScores;
window.renderSkills = renderSkills;
window.setSkillSort = setSkillSort;
window.toggleStatDisplayFormat = toggleStatDisplayFormat;
window.promptAddSkill = promptAddSkill;

// Actions & Combat
window.renderActions = renderActions;
window.filterActions = filterActions;
window.resetTurnResources = resetTurnResources;

// Features & Inventory
window.renderFeatures = renderFeatures;
window.promptAddFeature = promptAddFeature;
window.renderInventory = renderInventory;
window.setInventoryMode = setInventoryMode;
window.promptAddItem = promptAddItem;
window.toggleGemsDrawer = toggleGemsDrawer;
window.promptAddCustomCurrency = promptAddCustomCurrency;
window.promptAddGem = promptAddGem;

// Importer & Nomicon
window.promptDnDBeyondURLImport = promptDnDBeyondURLImport;
window.executeDnDBeyondFetch = executeDnDBeyondFetch;
window.enableManualEntry = enableManualEntry;
window.loadBucket = loadBucket;

// Safe Dummy Fallbacks for Unfinished Features
const dummyFunc = (name) => () => console.log(`[Stub] ${name} clicked (Not yet implemented)`);
window.gmAdjustPlayerHP = dummyFunc('gmAdjustPlayerHP');
window.inspectPlayerSheet = dummyFunc('inspectPlayerSheet');
window.gmModifyAttunement = dummyFunc('gmModifyAttunement');
window.toggleGMCombatMode = dummyFunc('toggleGMCombatMode');

/* ==========================================================================
   UI NAVIGATION & DRAWER CONTROLS
   ========================================================================== */

window.switchView = function(viewId) {
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
  document.querySelectorAll('.tab-nubbin').forEach(tab => tab.classList.remove('active'));
  
  const targetPanel = document.getElementById(viewId);
  if (targetPanel) targetPanel.classList.add('active');
  
  const targetTab = document.getElementById(viewId.replace('view-', 'nub-'));
  if (targetTab) targetTab.classList.add('active');
};

window.toggleCogMenu = function() {
  const cogMenu = document.getElementById('cogMenu');
  if (cogMenu) {
    cogMenu.style.display = (cogMenu.style.display === 'flex' || cogMenu.style.display === 'block') ? 'none' : 'flex';
  }
};

// [HIDDEN] LLM Integration Module for Gemini
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
      <input type="text" id="buffNameInput" placeholder="e.g. Bless, Haste, Poisoned" style="width:100%; padding:0.4rem;" />
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
      <button style="background:none; border:none; color:var(--text-muted); cursor:pointer; margin-left:0.5rem;" onclick="removeBuff(${idx})">✕</button>
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
  localStorage.setItem('memetic-theme', themeValue);
  if (themeValue === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'high-fantasy-dark' : 'parchment-light');
  } else {
    root.setAttribute('data-theme', themeValue);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const themeSelect = document.getElementById('themeSelect');
  const savedTheme = localStorage.getItem('memetic-theme') || 'system';
  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
  }
  applyTheme(savedTheme);

  const fontSlider = document.getElementById('fontSizeSlider');
  if (fontSlider) {
    fontSlider.addEventListener('input', (e) => {
      document.documentElement.style.fontSize = `${e.target.value}px`;
    });
  }

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

  renderAbilityScores();
  renderBuffs();
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (localStorage.getItem('memetic-theme') === 'system') applyTheme('system');
});