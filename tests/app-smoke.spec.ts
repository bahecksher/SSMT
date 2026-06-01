import { expect, test } from '@playwright/test';
import { collectPageErrors, expectCanvasVisible, gotoTestApp, sceneState, waitForScene } from './helpers';

test('boots the desktop game shell without page errors', async ({ page }) => {
  const errors = collectPageErrors(page);

  await gotoTestApp(page);
  await waitForScene(page, 'MenuScene');
  await expectCanvasVisible(page);

  expect(errors).toEqual([]);
});

test('starts a solo run and toggles pause/resume', async ({ page }) => {
  const errors = collectPageErrors(page);

  await gotoTestApp(page);
  await page.evaluate(() => window.__BITP_TEST__?.startSolo());
  await waitForScene(page, 'MissionSelectScene');

  await page.evaluate(() => window.__BITP_TEST__?.deployMission());
  await waitForScene(page, 'GameScene');
  await expectCanvasVisible(page);

  // Wait for countdown to finish and gameplay to begin
  await expect.poll(async () => (await sceneState(page)).gameState, { timeout: 10_000 }).toBe('PLAYING');

  await page.evaluate(() => window.__BITP_TEST__?.togglePause());
  await expect.poll(async () => (await sceneState(page)).gameState).toBe('PAUSED');

  await page.evaluate(() => window.__BITP_TEST__?.togglePause());
  await expect.poll(async () => (await sceneState(page)).gameState).toBe('PLAYING');

  expect(errors).toEqual([]);
});

test('persists callsign edits through localStorage', async ({ page }) => {
  const errors = collectPageErrors(page);

  await gotoTestApp(page);
  const updated = await page.evaluate(() => window.__BITP_TEST__?.setCallsignInitials('EZZ'));
  expect(updated).toMatch(/^EZZ-\d{3}$/);

  await page.reload();
  await page.waitForFunction(() => !!window.__BITP_TEST__);
  const persisted = await page.evaluate(() => window.localStorage.getItem('ssmt_player_name'));
  expect(persisted).toBe(updated);

  expect(errors).toEqual([]);
});
