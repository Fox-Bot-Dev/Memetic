/* ==========================================================================
   MEMETIC ACCESSIBILITY SUITE & ARIA ENGINE
   ========================================================================== */

// --- 1. Screen Reader Live Announcer ---
export function announceToScreenReader(message) {
  // Bail out immediately if accessibility isn't explicitly active in your state
  if (!window.state || !window.state.accessibilityActive) return;

  const announcer = document.getElementById('srAnnouncer');
  if (announcer) {
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }
}

// --- 2. Font Scaling Engine ---
export function initFontScaling() {
  const fontSlider = document.getElementById('fontSizeSlider');
  const fontDisplay = document.getElementById('fontSizeDisplay');
  const savedFontSize = localStorage.getItem('memetic-font-size') || '15';

  if (fontSlider) {
    fontSlider.value = savedFontSize;
    document.documentElement.style.fontSize = `${savedFontSize}px`;
    if (fontDisplay) fontDisplay.innerText = `${savedFontSize}px`;

    fontSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      document.documentElement.style.fontSize = `${val}px`;
      if (fontDisplay) fontDisplay.innerText = `${val}px`;
      localStorage.setItem('memetic-font-size', val);
    });
  }
}

// --- 3. Font Family / Dyslexic Selector ---
export function initFontFamily() {
  const fontSelect = document.getElementById('fontFamilySelect');
  const savedFont = localStorage.getItem('memetic-font-family') || 'system';

  if (fontSelect) {
    fontSelect.value = savedFont;
    document.documentElement.setAttribute('data-font', savedFont);

    fontSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      document.documentElement.setAttribute('data-font', val);
      localStorage.setItem('memetic-font-family', val);
    });
  }
}

// --- 4. Reduced Motion Engine ---
export function initReducedMotion() {
  const motionToggle = document.getElementById('reducedMotionToggle');
  const savedMotion = localStorage.getItem('memetic-reduce-motion') === 'true';

  if (motionToggle) {
    motionToggle.checked = savedMotion;
    if (savedMotion) document.documentElement.classList.add('reduce-motion');

    motionToggle.addEventListener('change', (e) => {
      const active = e.target.checked;
      document.documentElement.classList.toggle('reduce-motion', active);
      localStorage.setItem('memetic-reduce-motion', active);
    });
  }
}

// --- 5. Global Hotkeys & Keyboard Navigation ---
export function initAccessibilityHotkeys() {
  document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    const isTyping = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

    // ESCAPE: Always closes open Modals and Drawers
    if (e.key === 'Escape') {
      if (typeof window.closeModal === 'function') window.closeModal(false);
      
      const cog = document.getElementById('cogMenu');
      if (cog) cog.style.display = 'none';
      const diceTray = document.getElementById('diceTrayDrawer');
      if (diceTray) diceTray.style.display = 'none';
    }

    if (isTyping) return;

    // Hotkey 'D': Quick Dice Tray
    if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      if (typeof window.toggleDiceTray === 'function') window.toggleDiceTray();
    }

    // Hotkey 'H': Quick Adjust HP Engine
    if (e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      if (typeof window.promptAdjustHP === 'function') window.promptAdjustHP();
    }

    // Hotkeys '1' - '6': Switch Main Tabs
    const tabKeys = {
      '1': 'view-character',
      '2': 'view-details',
      '3': 'view-spells',
      '4': 'view-equipment',
      '5': 'view-features',
      '6': 'view-journal'
    };
    if (tabKeys[e.key]) {
      e.preventDefault();
      if (typeof window.switchView === 'function') window.switchView(tabKeys[e.key]);
    }
  });
}

// Master Accessibility Initiator
export function initAccessibilitySuite() {
  initFontScaling();
  initFontFamily();
  initReducedMotion();
  initAccessibilityHotkeys();
  console.log('[Memetic Engine] Accessibility Suite Active ♿');
}

// Global Bindings
window.announceToScreenReader = announceToScreenReader;
window.initAccessibilitySuite = initAccessibilitySuite;