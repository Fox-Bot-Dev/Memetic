/* ==========================================================================
   D&D BEYOND DIRECT JSON & URL API IMPORTER
   ========================================================================== */

import { updateHPDisplay } from '../engines/hpEngine.js';
import { renderInventory } from './inventory.js';
import { renderFeatures } from './features.js';
import { openModal, closeModal, alertModal } from '../core/modalEngine.js';
import { renderAbilityScores, renderSkills, renderSavingThrows } from './skills.js';
import { renderSpellbook } from './spells.js';

if (!window.rawScores) window.rawScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
if (!window.hpState) window.hpState = { baseMax: 10, current: 10, tempHP: 0, necroticDrain: 0 };

const rawScores = window.rawScores;
const hpState = window.hpState;

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
  window.state.pools = [];

  // 1. Identity & Multi-Class Subclass Level Parsing
  const charName = data.name || data.characterName || 'Unknown Hero';
  let totalLevel = 0;
  let classMap = {};
  let classDisplaySegments = [];

  if (data.classes && Array.isArray(data.classes) && data.classes.length > 0) {
    data.classes.forEach(c => {
      const clsName = c.definition?.name || 'Adventurer';
      const clsLevel = c.level || 1;
      const subName = c.subclassDefinition?.name || c.definition?.subclassDefinition?.name || '';
      
      totalLevel += clsLevel;
      classMap[clsName.toLowerCase()] = clsLevel;

      let segment = `${clsName} ${clsLevel}`;
      if (subName) {
        segment += ` <span class="subclass-badge">| ${subName}</span>`;
      }
      
      classDisplaySegments.push(segment);
    });
  } else {
    classDisplaySegments.push('Adventurer 1');
    totalLevel = 1;
  }
  
  window.state.level = totalLevel;
  
  const classLevelHTML = classDisplaySegments.join(' <span style="opacity:0.4; margin:0 0.3rem;">|</span> ');
  const classLevelStr = classDisplaySegments.map(s => s.replace(/<[^>]*>/g, '')).join(' | ');

  if (document.getElementById('charName')) document.getElementById('charName').innerText = charName;
  if (document.getElementById('charClass')) document.getElementById('charClass').innerHTML = classLevelHTML;
  
  const avatarImgUrl = data.avatarUrl || data.decorations?.avatarUrl;
  const avatarImgEl = document.getElementById('avatarImage');
  const avatarFallbackEl = document.getElementById('avatarFallback');

  if (avatarImgUrl && avatarImgEl) {
    avatarImgEl.src = avatarImgUrl;
    avatarImgEl.style.display = 'block';
    if (avatarFallbackEl) avatarFallbackEl.style.display = 'none';
  } else {
    const initials = charName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    if (avatarFallbackEl) {
      avatarFallbackEl.innerText = initials || 'TS';
      avatarFallbackEl.style.display = 'block';
    }
    if (avatarImgEl) avatarImgEl.style.display = 'none';
  }

  const backdropUrl = data.decorations?.backdropAvatarUrl || data.themeColor?.themeDecoration;
  if (backdropUrl) {
    document.body.style.backgroundImage = `url('${backdropUrl}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
  }

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

  // 3. Modifiers
  let acBonus = 0;
  let walkSpeed = 30;
  
  if (data.race?.baseWalkingSpeed) walkSpeed = data.race.baseWalkingSpeed;
  if (data.race?.weightSpeeds?.normal?.walk) walkSpeed = data.race.weightSpeeds.normal.walk;

  let proficiencies = new Set();
  let expertises = new Set();
  let saveProfs = new Set();

  if (data.modifiers) {
    Object.values(data.modifiers).forEach(modArray => {
      if (Array.isArray(modArray)) {
        modArray.forEach(mod => {
          if (mod.type === 'bonus' && statSubtypes[mod.subType]) {
            rawScores[statSubtypes[mod.subType]] = (rawScores[statSubtypes[mod.subType]] || 10) + (mod.value || 0);
          }
          if (mod.type === 'bonus' && (mod.subType === 'speed' || mod.subType === 'unarmored-movement')) {
            walkSpeed += mod.value;
          } else if (mod.type === 'set' && mod.subType === 'innate-speed-walking') {
            walkSpeed = Math.max(walkSpeed, mod.value);
          }
          if (mod.type === 'bonus' && mod.subType === 'armor-class') {
            acBonus += mod.value;
          }
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

  window.state.skillProfs = Array.from(proficiencies);
  window.state.skillExpertise = Array.from(expertises);
  window.state.saveProfs = Array.from(saveProfs);

  const dexMod = Math.floor(((rawScores.DEX || 10) - 10) / 2);
  const strMod = Math.floor(((rawScores.STR || 10) - 10) / 2);
  const conMod = Math.floor(((rawScores.CON || 10) - 10) / 2);
  const chaMod = Math.floor(((rawScores.CHA || 10) - 10) / 2);
  const wisMod = Math.floor(((rawScores.WIS || 10) - 10) / 2);
  const profBonus = Math.ceil(1 + (totalLevel / 4));

  // 4. HP
  const baseHitPoints = data.baseHitPoints || 10;
  hpState.baseMax = baseHitPoints + (conMod * totalLevel);
  hpState.current = Math.max(0, hpState.baseMax - (data.removedHitPoints || 0));
  hpState.tempHP = data.temporaryHitPoints || 0;
  hpState.necroticDrain = 0;

  // 5. Armor Class
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

  // 6. Action Economy Parsing
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

  const activationMap = { 1: 'Action', 3: 'Bonus Action', 4: 'Reaction', 8: 'Misc' };

  const parseActionGroup = (actionGroup) => {
    if (actionGroup && Array.isArray(actionGroup)) {
      actionGroup.forEach(act => {
        const actType = activationMap[act.activation?.activationType] || 'Bonus Action';
        let rawDesc = act.snippet || act.description || 'Class or Racial Feature Action.';
        const sneakDice = Math.ceil(totalLevel / 2);
        
        let cleanedDesc = rawDesc
          .replace(/\{\{scalevalue\}\}/gi, `${sneakDice}d6`)
          .replace(/\{\{classlevel\}\}/gi, totalLevel)
          .replace(/\{\{modifier:[^}]+\}\}/gi, '')
          .replace(/<hr\s*\/?>/gi, '')
          .replace(/<\/?[^>]+(>|$)/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        let maxUses = act.limitedUse?.maxUses || act.uses?.max || 0;
        let recharge = act.limitedUse?.resetType === 1 ? 'short_rest' : 'long_rest';
        const descLower = cleanedDesc.toLowerCase();

        if (maxUses === 0) {
          if (descLower.includes('once per short rest') || descLower.includes('recharges on a short rest')) {
            maxUses = 1;
            recharge = 'short_rest';
          } else if (descLower.includes('once per long rest') || descLower.includes('recharges on a long rest')) {
            maxUses = 1;
            recharge = 'long_rest';
          }
        }

        attackList.push({
          id: 'dndb_act_' + (act.id || Math.random()),
          name: act.name,
          type: actType,
          desc: cleanedDesc,
          dice: act.dice?.diceString || (act.name.toLowerCase().includes('sneak attack') ? `${sneakDice}d6` : ''),
          toHit: '',
          maxUses: maxUses,
          currentUses: act.limitedUse?.numberUsed || 0,
          rechargeTrigger: recharge
        });
      });
    }
  };

  if (data.actions) {
    parseActionGroup(data.actions.class);
    parseActionGroup(data.actions.race);
    parseActionGroup(data.actions.feat);
    parseActionGroup(data.actions.item);
  }
  window.state.actions = attackList;

  // 6.5 Inventory Parsing
  let inventoryItems = [];
  let containerMap = {};

  if (data.inventory && Array.isArray(data.inventory)) {
    data.inventory.forEach(inv => {
      const def = inv.definition || {};
      if (def.isContainer || def.filterType === 'Container' || ['Backpack', 'Bag of Holding', 'Pouch', 'Chest', 'Sack', 'Quiver'].includes(def.name)) {
        containerMap[inv.id] = def.name;
      }
    });

    data.inventory.forEach(inv => {
      const def = inv.definition || {};
      let assignedContainer = (inv.containerEntityId && containerMap[inv.containerEntityId]) ? containerMap[inv.containerEntityId] : (inv.equipped ? 'Equipped' : 'On Person');
      let rarityRaw = (def.rarity || 'common').toLowerCase().replace(/\s+/g, '-');
      let maxUses = inv.limitedUse?.maxUses || inv.uses?.max || 0;

      inventoryItems.push({
        id: 'dndb_inv_' + inv.id,
        name: def.name || inv.name || 'Unknown Item',
        qty: inv.quantity || 1,
        weight: def.weight || 0,
        type: def.filterType || def.type || 'GEAR',
        rarity: rarityRaw,
        equipped: Boolean(inv.equipped),
        container: assignedContainer,
        dice: def.damage ? def.damage.diceString : '',
        attunable: Boolean(def.isAttunementRequired),
        attuned: Boolean(inv.isAttuned),
        notes: def.description || '',
        maxUses: maxUses,
        currentUses: inv.limitedUse?.numberUsed || inv.uses?.value || 0,
        rechargeTrigger: inv.limitedUse?.resetType === 1 ? 'short_rest' : 'long_rest',
        isParty: false
      });
    });
  }
  window.state.inventory = inventoryItems;

  if (data.currencies) {
    const c = data.currencies;
    if (document.getElementById('coin-cp')) document.getElementById('coin-cp').value = c.cp || 0;
    if (document.getElementById('coin-sp')) document.getElementById('coin-sp').value = c.sp || 0;
    if (document.getElementById('coin-ep')) document.getElementById('coin-ep').value = c.ep || 0;
    if (document.getElementById('coin-gp')) document.getElementById('coin-gp').value = c.gp || 0;
    if (document.getElementById('coin-pp')) document.getElementById('coin-pp').value = c.pp || 0;
  }

  // 7. Features Parsing
  let featList = [];
  const pushFeat = (srcArray) => {
    if (srcArray && Array.isArray(srcArray)) {
      srcArray.forEach(item => {
        const def = item.definition || {};
        if (def.name) {
          let maxUses = item.limitedUse?.maxUses || item.uses?.max || def.limitedUse?.maxUses || 0;
          let used = item.limitedUse?.numberUsed || item.uses?.value || 0;

          featList.push({
            id: 'dndb_feat_' + (def.id || Math.random()),
            name: def.name,
            desc: def.description || '',
            currentUses: used,
            maxUses: maxUses,
            rechargeTrigger: item.limitedUse?.resetType === 1 ? 'short_rest' : 'long_rest'
          });
        }
      });
    }
  };

  pushFeat(data.race?.racialTraits);
  pushFeat(data.feats);
  if (data.classes) data.classes.forEach(c => pushFeat(c.classFeatures?.filter(cf => cf.requiredLevel <= totalLevel)));
  window.state.features = featList;

  // 7.7 Spell List & Caster Classes Extraction
  window.state.classes = [];
  if (data.classes && Array.isArray(data.classes)) {
    data.classes.forEach(c => {
      if (c.definition?.name) {
        window.state.classes.push({
          name: c.definition.name,
          level: c.level || 1
        });
      }
    });
  }

  let parsedSpells = [];

  const parseSpellMechanics = (def) => {
      const rawDesc = (def.snippet || def.description || '');
      
      let saveStat = null;
      if (def.requiresSavingThrow && def.saveDcStat) {
          const statKeys = {1:'STR', 2:'DEX', 3:'CON', 4:'INT', 5:'WIS', 6:'CHA'};
          saveStat = statKeys[def.saveDcStat];
      }
      if (!saveStat) {
          const saveMatch = rawDesc.match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+(?:saving throw|save)/i);
          if (saveMatch) saveStat = saveMatch[1].substring(0, 3).toUpperCase();
      }

      let isAttack = Boolean(def.requiresAttackRoll) || /spell attack/i.test(rawDesc);

      let dice = def.damage?.diceString || '';
      if (!dice) {
         const diceMatch = rawDesc.match(/(\d+d\d+)/i);
         if (diceMatch) dice = diceMatch[1];
      }

      return { 
          saveStat, 
          isAttack, 
          dice, 
          cleanDesc: rawDesc.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim() 
      };
  };

  const extractSpellsFromGroup = (spellGroup, defaultSource = 'Class') => {
    if (spellGroup && Array.isArray(spellGroup)) {
      spellGroup.forEach(s => {
        const def = s.definition || s;
        if (def.name) {
          let clsName = s.componentId ? defaultSource : (def.class ? def.class : 'Class');
          const mechanics = parseSpellMechanics(def);
          
          parsedSpells.push({
            id: 'sp_' + (s.id || Math.random()),
            name: def.name,
            level: def.level !== undefined ? def.level : 0,
            school: def.school || '',
            castingTime: def.activation?.activationType === 1 ? '1 Action' : (def.activation?.activationType === 3 ? '1 Bonus Action' : 'Special'),
            desc: mechanics.cleanDesc,
            dice: mechanics.dice,
            attack: mechanics.isAttack,
            save: mechanics.saveStat,
            casterClass: clsName,
            isPact: Boolean(s.isPact || def.isPact)
          });
        }
      });
    }
  };

  if (data.spells) {
    if (Array.isArray(data.spells)) {
      extractSpellsFromGroup(data.spells);
    } else if (typeof data.spells === 'object') {
      if (data.spells.class) extractSpellsFromGroup(data.spells.class, 'Class');
      if (data.spells.race) extractSpellsFromGroup(data.spells.race, 'Racial');
      if (data.spells.feat) extractSpellsFromGroup(data.spells.feat, 'Feat');
      if (data.spells.item) extractSpellsFromGroup(data.spells.item, 'Item');
    }
  }

  if (data.classSpells && Array.isArray(data.classSpells)) {
    data.classSpells.forEach(cs => {
      const clsName = data.classes?.find(c => c.id === cs.characterClassId)?.definition?.name;
      if (clsName && cs.spells && Array.isArray(cs.spells)) {
        cs.spells.forEach(s => {
          const def = s.definition || s;
          if (def.name) {
            const mechanics = parseSpellMechanics(def);
            parsedSpells.push({
              id: 'sp_' + (s.id || Math.random()),
              name: def.name,
              level: def.level !== undefined ? def.level : 0,
              school: def.school || '',
              castingTime: '1 Action',
              desc: mechanics.cleanDesc,
              dice: mechanics.dice,
              attack: mechanics.isAttack,
              save: mechanics.saveStat,
              casterClass: clsName,
              isPact: Boolean(s.isPact)
            });
          }
        });
      }
    });
  }

  window.state.spells = parsedSpells;

  // --------------------------------------------------------------------------
  // 7.8 BYPASS D&D BEYOND'S API: CALC MULTICLASS SPELL SLOTS
  // --------------------------------------------------------------------------
  let casterLevel = 0;
  let warlockLevel = 0;

  if (data.classes && Array.isArray(data.classes)) {
    data.classes.forEach(c => {
      const clsName = (c.definition?.name || '').toLowerCase();
      const clsLevel = c.level || 1;
      const subName = (c.subclassDefinition?.name || '').toLowerCase();

      if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(clsName)) {
        casterLevel += clsLevel;
      } else if (['paladin', 'ranger'].includes(clsName)) {
        casterLevel += Math.floor(clsLevel / 2);
      } else if (clsName === 'artificer') {
        casterLevel += Math.ceil(clsLevel / 2);
      } else if (clsName === 'warlock') {
        warlockLevel += clsLevel;
      }
      
      if (['eldritch knight', 'arcane trickster'].includes(subName)) {
        casterLevel += Math.floor(clsLevel / 3);
      }
    });
  }

  const spellSlotMatrix = [
    [], // 0
    [2], // 1
    [3], // 2
    [4, 2], // 3
    [4, 3], // 4
    [4, 3, 2], // 5
    [4, 3, 3], // 6
    [4, 3, 3, 1], // 7
    [4, 3, 3, 2], // 8
    [4, 3, 3, 3, 1], // 9
    [4, 3, 3, 3, 2], // 10
    [4, 3, 3, 3, 2, 1], // 11
    [4, 3, 3, 3, 2, 1], // 12
    [4, 3, 3, 3, 2, 1, 1], // 13
    [4, 3, 3, 3, 2, 1, 1], // 14
    [4, 3, 3, 3, 2, 1, 1, 1], // 15
    [4, 3, 3, 3, 2, 1, 1, 1], // 16
    [4, 3, 3, 3, 2, 1, 1, 1, 1], // 17
    [4, 3, 3, 3, 3, 1, 1, 1, 1], // 18
    [4, 3, 3, 3, 3, 2, 1, 1, 1], // 19
    [4, 3, 3, 3, 3, 2, 2, 1, 1]  // 20
  ];

  let extractedSlots = {};
  const safeLevel = Math.min(20, Math.max(0, casterLevel));
  const slotsForLevel = spellSlotMatrix[safeLevel] || [];

  // Generate standard slots based on level
  slotsForLevel.forEach((maxSlots, index) => {
    const spellLevel = index + 1;
    extractedSlots[spellLevel] = { max: maxSlots, used: 0 };
  });

  // Calculate Warlock Pact Magic slots
  const pactMatrix = [
    { level: 0, max: 0 }, { level: 1, max: 1 }, { level: 1, max: 2 }, { level: 2, max: 2 }, { level: 2, max: 2 },
    { level: 3, max: 2 }, { level: 3, max: 2 }, { level: 4, max: 2 }, { level: 4, max: 2 }, { level: 5, max: 2 },
    { level: 5, max: 2 }, { level: 5, max: 3 }, { level: 5, max: 3 }, { level: 5, max: 3 }, { level: 5, max: 3 },
    { level: 5, max: 3 }, { level: 5, max: 3 }, { level: 5, max: 4 }, { level: 5, max: 4 }, { level: 5, max: 4 },
    { level: 5, max: 4 }
  ];
  
  const safeWarlock = Math.min(20, Math.max(0, warlockLevel));
  const pactData = pactMatrix[safeWarlock];
  if (pactData && pactData.max > 0) {
      extractedSlots['Pact'] = { max: pactData.max, used: 0, level: pactData.level };
  }

  // Attempt to map any used slots sent via DDB API to our calculated slots
  if (data.spellSlots && Array.isArray(data.spellSlots)) {
      data.spellSlots.forEach(slot => {
          if (extractedSlots[slot.level]) {
              extractedSlots[slot.level].used = slot.used || 0;
          }
      });
  }
  if (data.pactMagic && Array.isArray(data.pactMagic)) {
      data.pactMagic.forEach(slot => {
           if (extractedSlots['Pact']) {
               extractedSlots['Pact'].used = slot.used || 0;
           }
      });
  }

  window.state.spellSlots = extractedSlots;
  // --------------------------------------------------------------------------

  const casterClasses = ['bard', 'wizard', 'sorcerer', 'cleric', 'druid', 'paladin', 'ranger', 'warlock', 'artificer'];
  const isCaster = data.classes?.some(c => casterClasses.includes((c.definition?.name || '').toLowerCase())) || parsedSpells.length > 0;

  const spellsNubbin = document.getElementById('nub-spells');
  if (spellsNubbin) {
    spellsNubbin.style.display = isCaster ? 'flex' : 'none';
  }

  // 8. Render Triggers
  if (typeof renderAbilityScores === 'function') renderAbilityScores();
  if (typeof renderSavingThrows === 'function') renderSavingThrows();
  if (typeof renderSkills === 'function') renderSkills();
  if (typeof updateHPDisplay === 'function') updateHPDisplay();
  if (typeof renderFeatures === 'function') renderFeatures();
  if (typeof renderInventory === 'function') renderInventory();
  if (typeof window.renderActions === 'function') window.renderActions();
  if (typeof window.renderResourcePools === 'function') window.renderResourcePools();
  if (typeof renderSpellbook === 'function') renderSpellbook();

  alertModal(`Imported "${charName}" (${classLevelStr}) successfully!`, "Import Complete");
}

window.promptDnDBeyondURLImport = promptDnDBeyondURLImport;
window.enableManualEntry = enableManualEntry;