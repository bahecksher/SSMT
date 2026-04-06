import { COMPANIES } from './companyData';
import type { MissionDef } from '../types';

const MISSION_BRIEFS: Record<MissionDef['type'], readonly [string, string, string]> = {
  SALVAGE_CREDITS: [
    "Tortuga's dead still drift. Strip them clean.",
    'Allied wrecks keep surfacing through the ring.',
    'Clean the war graveyard before Regent does.',
  ],
  EXTRACT_CREDITS: [
    'Slick got you in. Bring the take back out.',
    'Bank the haul before the patrol net closes.',
    'Big score. Beat the cordon and come home rich.',
  ],
  MINING_CREDITS: [
    'Moon slag in the ring is easy money. Cut it loose.',
    'The ring is shedding rich ore. Stay on the rock.',
    'Chew the shattered moon down to sparks.',
  ],
  REACH_CREDITS: [
    'Sit on the haul. Tortuga pays the patient.',
    'Hold the weight while Regent closes in.',
    'Carry a fortune right under their guns.',
  ],
  DESTROY_ENEMIES: [
    'Regent patrol is screening something below.',
    'Every escort you burn buys us another look.',
    'They are guarding a build site. Break the screen.',
  ],
  DESTROY_NPCS: [
    "Any crew feeding Regent's machine is fair game.",
    'Those freelancers are hauling for the wrong side.',
    'Cut every contractor feeding the build.',
  ],
  SURVIVE_EXTRACT: [
    'Tortuga wants you dead. Leave anyway.',
    'Ride the patrol surge and punch out clean.',
    'Stay alive long enough to see what they are hiding.',
  ],
  NO_DAMAGE_PHASE: [
    "Slick's remote shell only pays if you keep it clean.",
    'Fly untouched. We need clean telemetry off Tortuga.',
    'Stay flawless while the whole sky hunts you.',
  ],
  COLLECT_SHIELDS: [
    'Scour the lane. Regent is arming for something.',
    'Stack shields before their heavy kit wakes up.',
    'Take every shield. You will need them later.',
  ],
};

export function getMissionBrief(def: MissionDef): string {
  const liaison = COMPANIES[def.company].liaison;
  const tierIndex = Math.max(0, Math.min(2, def.tier - 1));
  const brief = MISSION_BRIEFS[def.type][tierIndex];
  return `${liaison}: ${brief}`;
}
