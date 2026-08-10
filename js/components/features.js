/* ==========================================================================
   DYNAMIC CLASS & RACIAL FEATURES RENDERER
   ========================================================================== */

import { openModal } from '../core/modalEngine.js';

export function promptAddFeature() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:0.6rem;" data-dashlane-disabled="true">
      <div>
        <label style="font-size:0.8rem; color:var(--text-muted);">Trait / Feature Name:</label>
        <input type="text" id="featNameInput" placeholder="e.g. Action Surge, Second Wind, Darkvision" autocomplete="off" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
      </div>

      <!-- USES & RECHARGE ROW -->
      <div style="display:flex; gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.4rem; border-radius:6px; border:1px solid rgba(255,255,255,0.05);">
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--accent-color); font-weight:bold;">Max Uses (0 = Passive):</label>
          <input type="number" id="featMaxUsesInput" value="0" min="0" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);" />
        </div>
        <div style="flex:1;">
          <label style="font-size:0.8rem; color:var(--accent-color); font-weight:bold;">Recharge Trigger:</label>
          <select id="featRechargeTriggerInput" style="width:100%; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
            <option value="short_rest">☕ Short Rest</option>
            <option value="long_rest">⛺ Long Rest</option>
            <option value="dawn">🌅 Dawn</option>
            <option value="noon">☀️ Noon</option>
            <option value="dusk">dusk</option>
            <option value="midnight">🌙 Midnight</option>
            <option value="specific">↻ Specific / GM</option>
          </select>
        </div>
      </div>

      <div>
        <label style="font-size:0.8rem; color:var(--text-muted);">Feature Description & Rules:</label>
        <textarea id="featDescInput" placeholder="Describe mechanical benefits..." style="width:100%; height:80px; padding:0.4rem; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main); font-size:0.75rem;"></textarea>
      </div>
    </div>
  `;

  openModal('Add Class or Racial Trait', html, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { label: 'Add Trait', class: '', onclick: () => {
        const name = document.getElementById('featNameInput')?.value.trim();
        const maxUses = parseInt(document.getElementById('featMaxUsesInput')?.value) || 0;
        const rechargeTrigger = document.getElementById('featRechargeTriggerInput')?.value || 'long_rest';
        const desc = document.getElementById('featDescInput')?.value.trim() || '';

        if (name) {
          if (!window.state) window.state = {};
          if (!window.state.features) window.state.features = [];
          window.state.features.push({
            id: 'feat_' + Date.now(),
            name,
            maxUses,
            currentUses: 0,
            rechargeTrigger,
            desc
          });
          renderFeatures();
        }
        closeModal(true);
      } 
    }
  ]);
}

export function toggleFeatureUse(id, newUses) {
  const feat = window.state?.features?.find(f => f.id === id);
  if (feat) {
    feat.currentUses = newUses;
    renderFeatures();
  }
}

export function deleteFeature(id) {
  if (window.state?.features) {
    window.state.features = window.state.features.filter(f => f.id !== id);
    renderFeatures();
  }
}

function sanitizeText(htmlStr) {
  if (!htmlStr) return '';
  return htmlStr.replace(/<hr\s*\/?>/gi, '').replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim();
}

export function renderFeatures() {
  const container = document.getElementById('featuresListZone');
  if (!container) return;

  const features = window.state?.features || [];
  container.innerHTML = '';

  if (features.length === 0) {
    container.innerHTML = `<p style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding: 1rem 0;">No features or traits recorded. Click '+ Add Trait' to create one.</p>`;
    return;
  }

  features.forEach(feat => {
    const card = document.createElement('div');
    const isDepleted = feat.maxUses > 0 && (feat.currentUses || 0) >= feat.maxUses;

    card.className = `panel-card ${isDepleted ? 'depleted' : ''}`;
    card.style.marginBottom = '0.35rem';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '0.3rem';
    card.style.padding = '0.55rem 0.8rem';

    // Bubble Tracker & Badge
    let usesHTML = '';
    if (feat.maxUses > 0) {
      let bubbles = '';
      const curr = feat.currentUses || 0;
      for (let i = 1; i <= feat.maxUses; i++) {
        let filled = (i <= curr) ? 'filled' : '';
        bubbles += `<div class="use-bubble ${filled}" onclick="toggleFeatureUse('${feat.id}', ${i === curr ? i - 1 : i})"></div>`;
      }

      let rText = feat.rechargeTrigger ? feat.rechargeTrigger.replace('_', ' ') : 'rest';
      let rIcon = '☕';
      if (feat.rechargeTrigger === 'dawn') rIcon = '🌅';
      else if (feat.rechargeTrigger === 'noon') rIcon = '☀️';
      else if (feat.rechargeTrigger === 'dusk') rIcon = '🌇';
      else if (feat.rechargeTrigger === 'midnight') rIcon = '🌙';
      else if (feat.rechargeTrigger === 'long_rest') rIcon = '⛺';
      else if (feat.rechargeTrigger === 'specific') rIcon = '↻';

      const tagClass = isDepleted ? 'recharge-badge depleted-badge' : 'recharge-badge';
      const tagLabel = isDepleted ? `🔒 LOCKOUT (${rText})` : `${rIcon} ${feat.maxUses - curr}/${feat.maxUses} USES`;

      usesHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.25rem;">
          <span class="${tagClass}">${tagLabel}</span>
          <div class="uses-tracker-group" style="margin:0;">${bubbles}</div>
        </div>
      `;
    }

    const cleanDesc = sanitizeText(feat.desc);

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; min-height:28px;">
        <div style="flex:1; padding-right:0.8rem;">
          <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
            <strong style="font-size:0.85rem; color:var(--text-main); ${isDepleted ? 'text-decoration: line-through;' : ''}">${feat.name}</strong>
          </div>
          ${usesHTML}
        </div>
        <div style="display:flex; align-items:center; gap:0.4rem; flex-shrink:0;">
          <button class="item-action-btn delete-btn" style="height:26px; max-height:26px; width:26px; padding:0; display:inline-flex; align-items:center; justify-content:center; line-height:1;" title="Delete Feature" onclick="deleteFeature('${feat.id}')">✕</button>
        </div>
      </div>
      ${cleanDesc ? `<p style="font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem; line-height:1.3; border-top:1px dashed var(--border-color); padding-top:0.25rem;">${cleanDesc}</p>` : ''}
    `;

    container.appendChild(card);
  });
}

// Global Exports
window.renderFeatures = renderFeatures;
window.promptAddFeature = promptAddFeature;
window.toggleFeatureUse = toggleFeatureUse;
window.deleteFeature = deleteFeature;