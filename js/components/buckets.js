/* ==========================================================================
   NOMICON BUCKET INVOCATION & THOUGHT-SCROLL HANDLER (js/components/buckets.js)
   ========================================================================== */

import { alertModal } from '../core/modalEngine.js';

// Initialize buckets array in global state if it doesn't exist
if (!window.state) window.state = {};
if (!window.state.nomiconBuckets) window.state.nomiconBuckets = [];

/**
 * Trigger the hidden file input to select a .thought.json file
 */
export function promptThoughtScrollImport() {
  const fileInput = document.getElementById('bucketFileInput');
  if (fileInput) {
    fileInput.click();
  }
}

/**
 * Handle the file selection and parse the JSON payload
 */
export function handleThoughtScrollUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const payload = JSON.parse(e.target.result);
      
      // Basic Schema Validation
      if (!payload.id || !payload.name) {
        throw new Error("Invalid Thought-Scroll Schema: Missing 'id' or 'name'.");
      }

      // Check for duplicates
      const exists = window.state.nomiconBuckets.some(b => b.id === payload.id);
      if (exists) {
        alertModal(`The thought-scroll "${payload.name}" is already bound to this codex.`, 'Invocation Failed');
        return;
      }

      // Store in active memory state
      window.state.nomiconBuckets.push({
        id: payload.id,
        name: payload.name,
        type: payload.type || 'Homebrew Module',
        desc: payload.desc || 'Custom mechanics and lore definitions.',
        data: payload,
        timestamp: new Date().toISOString()
      });

      console.log(`[Nomicon] Successfully ingested: ${payload.name}`);
      
      // Trigger UI update & force an autosave flush
      renderDynamicBuckets();
      if (typeof window.saveToLocalStorage === 'function') window.saveToLocalStorage();

      alertModal(`Thought-Scroll "${payload.name}" successfully integrated into the Nomicon!`, 'Invocation Complete');

    } catch (err) {
      console.error(err);
      alertModal('Failed to read Thought-Scroll. Ensure it is a valid .json / .thought.json file.', 'Parsing Error');
    }
    
    // Reset input so the same file can be uploaded again if deleted
    event.target.value = '';
  };
  reader.readAsText(file);
}

/**
 * Render dynamic ingested buckets into the Nomicon UI (#bucketsListZone)
 */
export function renderDynamicBuckets() {
  const zone = document.getElementById('bucketsListZone');
  if (!zone) return;

  const buckets = window.state.nomiconBuckets || [];

  if (buckets.length === 0) {
    zone.innerHTML = `
      <div style="text-align:center; padding:1.5rem; border:1px dashed var(--border-color); border-radius:8px; margin-top:1rem;">
        <p style="font-size:0.8rem; color:var(--text-muted);">No custom Thought-Scrolls currently active.</p>
        <button class="secondary-btn" style="margin-top:0.6rem; font-size:0.75rem; padding:0.3rem 0.6rem;" onclick="promptThoughtScrollImport()">+ Import .thought.json</button>
      </div>
    `;
    return;
  }

  // Header and Import Button
  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem; margin-bottom:0.8rem;">
      <h4 style="font-size:0.8rem; color:var(--accent-color); text-transform:uppercase; margin:0;">Injected Modules</h4>
      <button class="secondary-btn" style="font-size:0.65rem; padding:0.2rem 0.5rem;" onclick="promptThoughtScrollImport()">+ Import</button>
    </div>
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
  `;

  // Render each bucket as a card
  buckets.forEach((bucket, index) => {
    html += `
      <div class="card" style="margin:0; background:var(--bg-primary); border-left:4px solid var(--accent-color); padding:0.8rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <strong style="color:var(--text-main); display:block;">${bucket.name}</strong>
            <span style="font-size:0.6rem; color:var(--accent-color); text-transform:uppercase; font-weight:bold;">${bucket.type}</span>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem; line-height:1.3;">${bucket.desc}</p>
          </div>
          <div style="display:flex; gap:0.4rem;">
            <button class="secondary-btn" style="font-size:0.65rem; padding:0.2rem 0.5rem; color:var(--debuff-color, #ef4444); border-color:var(--debuff-color, #ef4444);" onclick="removeThoughtScroll(${index})">Sever</button>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  zone.innerHTML = html;
}

/**
 * Remove an injected thought-scroll from memory
 */
export function removeThoughtScroll(index) {
  if (!window.state.nomiconBuckets) return;
  const bucketName = window.state.nomiconBuckets[index].name;
  
  if (confirm(`Sever the connection to "${bucketName}"? Custom mechanics will be removed from memory.`)) {
    window.state.nomiconBuckets.splice(index, 1);
    renderDynamicBuckets();
    if (typeof window.saveToLocalStorage === 'function') window.saveToLocalStorage();
  }
}

/**
 * Keep the original static bucket loader for the core modules
 */
export function loadBucket(bucketType) {
  console.log(`[Nomicon] Invoking ${bucketType} thought-scroll...`);
  const badge = document.getElementById('autosaveBadge');
  if (badge) {
    badge.innerText = `🟢 ${bucketType.toUpperCase()} Active`;
    badge.style.opacity = '1';
  }
}

// Attach event listener to hidden file input on load
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('bucketFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleThoughtScrollUpload);
  }
  renderDynamicBuckets(); // Initial render check
});

// Global Bindings
window.loadBucket = loadBucket;
window.promptThoughtScrollImport = promptThoughtScrollImport;
window.handleThoughtScrollUpload = handleThoughtScrollUpload;
window.removeThoughtScroll = removeThoughtScroll;
window.renderDynamicBuckets = renderDynamicBuckets;