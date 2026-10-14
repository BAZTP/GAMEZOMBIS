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

const enemy = (x, y, extra = {}) => ({ x, y, hp: 500, maxHp: 500, type: 'walker', r: 13, speed: 48, attack: 0, flash: 0, angle: 0, wander: 0, ...extra });
const stock = g => Object.assign(g.inventory, { scrap: 999, energy: 999, wood: 999, parts: 999 });

test('all seven weapons unlock, load and fire; special ammunition stays separate', () => {
  const g = safeGame(); stock(g);
  for (let i = 1; i < WEAPONS.length; i++) {
    const w = WEAPONS[i]; assert.equal(g.switchWeapon(i), false);
    assert.equal(g.purchase(w.unlock), true); assert.equal(g.switchWeapon(i), true);
    assert.equal(g.magazines[i], w.clip); g.shotTimer = 0; g.shoot();
    assert.equal(g.magazines[i], w.clip - 1);
    assert.equal(g.bullets.at(-1).damage, w.damage);
    const reserves = { ...g.inventory };
    assert.equal(g.reload(), true); step(g, w.reload + .1);
    assert.equal(g.magazines[i], w.clip); assert.equal(g.inventory[w.ammo], reserves[w.ammo] - 1);
    for (const ammo of ['ammo', 'bolts', 'rockets']) if (ammo !== w.ammo) assert.equal(g.inventory[ammo], reserves[ammo]);
  }
  g.switchWeapon(5); g.magazines[5] = 0; g.inventory.bolts = 0;
  assert.equal(g.reload(), false); assert.equal(g.switchWeapon(7), false);
});

test('sniper penetrates two distinct enemies in spatial order without repeated hits', () => {
  const g = safeGame(); g.props = []; stock(g); g.purchase('sniper'); g.switchWeapon(4); g.shotTimer = 0; g.player.angle = 0;
  const a = enemy(1255, 1050, { speed: 0 }), b = enemy(1305, 1050, { speed: 0 }), c = enemy(1370, 1050, { speed: 0 });
  g.enemies = [c, b, a]; g.shoot(); step(g, .4);
  assert.equal(a.hp, 380); assert.equal(b.hp, 380); assert.equal(c.hp, 500);
  assert.equal(g.bullets.length, 0);
});

test('grenades damage multiple enemies without damaging the player or refuge', () => {
  const g = safeGame(); g.props = []; stock(g); g.purchase('launcher'); g.switchWeapon(6); g.shotTimer = 0; g.player.angle = 0;
  g.enemies = [enemy(1300, 1050, { speed: 0 }), enemy(1330, 1080, { speed: 0 }), enemy(1520, 1050, { speed: 0 })];
  g.shoot(); step(g, .3);
  assert.ok(g.enemies[0].hp < 500); assert.ok(g.enemies[1].hp < 500); assert.equal(g.enemies[2].hp, 500);
  assert.equal(g.player.hp, 100); assert.equal(g.base.hp, 300); assert.equal(g.blasts.length, 1);
});

test('walls stop fast projectiles and blast damage; expired grenades explode once', () => {
  for (const weapon of [4, 6]) {
    const g = safeGame(); stock(g); g.props = [{ type: 'building', x: 1260, y: 1000, w: 8, h: 100 }];
    g.purchase(WEAPONS[weapon].unlock); g.switchWeapon(weapon); g.shotTimer = 0; g.player.angle = 0;
    const e = enemy(1285, 1050, { speed: 0 }); g.enemies = [e]; g.shoot(); step(g, .4); assert.equal(e.hp, 500);
    assert.equal(g.bullets.length, 0);
  }
  const g = safeGame(); stock(g); g.props = []; g.purchase('launcher'); g.switchWeapon(6); g.shotTimer = 0;
  g.shoot(); step(g, 1.5); assert.equal(g.events.filter(e => e === 'explosion').length, 1); assert.equal(g.bullets.length, 0);
});

test('zombies cannot enter from any direction even in a crowd; they damage the perimeter', () => {
  for (const phase of ['day', 'night']) {
    const g = safeGame(); g.phase = phase; g.props = []; Object.assign(g.player, { x: BASE.x, y: BASE.y, hp: 1 });
    g.base.hp = g.base.maxHp = 10000;
    g.enemies = Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2; return enemy(BASE.x + Math.cos(a) * 180, BASE.y + Math.sin(a) * 180, { type: i % 2 ? 'brute' : 'runner', r: i % 2 ? 22 : 13, speed: 105 }); });
    for (let i = 0; i < 200; i++) {
      g.update(.025);
      for (const e of g.enemies) assert.ok(Math.abs(e.x - BASE.x) >= BASE.halfSize + e.r || Math.abs(e.y - BASE.y) >= BASE.halfSize + e.r);
    }
    assert.equal(g.player.hp, 1); assert.ok(g.base.hp < 10000); assert.equal(g.state, 'playing');
  }
});

test('refuge boundaries protect only the inside, including gate edges', () => {
  const g = safeGame(); g.props = [];
  Object.assign(g.player, { x: BASE.x, y: BASE.y + BASE.halfSize });
  g.enemies = [enemy(BASE.x, g.player.y + 13)]; step(g, .2);
  assert.equal(g.insideRefuge(), true); assert.equal(g.player.hp, 100); assert.ok(g.base.hp < 300);
  g.player.y += 5; g.enemies[0].attack = 0; step(g, .1);
  assert.equal(g.insideRefuge(), false); assert.ok(g.player.hp < 100);
  Object.assign(g.player, { x: BASE.x, y: BASE.y });
  Object.assign(g.enemies[0], { x: BASE.x, y: BASE.y }); g.update(.025);
  assert.equal(g.insideRefuge(g.enemies[0]), false);
});

test('material loot is reachable and pays out only once', () => {
  for (let seed = 0; seed < 25; seed++) {
    const g = new Game({ seed });
    for (const l of g.loot) assert.equal(g.props.some(o => o.type === 'building' && l.x > o.x - 14 && l.x < o.x + o.w + 14 && l.y > o.y - 14 && l.y < o.y + o.h + 14), false);
  }
  const g = safeGame();
  for (const [type, resource, amount] of [['lumber', 'wood', 20], ['technology', 'parts', 6]]) {
    const l = g.loot.find(l => l.type === type); Object.assign(g.player, { x: l.x, y: l.y });
    const before = g.inventory[resource]; step(g, .8, { interact: true });
    assert.equal(g.inventory[resource], before + amount); assert.equal(l.opened, true);
    step(g, .05, { interact: true }); assert.equal(g.inventory[resource], before + amount);
  }
});

test('refuge upgrades charge every material, increase capacity and reduce incoming damage', () => {
  const g = safeGame(); g.inventory.scrap = 999; g.inventory.energy = 999;
  const before = { ...g.inventory }; assert.equal(g.purchase('walls'), false); assert.deepEqual(g.inventory, before);
  stock(g);
  for (let i = 1; i <= 3; i++) {
    const cost = g.upgradeCost('walls'), before = { ...g.inventory };
    assert.equal(g.purchase('walls'), true); assert.equal(g.base.maxHp, 300 + 120 * i);
    for (const [id, amount] of Object.entries(cost)) assert.equal(g.inventory[id], before[id] - amount);
  }
  assert.equal(g.purchase('walls'), false);
  Object.assign(g.player, { x: BASE.x, y: BASE.y }); g.enemies = [enemy(BASE.x + 111.1, BASE.y)];
  const hp = g.base.hp; g.update(.025); assert.ok(Math.abs(hp - g.base.hp - 2.75) < 1e-8);
});

test('spikes kill attackers and infirmary heals only inside up to maximum health', () => {
  const g = safeGame(); stock(g); g.purchase('spikes'); g.purchase('infirmary');
  g.player.hp = 50; step(g, .5); assert.equal(g.player.hp, 50);
  Object.assign(g.player, { x: BASE.x, y: BASE.y });
  g.enemies = [enemy(BASE.x + 111.1, BASE.y, { hp: 5 })]; step(g, 1);
  assert.equal(g.kills, 1); assert.ok(g.player.hp >= 53 && g.player.hp < 54);
  g.player.hp = 99.9; step(g, .2); assert.equal(g.player.hp, 100);
});

test('generator uses energy only for active repairs and cannot repair without fuel', () => {
  const g = safeGame(); stock(g); g.purchase('generator'); g.inventory.energy = 1;
  step(g, 1); assert.equal(g.inventory.energy, 1); assert.equal(g.generatorFuelTime, 0);
  g.base.hp = 200; step(g, 8.2); assert.equal(g.inventory.energy, 0);
  assert.ok(Math.abs(g.base.hp - 232) < 1e-6); assert.equal(g.generatorFuelTime, 0);
  step(g, 1); assert.ok(Math.abs(g.base.hp - 232) < 1e-6);
  g.inventory.energy = 1; g.base.hp = 299.95; step(g, .5); assert.equal(g.base.hp, 300);
  const fuel = g.generatorFuelTime; step(g, .5); assert.equal(g.generatorFuelTime, fuel);
});

test('special ammunition recipes consume materials and cancelled reload does not create ammo', () => {
  const g = safeGame(); stock(g); g.purchase('crossbow'); g.purchase('launcher');
  assert.equal(g.inventory.bolts + g.magazines[5], 12); assert.equal(g.inventory.rockets + g.magazines[6], 6);
  for (const [id, amount] of [['bolts', 12], ['rockets', 6]]) {
    const before = g.inventory[id]; assert.equal(g.purchase(id), true); assert.equal(g.inventory[id], before + amount);
  }
  g.switchWeapon(5); g.magazines[5] = 0; const reserve = g.inventory.bolts;
  g.reload(); step(g, .2); g.switchWeapon(0); step(g, 1.5);
  assert.equal(g.magazines[5], 0); assert.equal(g.inventory.bolts, reserve);
});
