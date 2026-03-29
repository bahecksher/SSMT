import { CompanyId } from '../types';

export type LiaisonLineKey = 'intro' | 'runStart' | 'boost';

/** Dialogue lines per company per rep level (1 = Known, 2 = Trusted, 3 = Elite). */
const LIAISON_LINES: Record<CompanyId, Record<number, Record<LiaisonLineKey, string[]>>> = {
  [CompanyId.DEEPCORE]: {
    1: {
      intro: [
        "Holt here. DEEPCORE's watching your run.",
        "DEEPCORE ops, checking in. Don't waste our time.",
      ],
      runStart: [
        'Mine close, extract clean.',
        'Rock pays better than scrap. Remember that.',
      ],
      boost: [
        'DEEPCORE yield protocol active. Mining output boosted.',
      ],
    },
    2: {
      intro: [
        "Holt again. DEEPCORE's invested in you now.",
        'You keep delivering, we keep upgrading your scan.',
      ],
      runStart: [
        'Work the asteroids hard. We tuned your drill frequency.',
        "DEEPCORE's best run this quadrant. Don't ruin the streak.",
      ],
      boost: [
        'Enhanced yield protocol online. Mining output increased.',
      ],
    },
    3: {
      intro: [
        "Holt. DEEPCORE elite clearance. You've earned it.",
        "Top tier, pilot. DEEPCORE doesn't hand these out.",
      ],
      runStart: [
        'Full bore mining. Extract everything that glows.',
        "DEEPCORE's flagship operator. Make it count.",
      ],
      boost: [
        'Maximum yield protocol engaged. Peak mining output.',
      ],
    },
  },

  [CompanyId.RECLAIM]: {
    1: {
      intro: [
        "Voss, RECLAIM operations. We've got eyes on your salvage.",
        'RECLAIM CO checking in. Waste not, want not.',
      ],
      runStart: [
        'Every scrap has value. Prove you know that.',
        'Salvage smart, not fast.',
      ],
      boost: [
        'RECLAIM salvage protocols active. Yield boosted.',
      ],
    },
    2: {
      intro: [
        "Voss here. RECLAIM's upgraded your collection rig.",
        'Good hauls, pilot. We noticed.',
      ],
      runStart: [
        'Enhanced collectors online. Grab everything.',
        "RECLAIM's counting on you. Don't leave credits floating.",
      ],
      boost: [
        'Enhanced salvage array online. Improved yield.',
      ],
    },
    3: {
      intro: [
        "Voss. RECLAIM elite. You're our best scavenger.",
        'Top shelf clearance, pilot. RECLAIM salutes you.',
      ],
      runStart: [
        'Maximum collection efficiency. Nothing escapes your net.',
        "RECLAIM's finest. Clean the field.",
      ],
      boost: [
        'Peak salvage protocol engaged. Maximum yield.',
      ],
    },
  },

  [CompanyId.IRONVEIL]: {
    1: {
      intro: [
        'Kade. IRONVEIL SEC. We pay for confirmed kills.',
        "IRONVEIL's on the line. Show us what you've got.",
      ],
      runStart: [
        "Hostiles are credits. Don't let them fly free.",
        'Every wreck is a payday. Get to work.',
      ],
      boost: [
        'IRONVEIL bounty multiplier active. Kill bonuses boosted.',
      ],
    },
    2: {
      intro: [
        "Kade again. IRONVEIL's raised your bounty ceiling.",
        "You're making a name for yourself. IRONVEIL approves.",
      ],
      runStart: [
        'Enhanced bounty rates active. Make every shot count.',
        "IRONVEIL's watching. Put on a show.",
      ],
      boost: [
        'Elevated bounty protocol online. Enhanced kill bonuses.',
      ],
    },
    3: {
      intro: [
        "Kade. IRONVEIL elite. You're our top enforcer.",
        'Elite clearance, pilot. IRONVEIL owes you several.',
      ],
      runStart: [
        'Maximum bounty rates. Turn this sector into a graveyard.',
        "IRONVEIL's deadliest. Earn the title.",
      ],
      boost: [
        'Peak bounty protocol engaged. Maximum kill bonuses.',
      ],
    },
  },

  [CompanyId.FREEPORT]: {
    1: {
      intro: [
        "Nyla, FREEPORT UNION. We've seeded some extras for you.",
        'FREEPORT checking in. Luck favors our friends.',
      ],
      runStart: [
        'Keep your eyes open. Extra supplies in the field.',
        "We've scattered some gifts. Find them.",
      ],
      boost: [
        'FREEPORT supply drop active. Extra pickups in the field.',
      ],
    },
    2: {
      intro: [
        "Nyla again. FREEPORT's increased your supply allocation.",
        'Good runs earn better drops. Simple math.',
      ],
      runStart: [
        'More supplies seeded. FREEPORT takes care of its own.',
        "Upgraded drop rates. You'll find more out there.",
      ],
      boost: [
        'Enhanced supply protocol online. Improved drop rates.',
      ],
    },
    3: {
      intro: [
        "Nyla. FREEPORT elite. You're family now.",
        'Top tier, pilot. FREEPORT rolls out the red carpet.',
      ],
      runStart: [
        "Maximum supply drops. We've loaded the field for you.",
        "FREEPORT's best friend. Enjoy the bounty.",
      ],
      boost: [
        'Peak supply protocol engaged. Maximum drop rates.',
      ],
    },
  },
};

/** Lines spoken when a mission card is selected on the briefing screen. No rep required. */
const LIAISON_SELECT_LINES: Record<CompanyId, string[]> = {
  [CompanyId.DEEPCORE]: [
    "Holt, DEEPCORE. You take this one, you're on our clock.",
    "DEEPCORE contract. Mine hard, extract harder.",
    "That's a DEEPCORE job. We don't pay for half measures.",
    "Good eye. The rock's been calling.",
    "DEEPCORE appreciates the initiative.",
  ],
  [CompanyId.RECLAIM]: [
    "Voss here. RECLAIM likes your taste in work.",
    "A RECLAIM contract. Every scrap counts, pilot.",
    "RECLAIM CO. We turn wreckage into wealth.",
    "Smart pick. There's treasure in that debris.",
    "RECLAIM sees potential. Don't disappoint.",
  ],
  [CompanyId.IRONVEIL]: [
    "Kade. IRONVEIL SEC. You know what this means.",
    "An IRONVEIL contract. Shoot straight, get paid.",
    "IRONVEIL doesn't hire squeamish. You in or not?",
    "Good. We've got targets that need removing.",
    "IRONVEIL appreciates the trigger discipline.",
  ],
  [CompanyId.FREEPORT]: [
    "Nyla, FREEPORT. Welcome to the family business.",
    "FREEPORT contract. Survive, and the field provides.",
    "A FREEPORT job. We look out for our own.",
    "FREEPORT UNION. Stay sharp and the odds bend your way.",
    "Good choice. Freeport's got your back out there.",
  ],
};

/** Lines when deselecting a mission. */
const LIAISON_DESELECT_LINES: Record<CompanyId, string[]> = {
  [CompanyId.DEEPCORE]: [
    "Your call, pilot.",
    "DEEPCORE will find someone else.",
  ],
  [CompanyId.RECLAIM]: [
    "Cold feet? We'll keep it open.",
    "RECLAIM understands. For now.",
  ],
  [CompanyId.IRONVEIL]: [
    "Backing out? Noted.",
    "IRONVEIL remembers.",
  ],
  [CompanyId.FREEPORT]: [
    "No pressure. FREEPORT's patient.",
    "The offer stands, pilot.",
  ],
};

export function getLiaisonLine(company: CompanyId, level: number, key: LiaisonLineKey): string {
  const clampedLevel = Math.min(3, Math.max(1, level));
  const lines = LIAISON_LINES[company]?.[clampedLevel]?.[key];
  if (!lines || lines.length === 0) return '';
  return lines[Math.floor(Math.random() * lines.length)];
}

export function getLiaisonSelectLine(company: CompanyId): string {
  const lines = LIAISON_SELECT_LINES[company];
  return lines[Math.floor(Math.random() * lines.length)];
}

export function getLiaisonDeselectLine(company: CompanyId): string {
  const lines = LIAISON_DESELECT_LINES[company];
  return lines[Math.floor(Math.random() * lines.length)];
}
