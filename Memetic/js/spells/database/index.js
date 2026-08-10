/* ==========================================================================
   MASTER SPELL COMPENDIUM AGGREGATOR (js/spells/database/index.js)
   ========================================================================== */

import { abjurationSpells } from './abjuration.js';
import { conjurationSpells } from './conjuration.js';
import { divinationSpells } from './divination.js';
import { enchantmentSpells } from './enchantment.js';
import { evocationSpells } from './evocation.js';
import { illusionSpells } from './illusion.js';
import { necromancySpells } from './necromancy.js';
import { transmutationSpells } from './transmutation.js';

// Merge all school arrays into a single massive database export
export const spellDatabase = [
  ...abjurationSpells,
  ...conjurationSpells,
  ...divinationSpells,
  ...enchantmentSpells,
  ...evocationSpells,
  ...illusionSpells,
  ...necromancySpells,
  ...transmutationSpells
];