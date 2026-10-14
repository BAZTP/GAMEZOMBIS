export const WORLD = { w: 2400, h: 1800 };
export const BASE = { x: 1200, y: 900, r: 105, halfSize: 98 };
export const RESOURCES = {
  scrap: { label: 'Chatarra', icon: '▱' }, energy: { label: 'Energía', icon: 'ϟ' },
  wood: { label: 'Madera', icon: '▤' }, parts: { label: 'Componentes', icon: '⚙' },
};
export const WEAPONS = [
  { name: 'Pistola M9', short: 'M9', damage: 30, interval: .27, clip: 12, spread: .025, pellets: 1, reload: 1.35, noise: 5, ammo: 'ammo', length: 1 },
  { name: 'Escopeta Eco', short: 'ECO', unlock: 'shotgun', damage: 23, interval: .68, clip: 6, spread: .16, pellets: 5, reload: 1.8, noise: 13, ammo: 'ammo', life: .38, length: 1.65 },
  { name: 'Fusil Eclipse', short: 'ECL', unlock: 'rifle', damage: 29, interval: .115, clip: 30, spread: .035, pellets: 1, reload: 1.6, noise: 5, ammo: 'ammo', length: 2 },
  { name: 'Subfusil Ráfaga', short: 'RAF', unlock: 'smg', damage: 18, interval: .075, clip: 40, spread: .07, pellets: 1, reload: 1.8, noise: 4, ammo: 'ammo', length: 1.3 },
  { name: 'Rifle Vigía', short: 'VIG', unlock: 'sniper', damage: 120, interval: 1, clip: 5, spread: .003, pellets: 1, reload: 2, noise: 12, ammo: 'ammo', speed: 1500, life: 1, pierce: 2, length: 2.6 },
  { name: 'Ballesta Silente', short: 'SIL', unlock: 'crossbow', damage: 90, interval: .85, clip: 1, spread: 0, pellets: 1, reload: 1.05, noise: 1, ammo: 'bolts', speed: 800, life: 1.2, length: 1.5 },
  { name: 'Lanzagranadas Trueno', short: 'TRU', unlock: 'launcher', damage: 145, interval: 1.1, clip: 3, spread: .02, pellets: 1, reload: 2.3, noise: 22, ammo: 'rockets', speed: 510, life: 1.1, splash: 100, length: 1.9 },
];
export const UPGRADES = {
  repair: { title: 'Reparar refugio', description: '+90 de integridad estructural.', cost: { scrap: 18 }, icon: '✚' },
  medkit: { title: 'Botiquín de campo', description: 'Recupera 60 de salud con Q.', cost: { scrap: 10, energy: 3 }, icon: '♡' },
  ammo: { title: 'Munición ×60', description: 'Balas para pistola, escopeta, fusil, subfusil y rifle.', cost: { scrap: 8 }, icon: '⁙' },
  damage: { title: 'Balística mejorada', description: '+25% de daño. Máximo 4 niveles.', cost: { scrap: 25, energy: 5 }, icon: '↗', max: 4 },
  shotgun: { title: 'Escopeta Eco', description: 'Cinco perdigones. Control de multitudes.', cost: { scrap: 30, energy: 8 }, icon: '⌁', max: 1 },
  rifle: { title: 'Fusil Eclipse', description: 'Fuego automático de alta cadencia.', cost: { scrap: 55, energy: 15 }, icon: '⌁', max: 1 },
  smg: { title: 'Subfusil Ráfaga', description: '40 balas por cargador. Fuego muy rápido.', cost: { scrap: 38, parts: 4 }, icon: '⌁', max: 1 },
  sniper: { title: 'Rifle Vigía', description: '120 de daño. Atraviesa hasta 2 enemigos.', cost: { scrap: 65, parts: 8, energy: 10 }, icon: '⌖', max: 1 },
  crossbow: { title: 'Ballesta Silente', description: '90 de daño y ruido mínimo. Incluye 12 virotes.', cost: { scrap: 18, wood: 16 }, icon: '⋈', max: 1 },
  launcher: { title: 'Lanzagranadas Trueno', description: 'Explosión de área sin daño aliado. Incluye 6 granadas.', cost: { scrap: 80, parts: 12, energy: 16 }, icon: '✹', max: 1 },
  bolts: { title: 'Virotes ×12', description: 'Munición para la ballesta.', cost: { scrap: 4, wood: 6 }, icon: '↟' },
  rockets: { title: 'Granadas ×6', description: 'Munición para el lanzagranadas.', cost: { scrap: 14, parts: 2, energy: 4 }, icon: '✹' },
  turret: { title: 'Torreta centinela', description: 'Defensa automática. Máximo 4 torretas.', cost: { scrap: 35, energy: 12 }, icon: '⌖', max: 4 },
  walls: { title: 'Blindaje del refugio', description: '+120 de integridad y 15% menos daño por nivel.', cost: { scrap: 25, wood: 14, parts: 2 }, icon: '▱', max: 3 },
  spikes: { title: 'Estacas perimetrales', description: '12 de daño por segundo y nivel a los zombis junto al muro.', cost: { wood: 20, scrap: 12 }, icon: '⋀', max: 3 },
  infirmary: { title: 'Enfermería', description: 'Recupera 3 de salud por segundo y nivel dentro del refugio.', cost: { wood: 16, parts: 5, energy: 8 }, icon: '✚', max: 2 },
  generator: { title: 'Generador de reparación', description: 'Repara 4 puntos por segundo y nivel. Consume 1 energía cada 8 s de uso.', cost: { scrap: 30, parts: 8, wood: 10 }, icon: 'ϟ', max: 2 },
};
export const WEAPON_AMMO_LABELS = { ammo: 'BALAS', bolts: 'VIROTES', rockets: 'GRANADAS' };
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export function randomGenerator(seed = 8137) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export class Game {
  constructor({ seed = Date.now(), difficulty = 'normal' } = {}) {
    this.random = randomGenerator(seed);
    this.difficulty = difficulty;
    this.factor = difficulty === 'story' ? .65 : difficulty === 'hard' ? 1.3 : 1;
    this.player = { x: 1200, y: 1050, hp: 100, stamina: 100, angle: -Math.PI / 2, invulnerable: 0 };
    this.base = { ...BASE, hp: 300, maxHp: 300 };
    this.inventory = { scrap: 24, energy: 6, wood: 0, parts: 0, ammo: 108, bolts: 0, rockets: 0, medkits: 2, relays: 0 };
    this.levels = Object.fromEntries(Object.entries(UPGRADES).filter(([, u]) => u.max).map(([id]) => [id, 0]));
    this.weapon = 0; this.magazines = WEAPONS.map((w, i) => i === 0 ? w.clip : 0);
    this.generatorFuelTime = 0; this.blasts = [];
    this.phase = 'day'; this.day = 1; this.time = 80; this.elapsed = 0;
    this.kills = 0; this.score = 0; this.noise = 0; this.shotTimer = 0; this.reloadTimer = 0;
    this.spawnTimer = 3; this.state = 'playing'; this.enemies = []; this.bullets = [];
    this.particles = []; this.turrets = []; this.events = []; this.interaction = 0;
    this.shake = 0; this.message = 'Recupera los 3 relés y resiste 5 noches.';
    this.messageTime = 6;
    this.loot = []; this.props = []; this.scorch = [];
    this.makeWorld();
  }
  makeWorld() {
    const sites = [
      { x: 480, y: 390, name: 'ESTACIÓN NORTE', color: '#bdcc9b' },
      { x: 1940, y: 500, name: 'CLÍNICA ABANDONADA', color: '#95b8b6' },
      { x: 1870, y: 1420, name: 'DEPÓSITO 09', color: '#c49e73' },
      { x: 480, y: 1370, name: 'ZONA INDUSTRIAL', color: '#a8a58a' },
    ];
    this.sites = sites;
    sites.forEach((s, i) => {
      this.props.push({ x: s.x - 150, y: s.y - 115, w: 220, h: 95, type: 'building', color: s.color });
      this.props.push({ x: s.x + 110, y: s.y + 35, w: 65, h: 140, type: 'building', color: s.color });
      for (let j = 0; j < 6; j++) this.loot.push({ x: s.x - 90 + (j % 3) * 65, y: s.y + 20 + Math.floor(j / 3) * 70, type: j === 0 && i < 3 ? 'relay' : j === 2 ? 'medical' : j === 4 ? 'lumber' : j === 5 ? 'technology' : 'cache', opened: false, progress: 0 });
    });
    for (let i = 0; i < 22; i++) {
      const a = this.random() * Math.PI * 2, r = 240 + this.random() * 480;
      const x = BASE.x + Math.cos(a) * r, y = BASE.y + Math.sin(a) * r;
      if (this.props.some(o => o.type === 'building' && x > o.x - 35 && x < o.x + o.w + 35 && y > o.y - 35 && y < o.y + o.h + 35)) { i--; continue; }
      this.loot.push({ x, y, type: i % 3 === 0 ? 'lumber' : i % 3 === 1 ? 'technology' : 'cache', opened: false, progress: 0 });
    }
    for (let i = 0; i < 180; i++) {
      const x = 40 + this.random() * 2320, y = 40 + this.random() * 1720;
      if (dist({ x, y }, BASE) > 220 && !this.props.some(p => p.type === 'building' && Math.abs(p.x - x) < 230 && Math.abs(p.y - y) < 180))
        this.props.push({ x, y, r: 9 + this.random() * 21, type: this.random() > .3 ? 'tree' : 'rock', variation: this.random() });
    }
    for (let i = 0; i < 9; i++) this.spawnEnemy('walker', true);
  }
  notify(text, event = 'notice') { this.message = text; this.messageTime = 4; this.events.push(event); }
  nearestLoot() { return this.loot.filter(l => !l.opened && dist(l, this.player) < 70).sort((a, b) => dist(a, this.player) - dist(b, this.player))[0]; }
  nearBase() { return dist(this.player, this.base) < 210; }
  insideRefuge(entity = this.player) { return this.base.hp > 0 && Math.abs(entity.x - this.base.x) <= BASE.halfSize && Math.abs(entity.y - this.base.y) <= BASE.halfSize; }
  wallDistance(e) { return Math.hypot(Math.max(0, Math.abs(e.x - this.base.x) - BASE.halfSize), Math.max(0, Math.abs(e.y - this.base.y) - BASE.halfSize)); }
  keepOutside(e) {
    if (this.base.hp <= 0) return;
    const dx = e.x - this.base.x, dy = e.y - this.base.y, edge = BASE.halfSize + e.r + .1;
    if (Math.abs(dx) < edge && Math.abs(dy) < edge) {
      if (Math.abs(dx) > Math.abs(dy)) e.x = this.base.x + (Math.sign(dx) || 1) * edge;
      else e.y = this.base.y + (Math.sign(dy) || 1) * edge;
    }
  }
  weaponUnlocked(index) { const w = WEAPONS[index]; return !!w && (!w.unlock || this.levels[w.unlock] > 0); }
  switchWeapon(index) {
    if (!this.weaponUnlocked(index)) return false;
    this.weapon = index; this.reloadTimer = 0; this.shotTimer = .12; return true;
  }
  reload() {
    const w = WEAPONS[this.weapon];
    if (!this.reloadTimer && this.magazines[this.weapon] < w.clip && this.inventory[w.ammo] > 0) {
      this.reloadTimer = w.reload; this.events.push('reload'); return true;
    }
    return false;
  }
  heal() {
    if (this.player.hp >= 100 || this.inventory.medkits <= 0) return false;
    this.player.hp = Math.min(100, this.player.hp + 60); this.inventory.medkits--;
    this.notify('Botiquín aplicado. +60 de salud.', 'heal'); return true;
  }
  upgradeCost(id) {
    const u = UPGRADES[id]; if (!u) return null;
    const level = this.levels[id] || 0;
    return Object.fromEntries(Object.entries(u.cost).map(([k, v]) => [k, Math.ceil(v * (1 + level * .35))]));
  }
  purchase(id) {
    const u = UPGRADES[id]; if (!u || !this.nearBase() || this.state !== 'playing') return false;
    if (u.max && this.levels[id] >= u.max || id === 'repair' && this.base.hp >= this.base.maxHp) return false;
    const cost = this.upgradeCost(id);
    if (Object.entries(cost).some(([k, v]) => this.inventory[k] < v)) return false;
    for (const [k, v] of Object.entries(cost)) this.inventory[k] -= v;
    if (id === 'repair') this.base.hp = Math.min(this.base.maxHp, this.base.hp + 90);
    else if (id === 'ammo') this.inventory.ammo += 60;
    else if (id === 'bolts') this.inventory.bolts += 12;
    else if (id === 'rockets') this.inventory.rockets += 6;
    else if (id === 'medkit') this.inventory.medkits++;
    else {
      this.levels[id]++;
      const weaponIndex = WEAPONS.findIndex(w => w.unlock === id);
      if (weaponIndex >= 0) {
        const w = WEAPONS[weaponIndex];
        this.magazines[weaponIndex] = w.clip;
        if (w.ammo === 'bolts') this.inventory.bolts += 12 - w.clip;
        if (w.ammo === 'rockets') this.inventory.rockets += 6 - w.clip;
      }
      if (id === 'walls') { this.base.maxHp += 120; this.base.hp += 120; }
      if (id === 'turret') {
        const angle = (this.levels.turret - 1) * Math.PI / 2 + Math.PI / 4;
        this.turrets.push({ x: BASE.x + Math.cos(angle) * 130, y: BASE.y + Math.sin(angle) * 130, angle: 0, cooldown: 0 });
      }
    }
    this.notify(u.title + ': listo.', 'craft'); return true;
  }
  startNight() {
    if (this.phase !== 'day' || this.state !== 'playing') return;
    this.phase = 'night'; this.time = 45 + this.day * 5; this.spawnTimer = .5;
    this.notify(`Noche ${this.day}. La horda se acerca. Protege el refugio.`, 'alarm');
    if (this.day === 3 || this.day === 5) this.spawnEnemy('brute');
  }
  finishNight() {
    if (this.day === 5) {
      if (this.inventory.relays >= 3) { this.state = 'won'; this.events.push('win'); return; }
      this.phase = 'extraction'; this.time = Infinity;
      this.notify('La horda ha cedido. Recupera los relés restantes para evacuar.', 'dawn'); return;
    }
    this.day++; this.phase = 'day'; this.time = 80; this.spawnTimer = 6;
    this.inventory.scrap += 20; this.inventory.ammo += 42; this.inventory.energy += 6;
    this.inventory.wood += 8; this.inventory.parts += 2;
    this.base.hp = Math.min(this.base.maxHp, this.base.hp + 25);
    this.player.hp = Math.min(100, this.player.hp + 15);
    this.score += 150;
    this.notify('Amanecer. +20 chatarra · +42 balas · +6 energía · +8 madera · +2 componentes', 'dawn');
  }
  spawnEnemy(type = null, initial = false) {
    if (!type) { const r = this.random(); type = r < .12 && this.day >= 2 ? 'brute' : r < .38 ? 'runner' : 'walker'; }
    const a = this.random() * Math.PI * 2, r = initial ? 430 + this.random() * 550 : 850 + this.random() * 240;
    const hp = (type === 'brute' ? 220 : type === 'runner' ? 45 : 68) * (1 + (this.day - 1) * .13) * this.factor;
    this.enemies.push({ x: clamp(BASE.x + Math.cos(a) * r, 30, WORLD.w - 30), y: clamp(BASE.y + Math.sin(a) * r, 30, WORLD.h - 30), hp, maxHp: hp, type, r: type === 'brute' ? 22 : 13, speed: (type === 'runner' ? 105 : type === 'brute' ? 37 : 48) * (1 + (this.day - 1) * .07), attack: 0, angle: 0, flash: 0, wander: a });
  }
  burst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) { const a = this.random() * 6.28, speed = 25 + this.random() * 95; this.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .3 + this.random() * .4, color }); }
  }
  shoot() {
    if (this.reloadTimer > 0 || this.shotTimer > 0) return;
    if (this.magazines[this.weapon] <= 0) { this.reload(); return; }
    const w = WEAPONS[this.weapon], p = this.player;
    this.magazines[this.weapon]--; this.shotTimer = w.interval;
    this.noise = Math.min(100, this.noise + w.noise);
    for (let i = 0; i < w.pellets; i++) {
      const a = p.angle + (this.random() - .5) * w.spread * 2;
      this.bullets.push({ x: p.x + Math.cos(a) * 24, y: p.y + Math.sin(a) * 24, vx: Math.cos(a) * (w.speed || 980), vy: Math.sin(a) * (w.speed || 980), damage: w.damage * (1 + this.levels.damage * .25), life: w.life || .72, pierce: w.pierce || 1, splash: w.splash || 0, hit: new Set(), ammo: w.ammo });
    }
    this.burst(p.x + Math.cos(p.angle) * 26, p.y + Math.sin(p.angle) * 26, '#ffdc91', 3);
    this.shake = w.ammo === 'bolts' ? .5 : this.weapon === 1 ? 4 : 1.8; this.events.push(w.ammo === 'bolts' ? 'crossbow' : 'shot');
  }
  move(entity, dx, dy, radius = 14) {
    const blocked = (x, y) => this.props.some(o => o.type === 'building' && x + radius > o.x && x - radius < o.x + o.w && y + radius > o.y && y - radius < o.y + o.h);
    const x = clamp(entity.x + dx, radius, WORLD.w - radius), y = clamp(entity.y + dy, radius, WORLD.h - radius);
    if (!blocked(x, entity.y)) entity.x = x;
    if (!blocked(entity.x, y)) entity.y = y;
  }
  buildingHit(x, y, tx, ty) {
    let first = Infinity;
    for (const o of this.props) {
      if (o.type !== 'building') continue;
      let enter = 0, leave = 1;
      for (const [origin, delta, min, max] of [[x, tx - x, o.x, o.x + o.w], [y, ty - y, o.y, o.y + o.h]]) {
        if (Math.abs(delta) < 1e-9) { if (origin < min || origin > max) { enter = Infinity; break; } }
        else { const a = (min - origin) / delta, b = (max - origin) / delta; enter = Math.max(enter, Math.min(a, b)); leave = Math.min(leave, Math.max(a, b)); }
      }
      if (enter <= leave && enter <= 1) first = Math.min(first, enter);
    }
    return first;
  }
  hurtEnemy(e, damage) {
    if (e.hp <= 0) return;
    e.hp -= damage; e.flash = .12;
    if (e.hp <= 0) {
      this.kills++; this.score += e.type === 'brute' ? 60 : 15;
      if (this.random() > .55) this.inventory.scrap += 2;
      this.scorch.push({ x: e.x, y: e.y, r: e.r, a: e.angle });
      if (this.scorch.length > 90) this.scorch.shift();
    }
  }
  explode(b) {
    this.blasts.push({ x: b.x, y: b.y, radius: b.splash, life: .4 });
    this.burst(b.x, b.y, '#ffc06b', 24); this.shake = 6; this.events.push('explosion');
    for (const e of this.enemies) {
      const distance = dist(e, b);
      if (e.hp > 0 && distance <= b.splash && this.buildingHit(b.x, b.y, e.x, e.y) === Infinity)
        this.hurtEnemy(e, b.damage * (1 - .5 * distance / b.splash));
    }
  }
  update(dt, input = {}) {
    if (this.state !== 'playing') return;
    dt = Math.min(dt, .05); this.elapsed += dt;
    const p = this.player;
    this.shotTimer = Math.max(0, this.shotTimer - dt); this.messageTime -= dt;
    this.noise = Math.max(0, this.noise - dt * 5); this.shake *= .85;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    if (Number.isFinite(input.angle)) p.angle = input.angle;
    let mx = input.x || 0, my = input.y || 0, length = Math.hypot(mx, my);
    const sprint = input.sprint && p.stamina > 1 && length > 0;
    if (length > 1) { mx /= length; my /= length; }
    const speed = sprint ? 255 : 160;
    this.move(p, mx * speed * dt, my * speed * dt);
    p.stamina = clamp(p.stamina + (sprint ? -30 : 20) * dt, 0, 100);
    if (sprint) this.noise = Math.min(100, this.noise + dt * 6);
    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.reloadTimer = 0;
        const w = WEAPONS[this.weapon], amount = Math.min(w.clip - this.magazines[this.weapon], this.inventory[w.ammo]);
        this.magazines[this.weapon] += amount; this.inventory[w.ammo] -= amount;
      }
    }
    if (input.shoot) this.shoot();
    const loot = this.nearestLoot();
    for (const l of this.loot) {
      if (l.opened) continue;
      if (l === loot && input.interact) {
        l.progress += dt / (l.type === 'relay' ? 2 : .7);
        if (l.progress >= 1) {
          l.opened = true;
          if (l.type === 'relay') { this.inventory.relays++; this.inventory.energy += 15; this.score += 250; this.notify(`Relé recuperado (${this.inventory.relays}/3). +15 energía.`, 'relay'); }
          else if (l.type === 'medical') { this.inventory.medkits++; this.inventory.ammo += 18; this.notify('+1 botiquín · +18 munición', 'loot'); }
          else if (l.type === 'lumber') { this.inventory.wood += 20; this.inventory.scrap += 6; this.notify('+20 madera · +6 chatarra', 'loot'); }
          else if (l.type === 'technology') { this.inventory.parts += 6; this.inventory.energy += 8; this.inventory.scrap += 8; this.notify('+6 componentes · +8 energía · +8 chatarra', 'loot'); }
          else { const scrap = 12 + Math.floor(this.random() * 12); this.inventory.scrap += scrap; this.inventory.ammo += 18; this.inventory.energy += 4; this.inventory.wood += 6; this.inventory.parts += 2; this.notify(`+${scrap} chatarra · +18 balas · +4 energía · +6 madera · +2 componentes`, 'loot'); }
          this.score += 30; this.burst(l.x, l.y, '#c7f17c', 12);
        }
      } else l.progress = Math.max(0, l.progress - dt);
    }
    if (this.phase === 'extraction' && this.inventory.relays >= 3 && this.nearBase()) { this.state = 'won'; this.events.push('win'); }
    this.time -= dt;
    if (this.time <= 0) { if (this.phase === 'day') this.startNight(); else this.finishNight(); }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.enemies.length < 65) {
      this.spawnEnemy();
      this.spawnTimer = this.phase === 'night' ? Math.max(.65, 2.8 - this.day * .32 - this.noise * .009) / this.factor : 9 / this.factor;
    }
    const protectedPlayer = this.insideRefuge();
    if (p.hp > 0 && protectedPlayer && this.levels.infirmary) p.hp = Math.min(100, p.hp + dt * 3 * this.levels.infirmary);
    if (this.levels.generator && this.base.hp > 0 && this.base.hp < this.base.maxHp) {
      if (this.generatorFuelTime <= 0 && this.inventory.energy >= 1) { this.inventory.energy--; this.generatorFuelTime = 8; }
      const active = Math.min(dt, this.generatorFuelTime, (this.base.maxHp - this.base.hp) / (4 * this.levels.generator));
      this.base.hp += active * 4 * this.levels.generator; this.generatorFuelTime = Math.max(0, this.generatorFuelTime - active);
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      this.keepOutside(e);
      e.attack = Math.max(0, e.attack - dt); e.flash = Math.max(0, e.flash - dt);
      const pd = dist(e, p);
      const detects = pd < 240 + this.noise * 4 || this.phase !== 'night' && pd < 520;
      const target = detects ? protectedPlayer ? this.base : p : this.phase === 'night' ? this.base : null;
      let ax, ay;
      if (target) { ax = target.x - e.x; ay = target.y - e.y; }
      else { ax = Math.cos(e.wander + this.elapsed * .12); ay = Math.sin(e.wander + this.elapsed * .12); }
      const d = Math.hypot(ax, ay) || 1;
      const touchingWall = this.wallDistance(e) <= e.r + 4;
      const inRange = target === p ? pd <= 24 + (e.r - 13) : target === this.base && touchingWall;
      e.angle = Math.atan2(ay, ax);
      if (!inRange) {
        let dx = ax / d * e.speed * dt * (target ? 1 : .28), dy = ay / d * e.speed * dt * (target ? 1 : .28);
        for (const other of this.enemies) { if (e === other) continue; const dd = dist(e, other); if (dd > 0 && dd < e.r + other.r) { dx += (e.x - other.x) / dd * dt * 26; dy += (e.y - other.y) / dd * dt * 26; } }
        // Enemies steer around solid building corners instead of getting stuck.
        const oldX = e.x, oldY = e.y; this.move(e, dx, dy, e.r);
        if (Math.abs(e.x - oldX) + Math.abs(e.y - oldY) < .1) this.move(e, -Math.sin(e.angle) * e.speed * dt, Math.cos(e.angle) * e.speed * dt, e.r);
        this.keepOutside(e);
      }
      const atWall = this.wallDistance(e) <= e.r + 4;
      if (atWall && this.levels.spikes) this.hurtEnemy(e, dt * 12 * this.levels.spikes);
      if (e.hp > 0 && target && e.attack <= 0 && (inRange || atWall)) {
        e.attack = 1;
        if (target === p && inRange && !protectedPlayer) {
          if (p.invulnerable <= 0) { p.hp -= (e.type === 'brute' ? 22 : 10) * this.factor; p.invulnerable = .5; this.shake = 5; this.events.push('hurt'); }
        } else if (atWall) { this.base.hp -= (e.type === 'brute' ? 13 : 5) * this.factor * (1 - this.levels.walls * .15); this.burst(e.x, e.y, '#eea164', 3); }
      }
    }
    for (const t of this.turrets) {
      t.cooldown -= dt;
      const target = this.enemies.filter(e => e.hp > 0 && dist(e, t) < 370).sort((a, b) => dist(a, t) - dist(b, t))[0];
      if (target) { t.angle = Math.atan2(target.y - t.y, target.x - t.x); if (t.cooldown <= 0) { t.cooldown = .38; this.bullets.push({ x: t.x, y: t.y, vx: Math.cos(t.angle) * 800, vy: Math.sin(t.angle) * 800, damage: 23, life: .5, turret: true }); } }
    }
    for (const b of this.bullets) {
      const ox = b.x, oy = b.y, step = Math.min(dt, Math.max(0, b.life)); b.x += b.vx * step; b.y += b.vy * step; b.life -= dt;
      const dx = b.x - ox, dy = b.y - oy, wall = this.buildingHit(ox, oy, b.x, b.y), hits = [];
      b.hit ||= new Set(); b.pierce ??= 1;
      for (const e of this.enemies) {
        if (e.hp <= 0 || b.hit.has(e)) continue;
        const t = clamp(((e.x - ox) * dx + (e.y - oy) * dy) / (dx * dx + dy * dy || 1), 0, 1);
        if (t < wall && Math.hypot(e.x - ox - t * dx, e.y - oy - t * dy) < e.r + 4) hits.push({ e, t });
      }
      let stopped = false;
      for (const { e, t } of hits.sort((a, b) => a.t - b.t)) {
        b.hit.add(e);
        if (!b.splash) { this.hurtEnemy(e, b.damage); this.burst(e.x, e.y, '#9bac65', 5); }
        if (b.splash || --b.pierce <= 0) {
          b.x = ox + t * dx; b.y = oy + t * dy; b.life = 0; stopped = true; break;
        }
      }
      if (!stopped && wall !== Infinity) { b.x = ox + Math.max(0, wall - .001) * dx; b.y = oy + Math.max(0, wall - .001) * dy; b.life = 0; }
      if (b.life <= 0 && b.splash) this.explode(b);
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);
    this.bullets = this.bullets.filter(b => b.life > 0);
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const b of this.blasts) b.life -= dt;
    this.blasts = this.blasts.filter(b => b.life > 0);
    if (this.player.hp <= 0 || this.base.hp <= 0) { this.player.hp = Math.max(0, this.player.hp); this.base.hp = Math.max(0, this.base.hp); this.state = 'lost'; this.events.push('lose'); }
  }
}
