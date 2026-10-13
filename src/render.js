import * as THREE from 'three';
import { BASE, WORLD, clamp, randomGenerator } from './engine.js';
import { Assets, batchStatic, survivor, zombie, tree, building, shelter, lootCrate, turret, wreck } from './models.js';
import { drawMinimap } from './minimap.js';

const SCALE = 20;
const point = (x, y, height = 0) => new THREE.Vector3((x - BASE.x) / SCALE, height, (y - BASE.y) / SCALE);

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gpu = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.gpu.outputColorSpace = THREE.SRGBColorSpace;
    this.gpu.toneMapping = THREE.ACESFilmicToneMapping;
    this.gpu.toneMappingExposure = 1.32;
    this.mobile = matchMedia('(pointer: coarse)').matches;
    this.gpu.setPixelRatio(Math.min(devicePixelRatio || 1, this.mobile ? 1.25 : 1.5));
    this.gpu.shadowMap.enabled = !this.mobile;
    this.gpu.shadowMap.type = THREE.PCFSoftShadowMap;
    this.assets = new Assets();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#253a3c');
    this.scene.fog = new THREE.FogExp2('#253a3c', .012);
    this.camera = new THREE.PerspectiveCamera(46, 1, .2, 220);
    this.target = point(BASE.x, BASE.y + 75, .5);
    this.azimuth = .38; this.yawGoal = .38; this.distance = 37; this.distanceGoal = 37;
    this.elevation = .88;
    this.raycaster = new THREE.Raycaster(); this.aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.12);
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.enemyModels = new Map(); this.lootModels = new Map(); this.turretModels = new Map();
    this.sun = new THREE.DirectionalLight('#ffe0a1', 3.1);
    this.sun.position.set(-20, 34, 15); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 95 });
    this.sun.shadow.normalBias = .035; this.sun.shadow.bias = -.0003;
    this.scene.add(this.sun, this.sun.target);
    this.ambient = new THREE.HemisphereLight('#bfdbd0', '#324035', 2.1); this.scene.add(this.ambient);
    this.rim = new THREE.DirectionalLight('#81b6b8', .7); this.rim.position.set(15, 10, -20); this.scene.add(this.rim);
    this.flashlight = new THREE.SpotLight('#eee7bb', 0, 26, .43, .65, 1.4);
    this.scene.add(this.flashlight, this.flashlight.target);
    this.baseLight = new THREE.PointLight('#badf88', 16, 17, 1.8); this.baseLight.position.set(0, 3.5, 3); this.scene.add(this.baseLight);
    this.resize(); this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas);
    this.updateCamera(1, true);
    this.canvas.dataset.renderer = 'webgl2';
  }
  resize() {
    const r = this.canvas.getBoundingClientRect(); this.width = Math.max(1, r.width); this.height = Math.max(1, r.height);
    this.gpu.setSize(this.width, this.height, false); this.camera.aspect = this.width / this.height;
    this.camera.fov = this.width < 600 ? 57 : 46; this.camera.updateProjectionMatrix();
  }
  rotate(direction) { this.yawGoal += direction * Math.PI / 4; }
  zoom(delta) { this.distanceGoal = clamp(this.distanceGoal + delta, 23, 53); }
  resetCamera(player) {
    this.azimuth = this.yawGoal = .38; this.distance = this.distanceGoal = 37;
    this.target.copy(point(player.x, player.y, .5)); this.updateCamera(1, true);
  }
  movementToWorld(x, y) {
    return { x: x * Math.cos(this.azimuth) + y * Math.sin(this.azimuth), y: -x * Math.sin(this.azimuth) + y * Math.cos(this.azimuth) };
  }
  updateCamera(dt, immediate = false) {
    const smooth = immediate || this.reducedMotion ? 1 : 1 - Math.exp(-dt * 8);
    this.azimuth += (this.yawGoal - this.azimuth) * smooth;
    this.distance += (this.distanceGoal - this.distance) * smooth;
    const flat = Math.cos(this.elevation) * this.distance;
    this.camera.position.set(this.target.x + Math.sin(this.azimuth) * flat, this.target.y + Math.sin(this.elevation) * this.distance, this.target.z + Math.cos(this.azimuth) * flat);
    this.camera.lookAt(this.target); this.camera.updateMatrixWorld();
  }
  screenToWorld(x, y) {
    this.raycaster.setFromCamera(new THREE.Vector2(x / this.width * 2 - 1, 1 - y / this.height * 2), this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.aimPlane, new THREE.Vector3());
    return hit ? { x: hit.x * SCALE + BASE.x, y: hit.z * SCALE + BASE.y } : { x: this.target.x * SCALE + BASE.x, y: this.target.z * SCALE + BASE.y };
  }
  project(x, y, height = 0) {
    const p = point(x, y, height).project(this.camera);
    return { x: (p.x + 1) / 2 * this.width, y: (1 - p.y) / 2 * this.height, visible: p.z < 1 && p.z > -1 };
  }
  minimap(canvas, game, big = false) { drawMinimap(canvas, game, big); }

  groundTexture() {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const c = canvas.getContext('2d'), rand = randomGenerator(717);
    c.fillStyle = '#53604c'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 6500; i++) { const shade = 55 + Math.floor(rand() * 55); c.fillStyle = `rgba(${shade},${shade + 8},${shade - 9},.26)`; c.fillRect(rand() * 256, rand() * 256, 1 + rand() * 5, 1 + rand() * 4); }
    const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(24, 18); texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, this.gpu.capabilities.getMaxAnisotropy()); return texture;
  }
  label(text, color = '#d5dbc0', width = 7) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96;
    const c = canvas.getContext('2d'); c.fillStyle = '#132622dd'; c.fillRect(0, 0, 512, 96);
    c.strokeStyle = color; c.lineWidth = 2; c.strokeRect(4, 4, 504, 88);
    c.font = 'bold 28px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(text, 256, 49);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 96 / 512), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    mesh.userData.ownedGeometry = mesh.userData.ownedMaterial = true; return mesh;
  }
  clearWorld() {
    if (!this.world) return;
    this.world.traverse(o => {
      if (o.userData.ownedGeometry || o.parent?.userData.merged) o.geometry?.dispose();
      if (o.userData.ownedMaterial) { o.material.map?.dispose(); o.material.dispose(); }
      if (o.isInstancedMesh) o.dispose();
    });
    this.scene.remove(this.world); this.enemyModels.clear(); this.lootModels.clear(); this.turretModels.clear();
  }
  buildWorld(game) {
    this.clearWorld(); this.currentGame = game;
    this.world = new THREE.Group(); this.scene.add(this.world);
    const a = this.assets, staticRoot = new THREE.Group(), rand = randomGenerator(917);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.w / SCALE + 50, WORLD.h / SCALE + 50), new THREE.MeshStandardMaterial({ map: this.groundTexture(), roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.11; ground.receiveShadow = true;
    ground.userData.ownedGeometry = ground.userData.ownedMaterial = true; this.world.add(ground);
    a.box(staticRoot, '#757564', [0, -.065, 5], [120, .06, 7.2]);
    a.box(staticRoot, '#414c48', [0, -.025, 5], [120, .07, 5.2]);
    a.box(staticRoot, '#6d715e', [0, -.06, 0], [6.8, .07, 90]);
    a.box(staticRoot, '#414c48', [0, -.02, 0], [4.8, .08, 90]);
    for (let x = -58; x < 60; x += 3.3) a.box(staticRoot, '#b4aa73', [x, .032, 5], [1.4, .015, .09]);
    for (let z = -44; z < 45; z += 3.3) { if (Math.abs(z) > 7) a.box(staticRoot, '#b4aa73', [0, .036, z], [.09, .015, 1.4]); }
    for (let i = 0; i < 160; i++) {
      const x = (rand() - .5) * 115, z = (rand() - .5) * 84;
      if (Math.hypot(x, z) < 10) continue;
      const rock = a.mesh(staticRoot, 'sphere', i % 2 ? '#727765' : '#79806b', [x, .045, z], [.12 + rand() * .2, .07, .13]); rock.rotation.y = rand() * 6;
    }
    this.occluders = [];
    game.props.forEach((prop, i) => {
      if (prop.type === 'building') {
        const model = building(a, prop, i); model.position.copy(point(prop.x + prop.w / 2, prop.y + prop.h / 2)); this.world.add(model);
        this.occluders.push({ root: model, center: model.position.clone(), radius: Math.max(prop.w, prop.h) / SCALE * .65 });
      } else if (prop.type === 'tree') {
        const model = tree(a, prop); model.position.copy(point(prop.x, prop.y)); staticRoot.add(model);
      } else {
        const model = a.mesh(staticRoot, 'sphere', '#7b806b', [(prop.x - BASE.x) / SCALE, .24, (prop.y - BASE.y) / SCALE], [prop.r / 24, prop.r / 48, prop.r / 28]); model.rotation.y = prop.variation * 6;
      }
    });
    for (const [i, site] of game.sites.entries()) {
      const label = this.label(site.name, '#cfdbb1'); label.position.copy(point(site.x, site.y + 205, .05)); label.rotation.x = -Math.PI / 2; this.world.add(label);
      const car = wreck(a, ['#73816c', '#887568', '#697e7a', '#958b6a'][i]); car.position.copy(point(site.x + 90, site.y + 135)); car.rotation.y = i * .9; staticRoot.add(car);
      for (let j = 0; j < 4; j++) a.mesh(staticRoot, 'cylinder', '#877052', [(site.x - BASE.x) / SCALE - 4 + j * .7, .46, (site.y - BASE.y) / SCALE - 1], [.28, .9, .28]);
    }
    const wreckedCar = wreck(a, '#968768'); wreckedCar.position.set(-13, 0, 4); wreckedCar.rotation.y = 1.8; staticRoot.add(wreckedCar);
    for (const sign of [-1, 1]) {
      a.box(staticRoot, '#727b66', [sign * 60, .6, 0], [.5, 1.2, 90]); a.box(staticRoot, '#727b66', [0, .6, sign * 45], [120, 1.2, .5]);
      for (let j = -44; j < 45; j += 3) a.box(staticRoot, '#465a50', [sign * 60, 1.35, j], [.13, 2.7, .13]);
    }
    this.world.add(batchStatic(staticRoot));
    this.baseModel = shelter(a); this.world.add(this.baseModel.root);
    this.occluders.push({ root: this.baseModel.root, center: new THREE.Vector3(0, 0, -.65), radius: 4 });
    const baseLabel = this.label('REFUGIO 07', '#d4eea4', 3.1); baseLabel.position.set(0, 2.47, 1.82); this.baseModel.root.add(baseLabel);
    this.safeRing = a.ring(this.world, '#7b995b', 10.25, .02);
    this.safeRing.material = new THREE.MeshBasicMaterial({ color: '#b5d183', transparent: true, opacity: .13, depthWrite: false, side: THREE.DoubleSide }); this.safeRing.userData.ownedMaterial = true;
    for (const loot of game.loot) { const model = lootCrate(a, loot.type); model.root.position.copy(point(loot.x, loot.y)); this.world.add(model.root); this.lootModels.set(loot, model); }
    this.hero = survivor(a); this.world.add(this.hero.root);
    this.heroLast = { x: game.player.x, y: game.player.y };
    this.crosshair = a.ring(this.world, '#cbe4a5', .35, .04); this.crosshair.visible = false;
    this.tracerGeometry = new THREE.BufferGeometry(); this.tracerPositions = new Float32Array(256 * 6);
    this.tracerGeometry.setAttribute('position', new THREE.BufferAttribute(this.tracerPositions, 3)); this.tracerGeometry.setDrawRange(0, 0);
    this.tracers = new THREE.LineSegments(this.tracerGeometry, new THREE.LineBasicMaterial({ color: '#ffe3a0', toneMapped: false }));
    this.tracers.frustumCulled = false; this.tracers.userData.ownedGeometry = this.tracers.userData.ownedMaterial = true; this.world.add(this.tracers);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: '#d6cb85', toneMapped: false });
    this.particles = new THREE.InstancedMesh(a.geometries.box, particleMaterial, 512); this.particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.particles.count = 0; this.particles.frustumCulled = false; this.particles.userData.ownedMaterial = true; this.world.add(this.particles);
    this.particleDummy = new THREE.Object3D();
    this.canvas.dataset.world = 'ready';
  }
  updateCharacters(game, time, dt) {
    const p = game.player, hero = this.hero;
    const speed = Math.hypot(p.x - this.heroLast.x, p.y - this.heroLast.y) / Math.max(.001, dt);
    hero.root.position.copy(point(p.x, p.y)); hero.root.rotation.y = -p.angle - Math.PI / 2;
    hero.body.position.y = speed > 2 ? Math.sin(time * 14) * .04 : Math.sin(time * 2) * .012;
    hero.legs.forEach((leg, i) => leg.rotation.x = speed > 2 ? Math.sin(time * (speed > 180 ? 19 : 13) + i * Math.PI) * .48 : 0);
    hero.arms.rotation.x = game.reloadTimer > 0 ? .48 + Math.sin(time * 11) * .12 : 0;
    hero.gun.scale.z = game.weapon === 0 ? 1 : game.weapon === 1 ? 1.65 : 2;
    hero.flash.visible = game.shotTimer > [ .215, .60, .065 ][game.weapon] && game.reloadTimer <= 0;
    hero.body.visible = !(p.invulnerable > 0 && Math.sin(time * 30) > .3);
    this.heroLast = { x: p.x, y: p.y };
    const living = new Set(game.enemies);
    for (const [enemy, model] of this.enemyModels) if (!living.has(enemy)) { this.world.remove(model.root); this.enemyModels.delete(enemy); }
    for (const enemy of game.enemies) {
      let model = this.enemyModels.get(enemy);
      if (!model) { model = zombie(this.assets, enemy.type); this.enemyModels.set(enemy, model); this.world.add(model.root); }
      model.root.position.copy(point(enemy.x, enemy.y)); model.root.rotation.y = -enemy.angle - Math.PI / 2;
      const step = time * (enemy.type === 'runner' ? 16 : 7) + enemy.x * .04;
      model.legs.forEach((leg, i) => leg.rotation.x = Math.sin(step + i * Math.PI) * .38);
      model.arms.forEach((arm, i) => arm.rotation.x = Math.sin(step + i * 2) * .12);
      model.body.rotation.z = Math.sin(step * .5) * .06; model.body.position.y = Math.abs(Math.sin(step)) * .04;
      model.health.visible = enemy.hp < enemy.maxHp; model.health.rotation.y = this.azimuth - model.root.rotation.y;
      model.fill.scale.x = Math.max(.01, enemy.hp / enemy.maxHp) * .84;
      model.fill.position.x = -(1 - enemy.hp / enemy.maxHp) * .42;
    }
    for (const [loot, model] of this.lootModels) {
      model.lid.rotation.x = loot.opened ? -1.3 : -loot.progress * .35;
      model.marker.visible = !loot.opened; model.diamond.position.y = 1.4 + Math.sin(time * 2.2 + loot.x) * .16; model.diamond.rotation.y = time;
    }
    for (const t of game.turrets) {
      let model = this.turretModels.get(t);
      if (!model) { model = turret(this.assets); model.root.position.copy(point(t.x, t.y)); this.turretModels.set(t, model); this.world.add(model.root); }
      model.head.rotation.y = -t.angle - Math.PI / 2;
    }
  }
  updateEffects(game) {
    let index = 0;
    for (const b of game.bullets.slice(0, 256)) {
      const from = point(b.x, b.y, 1.14), to = point(b.x - b.vx * .018, b.y - b.vy * .018, 1.14);
      this.tracerPositions.set([from.x, from.y, from.z, to.x, to.y, to.z], index); index += 6;
    }
    this.tracerGeometry.attributes.position.needsUpdate = true; this.tracerGeometry.setDrawRange(0, index / 3);
    const dummy = this.particleDummy; this.particles.count = Math.min(game.particles.length, 512);
    for (let i = 0; i < this.particles.count; i++) {
      const p = game.particles[i]; dummy.position.copy(point(p.x, p.y, .2 + p.life * 1.8)); dummy.scale.setScalar(.07 + p.life * .075); dummy.rotation.set(p.life * 9, p.x, p.y); dummy.updateMatrix();
      this.particles.setMatrixAt(i, dummy.matrix); this.particles.setColorAt(i, new THREE.Color(p.color));
    }
    this.particles.instanceMatrix.needsUpdate = true; if (this.particles.instanceColor) this.particles.instanceColor.needsUpdate = true;
  }
  draw(game, time, overview = false) {
    if (this.currentGame !== game) this.buildWorld(game);
    const dt = Math.min(.1, Math.max(.001, time - (this.lastTime ?? time - .016))); this.lastTime = time;
    const target = overview ? point(BASE.x, BASE.y + 75, .5) : point(game.player.x, game.player.y, .5);
    this.target.lerp(target, this.reducedMotion ? 1 : 1 - Math.exp(-dt * 7)); this.updateCamera(dt);
    const night = game.phase === 'night', mix = 1 - Math.exp(-dt * 1.7);
    this.sun.intensity = THREE.MathUtils.lerp(this.sun.intensity, night ? .65 : 3.1, mix);
    this.sun.color.lerp(new THREE.Color(night ? '#9bb6e1' : '#ffe0a1'), mix);
    this.ambient.color.lerp(new THREE.Color(night ? '#96afd6' : '#bfdbd0'), mix);
    this.ambient.intensity = THREE.MathUtils.lerp(this.ambient.intensity, night ? .9 : 2.1, mix);
    this.rim.intensity = THREE.MathUtils.lerp(this.rim.intensity, night ? 1.3 : .7, mix);
    const sky = new THREE.Color(night ? '#111f2a' : '#576c61'); this.scene.background.lerp(sky, mix); this.scene.fog.color.copy(this.scene.background);
    this.sun.position.copy(this.target).add(new THREE.Vector3(-20, 34, 15)); this.sun.target.position.copy(this.target);
    this.flashlight.intensity = night ? 60 : 0;
    this.flashlight.position.copy(point(game.player.x, game.player.y, 1.5));
    this.flashlight.target.position.copy(point(game.player.x + Math.cos(game.player.angle) * 220, game.player.y + Math.sin(game.player.angle) * 220, 0));
    const animTime = game.elapsed;
    this.baseModel.beacon.scale.setScalar(.14 + Math.sin(animTime * 3) * .025);
    this.baseModel.armor.visible = game.levels.walls > 0; this.baseModel.fill.scale.x = 4 * Math.max(.001, game.base.hp / game.base.maxHp);
    this.updateCharacters(game, animTime, dt); this.updateEffects(game);
    const hero = point(game.player.x, game.player.y, 1.2);
    const ray = new THREE.Ray(this.camera.position, hero.clone().sub(this.camera.position).normalize());
    for (const o of this.occluders) {
      const center = o.center.clone(); center.y = 1.7;
      const between = center.distanceTo(this.camera.position) < hero.distanceTo(this.camera.position) + 2;
      const obscure = !overview && between && ray.distanceToPoint(center) < o.radius && o.center.distanceTo(hero) < o.radius + 8;
      for (const mesh of o.root.userData.fadeMeshes) { mesh.material.opacity = THREE.MathUtils.lerp(mesh.material.opacity, obscure ? .23 : 1, Math.min(1, mix * 3)); mesh.material.depthWrite = !obscure; mesh.castShadow = !obscure; }
    }
    this.gpu.render(this.scene, this.camera);
  }
  setAim(x, y, visible) {
    if (!this.crosshair) return;
    const aim = this.screenToWorld(x, y); this.crosshair.position.copy(point(aim.x, aim.y, .04)); this.crosshair.visible = visible;
  }
  dispose() {
    this.observer.disconnect(); this.clearWorld(); this.assets.dispose(); this.sun.shadow.map?.dispose(); this.gpu.dispose();
  }
}
