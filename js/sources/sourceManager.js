/* ==========================================================================
   SOURCE PACKAGE MANAGER & SCHEMA VALIDATOR (js/sources/sourceManager.js)
   ========================================================================== */

import { alertModal } from '../core/modalEngine.js';

let registeredSources = new Map();
let activeSourceIds = new Set(['srd_5_1_baseline']);

/**
 * Validate incoming JSON package schema structure
 */
export function validateSourcePackage(pkg) {
  if (!pkg || typeof pkg !== 'object') {
    return { valid: false, error: 'Package payload is not a valid JSON object.' };
  }
  if (!pkg.id || typeof pkg.id !== 'string') {
    return { valid: false, error: 'Missing or invalid "id" property.' };
  }
  if (!pkg.name || typeof pkg.name !== 'string') {
    return { valid: false, error: 'Missing or invalid "name" property.' };
  }
  return { valid: true };
}

/**
 * Register a source package in memory
 */
export function registerSourcePackage(pkg, activate = true) {
  const check = validateSourcePackage(pkg);
  if (!check.valid) {
    console.error(`[SourceManager] Validation failed: ${check.error}`);
    return false;
  }

  registeredSources.set(pkg.id, pkg);
  if (activate) {
    activeSourceIds.add(pkg.id);
  }

  console.log(`[SourceManager] Registered package "${pkg.name}" (${pkg.id})`);
  return true;
}

/**
 * Toggle a source package on/off
 */
export function toggleSourceActive(sourceId, isActive) {
  if (!registeredSources.has(sourceId)) return;
  if (isActive) {
    activeSourceIds.add(sourceId);
  } else {
    activeSourceIds.delete(sourceId);
  }
}

/**
 * Get all active classes merged across registered active sources
 */
export function getActiveClasses() {
  const classes = [];
  activeSourceIds.forEach(id => {
    const src = registeredSources.get(id);
    if (src && Array.isArray(src.classes)) {
      classes.push(...src.classes);
    }
  });
  return classes;
}

/**
 * Get all active species merged across registered active sources
 */
export function getActiveSpecies() {
  const species = [];
  activeSourceIds.forEach(id => {
    const src = registeredSources.get(id);
    if (src && Array.isArray(src.species)) {
      species.push(...src.species);
    }
  });
  return species;
}

/**
 * Load default baseline SRD 5.1 rules package from disk
 */
export async function initBaselineSource() {
  try {
    const response = await fetch('./js/sources/srd51_rules.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const srdData = await response.json();
    registerSourcePackage(srdData, true);
  } catch (err) {
    console.warn('[SourceManager] Could not load srd51_rules.json via fetch. Using fallback state.', err);
  }
}

// Global Exports
window.registerSourcePackage = registerSourcePackage;
window.getActiveClasses = getActiveClasses;
window.getActiveSpecies = getActiveSpecies;