/* ==========================================================================
   FEATURES & TRAITS RENDERER
   ========================================================================== */

import { openModal, closeModal } from './modalEngine.js';

export function promptAddFeature() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:0.6rem;">
      <label style="font-size:0.8rem; color:var(--text-muted);">Feature Title:</label>
      <input type="text" id="featTitleInput" placeholder="e.g. Action Surge, Darkvision" style="width:100%; padding:0.4rem;" />
      <label style="font-size:0.8rem; color:var(--text-muted);">Description:</label>
      <textarea id="featDescInput" style="width:100%; height:80px; padding:0.4rem;"></textarea>
    </div>
  `;
  openModal('Add Trait or Feature', html, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: 'Add Feature', class: '', onclick: () => {
        const name = document.getElementById('featTitleInput')?.value.trim();
        const desc = document.getElementById('featDescInput')?.value.trim();
        if (name) {
          if (!window.state) window.state = {};
          if (!window.state.features) window.state.features = [];
          window.state.features.push({ id: 'custom_' + Date.now(), name, desc, currentUses: 0, maxUses: 0 });
          renderFeatures();
        }
        closeModal(true);
      } 
    }
  ]);
}

export function adjustFeatureUses(index, delta) {
  if (window.state?.features && window.state.features[index]) {
    const feat = window.state.features[index];
    feat.currentUses = Math.max(0, Math.min(feat.maxUses, feat.currentUses + delta));
    renderFeatures();
  }
}

window.adjustFeatureUses = adjustFeatureUses;

export function renderFeatures() {
  const container = document.getElementById('featuresListZone');
  if (!container) return;
  
  container.innerHTML = '';
  const features = window.state?.features || [];
  
  if (features.length === 0) {
    container.innerHTML = `<p style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding: 1rem 0;">No features available. Import or click '+ Add Trait'.</p>`;
    return;
  }
  
  features.forEach((feat, idx) => {
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.style.marginBottom = '0.4rem';
    card.style.display = 'flex';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'flex-start';

    let usesHTML = '';
    if (feat.maxUses > 0) {
      usesHTML = `
        <div style="display:flex; align-items:center; gap:0.4rem; flex-shrink:0; margin-left:1rem;">
          <span style="font-size:0.7rem; color:var(--text-muted);">Uses:</span>
          <div style="display:flex; align-items:center; background:rgba(0,0,0,0.2); border-radius:4px; padding:0.1rem 0.3rem; border:1px solid var(--border-color);">
            <button class="secondary-btn" style="padding:0.1rem 0.3rem; font-size:0.65rem;" onclick="adjustFeatureUses(${idx}, -1)">-</button>
            <strong style="font-size:0.8rem; margin:0 0.4rem; color:var(--accent-color);">${feat.currentUses} / ${feat.maxUses}</strong>
            <button class="secondary-btn" style="padding:0.1rem 0.3rem; font-size:0.65rem;" onclick="adjustFeatureUses(${idx}, 1)">+</button>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div style="flex:1; padding-right: 0.5rem;">
        <strong style="font-size:0.85rem; display:block; color:var(--text-main);">${feat.name}</strong>
        <p style="font-size:0.75rem; color:var(--text-muted); margin:0.3rem 0 0 0; line-height: 1.3;">${feat.desc}</p>
      </div>
      ${usesHTML}
    `;
    container.appendChild(card);
  });
}