/* ==========================================================================
   THE "SQUISH" ENGINE: BULLETPROOF PDF PARSER
   Bypasses PDF kerning splits by crushing the document into a single unformatted string.
   ========================================================================== */

import { rawScores, hpState, setInventoryItems, setCharacterFeatures } from './state.js';
import { renderAbilityScores, recalculateDefenses } from './skills.js';
import { updateHPDisplay } from './hpEngine.js';
import { renderInventory } from './inventory.js';
import { renderFeatures } from './features.js';
import { alertModal } from './modalEngine.js';
import { triggerAutosave } from './autosave.js';

export async function parseDnDBeyondPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    if (!window.pdfjsLib) {
      alertModal("PDF.js library is missing from index.html!", "Import Error");
      return;
    }

    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let rawTextArray = [];

    // Extract raw text blocks directly from the PDF canvas
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      rawTextArray.push(...textContent.items.map(item => item.str));
    }

    // ----------------------------------------------------------------------
    // 1. THE SQUISH ENGINE (For Flawless Stat & HP Extraction)
    // ----------------------------------------------------------------------
    // Strip everything except letters and numbers. No spaces, no kerning gaps.
    const squished = rawTextArray.join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
    console.log("=== SQUISHED MATRIX ===", squished);

    const getSquishStat = (statName) => {
      const match = squished.match(new RegExp(`${statName}(\\d+)`));
      if (match) {
        const digits = match[1];
        // If the number starts with 1, 2, or 3, it's a two-digit stat (10-30)
        if (['1', '2', '3'].includes(digits[0]) && digits.length >= 2) {
          return parseInt(digits.substring(0, 2));
        }
        // Otherwise it's a single digit stat (e.g., 8 or 9)
        return parseInt(digits.substring(0, 1));
      }
      return 10;
    };

    rawScores.STR = getSquishStat('STRENGTH');
    rawScores.DEX = getSquishStat('DEXTERITY');
    rawScores.CON = getSquishStat('CONSTITUTION');
    rawScores.INT = getSquishStat('INTELLIGENCE');
    rawScores.WIS = getSquishStat('WISDOM');
    rawScores.CHA = getSquishStat('CHARISMA');

    // Extract Max HP
    const hpMatch = squished.match(/MAXHP(\d{1,3})/) || squished.match(/HITPOINTS(\d{1,3})/);
    if (hpMatch) hpState.baseMax = parseInt(hpMatch[1]);
    
    hpState.current = hpState.baseMax;
    hpState.necroticDrain = 0;
    hpState.tempHP = 0;

    // ----------------------------------------------------------------------
    // 2. STANDARD EXTRACTION (For Identity Strings)
    // ----------------------------------------------------------------------
    const fullText = rawTextArray.join(' ');
    let charName = 'Unknown Hero';
    let classLevel = 'Level 1 Adventurer';

    // Look for the specific Armorer / Class string formats
    const nameMatch = fullText.match(/Armorer\s*-\s*([A-Za-z\s]+)\(/i) || fullText.match(/([A-Za-z\s]+)CLASS & LEVEL/);
    if (nameMatch) {
      charName = nameMatch[1].trim();
    } else if (rawTextArray[0] && rawTextArray[0].length > 2) {
      charName = rawTextArray[0].trim(); // Fallback to first line
    }

    const classRegex = /(Artificer|Barbarian|Bard|Cleric|Druid|Fighter|Monk|Paladin|Ranger|Rogue|Sorcerer|Warlock|Wizard)\s+\d+/i;
    const cMatch = fullText.match(classRegex);
    if (cMatch) classLevel = cMatch[0];

    // ----------------------------------------------------------------------
    // 3. UI UPDATES
    // ----------------------------------------------------------------------
    if (document.getElementById('charName')) document.getElementById('charName').innerText = charName;
    if (document.getElementById('charClass')) document.getElementById('charClass').innerText = classLevel;
    
    const initials = charName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    if (document.getElementById('avatarFallback')) document.getElementById('avatarFallback').innerText = initials || 'NW';

    // Clear out the junk inventory to give you a clean slate
    setInventoryItems([]);

    renderAbilityScores();
    recalculateDefenses();
    updateHPDisplay();
    renderInventory();
    renderFeatures();
    
    triggerAutosave();

    alertModal(`Squish Engine Extracted: ${charName} (${classLevel})!`, "Import Successful");

  } catch (err) {
    console.error(err);
    alertModal("PDF Parsing failed. Check the console for details.", "Import Error");
  }
}