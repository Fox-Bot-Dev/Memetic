export const evocationSpells = [
  {
    id: "comp_fire_bolt",
    name: "Fire Bolt",
    level: 0,
    school: "Evocation",
    castingTime: "1 Action",
    range: "120 feet",
    duration: "Instantaneous",
    save: "",
    attack: true,
    dice: "1d10 Fire",
    desc: "You hurl a mote of fire at a creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage. A flammable object hit by this spell ignites if it isn't being worn or carried."
  },
  {
    id: "comp_cure_wounds",
    name: "Cure Wounds",
    level: 1,
    school: "Evocation",
    castingTime: "1 Action",
    range: "Touch",
    duration: "Instantaneous",
    save: "",
    attack: false,
    dice: "1d8",
    desc: "A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs."
  },
  {
    id: "comp_healing_word",
    name: "Healing Word",
    level: 1,
    school: "Evocation",
    castingTime: "1 Bonus Action",
    range: "60 feet",
    duration: "Instantaneous",
    save: "",
    attack: false,
    dice: "1d4",
    desc: "A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier. This spell has no effect on undead or constructs."
  },
  {
    id: "comp_magic_missile",
    name: "Magic Missile",
    level: 1,
    school: "Evocation",
    castingTime: "1 Action",
    range: "120 feet",
    duration: "Instantaneous",
    save: "",
    attack: false,
    dice: "1d4+1 Force",
    desc: "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously."
  },
  {
    id: "comp_fireball",
    name: "Fireball",
    level: 3,
    school: "Evocation",
    castingTime: "1 Action",
    range: "150 feet",
    duration: "Instantaneous",
    save: "DEX",
    attack: false,
    dice: "8d6 Fire",
    desc: "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. Takes 8d6 fire damage on a failed save, half on success."
  }
];