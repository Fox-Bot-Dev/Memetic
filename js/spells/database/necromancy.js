export const necromancySpells = [
  {
    id: "comp_toll_the_dead",
    name: "Toll the Dead",
    level: 0,
    school: "Necromancy",
    castingTime: "1 Action",
    range: "60 feet",
    duration: "Instantaneous",
    save: "WIS",
    attack: false,
    dice: "1d12 Necrotic",
    desc: "You point at one creature you can see within range, and the sound of a dolorous bell fills the air around it for a moment. The target must succeed on a Wisdom saving throw or take 1d8 necrotic damage. If the target is missing any of its hit points, it instead takes 1d12 necrotic damage."
  },
  {
    id: "comp_inflict_wounds",
    name: "Inflict Wounds",
    level: 1,
    school: "Necromancy",
    castingTime: "1 Action",
    range: "Touch",
    duration: "Instantaneous",
    save: "",
    attack: true,
    dice: "3d10 Necrotic",
    desc: "Make a melee spell attack against a creature you can reach. On a hit, the target takes 3d10 necrotic damage."
  },
  {
    id: "comp_animate_dead",
    name: "Animate Dead",
    level: 3,
    school: "Necromancy",
    castingTime: "1 Minute",
    range: "10 feet",
    duration: "Instantaneous",
    save: "",
    attack: false,
    dice: "",
    desc: "This spell creates an undead servant. Choose a pile of bones or a corpse of a Medium or Small humanoid within range. Your spell imbues the target with a foul mimicry of life, raising it as an undead creature (a skeleton or zombie)."
  }
];