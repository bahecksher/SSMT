import { CompanyId } from '../types';

export type RivalAbilityType = 'laser';

export interface RivalDef {
  id: string;
  name: string;
  callsign: string;
  companyId: CompanyId;
  repLabel: string;
  hp: number;
  shieldLayers: number;
  ability: RivalAbilityType;
  color: number;
  accent: number;
  comms: {
    intro: string[];
    abilityTell: string[];
    flee: string[];
    escaped: string[];
  };
}

export const RIVAL_DEFS: RivalDef[] = [
  {
    id: 'veyra-redline',
    name: 'VEYRA KADE',
    callsign: 'REDLINE',
    companyId: CompanyId.IRONVEIL,
    repLabel: 'IRONVEIL ENFORCER',
    hp: 3,
    shieldLayers: 0,
    ability: 'laser',
    color: 0xff3366,
    accent: 0xff0044,
    comms: {
      intro: [
        'Pilot, you are trespassing on Ironveil recovery rights.',
        'Redline on intercept. This lane is closed.',
      ],
      abilityTell: [
        'Redline armed. Hold still.',
        'Laser mark confirmed.',
      ],
      flee: [
        'Enough. I have your flight pattern.',
        'Telemetry captured. Disengaging.',
      ],
      escaped: [
        'Ironveil will invoice the wreckage.',
        'Next pass will not be a warning.',
      ],
    },
  },
];

export function pickRivalDef(): RivalDef {
  return RIVAL_DEFS[Math.floor(Math.random() * RIVAL_DEFS.length)];
}

export function pickRivalLine(lines: readonly string[]): string {
  return lines[Math.floor(Math.random() * lines.length)] ?? '';
}
