import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, BASE, WEAPONS } from '../src/engine.js';
const step = (g, seconds, input = {}) => { for (let t = 0; t < seconds; t += .025) g.update(.025, input); };
const safeGame = () => { const g = new Game({ seed: 42 }); g.enemies = []; g.spawnTimer = 1000; return g; };

test('world generation supplies exactly three relays and a reproducible layout', () => {
  const a = safeGame(), b = safeGame();
  assert.equal(a.loot.filter(l => l.type === 'relay').length, 3);
  assert.deepEqual(a.loot, b.loot); assert.ok(a.props.length > 80);
});
test('movement, sprint consumption and recovery work with bounded coordinates', () => {
  const g = safeGame(), x = g.player.x; step(g, 1, { x: 1, sprint: true });
  assert.ok(g.player.x > x + 240); assert.ok(g.player.stamina < 75);
  step(g, 2); assert.equal(g.player.stamina, 100);
  g.player.x = 2390; step(g, .1, { x: 1 }); assert.ok(g.player.x <= 2386);
});
test('buildings block movement', () => {
  const g = safeGame(); const b = g.props.find(p => p.type === 'building');
  g.player.x = b.x - 20; g.player.y = b.y + 30; step(g, .5, { x: 1 });
  assert.ok(g.player.x < b.x);
});
test('shooting kills an enemy along a swept bullet path and spends ammunition', () => {
  const g = safeGame();
  g.enemies = [{ x: 1290, y: 1050, hp: 25, maxHp: 25, type: 'walker', r: 13, speed: 0, attack: 0, flash: 0, angle: 0 }];
  step(g, .15, { shoot: true, angle: 0 });
  assert.equal(g.kills, 1); assert.equal(g.magazines[0], 11); assert.ok(g.noise > 0); assert.equal(g.enemies.length, 0);
});
test('reload consumes reserve ammunition exactly once', () => {
  const g = safeGame(); g.magazines[0] = 2; const reserve = g.inventory.ammo;
  assert.equal(g.reload(), true); assert.equal(g.reload(), false); step(g, 1.6);
  assert.equal(g.magazines[0], WEAPONS[0].clip); assert.equal(g.inventory.ammo, reserve - 10);
});
test('loot requires proximity and hold duration and cannot be collected twice', () => {
  const g = safeGame(), l = g.loot.find(l => l.type === 'cache');
  step(g, 1, { interact: true }); assert.equal(l.opened, false);
  g.player.x = l.x; g.player.y = l.y; const old = g.inventory.scrap;
  step(g, .3, { interact: true }); assert.equal(l.opened, false);
  step(g, .5, { interact: true }); assert.equal(l.opened, true); assert.ok(g.inventory.scrap > old);
  const current = g.inventory.scrap; step(g, .1, { interact: true }); assert.equal(g.inventory.scrap, current);
});
test('purchases enforce proximity, affordability, levels and weapon unlocks', () => {
  const g = safeGame(); assert.equal(g.switchWeapon(1), false);
  assert.equal(g.purchase('rifle'), false); g.inventory.scrap = 999; g.inventory.energy = 999;
  g.player.x = 10; assert.equal(g.purchase('shotgun'), false); g.player.x = BASE.x;
  assert.equal(g.purchase('shotgun'), true); assert.equal(g.purchase('shotgun'), false); assert.equal(g.switchWeapon(1), true);
  for (let i = 0; i < 4; i++) assert.equal(g.purchase('turret'), true);
  assert.equal(g.turrets.length, 4); assert.equal(g.purchase('turret'), false);
});
test('medical items and structural repair respect maximum health', () => {
  const g = safeGame(); assert.equal(g.heal(), false); g.player.hp = 70; assert.equal(g.heal(), true); assert.equal(g.player.hp, 100);
  assert.equal(g.inventory.medkits, 1); assert.equal(g.purchase('repair'), false);
  g.base.hp = 280; assert.equal(g.purchase('repair'), true); assert.equal(g.base.hp, 300); assert.equal(g.inventory.scrap, 6);
});
test('night transitions award supplies and progress the mission', () => {
  const g = safeGame(); g.time = .01; g.update(.025); assert.equal(g.phase, 'night');
  const ammo = g.inventory.ammo; g.time = .01; g.update(.025);
  assert.equal(g.day, 2); assert.equal(g.phase, 'day'); assert.equal(g.inventory.ammo, ammo + 42);
});
test('turrets acquire threats and damage them automatically', () => {
  const g = safeGame(); g.inventory.scrap = 100; g.inventory.energy = 30; g.purchase('turret'); const t = g.turrets[0];
  g.enemies = [{ x: t.x + 90, y: t.y, hp: 20, maxHp: 20, type: 'walker', r: 13, speed: 0, attack: 0, flash: 0, angle: 0 }];
  step(g, .5); assert.equal(g.kills, 1);
});
test('victory requires both relays and five completed nights', () => {
  const g = safeGame(); g.inventory.relays = 3; step(g, .1); assert.equal(g.state, 'playing');
  g.day = 5; g.phase = 'night'; g.time = .01; g.update(.025); assert.equal(g.state, 'won');
  const h = safeGame(); h.day = 5; h.phase = 'night'; h.time = .01; h.update(.025);
  assert.equal(h.phase, 'extraction'); assert.equal(h.state, 'playing'); h.inventory.relays = 3; h.update(.025); assert.equal(h.state, 'won');
});
test('death and refuge destruction end a run and stop simulation', () => {
  for (const target of ['player', 'base']) { const g = safeGame(); g[target].hp = 0; g.update(.025); assert.equal(g.state, 'lost'); const elapsed = g.elapsed; step(g, 1); assert.equal(g.elapsed, elapsed); }
});
