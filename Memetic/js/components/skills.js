/* ==========================================================================
   DYNAMIC SKILLS & SAVING THROWS RENDERER
   ========================================================================== */

import { rawScores } from '../Core/state.js';

let currentSkillSort = 'alpha';
let isModifierView = false;

const skillDataList = [
  { id: 'acrobatics', name: 'Acrobatics', stat: 'DEX' },
  { id: 'animal-handling', name: 'Animal Handling', stat: 'WIS' },
  { id: 'arcana', name: 'Arcana', stat: 'INT' },
  { id: 'athletics', name: 'Athletics', stat: 'STR' },
  { id: 'deception', name: 'Deception', stat: 'CHA' },
  { id: 'history', name: 'History', stat: 'INT' },
  { id: 'insight', name: 'Insight', stat: 'WIS' },
  { id: 'intimidation', name: 'Intimidation', stat: 'CHA' },
  { id: 'investigation', name: 'Investigation', stat: 'INT' },
  { id: 'medicine', name: 'Medicine', stat: 'WIS' },
  { id: 'nature', name: 'Nature', stat: 'INT' },
  { id: 'perception', name: 'Perception', stat: 'WIS' },
  { id: 'performance', name: 'Performance', stat: 'CHA' },
  { id: 'persuasion', name: 'Persuasion', stat: 'CHA' },
  { id: 'religion', name: 'Religion', stat: 'INT' },
  { id: 'sleight-of-hand', name: 'Sleight of Hand', stat: 'DEX' },
  { id: 'stealth', name: 'Stealth', stat: 'DEX' },
  { id: 'survival', name: 'Survival', stat: 'WIS' }
];

const statCodes = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

function getStatMod(val) {
  return Math.floor(((val || 10) - 10) / 2);
}

/**
 * Main Skills Render Execution (Live Stat & Proficiency Calculation)
 */
export function renderSkills() {
  const container = document.getElementById('skillsListContainer');
  if (!container) return;

  // 1. Ensure skills array exists
  if (!window.state) window.state = {};
  if (!window.state.skills || !Array.isArray(window.state.skills) || window.state.skills.length === 0) {
    window.state.skills = skillDataList.map(s => ({
      id: s.id,
      name: s.name,
      stat: s.stat,
      prof: 0
    }));
  }

  // 2. Sync Proficiencies from Importer State if available
  const profs = window.state.skillProfs || [];
  const exps = window.state.skillExpertise || [];
  if (profs.length > 0 || exps.length > 0) {
    window.state.skills.forEach(s => {
      const idClean = s.id.toLowerCase().replace(/[^a-z]/g, '');
      const hasExp = exps.some(e => e.toLowerCase().replace(/[^a-z]/g, '').includes(idClean));
      const hasProf = profs.some(p => p.toLowerCase().replace(/[^a-z]/g, '').includes(idClean));

      if (hasExp) s.prof = 2;
      else if (hasProf) s.prof = 1;
    });
  }

  // 3. Calculate Modifiers Live
  const scores = window.rawScores || { STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10 };
  const pb = window.characterPB || 3;

  const preparedList = window.state.skills.map(skill => {
    const statVal = scores[skill.stat] !== undefined ? scores[skill.stat] : 10;
    const statMod = Math.floor((statVal - 10) / 2);
    const profBonus = (skill.prof || 0) * pb;
    const calcMod = (skill.customMod !== undefined) ? skill.customMod : (statMod + profBonus);

    return {
      ...skill,
      calculatedMod: calcMod
    };
  });

  // 4. Sorting
  let list = [...preparedList];
  if (currentSkillSort === 'alpha') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSkillSort === 'mod') {
    list.sort((a, b) => b.calculatedMod - a.calculatedMod);
  } else if (currentSkillSort === 'prof') {
    list.sort((a, b) => (b.prof || 0) - (a.prof || 0));
  }

  // 5. Render HTML
  container.innerHTML = list.map(skill => {
    const profClass = skill.prof === 2 ? 'expertise' : skill.prof === 1 ? 'active' : '';
    const profIcon = skill.prof === 2 ? '⯁' : skill.prof === 1 ? '●' : '○';
    const modStr = skill.calculatedMod >= 0 ? `+${skill.calculatedMod}` : skill.calculatedMod;

    return `
      <div class="skill-row" 
           style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; font-size: 0.78rem; border-bottom: 1px solid rgba(255,255,255,0.08); cursor: pointer; min-height: 28px; width: 100%;" 
           onclick="rollSkill('${skill.name}', ${skill.calculatedMod})">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="skill-prof-icon ${profClass}" style="font-size: 0.75rem; color: var(--accent-color, #ffaa00);">${profIcon}</span>
          <strong style="color: var(--text-main, #ffffff); font-size: 0.78rem;">${skill.name}</strong>
          <small style="color: var(--text-muted, #a0a0b0); font-size: 0.65rem;">(${skill.stat})</small>
        </div>
        <strong style="color: var(--accent-color, #ffaa00); font-size: 0.8rem;">${modStr}</strong>
      </div>
    `;
  }).join('');

  const badge = document.getElementById('skillCountBadge');
  if (badge) badge.innerText = `(${list.length})`;
}

/**
 * Sort Button Handler
 */
export function setSkillSort(mode) {
  currentSkillSort = mode;
  ['Alpha', 'Mod', 'Prof'].forEach(m => {
    const btn = document.getElementById(`sortBtn${m}`);
    if (btn) {
      if (m.toLowerCase() === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
  renderSkills();
}

/**
 * Roll Skill Helper
 */
export function rollSkill(skillName, totalMod) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const modNum = parseInt(totalMod, 10) || 0;
  const total = d20 + modNum;
  const modStr = modNum >= 0 ? `+${modNum}` : `${modNum}`;

  const log = document.getElementById('diceLog');
  if (log) {
    let natClass = d20 === 20 ? 'color:var(--accent-color); font-weight:bold;' : d20 === 1 ? 'color:var(--debuff-color); font-weight:bold;' : '';
    log.innerHTML = `<span style="${natClass}">${skillName}</span>: Rolled <strong>${d20}</strong> (${modStr}) = <strong>${total}</strong>`;
  } else if (typeof alertModal === 'function') {
    alertModal(`${skillName} Roll: ${d20} (${modStr}) = ${total}`, 'Dice Roll Result');
  }
}

export function toggleStatDisplayFormat() {
  isModifierView = !isModifierView;
  renderAbilityScores();
}

/**
 * Render Saving Throws Row
 */
export function renderSavingThrows() {
  const container = document.getElementById('savingThrowsZone') || document.getElementById('savingThrowsRow');
  if (!container) return;

  const scores = window.rawScores || { STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10 };
  const pb = window.characterPB || Math.ceil(1 + ((window.state?.level || 1) / 4));
  const saveProfs = window.state?.saveProfs || [];

  container.innerHTML = statCodes.map(code => {
    const score = scores[code] !== undefined ? scores[code] : 10;
    const mod = getStatMod(score);
    const isProf = saveProfs.includes(code);
    const totalMod = mod + (isProf ? pb : 0);
    const modStr = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;
    const profIcon = isProf ? '●' : '○';

    return `
      <div class="pill-card save-card" 
           style="padding:0.35rem 0.5rem; display:flex; align-items:center; justify-content:space-between; cursor:pointer; min-width:85px;"
           onclick="rollSkill('${code} Save', ${totalMod})">
        <div style="display:flex; align-items:center; gap:4px;">
          <span style="color:var(--accent-color, #ffaa00); font-size:0.75rem;">${profIcon}</span>
          <span style="font-size:0.7rem; font-weight:bold; color:var(--text-muted);">${code}</span>
        </div>
        <strong style="font-size:0.85rem; color:var(--text-main);">${modStr}</strong>
      </div>
    `;
  }).join('');
}

/**
 * Render Ability Scores with High Stat Glow & Dump Stat Dim
 */
export function renderAbilityScores() {
  const row = document.getElementById('abilityScoresRow');
  if (!row) return;

  // 1. Calculate Highest & Lowest Scores across all stats
  let maxVal = -Infinity;
  let minVal = Infinity;

  statCodes.forEach(code => {
    const score = (rawScores && rawScores[code] !== undefined) ? rawScores[code] : 10;
    if (score > maxVal) maxVal = score;
    if (score < minVal) minVal = score;
  });

  // 2. Build Pill Cards
  row.innerHTML = statCodes.map(code => {
    const score = (rawScores && rawScores[code] !== undefined) ? rawScores[code] : 10;
    const mod = getStatMod(score);
    const modStr = mod >= 0 ? `+${mod}` : mod;

    const isHigh = (score === maxVal && maxVal > minVal);
    const isDump = (score === minVal && maxVal > minVal);

    let cardStyle = "padding:0.4rem; position:relative; transition:all 0.2s ease;";

    if (isHigh) {
      cardStyle += " border: 1.5px solid var(--accent-color, #ffaa00) !important; box-shadow: 0 0 12px rgba(255, 170, 0, 0.45) !important;";
    } else if (isDump) {
      cardStyle += " opacity: 0.55; filter: contrast(0.85);";
    }

    return `
      <div class="pill-card" style="${cardStyle}">
        <div class="lbl" style="font-size:0.65rem; color:var(--text-muted); font-weight:bold;">${code}</div>
        <div class="val" style="font-size:1rem; font-weight:bold; color:var(--text-main);">
          ${isModifierView ? modStr : score}
          <span style="font-size:0.7rem; color:var(--accent-color); margin-left:2px;">${isModifierView ? `(${score})` : modStr}</span>
        </div>
      </div>
    `;
  }).join('');

  renderSavingThrows();
}

export function promptAddSkill() {
  if (typeof window.openModal === 'function') {
    const html = `
      <div style="display:flex; flex-direction:column; gap:0.6rem;">
        <label>Skill Name:</label>
        <input type="text" id="customSkillName" placeholder="e.g. Cooking" />
        <label>Associated Stat:</label>
        <select id="customSkillStat">
          <option value="STR">STR</option>
          <option value="DEX">DEX</option>
          <option value="CON">CON</option>
          <option value="INT">INT</option>
          <option value="WIS">WIS</option>
          <option value="CHA">CHA</option>
        </select>
      </div>
    `;

    openModal('Add Custom Skill', html, [
      { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
      {
        label: 'Add Skill',
        class: '',
        onclick: () => {
          const name = document.getElementById('customSkillName')?.value.trim();
          const stat = document.getElementById('customSkillStat')?.value || 'STR';
          if (name) {
            const baseStatVal = (rawScores && rawScores[stat]) ? rawScores[stat] : 10;
            const mod = getStatMod(baseStatVal);
            window.state.skills.push({
              id: name.toLowerCase().replace(/\s+/g, '-'),
              name: name,
              stat: stat,
              prof: 0,
              mod: mod
            });
            renderSkills();
          }
          closeModal(true);
        }
      }
    ]);
  }
}

// BIND MODULE FUNCTIONS TO GLOBAL WINDOW SCOPE
window.renderSkills = renderSkills;
window.renderSavingThrows = renderSavingThrows;
window.setSkillSort = setSkillSort;
window.rollSkill = rollSkill;
window.promptAddSkill = promptAddSkill;
window.toggleStatDisplayFormat = toggleStatDisplayFormat;
window.renderAbilityScores = renderAbilityScores;

// AUTO-EXECUTE ON DOM READY
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderSkills();
    renderAbilityScores();
  });
} else {
  renderSkills();
  renderAbilityScores();
}

export function toggleDiceTray() {
  const drawer = document.getElementById('diceTrayDrawer');
  if (drawer) {
    const isHidden = drawer.style.display === 'none' || drawer.style.display === '';
    drawer.style.display = isHidden ? 'flex' : 'none';
  }
}

export function rollCustomDice(sides) {
  const qtyInput = document.getElementById('diceQtyInput');
  const modInput = document.getElementById('diceModInput');
  const qty = Math.max(1, parseInt(qtyInput?.value, 10) || 1);
  const mod = parseInt(modInput?.value, 10) || 0;

  let rolls = [];
  let total = 0;

  for (let i = 0; i < qty; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }

  total += mod;

  const modStr = mod > 0 ? ` + ${mod}` : mod < 0 ? ` - ${Math.abs(mod)}` : '';
  const rollListStr = rolls.length > 1 ? ` (${rolls.join(', ')})` : '';

  const log = document.getElementById('diceLog');
  if (log) {
    log.innerHTML = `<span style="color:var(--accent-color);">${qty}d${sides}${modStr}</span>: <strong>${total}</strong>${rollListStr}`;
  }
}

window.toggleDiceTray = toggleDiceTray;
window.rollCustomDice = rollCustomDice;