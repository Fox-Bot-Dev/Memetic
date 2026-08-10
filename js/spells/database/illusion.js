export const illusionSpells = [
  {
    id: "comp_minor_illusion",
    name: "Minor Illusion",
    level: 0,
    school: "Illusion",
    castingTime: "1 Action",
    range: "30 feet",
    duration: "1 Minute",
    save: "INT",
    attack: false,
    dice: "",
    desc: "You create a sound or an image of an object within range that lasts for the duration. The illusion also ends if you dismiss it as an action or cast this spell again."
  },
  {
    id: "comp_invisibility",
    name: "Invisibility",
    level: 2,
    school: "Illusion",
    castingTime: "1 Action",
    range: "Touch",
    duration: "Concentration, up to 1 hour",
    save: "",
    attack: false,
    dice: "",
    desc: "A creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target's person. The spell ends early if the target attacks or casts a spell."
  },
  {
    id: "comp_mirror_image",
    name: "Mirror Image",
    level: 2,
    school: "Illusion",
    castingTime: "1 Action",
    range: "Self",
    duration: "1 Minute",
    save: "",
    attack: false,
    dice: "",
    desc: "Three illusory duplicates of yourself appear in your space. Until the spell ends, the duplicates move with you and mimic your actions, making it impossible to track which image is real. Each time a creature targets you with an attack, roll a d20 to see if the attack targets a duplicate instead."
  }
];