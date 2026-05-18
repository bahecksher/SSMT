import Phaser from 'phaser';
import { TITLE_FONT } from '../constants';
import type { RivalDef } from '../data/rivalData';
import { COMPANIES } from '../data/companyData';
import { CommPanel } from './CommPanel';
import { darkenColor } from '../utils/geometry';
import { createLiaisonPortrait } from './LiaisonComm';

export class RivalComm extends CommPanel {
  constructor(scene: Phaser.Scene, rival: RivalDef, options: { width?: number; depth?: number; autoHideMs?: number } = {}) {
    const company = COMPANIES[rival.companyId];
    super(
      scene,
      {
        nameLabel: `${rival.callsign} // ${rival.repLabel}`,
        nameColor: rival.color,
        nameFontFamily: TITLE_FONT,
        textColor: rival.color,
        fillColor: darkenColor(rival.color, 0.12),
        borderColor: rival.color,
        innerBorderColor: rival.accent,
        wipeDirection: 'none',
        autoHideMs: 4800,
        pulseDuration: 420,
        pulseAlpha: 0.62,
        scanAngle: -1,
        scanDuration: 1500,
      },
      createLiaisonPortrait(scene, company),
      { ...options, depth: options.depth ?? 149 },
    );
  }
}
