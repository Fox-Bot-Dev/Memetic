/* ==========================================================================
   MEMETIC SMART AUTOSAVE & DIRECTORY ENGINE
   ========================================================================== */

import { rawScores, inventoryItems, walletState, customCurrencies, gemsAndValuables, containers, hpState, characterFeatures } from './state.js';
import { alertModal } from './modalEngine.js';

let dirHandle = null;
let autosaveTimer = null;

export function getNomiconPayload() {
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
    characterFeatures
  };
}

export function saveToLocalStorage() {
  try {
    const payload = getNomiconPayload();
    localStorage.setItem('nomicon_autosave', JSON.stringify(payload));
    updateAutosaveBadge('Synced to Memory');
  } catch (err) {
    console.error('LocalStorage Autosave Error:', err);
  }
}

export async function linkSaveDirectory() {
  if (!('showDirectoryPicker' in window)) {
    alertModal("Physical folder linking requires a modern browser (Chrome, Edge, Brave, Opera) or an app wrapper.", "Directory Linking");
    return;
  }

  try {
    dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    alertModal(`Linked save directory to: "${dirHandle.name}". Memetic will write 'autosave.json' here automatically!`, "Folder Linked");
    triggerAutosave();
  } catch (err) {
    if (err.name !== 'AbortError') {
      alertModal("Could not link folder permission.", "Directory Error");
    }
  }
}

export async function saveToPhysicalDirectory() {
  if (!dirHandle) return;

  try {
    const options = { mode: 'readwrite' };
    if ((await dirHandle.queryPermission(options)) !== 'granted') {
      if ((await dirHandle.requestPermission(options)) !== 'granted') return;
    }

    const fileHandle = await dirHandle.getFileHandle('autosave.json', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(getNomiconPayload(), null, 2));
    await writable.close();

    updateAutosaveBadge(`Saved to ${dirHandle.name}/autosave.json`);
  } catch (err) {
    console.error('Physical File Save Error:', err);
  }
}

export function triggerAutosave() {
  saveToLocalStorage();
  if (dirHandle) {
    saveToPhysicalDirectory();
  }
}

export function restoreAutosaveOnBoot() {
  const saved = localStorage.getItem('nomicon_autosave');
  if (!saved) return false;

  try {
    const parsed = JSON.parse(saved);
    if (parsed.rawScores) Object.assign(rawScores, parsed.rawScores);
    if (parsed.hpState) Object.assign(hpState, parsed.hpState);
    if (parsed.inventoryItems) {
      inventoryItems.length = 0;
      inventoryItems.push(...parsed.inventoryItems);
    }
    if (parsed.walletState) Object.assign(walletState, parsed.walletState);
    if (parsed.characterFeatures) {
      characterFeatures.length = 0;
      characterFeatures.push(...parsed.characterFeatures);
    }
    return true;
  } catch (err) {
    console.error("Autosave Restoration Error:", err);
    return false;
  }
}

function updateAutosaveBadge(msg) {
  const badge = document.getElementById('autosaveBadge');
  if (badge) {
    badge.innerText = `🟢 ${msg}`;
    badge.style.opacity = '1';
    setTimeout(() => { badge.style.opacity = '0.6'; }, 2000);
  }
}

export function initAutosaveLoop() {
  if (autosaveTimer) clearInterval(autosaveTimer);
  autosaveTimer = setInterval(triggerAutosave, 10000);
}