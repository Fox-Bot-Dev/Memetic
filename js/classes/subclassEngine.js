/* ==========================================================================
   LEGAL-SAFE SUBCLASS ENGINE & FEATURE UNLOCKER (js/classes/subclassEngine.js)
   ========================================================================== */

import { renderFeatures } from '../components/features.js';

/**
 * Built-in Subclass Registry
 * Contains legal-safe SRD 5.1 / Creative Commons subclasses + Memetic Homebrew
 */
export const subclassRegistry = {
  // SRD / Open Baseline Subclasses
  'srd_champion': {
    id: 'srd_champion',
    name: 'Champion',
    parentClass: 'Fighter',
    unlockLevel: 3,
    features: [
      { level: 3, name: 'Improved Critical', desc: 'Your weapon attacks score a critical hit on a roll of 19 or 20.', maxUses: 0 },
      { level: 7, name: 'Remarkable Athlete', desc: 'Add half your proficiency bonus (rounded up) to any Strength, Dexterity, or Constitution check you make that doesn\'t already use your proficiency bonus.', maxUses: 0 },
      { level: 10, name: 'Additional Fighting Style', desc: 'You can choose a second option from the Fighting Style class feature.', maxUses: 0 }
    ]
  },
  'srd_evocation': {
    id: 'srd_evocation',
    name: 'School of Evocation',
    parentClass: 'Wizard',
    unlockLevel: 2,
    features: [
      { level: 2, name: 'Evocation Savant', desc: 'The gold and time you must spend to copy an Evocation spell into your spellbook is halved.', maxUses: 0 },
      { level: 2, name: 'Sculpt Spells', desc: 'You can create pockets of relative safety within the effects of your evocation spells.', maxUses: 0 },
      { level: 6, name: 'Potent Cantrip', desc: 'Your damaging cantrips affect even creatures that avoid the brunt of the effect.', maxUses: 0 }
    ]
  },

  // Memetic Homebrew Subclasses
  'homebrew_blood_knight': {
    id: 'homebrew_blood_knight',
    name: 'Blood Knight',
    parentClass: 'Fighter',
    unlockLevel: 3,
    features: [
      { level: 3, name: 'Hemovar Siphon', desc: 'Spending 2 Hemovar points restores 1d8 HP on a hit.', maxUses: 4, rechargeTrigger: 'short_rest' },
      { level: 7, name: 'Sanguine Ward', desc: 'Gain temporary HP equal to your Constitution modifier whenever you drop an enemy.', maxUses: 0 },
      { level: 10, name: 'Crimson Strike', desc: 'Infuse your attack with sangromancy to deal an additional 2d6 necrotic damage.', maxUses: 2, rechargeTrigger: 'long_rest' }
    ]
  }
};

/**
 * Register a new homebrew subclass dynamically (used by Nomicon or Invasive Thoughts)
 */
export function registerSubclass(subclassData) {
  if (!subclassData || !subclassData.id || !subclassData.name) return false;
  subclassRegistry[subclassData.id] = subclassData;
  console.log(`[SubclassEngine] Registered subclass: ${subclassData.name}`);
  return true;
}

/**
 * Evaluate character level and inject newly unlocked subclass features
 */
export function evaluateSubclassUnlocks(className, subclassName, charLevel) {
  if (!window.state) return;
  if (!window.state.features) window.state.features = [];

  const subKey = Object.keys(subclassRegistry).find(
    k => subclassRegistry[k].name.toLowerCase() === (subclassName || '').toLowerCase()
  );

  if (!subKey) return;

  const subData = subclassRegistry[subKey];
  if (charLevel < subData.unlockLevel) return;

  let addedCount = 0;
  subData.features.forEach(feat => {
    if (charLevel >= feat.level) {
      const exists = window.state.features.some(f => f.name.toLowerCase() === feat.name.toLowerCase());
      if (!exists) {
        window.state.features.push({
          id: 'sub_feat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: feat.name,
          desc: feat.desc,
          maxUses: feat.maxUses || 0,
          currentUses: 0,
          rechargeTrigger: feat.rechargeTrigger || 'long_rest',
          source: `${subData.name} (Lvl ${feat.level})`
        });
        addedCount++;
      }
    }
  });

  if (addedCount > 0 && typeof renderFeatures === 'function') {
    renderFeatures();
  }
}

// Global Bindings
window.subclassRegistry = subclassRegistry;
window.registerSubclass = registerSubclass;
window.evaluateSubclassUnlocks = evaluateSubclassUnlocks;