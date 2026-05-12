import Phaser from 'phaser';
import { gameConfig } from './game/config';

declare global {
  interface Window {
    __BITP_GAME__?: Phaser.Game;
    __BITP_TEST__?: {
      getActiveScene: () => string | null;
      getSceneState: () => Record<string, unknown>;
      setCallsignInitials: (initials: string) => string | null;
      setMenuMode: (mode: string) => void;
      startSolo: () => void;
      deployMission: () => void;
      createVersusRoom: () => Promise<string | null>;
      joinVersusRoom: (roomCode: string) => Promise<string | null>;
      toggleVersusReady: () => Promise<void>;
      togglePause: () => void;
      jumpToPhase: (phase: number) => void;
    };
  }
}

const TEXT_RESOLUTION = (() => {
  if (typeof window === 'undefined') return 1;
  return Math.min(2, Math.max(1, Math.ceil(window.devicePixelRatio || 1)));
})();

const originalTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;

Phaser.GameObjects.GameObjectFactory.prototype.text = function (...args: Parameters<typeof originalTextFactory>) {
  const text = originalTextFactory.apply(this, args);
  text.setResolution(TEXT_RESOLUTION);
  return text;
};

const game = new Phaser.Game(gameConfig);

if (typeof window !== 'undefined') {
  window.__BITP_GAME__ = game;

  if (new URLSearchParams(window.location.search).get('test') === '1') {
    const getScene = (key: string): any => game.scene.getScene(key);
    const getActiveScene = () => {
      const scenes = game.scene.getScenes(true);
      return scenes[scenes.length - 1]?.scene.key ?? null;
    };

    window.__BITP_TEST__ = {
      getActiveScene,
      getSceneState: () => {
        const active = getActiveScene();
        const menu = getScene('MenuScene');
        const gameScene = getScene('GameScene');
        return {
          activeScene: active,
          menuMode: menu?.saveSystem?.getSelectedMode?.() ?? null,
          menuVersusState: menu?.versusState ?? null,
          menuVersusRoomCode: menu?.versusSession?.roomCode ?? null,
          menuVersusRoster: menu?.versusSession?.getActivePlayers?.() ?? [],
          gameState: gameScene?.state ?? null,
          gameRunMode: gameScene?.runMode ?? null,
        };
      },
      setCallsignInitials: (initials: string) => {
        const menu = getScene('MenuScene');
        const updated = menu?.saveSystem?.setPlayerInitials?.(initials) ?? null;
        if (updated && menu?.pilotText) {
          menu.pilotText.setText(`PILOT: ${updated}`);
        }
        return updated;
      },
      setMenuMode: (mode: string) => {
        const menu = getScene('MenuScene');
        menu?.saveSystem?.setSelectedMode?.(mode);
        menu?.updateModeTabStyles?.call(menu);
        menu?.loadLeaderboard?.call(menu);
      },
      startSolo: () => {
        const menu = getScene('MenuScene');
        menu?.saveSystem?.setSelectedMode?.('ARCADE');
        menu?.scene?.start?.('MissionSelectScene', { mode: 'ARCADE' });
      },
      deployMission: () => {
        getScene('MissionSelectScene')?.deploy?.();
      },
      createVersusRoom: async () => {
        const menu = getScene('MenuScene');
        menu?.saveSystem?.setSelectedMode?.('VERSUS');
        menu?.updateModeTabStyles?.call(menu);
        menu?.loadLeaderboard?.call(menu);
        await menu?.createVersusRoom?.call(menu);
        return menu?.versusSession?.roomCode ?? null;
      },
      joinVersusRoom: async (roomCode: string) => {
        const menu = getScene('MenuScene');
        menu?.saveSystem?.setSelectedMode?.('VERSUS');
        menu?.updateModeTabStyles?.call(menu);
        menu?.loadLeaderboard?.call(menu);
        await menu?.startVersusSession?.call(menu, roomCode);
        return menu?.versusSession?.roomCode ?? null;
      },
      toggleVersusReady: async () => {
        const menu = getScene('MenuScene');
        await menu?.toggleVersusReady?.call(menu);
      },
      togglePause: () => {
        const gameScene = getScene('GameScene');
        gameScene?.togglePause?.call(gameScene);
      },
      jumpToPhase: (phase: number) => {
        const gameScene = getScene('GameScene');
        gameScene?.debugJumpToPhase?.call(gameScene, phase);
      },
    };
  }
}
