export const enchantmentSpells = [
  {
    id: "comp_vicious_mockery",
    name: "Vicious Mockery",
    level: 0,
    school: "Enchantment",
    castingTime: "1 Action",
    range: "60 feet",
    duration: "Instantaneous",
    save: "WIS",
    attack: false,
    dice: "1d4 Psychic",
    desc: "You unleash a string of enchantments laced with subtle insults at a creature you can see within range. If the target can hear you, it must succeed on a Wisdom saving throw or take 1d4 psychic damage and have disadvantage on the next attack roll it makes before the end of its next turn."
  },
  {
    id: "comp_bless",
    name: "Bless",
    level: 1,
    school: "Enchantment",
    castingTime: "1 Action",
    range: "30 feet",
    duration: "Concentration, up to 1 minute",
    save: "",
    attack: false,
    dice: "1d4",
    desc: "You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw."
  },
  {
    id: "comp_command",
    name: "Command",
    level: 1,
    school: "Enchantment",
    castingTime: "1 Action",
    range: "60 feet",
    duration: "1 Round",
    save: "WIS",
    attack: false,
    dice: "",
    desc: "You speak a one-word command to a creature you can see within range. The target must succeed on a Wisdom saving throw or follow the command on its next turn. Typical commands include Approach, Drop, Flee, Grovel, or Halt."
  },
  {
    id: "comp_hold_person",
    name: "Hold Person",
    level: 2,
    school: "Enchantment",
    castingTime: "1 Action",
    range: "60 feet",
    duration: "Concentration, up to 1 minute",
    save: "WIS",
    attack: false,
    dice: "",
    desc: "Choose a humanoid that you can see within range. The target must succeed on a Wisdom saving throw or be paralyzed for the duration. At the end of each of its turns, the target can make another Wisdom saving throw. On a success, the spell ends on the target."
  }
];