/* ==========================================================================
   SPECIES ENGINE (LINEAGE & RACIAL TRAITS)
   ========================================================================== */

export const SpeciesRegistry = {
  'human': {
    name: 'Human',
    speed: 30,
    senses: 'Normal Vision',
    traits: [
      { name: 'Versatility', desc: 'Gains proficiency in one extra skill of choice.' }
    ]
  },
  'elf': {
    name: 'Elf',
    speed: 30,
    senses: 'Darkvision (60 ft.)',
    traits: [
      { name: 'Fey Ancestry', desc: 'Advantage on saving throws against being charmed, and magic cannot put you to sleep.' },
      { name: 'Keen Senses', desc: 'Proficiency in Perception.' }
    ]
  }
};

export function applySpeciesTraits(speciesName) {
  if (!speciesName) return;
  const key = speciesName.toLowerCase().trim();
  const species = SpeciesRegistry[key];

  if (!window.state) window.state = {};
  window.state.species = speciesName;

  if (species) {
    if (species.speed) window.state.speed = species.speed;
    console.log(`🧬 [Species Engine] Applied Lineage: ${species.name}`);
  } else {
    console.log(`🧬 [Species Engine] Custom Species set: ${speciesName}`);
  }

  if (typeof window.announceToScreenReader === 'function') {
    window.announceToScreenReader(`Applied species ${speciesName}`);
  }
}

window.SpeciesRegistry = SpeciesRegistry;
window.applySpeciesTraits = applySpeciesTraits;