/* ==========================================================================
   MEMETIC SMART AUTOSAVE & DIRECTORY ENGINE (js/core/autosave.js)
   ========================================================================== */

import { 
  rawScores, 
  hpState, 
  walletState, 
  customCurrencies, 
  gemsAndValuables, 
  characterFeatures 
} from './state.js';

import { openModal } from './modalEngine.js';

let dirHandle = null;
let autosaveTimer = null;

export function getNomiconPayload() {
  const inventoryItems = (window.state && window.state.inventory) ? window.state.inventory : [];
  const containers = (window.state && window.state.containers) ? window.state.containers : [];
  const nomiconBuckets = (window.state && window.state.nomiconBuckets) ? window.state.nomiconBuckets : [];

  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    rawScores,
    hpState,
    inventoryItems,
    walletState,
    customCurrencies,
    gemsAndValuables,
    containers,
    characterFeatures,
    nomiconBuckets
  };
}

export function saveToLocalStorage() {
  try {
    const payload = getNomiconPayload();
    localStorage.setItem('nomicon_autosave', JSON.stringify(payload));
    
    if (typeof window.updateAutosaveBadge === 'function') {
      window.updateAutosaveBadge('Synced to Memory');
    }
  } catch (err) {
    console.error('LocalStorage Autosave Error:', err);
  }
}

export async function linkSaveDirectory() {
  if (!('showDirectoryPicker' in window)) {
    if (typeof alertModal === 'function') {
      alertModal('Physical folder linking requires a modern browser (Chrome, Edge, Brave, Opera) or an app wrapper.', 'Directory Linking');
    } else {
      alert('Physical folder linking requires a modern browser (Chrome, Edge, Brave, Opera) or an app wrapper.');
    }
    return;
  }
}