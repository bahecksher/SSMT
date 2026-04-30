import assert from 'node:assert/strict';
import { SharedWorldSimulation } from '../src/game/sharedVersus/SharedWorldSimulation.ts';
import type { SharedServerMessage } from '../src/game/sharedVersus/types.ts';

function collectSink(messages: SharedServerMessage[]) {
  return {
    send(message: SharedServerMessage): void {
      messages.push(message);
    },
  };
}

function findInBoundsDrifter(sim: SharedWorldSimulation, sink: ReturnType<typeof collectSink>) {
  for (let i = 0; i < 80; i++) {
    const drifter = sim.getSnapshot().drifters.find((d) => (
      !d.depleted &&
      d.x >= d.radius &&
      d.x <= 1 - d.radius &&
      d.y >= d.radius &&
      d.y <= 1 - d.radius
    ));
    if (drifter) return drifter;
    sim.tick(100, sink);
  }
  throw new Error('No in-bounds drifter found');
}

function testTwoPlayersDrainSharedSalvage(): void {
  const messages: SharedServerMessage[] = [];
  const sim = new SharedWorldSimulation({ matchId: 'shared-test', seed: 1 });
  const sink = collectSink(messages);
  sim.addPlayer('p1', 'P1');
  sim.addPlayer('p2', 'P2');
  const firstSalvage = sim.getSnapshot().salvage[0];
  assert.ok(firstSalvage);
  sim.handleMessage({ type: 'player_pose', playerId: 'p1', x: firstSalvage.x, y: firstSalvage.y, angle: 0, shielded: false }, sink);
  sim.handleMessage({ type: 'player_pose', playerId: 'p2', x: firstSalvage.x, y: firstSalvage.y, angle: 0, shielded: false }, sink);

  for (let i = 0; i < 10; i++) sim.tick(100, sink);
  const snapshot = sim.getSnapshot();
  const updatedSalvage = snapshot.salvage.find((s) => s.id === firstSalvage.id);
  const p1 = snapshot.players.find((p) => p.id === 'p1');
  const p2 = snapshot.players.find((p) => p.id === 'p2');

  assert.ok(updatedSalvage);
  assert.ok(updatedSalvage.hp < firstSalvage.hp);
  assert.ok(p1 && p1.score > 0);
  assert.ok(p2 && p2.score > 0);
  assert.equal(Math.round(p1.score), Math.round(p2.score));
}

function testPlayerOverlapIsHarmless(): void {
  const messages: SharedServerMessage[] = [];
  const sim = new SharedWorldSimulation({ matchId: 'overlap-test', seed: 2 });
  const sink = collectSink(messages);
  sim.addPlayer('p1', 'P1');
  sim.addPlayer('p2', 'P2');
  sim.handleMessage({ type: 'player_pose', playerId: 'p1', x: 0.5, y: 0.5, angle: 0, shielded: false }, sink);
  sim.handleMessage({ type: 'player_pose', playerId: 'p2', x: 0.5, y: 0.5, angle: 0, shielded: false }, sink);

  for (let i = 0; i < 10; i++) sim.tick(100, sink);

  assert.equal(messages.some((m) => m.type === 'player_terminal'), false);
  assert.equal(sim.getSnapshot().players.filter((p) => p.status === 'active').length, 2);
}

function testSharedGateAllowsSeparateExtraction(): void {
  const messages: SharedServerMessage[] = [];
  const sim = new SharedWorldSimulation({ matchId: 'gate-test', seed: 3 });
  const sink = collectSink(messages);

  for (let i = 0; i < 310; i++) sim.tick(100, sink);
  sim.addPlayer('p1', 'P1');
  sim.addPlayer('p2', 'P2');
  const gate = sim.getSnapshot().gate;
  assert.ok(gate?.extractable);
  sim.handleMessage({ type: 'player_pose', playerId: 'p1', x: gate.x, y: gate.y, angle: 0, shielded: false }, sink);
  sim.handleMessage({ type: 'extract_request', playerId: 'p1' }, sink);
  const snapshot = sim.getSnapshot();

  assert.equal(snapshot.players.find((p) => p.id === 'p1')?.status, 'extracted');
  assert.equal(snapshot.players.find((p) => p.id === 'p2')?.status, 'active');
}

function testAsteroidContactKillsUnshieldedPlayer(): void {
  const messages: SharedServerMessage[] = [];
  const sim = new SharedWorldSimulation({ matchId: 'asteroid-hit-test', seed: 6 });
  const sink = collectSink(messages);
  sim.addPlayer('p1', 'P1');
  const drifter = findInBoundsDrifter(sim, sink);
  sim.handleMessage({ type: 'player_pose', playerId: 'p1', x: drifter.x, y: drifter.y, angle: 0, shielded: false }, sink);
  sim.tick(100, sink);

  const player = sim.getSnapshot().players.find((p) => p.id === 'p1');
  const terminal = messages.find((m) => m.type === 'player_terminal' && m.playerId === 'p1');
  assert.equal(player?.status, 'dead');
  assert.equal(terminal?.type, 'player_terminal');
  if (terminal?.type === 'player_terminal') assert.equal(terminal.cause, 'asteroid');
}

function testAsteroidContactConsumesShieldOnce(): void {
  const messages: SharedServerMessage[] = [];
  const sim = new SharedWorldSimulation({ matchId: 'asteroid-shield-test', seed: 7 });
  const sink = collectSink(messages);
  sim.addPlayer('p1', 'P1');
  const drifter = findInBoundsDrifter(sim, sink);
  sim.handleMessage({ type: 'player_pose', playerId: 'p1', x: drifter.x, y: drifter.y, angle: 0, shielded: true }, sink);
  sim.tick(100, sink);
  sim.handleMessage({ type: 'player_pose', playerId: 'p1', x: drifter.x, y: drifter.y, angle: 0, shielded: true }, sink);
  sim.tick(100, sink);

  const snapshot = sim.getSnapshot();
  const player = snapshot.players.find((p) => p.id === 'p1');
  const impactedDrifter = snapshot.drifters.find((d) => d.id === drifter.id);
  assert.equal(player?.status, 'active');
  assert.equal(player?.shielded, false);
  assert.equal(impactedDrifter?.depleted, true);
  assert.equal(messages.some((m) => m.type === 'player_terminal'), false);
}

function testWorldLaserOnlyHitsActivePlayers(): void {
  const messages: SharedServerMessage[] = [];
  const sim = new SharedWorldSimulation({ matchId: 'laser-test', seed: 4 });
  const sink = collectSink(messages);
  sim.addPlayer('p1', 'P1');
  sim.addPlayer('p2', 'P2');
  const target = sim.getSnapshot().players.find((p) => p.id === 'p1');
  assert.ok(target);
  sim.handleMessage({ type: 'player_pose', playerId: 'p1', x: 0.5, y: 0.25, angle: 0, shielded: false }, sink);
  sim.handleMessage({ type: 'fire_laser', playerId: 'p2', lane: 'top' }, sink);
  for (let i = 0; i < 10; i++) sim.tick(100, sink);

  assert.equal(sim.getSnapshot().players.find((p) => p.id === 'p1')?.status, 'dead');

  const sim2 = new SharedWorldSimulation({ matchId: 'laser-extracted-test', seed: 5 });
  const messages2: SharedServerMessage[] = [];
  const sink2 = collectSink(messages2);
  for (let i = 0; i < 310; i++) sim2.tick(100, sink2);
  sim2.addPlayer('p1', 'P1');
  const gate = sim2.getSnapshot().gate;
  assert.ok(gate?.extractable);
  sim2.handleMessage({ type: 'player_pose', playerId: 'p1', x: gate.x, y: gate.y, angle: 0, shielded: false }, sink2);
  sim2.handleMessage({ type: 'extract_request', playerId: 'p1' }, sink2);
  sim2.handleMessage({ type: 'fire_laser', playerId: 'p2', lane: 'top' }, sink2);
  for (let i = 0; i < 10; i++) sim2.tick(100, sink2);

  assert.equal(sim2.getSnapshot().players.find((p) => p.id === 'p1')?.status, 'extracted');
}

testTwoPlayersDrainSharedSalvage();
testPlayerOverlapIsHarmless();
testSharedGateAllowsSeparateExtraction();
testAsteroidContactKillsUnshieldedPlayer();
testAsteroidContactConsumesShieldOnce();
testWorldLaserOnlyHitsActivePlayers();
console.log('sharedVersusSimulation tests passed');
