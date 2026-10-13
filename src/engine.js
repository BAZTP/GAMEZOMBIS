export const WORLD = { w: 2400, h: 1800 };
export const BASE = { x: 1200, y: 900, r: 105 };
export const WEAPONS = [
  { name: 'Pistola M9', short: 'M9', damage: 30, interval: .27, clip: 12, spread: .025, pellets: 1 },
  { name: 'Escopeta Eco', short: 'ECO', damage: 23, interval: .68, clip: 6, spread: .16, pellets: 5 },
  { name: 'Fusil Eclipse', short: 'ECL', damage: 29, interval: .115, clip: 30, spread: .035, pellets: 1 },
];
export const UPGRADES = {
  repair: { title: 'Reparar refugio', description: '+90 de integridad estructural.', cost: { scrap: 18 }, icon: '✚' },
  medkit: { title: 'Botiquín de campo', description: 'Recupera 60 de salud con Q.', cost: { scrap: 10, energy: 3 }, icon: '♡' },
  ammo: { title: 'Munición ×60', description: 'Suministros para todas tus armas.', cost: { scrap: 8 }, icon: '⁙' },
  damage: { title: 'Balística mejorada', description: '+25% de daño. Máximo 4 niveles.', cost: { scrap: 25, energy: 5 }, icon: '↗', max: 4 },
  shotgun: { title: 'Escopeta Eco', description: 'Cinco perdigones. Control de multitudes.', cost: { scrap: 30, energy: 8 }, icon: '⌁', max: 1 },
  rifle: { title: 'Fusil Eclipse', description: 'Fuego automático de alta cadencia.', cost: { scrap: 55, energy: 15 }, icon: '⌁', max: 1 },
  turret: { title: 'Torreta centinela', description: 'Defensa automática. Máximo 4 torretas.', cost: { scrap: 35, energy: 12 }, icon: '⌖', max: 4 },
  walls: { title: 'Blindaje del refugio', description: '+80 de integridad máxima y actual.', cost: { scrap: 30, energy: 6 }, icon: '▱', max: 3 },
};
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
    this.inventory = { scrap: 24, energy: 6, ammo: 108, medkits: 2, relays: 0 };
    this.levels = { damage: 0, shotgun: 0, rifle: 0, turret: 0, walls: 0 };
    this.weapon = 0; this.magazines = [12, 6, 30];
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
      for (let j = 0; j < 4; j++) this.loot.push({ x: s.x - 80 + j * 49, y: s.y + 20 + (j % 2) * 60, type: j === 0 && i < 3 ? 'relay' : j === 2 ? 'medical' : 'cache', opened: false, progress: 0 });
    });
    for (let i = 0; i < 22; i++) {
      const a = this.random() * Math.PI * 2, r = 240 + this.random() * 480;
      this.loot.push({ x: BASE.x + Math.cos(a) * r, y: BASE.y + Math.sin(a) * r, type: 'cache', opened: false, progress: 0 });
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
  switchWeapon(index) {
    if (index === 1 && !this.levels.shotgun || index === 2 && !this.levels.rifle || index < 0 || index > 2) return false;
    this.weapon = index; this.reloadTimer = 0; this.shotTimer = .12; return true;
  }
  reload() {
    if (!this.reloadTimer && this.magazines[this.weapon] < WEAPONS[this.weapon].clip && this.inventory.ammo > 0) {
      this.reloadTimer = this.weapon === 1 ? 1.8 : 1.35; this.events.push('reload'); return true;
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
    else if (id === 'medkit') this.inventory.medkits++;
    else {
      this.levels[id]++;
      if (id === 'walls') { this.base.maxHp += 80; this.base.hp += 80; }
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
    this.base.hp = Math.min(this.base.maxHp, this.base.hp + 25);
    this.player.hp = Math.min(100, this.player.hp + 15);
    this.score += 150;
    this.notify('Amanecer. +20 chatarra · +42 munición · +6 energía', 'dawn');
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
    this.noise = Math.min(100, this.noise + (this.weapon === 1 ? 13 : 5));
    for (let i = 0; i < w.pellets; i++) {
      const a = p.angle + (this.random() - .5) * w.spread * 2;
      this.bullets.push({ x: p.x + Math.cos(a) * 24, y: p.y + Math.sin(a) * 24, vx: Math.cos(a) * 980, vy: Math.sin(a) * 980, damage: w.damage * (1 + this.levels.damage * .25), life: this.weapon === 1 ? .38 : .72 });
    }
    this.burst(p.x + Math.cos(p.angle) * 26, p.y + Math.sin(p.angle) * 26, '#ffdc91', 3);
    this.shake = this.weapon === 1 ? 4 : 1.8; this.events.push('shot');
  }
  move(entity, dx, dy, radius = 14) {
    const blocked = (x, y) => this.props.some(o => o.type === 'building' && x + radius > o.x && x - radius < o.x + o.w && y + radius > o.y && y - radius < o.y + o.h);
    const x = clamp(entity.x + dx, radius, WORLD.w - radius), y = clamp(entity.y + dy, radius, WORLD.h - radius);
    if (!blocked(x, entity.y)) entity.x = x;
    if (!blocked(entity.x, y)) entity.y = y;
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
        const amount = Math.min(WEAPONS[this.weapon].clip - this.magazines[this.weapon], this.inventory.ammo);
        this.magazines[this.weapon] += amount; this.inventory.ammo -= amount;
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
          else { const scrap = 12 + Math.floor(this.random() * 12); this.inventory.scrap += scrap; this.inventory.ammo += 18; this.inventory.energy += 4; this.notify(`+${scrap} chatarra · +18 munición · +4 energía`, 'loot'); }
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
    for (const e of this.enemies) {
      e.attack = Math.max(0, e.attack - dt); e.flash = Math.max(0, e.flash - dt);
      const pd = dist(e, p);
      const target = pd < 240 + this.noise * 4 || this.phase !== 'night' && pd < 520 ? p : this.phase === 'night' ? this.base : null;
      let ax, ay;
      if (target) { ax = target.x - e.x; ay = target.y - e.y; }
      else { ax = Math.cos(e.wander + this.elapsed * .12); ay = Math.sin(e.wander + this.elapsed * .12); }
      const d = Math.hypot(ax, ay) || 1, contact = target === p ? 24 : target === this.base ? 98 : 0;
      e.angle = Math.atan2(ay, ax);
      if (!target || d > contact) {
        let dx = ax / d * e.speed * dt * (target ? 1 : .28), dy = ay / d * e.speed * dt * (target ? 1 : .28);
        for (const other of this.enemies) { if (e === other) continue; const dd = dist(e, other); if (dd > 0 && dd < e.r + other.r) { dx += (e.x - other.x) / dd * dt * 26; dy += (e.y - other.y) / dd * dt * 26; } }
        // Enemies steer around solid building corners instead of getting stuck.
        const oldX = e.x, oldY = e.y; this.move(e, dx, dy, e.r);
        if (Math.abs(e.x - oldX) + Math.abs(e.y - oldY) < .1) this.move(e, -Math.sin(e.angle) * e.speed * dt, Math.cos(e.angle) * e.speed * dt, e.r);
      } else if (target && e.attack <= 0) {
        e.attack = 1;
        if (target === p && p.invulnerable <= 0) { p.hp -= (e.type === 'brute' ? 22 : 10) * this.factor; p.invulnerable = .5; this.shake = 5; this.events.push('hurt'); }
        else if (target === this.base) { this.base.hp -= (e.type === 'brute' ? 13 : 5) * this.factor; this.burst(e.x, e.y, '#eea164', 3); }
      }
    }
    for (const t of this.turrets) {
      t.cooldown -= dt;
      const target = this.enemies.filter(e => e.hp > 0 && dist(e, t) < 370).sort((a, b) => dist(a, t) - dist(b, t))[0];
      if (target) { t.angle = Math.atan2(target.y - t.y, target.x - t.x); if (t.cooldown <= 0) { t.cooldown = .38; this.bullets.push({ x: t.x, y: t.y, vx: Math.cos(t.angle) * 800, vy: Math.sin(t.angle) * 800, damage: 23, life: .5, turret: true }); } }
    }
    for (const b of this.bullets) {
      const ox = b.x, oy = b.y; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        const dx = b.x - ox, dy = b.y - oy;
        const t = clamp(((e.x - ox) * dx + (e.y - oy) * dy) / (dx * dx + dy * dy || 1), 0, 1);
        if (Math.hypot(e.x - ox - t * dx, e.y - oy - t * dy) < e.r + 4) {
          e.hp -= b.damage; e.flash = .12; b.life = -1; this.burst(e.x, e.y, '#9bac65', 5);
          if (e.hp <= 0) { this.kills++; this.score += e.type === 'brute' ? 60 : 15; if (this.random() > .55) this.inventory.scrap += 2; this.scorch.push({ x: e.x, y: e.y, r: e.r, a: e.angle }); if (this.scorch.length > 90) this.scorch.shift(); }
          break;
        }
      }
      if (this.props.some(o => o.type === 'building' && b.x > o.x && b.x < o.x + o.w && b.y > o.y && b.y < o.y + o.h)) b.life = -1;
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);
    this.bullets = this.bullets.filter(b => b.life > 0);
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.player.hp <= 0 || this.base.hp <= 0) { this.player.hp = Math.max(0, this.player.hp); this.base.hp = Math.max(0, this.base.hp); this.state = 'lost'; this.events.push('lose'); }
  }
}
