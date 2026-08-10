/* ==========================================================================
   MEMETIC SEQUENCE ENGINE & OVERDRIVE RECOVERY
   ========================================================================== */

import { openModal } from '../core/modalEngine.js';

let sequenceClicks = 0;

export function initCoreSequence() {
  const bannerEl = document.querySelector('.memetic-tag') || document.querySelector('.memetic-banner');

  if (bannerEl) {
    bannerEl.style.cursor = 'pointer';
    bannerEl.addEventListener('click', () => {
      sequenceClicks++;
      if (sequenceClicks === 6) {
        sequenceClicks = 0;
        verifyAccessKey();
      }
    });
  }
}

function verifyAccessKey() {
  const modalBodyHTML = `
    <div style="display:flex; flex-direction:column; gap:0.8rem; text-align:center; padding: 0.5rem 0;" data-dashlane-disabled="true">
      <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
        CODEX RECOVERY: ENTER OVERRIDE AUTHORIZATION KEY
      </p>
      <input 
        type="search" 
        id="terminalOverrideKey" 
        name="terminal_override_key_no_fill" 
        placeholder="MM/DD/YYYY" 
        autocomplete="off" 
        autocorrect="off" 
        spellcheck="false" 
        data-dashlane-disabled="true" 
        data-1p-ignore="true" 
        data-lpignore="true" 
        style="width:100%; text-align:center; font-family:'Courier New', monospace; font-size:1rem; padding:0.5rem; letter-spacing:1px;" 
        autofocus 
      />
    </div>
  `;

  openModal('Black Wall: Terminal Accessed', modalBodyHTML, [
    { label: 'Cancel', class: 'secondary-btn', onclick: () => closeModal(false) },
    { 
      label: 'Execute', 
      class: '', 
      onclick: () => {
        const keyInput = document.getElementById('terminalOverrideKey')?.value.trim();
        closeModal(true);

        if (keyInput === "12/10/1993" || keyInput === "1993-12-10") {
          triggerStateShift();
        } else if (keyInput) {
          console.warn("AUTHORIZATION DENIED: INVALID OVERRIDE KEY");
          alertModal("AUTHORIZATION DENIED: INVALID OVERRIDE KEY", "Terminal Error");
        }
      } 
    }
  ]);

  setTimeout(() => {
    const inputEl = document.getElementById('terminalOverrideKey');
    if (inputEl) {
      inputEl.focus();
      inputEl.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          const btn = document.querySelector('#customModalOverlay .modal-footer button:not(.secondary-btn)');
          if (btn) btn.click();
        }
      });
    }
  }, 100);
}

export function triggerStateShift() {
  const body = document.body;
  
  body.classList.add('glitch-transition');
  body.classList.add('oramer-k-canrac');
  localStorage.setItem('memetic-theme', 'oramer-k-canrac');
  
  setTimeout(() => {
    body.classList.remove('glitch-transition');
  }, 350);
}

// Rest Shockwave Visual Handler
export function triggerRestShockwave(event) {
  if (!document.body.classList.contains('oramer-k-canrac') || !event) return;

  const btn = event.currentTarget || event.target;
  if (!btn) return;

  const ripple = document.createElement('div');
  ripple.className = 'pulse-ripple';
  
  const rect = btn.getBoundingClientRect();
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  
  btn.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

// Global Bindings
window.initCoreSequence = initCoreSequence;
window.triggerRestShockwave = triggerRestShockwave;
window.triggerStateShift = triggerStateShift;