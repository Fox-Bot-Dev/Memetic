/* ==========================================================================
   DYNAMIC SKILLS & SAVING THROWS RENDERER
   ========================================================================== */

import { rawScores } from './state.js';
import { openModal, closeModal } from './modalEngine.js';

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

export function toggleStatDisplayFormat() {
  isModifierView = !isModifierView;
  renderAbilityScores();
}

export function promptAddSkill() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:0.6rem;">
      <label style="font-size:0.8rem; color:var(--text-muted);">Skill Name:</label>
      <input type="text" id="customSkillName" placeholder="e.g. Vehicles (Land)" style="width:100%; padding:0.4rem;" />
      <label style="font-size:0.8rem; color:var(--text-muted);">Governing Attribute:</label>
      <select id="customSkillStat" style="width:100%; padding:0.4rem; background:var(--bg-secondary); color:var(--text-main);">
        <option value="STR">STR</option><option value="DEX">DEX</option><option value="CON">CON</option>
        <option value="INT">INT</option><option value="WIS">WIS</option><option value="CHA">CHA</option>
      </select>
    </div>
  `;
  openModal('Add Custom Skill', html, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: 'Add Skill', class: '', onclick: () => {
        const name = document.getElementById('customSkillName')?.value.trim();
        const stat = document.getElementById('customSkillStat')?.value;
        if (name) {
          skillDataList.push({ id: name.toLowerCase().replace(/\s+/g, '-'), name, stat });
          renderSkills();
        }
        closeModal(true);
      } 
    }
  ]);
}

export function setSkillSort(type) {
  currentSkillSort = type;
  document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
  const targetBtn = document.getElementById(`sort-${type}`);
  if (targetBtn) targetBtn.classList.add('active');
  renderSkills();
}

export function renderAbilityScores() {
  const totalLevel = window.state?.level || 1;
  const profBonus = Math.ceil(1 + (totalLevel / 4));
  const saveProfs = window.state?.saveProfs || [];

  // 1. Core Ability Scores (Styled with .pill-card)
  const scoresContainer = document.getElementById('abilityScoresRow');
  if (scoresContainer) {
    scoresContainer.innerHTML = '';
    statCodes.forEach(stat => {
      let score = rawScores[stat] || 10;
      let mod = Math.floor((score - 10) / 2);
      let modStr = mod >= 0 ? `+${mod}` : mod;
      
      const div = document.createElement('div');
      div.className = 'pill-card';
      div.style.flex = '1';
      div.style.textAlign = 'center';

      let displayVal = isModifierView ? modStr : score;
      let subVal = isModifierView ? `(${score})` : modStr;

      div.innerHTML = `
        <div class="lbl">${stat}</div>
        <div class="val">${displayVal} <sup style="font-size:0.65rem; color:var(--accent-color);">${subVal}</sup></div>
      `;
      scoresContainer.appendChild(div);
    });
  }
  
  // 2. Saving Throws
  const savesContainer = document.getElementById('savingThrowsRow');
  if (savesContainer) {
    savesContainer.innerHTML = '';
    statCodes.forEach(stat => {
      let mod = Math.floor(((rawScores[stat] || 10) - 10) / 2);
      let isProf = saveProfs.includes(stat);
      let totalSave = mod + (isProf ? profBonus : 0);
      let saveStr = totalSave >= 0 ? `+${totalSave}` : totalSave;
      
      const div = document.createElement('div');
      div.className = 'pill-card';
      div.style.flex = '1';
      div.style.textAlign = 'center';
      div.innerHTML = `
        <div class="lbl" style="${isProf ? 'color:var(--accent-color); font-weight:bold;' : ''}">${stat} SAVE</div>
        <div class="val">${saveStr}</div>
      `;
      savesContainer.appendChild(div);
    });
  }

  renderSkills();
}

export function renderSkills() {
  const skillsContainer = document.getElementById('skillsList');
  if (!skillsContainer) return;
  
  skillsContainer.innerHTML = '';
  const totalLevel = window.state?.level || 1;
  const profBonus = Math.ceil(1 + (totalLevel / 4));
  const profs = window.state?.skillProfs || [];
  const exp = window.state?.skillExpertise || [];
  
  let processedSkills = skillDataList.map(skill => {
    let statMod = Math.floor(((rawScores[skill.stat] || 10) - 10) / 2);
    let isProf = profs.includes(skill.id);
    let isExp = exp.includes(skill.id);
    let total = statMod + (isProf ? profBonus : 0) + (isExp ? profBonus : 0);
    return { ...skill, total, isProf, isExp };
  });

  if (currentSkillSort === 'alpha') processedSkills.sort((a, b) => a.name.localeCompare(b.name));
  else if (currentSkillSort === 'mod') processedSkills.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  else if (currentSkillSort === 'prof') processedSkills.sort((a, b) => (b.isExp ? 2 : (b.isProf ? 1 : 0)) - (a.isExp ? 2 : (a.isProf ? 1 : 0)) || a.name.localeCompare(b.name));

  processedSkills.forEach(skill => {
    let totalStr = skill.total >= 0 ? `+${skill.total}` : skill.total;
    let pipColor = skill.isExp ? 'var(--accent-gold)' : (skill.isProf ? 'var(--accent-color)' : 'transparent');
    let borderStyle = (skill.isProf || skill.isExp) ? `border: 1px solid ${pipColor};` : 'border: 1px solid var(--border-color);';
    
    const el = document.createElement('div');
    el.style.display = 'flex';
    el.style.justifyContent = 'space-between';
    el.style.alignItems = 'center';
    el.style.padding = '0.35rem 0.5rem';
    el.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    el.style.cursor = 'pointer';
    
    el.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.4rem;">
        <div style="width:10px; height:10px; border-radius:50%; ${borderStyle} background-color:${pipColor};"></div>
        <span style="font-size:0.8rem; color:var(--text-main);">${skill.name} <small style="color:var(--text-muted);">(${skill.stat})</small></span>
      </div>
      <strong style="color:var(--accent-color); font-size:0.9rem;">${totalStr}</strong>
    `;
    skillsContainer.appendChild(el);
  });
}