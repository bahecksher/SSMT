import { MissionType, CompanyId } from '../types';
import type { MissionDef, ActiveMission, CompanyId as CompanyIdType } from '../types';
import { MISSION_TIER_WEIGHTS } from './tuning';
import { MISSION_TEMPLATES } from './missionData';

interface ResolvedTemplate {
  type: MissionType;
  company: CompanyIdType;
  weight: number;
  labelTemplate: string;
  tiers: readonly [{ target: number; reward: number }, { target: number; reward: number }, { target: number; reward: number }];
}

// Resolve templates at import time
const TEMPLATES: ResolvedTemplate[] = MISSION_TEMPLATES.map((t) => ({
  type: MissionType[t.type as keyof typeof MissionType],
  company: CompanyId[t.company as keyof typeof CompanyId],
  weight: t.weight,
  labelTemplate: t.labelTemplate,
  tiers: t.tiers,
}));

const TOTAL_WEIGHT = TEMPLATES.reduce((sum, t) => sum + t.weight, 0);

function pickWeightedTemplate(): ResolvedTemplate {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const template of TEMPLATES) {
    r -= template.weight;
    if (r <= 0) return template;
  }
  return TEMPLATES[0];
}

function pickTier(): 1 | 2 | 3 {
  const r = Math.random();
  if (r < MISSION_TIER_WEIGHTS[0]) return 1;
  if (r < MISSION_TIER_WEIGHTS[0] + MISSION_TIER_WEIGHTS[1]) return 2;
  return 3;
}

function buildDef(template: ResolvedTemplate, tier: 1 | 2 | 3): MissionDef {
  const td = template.tiers[tier - 1];
  const label = template.labelTemplate.replace('{target}', String(td.target));
  return {
    type: template.type,
    company: template.company,
    target: td.target,
    label,
    reward: td.reward,
    tier,
  };
}

function missionId(def: MissionDef): string {
  return `${def.type}_T${def.tier}`;
}

/** Generate a random mission that doesn't collide with existing mission IDs. */
export function generateMission(existingIds: Set<string>): ActiveMission {
  for (let attempt = 0; attempt < 30; attempt++) {
    const template = pickWeightedTemplate();
    const tier = pickTier();
    const def = buildDef(template, tier);
    const id = missionId(def);
    if (!existingIds.has(id)) {
      return { id, def, progress: 0, completed: false, accepted: false };
    }
  }
  for (const template of TEMPLATES) {
    for (const tier of [1, 2, 3] as const) {
      const def = buildDef(template, tier);
      const id = missionId(def);
      if (!existingIds.has(id)) {
        return { id, def, progress: 0, completed: false, accepted: false };
      }
    }
  }
  const template = TEMPLATES[0];
  const def = buildDef(template, 1);
  return { id: missionId(def), def, progress: 0, completed: false, accepted: false };
}
