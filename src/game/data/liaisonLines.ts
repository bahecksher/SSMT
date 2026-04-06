import { CompanyId } from '../types';

export type LiaisonLineKey = 'intro' | 'runStart' | 'boost';

/** Dialogue lines per company per rep level (1 = Known, 2 = Trusted, 3 = Elite). */
const LIAISON_LINES: Record<CompanyId, Record<number, Record<LiaisonLineKey, string[]>>> = {
  [CompanyId.DEEPCORE]: {
    1: {
      intro: [
        "Holt here. Tortuga's ring is full of moon slag and easy ore.",
        "DEEPCORE ops. The battle broke a moon for us. Go cash it in.",
      ],
      runStart: [
        'Ignore the wrecks. The ring is low-hanging profit.',
        'They can keep the planet. We want the stone around it.',
      ],
      boost: [
        'DEEPCORE drill sync active. Moon-slag yield boosted.',
      ],
    },
    2: {
      intro: [
        "Holt again. The ring is paying, and DEEPCORE wants a bigger bite.",
        'You keep hauling ore off Tortuga, we keep opening the taps.',
      ],
      runStart: [
        'Work the broken moon hard. We tuned your drill for slag seams.',
        "Every rock you crack is profit Regent can't use.",
      ],
      boost: [
        'Enhanced yield protocol online. Strip the ring faster.',
      ],
    },
    3: {
      intro: [
        "Holt. Elite clearance. DEEPCORE intends to own Tortuga's sky.",
        "Top tier, pilot. That ring is ours if you can keep it bleeding.",
      ],
      runStart: [
        'Full bore mining. Grind the shattered moon to dust.',
        "Strip every bright seam before Regent can turn it into armor.",
      ],
      boost: [
        'Maximum yield protocol engaged. Peak ring harvest online.',
      ],
    },
  },

  [CompanyId.RECLAIM]: {
    1: {
      intro: [
        "Voss, RECLAIM operations. Tortuga's dead fleets are still worth plenty.",
        'RECLAIM CO checking in. Allied and Regent both left valuables drifting.',
      ],
      runStart: [
        'Every busted hull in that ring still has a buyer.',
        'Salvage smart. The dead over Tortuga still pay.',
      ],
      boost: [
        'RECLAIM salvage protocols active. Wreck yield boosted.',
      ],
    },
    2: {
      intro: [
        "Voss here. Your rig's tuned for battle salvage now.",
        'Good hauls, pilot. Keep pulling history out of that sky.',
      ],
      runStart: [
        'Enhanced collectors online. Sweep the old battle lanes.',
        "The ring keeps spitting up wreckage. Don't leave it for Regent.",
      ],
      boost: [
        'Enhanced salvage array online. Combat wreck yield improved.',
      ],
    },
    3: {
      intro: [
        "Voss. Elite clearance. You're one of the few who can read Tortuga's graveyard.",
        'Top shelf, pilot. Go pull the best pieces before they vanish below the storms.',
      ],
      runStart: [
        'Maximum collection efficiency. Nothing in that war ring escapes you.',
        "Clean the field. Every lost hull is a clue to what Regent is rebuilding.",
      ],
      boost: [
        'Peak salvage protocol engaged. Maximum wreck recovery.',
      ],
    },
  },

  [CompanyId.IRONVEIL]: {
    1: {
      intro: [
        'Kade. IRONVEIL SEC. Anything not flying Regent colors is just clutter.',
        "IRONVEIL's on the line. Tortuga is a live contract zone now.",
      ],
      runStart: [
        "Regent's screening something on the surface. Start thinning them out.",
        'Every hostile you erase buys us a clearer look below.',
      ],
      boost: [
        'IRONVEIL bounty multiplier active. Anti-Regent contract rates boosted.',
      ],
    },
    2: {
      intro: [
        "Kade again. We're seeing traffic patterns around hidden build sites.",
        "You're making a name for yourself. Keep Regent nervous.",
      ],
      runStart: [
        'Enhanced bounty rates active. Break their escorts and their workers.',
        "IRONVEIL's watching. Shut down anything feeding the project.",
      ],
      boost: [
        'Elevated bounty protocol online. Enhanced anti-Regent bounties.',
      ],
    },
    3: {
      intro: [
        "Kade. Elite clearance. Regent is building something under that ring.",
        'Top enforcer, pilot. We do not let hidden war machines hatch.',
      ],
      runStart: [
        'Maximum bounty rates. Turn their whole screen into wreckage.',
        "Everything protecting the build dies today. Earn your title.",
      ],
      boost: [
        'Peak bounty protocol engaged. Maximum contract lethality.',
      ],
    },
  },

  [CompanyId.FREEPORT]: {
    1: {
      intro: [
        "Nyla, FREEPORT UNION. Tortuga sits on routes people used to kill for.",
        'FREEPORT checking in. Reopen this world and half the sector gets richer.',
      ],
      runStart: [
        'Keep your eyes open. We seeded supplies along the old lanes.',
        "If Tortuga opens again, trade starts moving tomorrow.",
      ],
      boost: [
        'FREEPORT supply drop active. Trade-lane support seeded in the field.',
      ],
    },
    2: {
      intro: [
        "Nyla again. The route maps all converge on Tortuga's orbit.",
        'Good runs make believers. We are investing in a reopening.',
      ],
      runStart: [
        'More supplies seeded. Every clean run makes the case for opening the port.',
        "Upgraded drop rates. We want proof Tortuga can be crossed again.",
      ],
      boost: [
        'Enhanced supply protocol online. Trade-route support increased.',
      ],
    },
    3: {
      intro: [
        "Nyla. Elite tier. Open Tortuga and the whole sector reroutes through us.",
        'Top tier, pilot. One broken blockade can redraw a star chart.',
      ],
      runStart: [
        "Maximum supply drops. Keep the corridor alive and the future opens.",
        "FREEPORT's betting on you to make Tortuga profitable again.",
      ],
      boost: [
        'Peak supply protocol engaged. Maximum trade-lane support.',
      ],
    },
  },
};

export function getLiaisonLine(company: CompanyId, level: number, key: LiaisonLineKey): string {
  const clampedLevel = Math.min(3, Math.max(1, level));
  const lines = LIAISON_LINES[company]?.[clampedLevel]?.[key];
  if (!lines || lines.length === 0) return '';
  return lines[Math.floor(Math.random() * lines.length)];
}
