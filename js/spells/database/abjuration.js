export const abjurationSpells = [
  {
    id: "comp_shield",
    name: "Shield",
    level: 1,
    school: "Abjuration",
    castingTime: "1 Reaction",
    range: "Self",
    duration: "1 Round",
    save: "",
    attack: false,
    dice: "",
    desc: "An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile."
  },
  {
    id: "comp_absorb_elements",
    name: "Absorb Elements",
    level: 1,
    school: "Abjuration",
    castingTime: "1 Reaction",
    range: "Self",
    duration: "1 Round",
    save: "",
    attack: false,
    dice: "1d6",
    desc: "The spell captures some of the incoming energy, lessening its effect on you and storing it for your next melee attack. You have resistance to the triggering damage type until the start of your next turn. Also, the first time you hit with a melee attack on your next turn, the target takes an extra 1d6 damage of the triggering type."
  },
  {
    id: "comp_armor_of_agathys",
    name: "Armor of Agathys",
    level: 1,
    school: "Abjuration",
    castingTime: "1 Action",
    range: "Self",
    duration: "1 Hour",
    save: "",
    attack: false,
    dice: "5 Cold",
    desc: "A protective magical force surrounds you, manifesting as a spectral frost that covers you and your gear. You gain 5 temporary hit points. If a creature hits you with a melee attack while you have these hit points, the creature takes 5 cold damage."
  },
  {
    id: "comp_counterspell",
    name: "Counterspell",
    level: 3,
    school: "Abjuration",
    castingTime: "1 Reaction",
    range: "60 feet",
    duration: "Instantaneous",
    save: "",
    attack: false,
    dice: "",
    desc: "You attempt to interrupt a creature in the process of casting a spell. If the creature is casting a spell of 3rd level or lower, its spell fails and has no effect. If it is casting a spell of 4th level or higher, make an ability check using your spellcasting ability (DC 10 + the spell's level)."
  },
  {
    id: "comp_dispel_magic",
    name: "Dispel Magic",
    level: 3,
    school: "Abjuration",
    castingTime: "1 Action",
    range: "120 feet",
    duration: "Instantaneous",
    save: "",
    attack: false,
    dice: "",
    desc: "Choose one creature, object, or magical effect within range. Any spell of 3rd level or lower on the target ends. For each spell of 4th level or higher on the target, make an ability check using your spellcasting ability (DC 10 + the spell's level)."
  }
];