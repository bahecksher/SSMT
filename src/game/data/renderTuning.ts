import { getLayout, isNarrowViewport, isShortViewport, type LayoutMetrics } from '../layout';

export interface RenderTuningProfile {
  gameStarfieldCount: number;
  gameStarfieldFrameMs: number;
  geoSphereSubdivisions: number;
  geoSphereRingSegments: number;
  geoSphereRingDebrisStep: number;
  geoSphereFrameMs: number;
  mirrorLiveBgAlpha: number;
  mirrorLiveRenderEnemies: boolean;
  mirrorRenderFrameMs: number;
  mirrorSpectateRenderFrameMs: number;
  asteroidMiningSegments: number;
  salvageRingSegments: number;
}

const DEFAULT_PROFILE: RenderTuningProfile = {
  gameStarfieldCount: 170,
  gameStarfieldFrameMs: 16,
  geoSphereSubdivisions: 2,
  geoSphereRingSegments: 160,
  geoSphereRingDebrisStep: 1,
  geoSphereFrameMs: 16,
  mirrorLiveBgAlpha: 0.08,
  mirrorLiveRenderEnemies: true,
  mirrorRenderFrameMs: 16,
  mirrorSpectateRenderFrameMs: 16,
  asteroidMiningSegments: 12,
  salvageRingSegments: 16,
};

const CONSTRAINED_PROFILE: RenderTuningProfile = {
  gameStarfieldCount: 96,
  gameStarfieldFrameMs: 33,
  geoSphereSubdivisions: 1,
  geoSphereRingSegments: 96,
  geoSphereRingDebrisStep: 2,
  geoSphereFrameMs: 50,
  mirrorLiveBgAlpha: 0,
  mirrorLiveRenderEnemies: false,
  mirrorRenderFrameMs: 100,
  mirrorSpectateRenderFrameMs: 33,
  asteroidMiningSegments: 8,
  salvageRingSegments: 10,
};

export function getRenderTuningProfile(metrics: LayoutMetrics = getLayout()): RenderTuningProfile {
  return (isNarrowViewport(metrics) || isShortViewport(metrics))
    ? CONSTRAINED_PROFILE
    : DEFAULT_PROFILE;
}
