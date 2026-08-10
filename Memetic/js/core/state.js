/* ==========================================================================
   GLOBAL STATE MODULE (js/state.js)
   ========================================================================== */

// Initialize Global Window State Fallbacks
if (!window.rawScores) {
  window.rawScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
}

if (!window.hpState) {
  window.hpState = { baseMax: 10, current: 10, tempHP: 0, necroticDrain: 0 };
}

if (!window.state) {
  window.state = {
    skills: [],
    inventory: [],
    features: [],
    actions: [],
    pools: [],
    spellSlots: {},
    skillSortMode: 'alpha'
  };
}

// Export Live References
export const rawScores = window.rawScores;
export const hpState = window.hpState;

export let walletState = { cp: 45, sp: 12, ep: 0, gp: 135, pp: 2 };
export let customCurrencies = [];
export let gemsAndValuables = [
  { id: 'gem_1', name: 'Small Ruby', qty: 2, gpValue: 50 },
  { id: 'gem_2', name: 'Silver Chalice', qty: 1, gpValue: 25 }
];

export let characterFeatures = [
  { id: 'feat_1', name: 'Hemovar Siphon', desc: 'Spending 2 Hemovar points restores 1d8 HP on a hit.', currentUses: 2, maxUses: 4 },
  { id: 'feat_2', name: 'Second Wind', desc: 'Bonus action self-heal.', currentUses: 1, maxUses: 1 }
];

export function setCharacterFeatures(feats) {
  characterFeatures = feats;
  window.state.features = feats;
}

export function setInventoryItems(items) {
  window.state.inventory = items;
}

export const dataNomiconRegistry = [
  { id: 'character', name: 'Character State Scroll', file: 'character.json', desc: 'Stats, active buffs, health state, and equipped gear.' },
  { id: 'homebrew', name: 'Homebrew Mechanics Library', file: 'homebrew.json', desc: 'Custom rules, injected mechanics, and extracted classes.' },
  { id: 'campaign', name: 'Campaign Lore & World Tome', file: 'campaign.json', desc: 'Locations, deities, factions, and world state notes.' },
  { id: 'spellbook', name: 'Arcane & Spell Index', file: 'spellbook.json', desc: 'Known spells, slots, and spell save rules.' },
  { id: 'journal', name: 'Session Chronicles', file: 'journal.json', desc: 'Campaign quest notes and NPC directory.' }
];

export const rawSavesProf = { STR: false, DEX: false, CON: true, INT: false, WIS: false, CHA: true };
export const baseDefenses = { ac: 17, speed: 30 };
export const characterPB = 3;

export let activeBuffs = [
  { id: 'shield_spell', name: 'Shield Spell', active: false, targetStat: 'AC', val: 5, isDebuff: false },
  { id: 'haste_spell', name: 'Haste', active: false, targetStat: 'SPEED', val: 30, isDebuff: false }
];

export let actionRegistry = [
  { id: 'act_1', name: 'Greatsword Slashing', type: 'attack', costCategory: 'action', dice: '2d6+3', desc: 'Melee weapon attack' },
  { id: 'act_2', name: 'Second Wind', type: 'heal', costCategory: 'bonus_action', dice: '1d10+5', desc: 'Bonus action self-heal' },
  { id: 'act_3', name: 'Parry', type: 'reaction', costCategory: 'reaction', dice: '1d6+1', desc: 'Reaction AC bonus on hit' }
];

export let currentSort = 'alpha';
export function setCurrentSort(val) {
  currentSort = val;
  window.state.skillSortMode = val;
}