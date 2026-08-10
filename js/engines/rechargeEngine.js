/* ==========================================================================
   REST & RECHARGE ENGINE (Long/Short Rests & Time Ticks)
   ========================================================================== */

import { updateHPDisplay } from './hpEngine.js';
import { renderInventory } from '../components/inventory.js';
import { renderActions } from '../components/actions.js';
import { renderFeatures } from '../components/features.js';
import { renderResourcePools } from './resourceEngine.js';

/**
 * Helper: Determine glowing pulse color based on highest ability score.
 */
function getHighestStatColor() {
  const statColors = {
    'STR': '#ff1e27', // Crimson
    'DEX': '#00ff66', // Emerald
    'CON': '#ffaa00', // Amber
    'INT': '#00ccff', // Sapphire
    'WIS': '#ffdd00', // Gold
    'CHA': '#b84dff'  // Amethyst
  };
  
  let highestStat = 'CON'; // Default fallback
  let highestVal = -1;
  
  const row = document.getElementById('abilityScoresRow');
  if (row) {
    const text = row.innerText;
    const regex = /(STR|DEX|CON|INT|WIS|CHA)\s+(\d+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const stat = match[1];
      const val = parseInt(match[2], 10);
      if (val > highestVal) {
        highestVal = val;
        highestStat = stat;
      }
    }
  }
  return statColors[highestStat] || '#ffffff';
}

/**
 * Trigger Short or Long Rests with 5-second cooldown guard.
 */
export function triggerRest(type, event) {
  if (!window.state) return;

  const btn = event?.currentTarget || event?.target;

  // 1. Cooldown Guard
  if (btn && btn.classList.contains('cooldown-active')) return;

  // 2. Trigger 5-Second Cooldown Animation
  if (btn) {
    btn.classList.add('cooldown-active');
    setTimeout(() => {
      btn.classList.remove('cooldown-active');
    }, 5000);
  }

  // 3. Stealth Overdrive Theme Ripple Hook
  if (type === 'long_rest' && event && window.triggerRestShockwave) {
    window.triggerRestShockwave(event);
  }
  
  // 4. Global UI Border Pulse for Long Rests
  if (type === 'long_rest') {
    const appFrame = document.getElementById('appFrame');
    if (appFrame) {
      appFrame.style.setProperty('--rest-glow-color', getHighestStatColor());
      appFrame.classList.remove('long-rest-pulse-active');
      void appFrame.offsetWidth; // Force reflow
      appFrame.classList.add('long-rest-pulse-active');
      
      setTimeout(() => appFrame.classList.remove('long-rest-pulse-active'), 1200);
    }
  }

  // 5. Rest Logic Execution
  if (type === 'long_rest' && window.hpState) {
    window.hpState.current = window.hpState.baseMax;
    updateHPDisplay();
  }

  const rechargeList = (list) => {
    if (!list || !Array.isArray(list)) return;
    list.forEach(item => {
      if (item.maxUses > 0) {
        if (type === 'long_rest' && ['long_rest', 'short_rest', 'dawn'].includes(item.rechargeTrigger)) {
          item.currentUses = 0;
        } else if (type === 'short_rest' && item.rechargeTrigger === 'short_rest') {
          item.currentUses = 0;
        }
      }
    });
  };

  rechargeList(window.state.inventory);
  rechargeList(window.state.features);
  rechargeList(window.state.actions);

  if (window.state.pools) {
    window.state.pools.forEach(pool => {
      if (type === 'long_rest' && ['long_rest', 'short_rest', 'dawn'].includes(pool.rechargeTrigger)) {
        pool.current = pool.max;
      } else if (type === 'short_rest' && pool.rechargeTrigger === 'short_rest') {
        pool.current = pool.max;
      }
    });
  }
  
// Spell Slot Wipe (Handles Flat Pools AND Nested Class Pools)
  if (type === 'long_rest' && window.state.spellSlots) {
    const resetPool = (poolObj) => {
      if (!poolObj || typeof poolObj !== 'object') return;
      Object.keys(poolObj).forEach(k => {
        if (poolObj[k] && typeof poolObj[k] === 'object' && poolObj[k].max !== undefined) {
          poolObj[k].used = 0;
        } else if (typeof poolObj[k] === 'object') {
          resetPool(poolObj[k]); // Recurse into class pools like spellSlots.bard
        }
      });
    };
    resetPool(window.state.spellSlots);
  }

  // 6. UI DOM Repaints
  if (typeof renderInventory === 'function') renderInventory();
  if (typeof renderActions === 'function') renderActions();
  if (typeof renderFeatures === 'function') renderFeatures();
  if (typeof renderResourcePools === 'function') renderResourcePools();
  
  // NEW: Repaint Spellbook explicitly so it visually unlocks
  if (typeof window.renderSpellbook === 'function') window.renderSpellbook(); 
}

/**
 * Trigger Time-Based Recharges (Dawn, Dusk, Midnight, etc.)
 */
export function triggerTimeRecharge(timeOfDay) {
  if (!window.state) return;

  const rechargeList = (list) => {
    if (!list || !Array.isArray(list)) return;
    list.forEach(item => {
      if (item.maxUses > 0 && item.rechargeTrigger === timeOfDay) {
        item.currentUses = 0;
      }
    });
  };

  rechargeList(window.state.inventory);
  rechargeList(window.state.features);
  rechargeList(window.state.actions);

  if (window.state.pools) {
    window.state.pools.forEach(pool => {
      if (pool.rechargeTrigger === timeOfDay) pool.current = pool.max;
    });
  }
  
  if (typeof renderInventory === 'function') renderInventory();
  if (typeof renderActions === 'function') renderActions();
  if (typeof renderFeatures === 'function') renderFeatures();
  if (typeof renderResourcePools === 'function') renderResourcePools();
  if (typeof window.renderSpellbook === 'function') window.renderSpellbook();
}

/**
 * Trigger GM/Specific Item Recharges
 */
export function triggerSpecificRecharge() {
  if (!window.state) return;

  const rechargeList = (list) => {
    if (!list || !Array.isArray(list)) return;
    list.forEach(item => {
      if (item.maxUses > 0 && item.rechargeTrigger === 'specific') {
        item.currentUses = 0;
      }
    });
  };

  rechargeList(window.state.inventory);
  rechargeList(window.state.features);
  rechargeList(window.state.actions);
  
  if (window.state.pools) {
    window.state.pools.forEach(pool => {
      if (pool.rechargeTrigger === 'specific') pool.current = pool.max;
    });
  }

  if (typeof renderInventory === 'function') renderInventory();
  if (typeof renderActions === 'function') renderActions();
  if (typeof renderFeatures === 'function') renderFeatures();
  if (typeof renderResourcePools === 'function') renderResourcePools();
  if (typeof window.renderSpellbook === 'function') window.renderSpellbook();
}

// Global Bindings
window.triggerRest = triggerRest;
window.triggerTimeRecharge = triggerTimeRecharge;
window.triggerSpecificRecharge = triggerSpecificRecharge;