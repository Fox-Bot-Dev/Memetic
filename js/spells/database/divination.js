export const divinationSpells = [
  {
    id: "comp_guidance",
    name: "Guidance",
    level: 0,
    school: "Divination",
    castingTime: "1 Action",
    range: "Touch",
    duration: "Concentration, up to 1 minute",
    save: "",
    attack: false,
    dice: "1d4",
    desc: "You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one ability check of its choice. It can roll the die before or after making the ability check."
  },
  {
    id: "comp_hunter_mark",
    name: "Hunter's Mark",
    level: 1,
    school: "Divination",
    castingTime: "1 Bonus Action",
    range: "90 feet",
    duration: "Concentration, up to 1 hour",
    save: "",
    attack: false,
    dice: "1d6",
    desc: "You choose a creature you can see within range and mystically mark it as your quarry. Until the spell ends, you deal an extra 1d6 damage to the target whenever you hit it with a weapon attack, and you have advantage on any Wisdom (Perception) or Wisdom (Survival) check you make to find it."
  },
  {
    id: "comp_detect_magic",
    name: "Detect Magic",
    level: 1,
    school: "Divination",
    castingTime: "1 Action",
    range: "Self",
    duration: "Concentration, up to 10 minutes",
    save: "",
    attack: false,
    dice: "",
    desc: "For the duration, you sense the presence of magic within 30 feet of you. If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic, and you learn its school of magic."
  }
];