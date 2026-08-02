/* ==========================================================================
   D&D BEYOND DIRECT JSON & URL API IMPORTER
   ========================================================================== */

import { rawScores, hpState, setInventoryItems, setCharacterFeatures } from './state.js';
import { renderAbilityScores } from './skills.js';
import { updateHPDisplay } from './hpEngine.js';
import { renderInventory } from './inventory.js';
import { renderFeatures } from './features.js';
import { openModal, closeModal, alertModal } from './modalEngine.js';
import { triggerAutosave } from './autosave.js';

export function promptDnDBeyondURLImport() {
  const contentHTML = `
    <div style="display:flex; flex-direction:column; gap:0.8rem;">
      <p style="font-size:0.8rem; color:var(--text-muted);">
        Paste your D&D Beyond character URL (e.g., <code>https://www.dndbeyond.com/characters/12345678</code>) or raw Character ID:
      </p>
      <input type="text" id="dndbUrlInput" placeholder="https://www.dndbeyond.com/characters/..." style="width:100%; font-size:0.85rem; padding:0.4rem;" />
      
      <div style="text-align:center; font-size:0.75rem; color:var(--text-muted); margin:0.2rem 0;">— OR PASTE RAW JSON —</div>
      
      <textarea id="dndbJsonInput" placeholder="Paste raw JSON here if character sheet is set to private..." style="width:100%; height:90px; font-size:0.75rem; padding:0.4rem;"></textarea>
    </div>
  `;

  openModal('Import D&D Beyond Character', contentHTML, [
    { label: 'Fetch & Import', class: '', onclick: () => executeDnDBeyondFetch() },
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) }
  ]);
}

export function enableManualEntry() {
  if (typeof closeModal === 'function') closeModal(true);
  
  const editableFields = ['charName', 'charClass', 'displayAC', 'displayHP', 'displaySpeed', 'displayInit'];
  
  editableFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute('contenteditable', 'true');
      el.style.borderBottom = '1px dashed var(--accent-color)';
      el.style.padding = '0.1rem 0.3rem';
      el.style.borderRadius = '4px';
      el.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      el.style.outline = 'none';
      el.style.cursor = 'text';
    }
  });

  if (typeof alertModal === 'function') {
    alertModal("Manual Edit Mode Active! You can now click directly on your Name, Class, AC, HP, Speed, and Initiative to type custom values.", "Manual Mode Enabled");
  }
}

export async function executeDnDBeyondFetch() {
  const urlOrId = document.getElementById('dndbUrlInput')?.value.trim();
  const rawJsonText = document.getElementById('dndbJsonInput')?.value.trim();

  closeModal(true);

  let characterData = null;

  if (rawJsonText) {
    try {
      const parsed = JSON.parse(rawJsonText);
      characterData = parsed.data || parsed;
    } catch (e) {
      alertModal("Invalid raw JSON pasted.", "Import Error");
      return;
    }
  } else if (urlOrId) {
    const idMatch = urlOrId.match(/\d+/);
    if (!idMatch) {
      alertModal("Could not find a valid Character ID in that URL.", "Import Error");
      return;
    }

    const charId = idMatch[0];
    const targetUrl = `https://character-service.dndbeyond.com/character/v5/character/${charId}`;

    const proxyFetchers = [
      async () => {
        const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
        if (!res.ok) return null;
        return await res.json();
      },
      async () => {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&timestamp=${Date.now()}`);
        if (!res.ok) return null;
        const proxyJson = await res.json();
        return JSON.parse(proxyJson.contents);
      },
      async () => {
        const res = await fetch(targetUrl);
        if (!res.ok) return null;
        return await res.json();
      }
    ];

    for (const fetcher of proxyFetchers) {
      try {
        const resData = await fetcher();
        if (resData && (resData.success !== false) && (resData.data || resData.name || resData.id)) {
          characterData = resData;
          break;
        }
      } catch (err) {}
    }

  } else {
    alertModal("Please provide a Character Link or JSON data.", "Input Missing");
    return;
  }

  if (!characterData) {
    alertModal("D&D Beyond API refused request or character is Private. Paste raw JSON if URL fails!", "Import Failed");
    return;
  }

  parseDnDBeyondDataObject(characterData);
}

function parseDnDBeyondDataObject(payload) {
  if (!payload) return;

  if (payload.success === false || payload.errorMessage) {
    const errorMsg = payload.errorMessage || payload.message || "Access Denied";
    alertModal(`D&D Beyond returned error: "${errorMsg}". Ensure character is set to Public!`, "Import Error");
    return;
  }

  let data = payload.data?.character || payload.data || payload.character || payload;

  if (!window.state) window.state = {};

  // 1. Identity & Class Level
  const charName = data.name || data.characterName || 'Unknown Hero';
  let primaryClass = 'Adventurer';
  let totalLevel = 1;

  if (data.classes && Array.isArray(data.classes) && data.classes.length > 0) {
    primaryClass = data.classes[0].definition?.name || 'Adventurer';
    totalLevel = data.classes.reduce((acc, c) => acc + (c.level || 0), 0);
  }
  
  window.state.level = totalLevel; // Save for accurate Prof Math
  const classLevelStr = `${primaryClass} ${totalLevel}`;

  if (document.getElementById('charName')) document.getElementById('charName').innerText = charName;
  if (document.getElementById('charClass')) document.getElementById('charClass').innerText = classLevelStr;
  const initials = charName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  if (document.getElementById('avatarFallback')) document.getElementById('avatarFallback').innerText = initials || 'TS';

  // 2. Ability Scores
  const statKeys = { 1: 'STR', 2: 'DEX', 3: 'CON', 4: 'INT', 5: 'WIS', 6: 'CHA' };
  const statSubtypes = {
    'strength-score': 'STR', 'dexterity-score': 'DEX', 'constitution-score': 'CON',
    'intelligence-score': 'INT', 'wisdom-score': 'WIS', 'charisma-score': 'CHA'
  };

  if (data.stats && Array.isArray(data.stats)) {
    data.stats.forEach(s => {
      if (statKeys[s.id]) rawScores[statKeys[s.id]] = s.value || 10;
    });
  }

  // 3. Deep Modifier Parsing (Profs, Saves, AC, Speed)
  let acBonus = 0;
  let walkSpeed = 30; // 5e Default
  
  // Fallbacks for base racial speeds (Centaur, Wood Elf, etc.)
  if (data.race?.baseWalkingSpeed) walkSpeed = data.race.baseWalkingSpeed;
  if (data.race?.weightSpeeds?.normal?.walk) walkSpeed = data.race.weightSpeeds.normal.walk;

  let proficiencies = new Set();
  let expertises = new Set();
  let saveProfs = new Set();

  if (data.modifiers) {
    Object.values(data.modifiers).forEach(modArray => {
      if (Array.isArray(modArray)) {
        modArray.forEach(mod => {
          // Stats
          if (mod.type === 'bonus' && statSubtypes[mod.subType]) {
            rawScores[statSubtypes[mod.subType]] = (rawScores[statSubtypes[mod.subType]] || 10) + (mod.value || 0);
          }
          // Speed
          if (mod.type === 'bonus' && (mod.subType === 'speed' || mod.subType === 'unarmored-movement')) {
            walkSpeed += mod.value;
          } else if (mod.type === 'set' && mod.subType === 'innate-speed-walking') {
            walkSpeed = Math.max(walkSpeed, mod.value);
          }
          // AC
          if (mod.type === 'bonus' && mod.subType === 'armor-class') {
            acBonus += mod.value;
          }
          // Skills & Saves
          if (mod.type === 'proficiency') {
            proficiencies.add(mod.subType);
            if (mod.subType.endsWith('-saving-throws')) {
              saveProfs.add(mod.subType.split('-')[0].toUpperCase());
            }
          }
          if (mod.type === 'expertise') {
            expertises.add(mod.subType);
          }
        });
      }
    });
  }

  if (data.overrideStats && Array.isArray(data.overrideStats)) {
    data.overrideStats.forEach(ov => {
      if (statKeys[ov.id] && ov.value !== null) rawScores[statKeys[ov.id]] = ov.value;
    });
  }

  // Bind extracted profs to state for skills.js
  window.state.skillProfs = Array.from(proficiencies);
  window.state.skillExpertise = Array.from(expertises);
  window.state.saveProfs = Array.from(saveProfs);

  const dexMod = Math.floor(((rawScores.DEX || 10) - 10) / 2);
  const strMod = Math.floor(((rawScores.STR || 10) - 10) / 2);
  const conMod = Math.floor(((rawScores.CON || 10) - 10) / 2);
  const profBonus = Math.ceil(1 + (totalLevel / 4));

  // 4. Calculated HP
  const baseHitPoints = data.baseHitPoints || 10;
  hpState.baseMax = baseHitPoints + (conMod * totalLevel);
  hpState.current = Math.max(0, hpState.baseMax - (data.removedHitPoints || 0));
  hpState.tempHP = data.temporaryHitPoints || 0;
  hpState.necroticDrain = 0;

  // 5. Armor Class Calculation
  let armorClass = 10 + dexMod;
  let equippedArmorBase = 0;
  let hasShield = false;

  if (data.inventory && Array.isArray(data.inventory)) {
    data.inventory.forEach(inv => {
      const def = inv.definition || {};
      if (inv.equipped) {
        if (def.filterType === 'Armor' && def.armorClass) {
          equippedArmorBase = Math.max(equippedArmorBase, def.armorClass);
        } else if (def.armorTypeId === 4) { 
          hasShield = true;
        }
      }
    });
  }

  if (equippedArmorBase > 0) {
    armorClass = equippedArmorBase + dexMod + (hasShield ? 2 : 0);
  } else {
    armorClass = 10 + dexMod + (hasShield ? 2 : 0);
  }
  
  armorClass += acBonus;

  if (document.getElementById('displayAC')) document.getElementById('displayAC').innerText = armorClass;
  if (document.getElementById('displaySpeed')) document.getElementById('displaySpeed').innerText = `${walkSpeed}ft`;
  if (document.getElementById('displayInit')) document.getElementById('displayInit').innerText = (dexMod >= 0 ? `+${dexMod}` : dexMod);

  // 6. Weapon Actions
  let attackList = [];
  if (data.inventory && Array.isArray(data.inventory)) {
    data.inventory.forEach(inv => {
      const def = inv.definition || {};
      if (inv.equipped && (def.filterType === 'Weapon' || def.attackType)) {
        let isFinesse = def.properties && def.properties.some(p => p.name === 'Finesse');
        let isRanged = def.attackType === 2;
        let atkMod = (isFinesse || isRanged) ? Math.max(dexMod, strMod) : strMod;
        let toHit = atkMod + profBonus;
        
        let dmgDice = def.damage ? def.damage.diceString : null;
        if (dmgDice && atkMod !== 0) dmgDice += (atkMod > 0 ? `+${atkMod}` : atkMod);

        attackList.push({
          id: 'dndb_atk_' + inv.id,
          name: def.name,
          type: 'Attack',
          desc: `${def.damageType || 'Weapon'} attack. Range: ${def.range || 'Melee'}`,
          dice: dmgDice,
          toHit: (toHit >= 0 ? `+${toHit}` : `${toHit}`)
        });
      }
    });
  }
  window.state.actions = attackList;

  // 7. Features (Passives strictly set to 0 uses)
  let featList = [];
  const pushFeat = (srcArray) => {
    if (srcArray && Array.isArray(srcArray)) {
      srcArray.forEach(item => {
        const def = item.definition || {};
        if (def.name) {
          featList.push({
            id: 'dndb_feat_' + (def.id || Math.random()),
            name: def.name,
            desc: def.description || '',
            currentUses: 0,
            maxUses: 0 // HIDES UI COUNTER
          });
        }
      });
    }
  };

  pushFeat(data.race?.racialTraits);
  pushFeat(data.feats);
  if (data.classes) data.classes.forEach(c => pushFeat(c.classFeatures?.filter(cf => cf.requiredLevel <= totalLevel)));
  window.state.features = featList;

  // 8. Final Render Triggers
  if (typeof renderAbilityScores === 'function') renderAbilityScores();
  if (typeof updateHPDisplay === 'function') updateHPDisplay();
  if (typeof renderFeatures === 'function') renderFeatures();
  if (typeof window.renderActions === 'function') window.renderActions();

  alertModal(`Imported "${charName}" (${classLevelStr}) successfully!`, "Import Complete");
  };
