/* ==========================================================================
   MEMETIC CORE STATE - SINGLE SOURCE OF TRUTH
   ========================================================================== */

export const getApiKey = () => localStorage.getItem('gemini_api_key') || '';
export const setApiKey = (key) => localStorage.setItem('gemini_api_key', key);

export let isGM = false;
export function setGMState(val) { isGM = val; }

export let isCombatActive = false;
export function setCombatActiveState(val) { isCombatActive = val; }

export let showModPrimary = false;
export function setShowModPrimary(val) { showModPrimary = val; }

export let currentActionFilter = 'all';
export function setCurrentActionFilter(val) { currentActionFilter = val; }

export let currentContainerFilter = 'all';
export function setCurrentContainerFilter(val) { currentContainerFilter = val; }

export let currentInventoryMode = 'personal';
export function setCurrentInventoryMode(val) { currentInventoryMode = val; }

export let pendingImportBucket = null;
export function setPendingImportBucket(val) { pendingImportBucket = val; }

export let usedTurnResources = { action: false, bonus_action: false, reaction: false };

export let hpState = { current: 38, baseMax: 42, necroticDrain: 0, tempHP: 0 };
export let maxAttunementSlots = 3;
export function setMaxAttunementSlots(val) { maxAttunementSlots = val; }

export let containers = ['Carried / Equipped', 'Backpack', 'Belt Pouch'];

export let inventoryItems = [
  { id: 'inv_1', name: 'Greatsword', type: 'weapon', weight: 6, qty: 1, container: 'Carried / Equipped', equipped: true, attuned: false, statType: 'none', statVal: 0, dice: '2d6', isParty: false },
  { id: 'inv_2', name: 'Plate Armor', type: 'armor', weight: 65, qty: 1, container: 'Carried / Equipped', equipped: true, attuned: false, statType: 'AC', statVal: 1, dice: null, isParty: false },
  { id: 'inv_3', name: 'Explorer\'s Pack', type: 'misc', weight: 35, qty: 1, container: 'Backpack', equipped: false, attuned: false, statType: 'none', statVal: 0, dice: null, isParty: false },
  { id: 'inv_4', name: 'Potion of Healing', type: 'healing', weight: 0.5, qty: 3, container: 'Belt Pouch', equipped: false, attuned: false, statType: 'HP', statVal: 0, dice: '2d4+2', isParty: false }
];
export function setInventoryItems(items) { inventoryItems = items; }

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
export function setCharacterFeatures(feats) { characterFeatures = feats; }

export const dataNomiconRegistry = [
  { id: 'character', name: 'Character State Scroll', file: 'character.json', desc: 'Stats, active buffs, health state, and equipped gear.' },
  { id: 'homebrew', name: 'Homebrew Mechanics Library', file: 'homebrew.json', desc: 'Custom rules, injected mechanics, and extracted classes.' },
  { id: 'campaign', name: 'Campaign Lore & World Tome', file: 'campaign.json', desc: 'Locations, deities, factions, and world state notes.' },
  { id: 'spellbook', name: 'Arcane & Spell Index', file: 'spellbook.json', desc: 'Known spells, slots, and spell save rules.' },
  { id: 'journal', name: 'Session Chronicles', file: 'journal.json', desc: 'Campaign quest notes and NPC directory.' }
];

export const rawScores = { STR: 16, DEX: 12, CON: 15, INT: 10, WIS: 14, CHA: 18 };
export const rawSavesProf = { STR: false, DEX: false, CON: true, INT: false, WIS: false, CHA: true };
export const baseDefenses = { ac: 17, speed: 30 };
export const characterPB = 3;

export let activeBuffs = [
  { id: 'shield_spell', name: 'Shield Spell', active: false, targetStat: 'AC', val: 5, isDebuff: false },
  { id: 'haste_spell', name: 'Haste', active: false, targetStat: 'SPEED', val: 30, isDebuff: false }
];

export let actionRegistry = [
  { id: 'act_1', name: 'Greatsword Slashing', type: 'attack', costCategory: 'action', dice: '2d6+3', desc: 'Melee weapon attack' },
  { id: 'act_2', name: 'Second Wind', type: 'heal', costCategory: 'bonus_action', dice: '1d10+5', desc: 'Bonus action self-heal (Keyword: HEAL)' },
  { id: 'act_3', name: 'Parry', type: 'reaction', costCategory: 'reaction', dice: '1d6+1', desc: 'Reaction AC bonus on hit' }
];

export let skillsData = [
  { name: 'Acrobatics', stat: 'DEX', prof: 0 }, { name: 'Animal Handling', stat: 'WIS', prof: 0 },
  { name: 'Arcana', stat: 'INT', prof: 0 }, { name: 'Athletics', stat: 'STR', prof: 2 },
  { name: 'Deception', stat: 'CHA', prof: 1 }, { name: 'History', stat: 'INT', prof: 0 },
  { name: 'Insight', stat: 'WIS', prof: 0 }, { name: 'Intimidation', stat: 'CHA', prof: 1 },
  { name: 'Investigation', stat: 'INT', prof: 1 }, { name: 'Medicine', stat: 'WIS', prof: 0 },
  { name: 'Nature', stat: 'INT', prof: 0 }, { name: 'Perception', stat: 'WIS', prof: 0 },
  { name: 'Performance', stat: 'CHA', prof: 0 }, { name: 'Persuasion', stat: 'CHA', prof: 0 },
  { name: 'Religion', stat: 'INT', prof: 0 }, { name: 'Sleight of Hand', stat: 'DEX', prof: 0 },
  { name: 'Stealth', stat: 'DEX', prof: 0 }, { name: 'Survival', stat: 'WIS', prof: 0 }
];
export let currentSort = 'alpha';
export function setCurrentSort(val) { currentSort = val; }