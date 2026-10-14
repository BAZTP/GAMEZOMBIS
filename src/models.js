import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Shared geometry and materials keep an entire horde cheap to render.
export class Assets {
  constructor() {
    this.materials = new Map();
    this.geometries = {
      box: new THREE.BoxGeometry(1, 1, 1),
      cylinder: new THREE.CylinderGeometry(1, 1, 1, 8),
      cone: new THREE.ConeGeometry(1, 1, 7),
      sphere: new THREE.IcosahedronGeometry(1, 0),
      ring: new THREE.RingGeometry(.88, 1, 48),
    };
  }
  material(color, glow = false) {
    const key = `${color}:${glow}`;
    if (!this.materials.has(key)) this.materials.set(key, new THREE.MeshStandardMaterial({
      color, roughness: .87, metalness: .08, flatShading: true,
      emissive: glow ? color : 0x000000, emissiveIntensity: glow ? 1.7 : 0,
    }));
    return this.materials.get(key);
  }
  mesh(parent, shape, color, position, scale, glow = false) {
    const mesh = new THREE.Mesh(this.geometries[shape], this.material(color, glow));
    mesh.position.set(...position); mesh.scale.set(...scale);
    mesh.castShadow = !glow; mesh.receiveShadow = !glow; parent.add(mesh); return mesh;
  }
  box(parent, color, position, scale, glow = false) { return this.mesh(parent, 'box', color, position, scale, glow); }
  ring(parent, color, radius, y = .035) {
    const ring = this.mesh(parent, 'ring', color, [0, y, 0], [radius, radius, radius], true);
    ring.rotation.x = -Math.PI / 2; return ring;
  }
  dispose() { for (const g of Object.values(this.geometries)) g.dispose(); for (const m of this.materials.values()) m.dispose(); }
}

export function batchStatic(root) {
  root.updateMatrixWorld(true);
  const batches = new Map();
  root.traverse(object => {
    if (!object.isMesh) return;
    const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
    if (!batches.has(object.material)) batches.set(object.material, []);
    batches.get(object.material).push(geometry);
  });
  const result = new THREE.Group();
  for (const [material, geometries] of batches) {
    const merged = mergeGeometries(geometries);
    for (const geometry of geometries) geometry.dispose();
    const mesh = new THREE.Mesh(merged, material); mesh.castShadow = true; mesh.receiveShadow = true; result.add(mesh);
  }
  result.userData.merged = true;
  return result;
}

export function survivor(a) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const legs = [];
  for (const x of [-.2, .2]) {
    const leg = new THREE.Group(); leg.position.set(x, .86, 0); body.add(leg); legs.push(leg);
    a.box(leg, '#364641', [0, -.31, 0], [.29, .65, .31]);
    a.box(leg, '#1c292c', [0, -.7, -.08], [.32, .19, .48]);
  }
  a.box(body, '#a3b2a0', [0, 1.2, 0], [.83, .76, .5]);
  a.box(body, '#40544f', [0, 1.25, -.28], [.65, .52, .17]);
  a.box(body, '#5b6955', [0, 1.18, .36], [.58, .65, .35]);
  a.box(body, '#c9df9e', [0, 1.45, .56], [.34, .09, .02], true);
  a.box(body, '#d3b699', [0, 1.86, -.02], [.43, .42, .42]);
  a.mesh(body, 'sphere', '#4b645b', [0, 2.03, .015], [.36, .24, .34]);
  a.box(body, '#242f30', [0, 1.9, -.25], [.46, .13, .08]);
  const arms = new THREE.Group(); arms.position.set(0, 1.37, 0); body.add(arms);
  a.box(arms, '#96a791', [-.48, -.12, -.19], [.24, .48, .3]).rotation.x = -.5;
  a.box(arms, '#96a791', [.44, -.1, -.29], [.25, .35, .59]);
  a.box(arms, '#d3b699', [.35, -.17, -.63], [.21, .21, .2]);
  const gun = new THREE.Group(); gun.position.set(.28, -.1, -.63); arms.add(gun);
  a.box(gun, '#252e30', [0, 0, -.15], [.18, .21, .56]);
  a.box(gun, '#718084', [0, .06, -.3], [.12, .12, .4]);
  const attachments = Array.from({ length: 7 }, () => { const group = new THREE.Group(); gun.add(group); return group; });
  a.box(attachments[1], '#75634c', [0, -.1, -.3], [.27, .15, .28]);
  a.box(attachments[2], '#51644e', [0, -.23, -.12], [.15, .3, .15]);
  a.box(attachments[3], '#293537', [0, -.22, -.2], [.2, .4, .13]);
  a.mesh(attachments[4], 'cylinder', '#657779', [0, .22, -.2], [.09, .24, .09]).rotation.x = Math.PI / 2;
  a.box(attachments[4], '#303c39', [0, .14, -.2], [.1, .13, .16]);
  for (const sign of [-1, 1]) {
    a.box(attachments[5], '#bc9364', [sign * .36, .03, -.38], [.8, .09, .08]).rotation.y = sign * .25;
    a.box(attachments[5], '#d0d7c1', [sign * .32, .04, -.22], [.68, .025, .018]).rotation.y = -sign * .3;
  }
  a.mesh(attachments[6], 'cylinder', '#778454', [0, -.04, -.24], [.24, .44, .24]).rotation.x = Math.PI / 2;
  const flash = a.mesh(gun, 'sphere', '#ffdf8f', [0, 0, -.6], [.18, .18, .35], true); flash.visible = false;
  const ring = a.ring(root, '#9bbe72', .83);
  return { root, body, legs, arms, gun, flash, ring, attachments };
}

export function zombie(a, type) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const brute = type === 'brute', runner = type === 'runner';
  const coat = brute ? '#8e6657' : runner ? '#9a8459' : '#60725c';
  const skin = brute ? '#9b9b78' : '#9ba77b';
  const legs = [];
  for (const x of [-.19, .19]) {
    const leg = new THREE.Group(); leg.position.set(x, .83, 0); body.add(leg); legs.push(leg);
    a.box(leg, '#434e43', [0, -.3, 0], [.25, .61, .3]); a.box(leg, '#333a32', [0, -.66, -.06], [.28, .18, .42]);
  }
  a.box(body, coat, [0, 1.19, .03], [.76, .77, .48]);
  a.box(body, '#665945', [-.1, 1.21, -.23], [.25, .26, .04]);
  a.box(body, skin, [0, 1.82, -.12], [.42, .47, .44]).rotation.z = -.14;
  for (const x of [-.12, .12]) a.box(body, '#f2ae69', [x, 1.88, -.35], [.08, .055, .025], true);
  const arms = [];
  for (const x of [-.48, .48]) {
    const arm = new THREE.Group(); arm.position.set(x, 1.47, 0); body.add(arm); arms.push(arm);
    a.box(arm, coat, [0, -.05, -.28], [.23, .27, .65]);
    a.box(arm, skin, [0, -.08, -.68], [.2, .22, .22]);
  }
  if (brute) {
    a.box(body, '#614e44', [0, 1.35, .35], [1, .67, .27]); root.scale.setScalar(1.5);
  } else if (runner) { root.scale.set(.85, .93, .85); body.rotation.x = .13; }
  const health = new THREE.Group(); health.position.y = 2.38; root.add(health);
  a.box(health, '#222d28', [0, 0, 0], [.88, .075, .03]);
  const fill = a.box(health, '#db9368', [0, 0, .025], [.84, .047, .035], true);
  health.visible = false;
  return { root, body, legs, arms, health, fill };
}

export function tree(a, prop) {
  const root = new THREE.Group(), size = prop.r / 20;
  a.mesh(root, 'cylinder', '#554b3a', [0, .9, 0], [.14 + size * .1, 1.8, .14 + size * .1]);
  const pine = prop.variation > .45;
  if (pine) {
    for (let i = 0; i < 3; i++) a.mesh(root, 'cone', ['#30473e', '#3c5946', '#506650'][i], [0, 1.7 + i * .8, 0], [size * (1.4 - i * .25), 2.3, size * (1.4 - i * .25)]);
  } else {
    for (let i = 0; i < 3; i++) a.mesh(root, 'sphere', ['#3c5443', '#52654c', '#677854'][i], [Math.cos(i * 2.1) * size * .5, 2.3 + (i % 2) * .6, Math.sin(i * 2.1) * size * .5], [size * 1.25, size * 1.4, size * 1.15]);
  }
  return root;
}

export function building(a, prop, index) {
  const root = new THREE.Group(), w = prop.w / 20, d = prop.h / 20, h = index % 2 ? 3.1 : 4.1;
  a.box(root, '#394742', [0, .16, 0], [w + .5, .32, d + .5]);
  const walls = a.box(root, prop.color, [0, h / 2, 0], [w, h, d]);
  const roof = a.box(root, '#425954', [0, h + .15, 0], [w + .3, .34, d + .3]);
  for (const x of [-w / 2, w / 2]) a.box(root, '#718175', [x, h / 2, 0], [.19, h + .15, d + .06]);
  for (let x = -w / 2 + .85; x < w / 2 - .4; x += 1.6) {
    for (const z of [-d / 2 - .025, d / 2 + .025]) {
      a.box(root, '#303f3e', [x, 2, z], [.95, 1.2, .07]);
      a.box(root, '#809584', [x, 2, z * 1.002], [.045, 1.2, .08]);
    }
  }
  a.box(root, '#394841', [0, .95, d / 2 + .05], [1.1, 1.9, .1]);
  a.box(root, '#d4a76a', [.35, 1, d / 2 + .12], [.09, .09, .06], true);
  a.box(root, '#5e7268', [-w * .24, h + .42, 0], [1.2, .6, 1.4]);
  for (let j = 0; j < 4; j++) a.box(root, '#303d3b', [-w * .24, h + .74, -.45 + j * .3], [.98, .025, .09]);
  a.mesh(root, 'cylinder', '#7a8272', [w * .25, h + .47, -d * .22], [.32, .8, .32]);
  for (let x = -w / 2 + .4; x < w / 2; x += .55) a.box(root, '#586b60', [x, h + .34, 0], [.04, .025, d]);
  // Only solid volumes fade; architectural details remain as a spatial outline.
  for (const mesh of [walls, roof]) { mesh.material = mesh.material.clone(); mesh.material.transparent = true; mesh.userData.ownedMaterial = true; }
  root.userData.fadeMeshes = [walls, roof];
  return root;
}

export function shelter(a) {
  const root = new THREE.Group();
  a.box(root, '#626956', [0, -.015, 0], [10.3, .16, 9.4]);
  a.box(root, '#929980', [0, .1, 0], [6.8, .2, 5.9]);
  const walls = a.box(root, '#607a68', [0, 1.38, -.65], [6.4, 2.55, 4.7]);
  const roof = a.box(root, '#374f48', [0, 2.77, -.65], [6.9, .3, 5.2]);
  for (const mesh of [walls, roof]) { mesh.material = mesh.material.clone(); mesh.material.transparent = true; mesh.userData.ownedMaterial = true; }
  for (let x = -3; x <= 3; x += .45) a.box(root, '#536c5c', [x, 2.96, -.65], [.065, .09, 5.1]);
  a.box(root, '#253b35', [0, .95, 1.73], [1.35, 1.9, .13]);
  a.box(root, '#c9ec99', [0, 2.16, 1.84], [1.45, .12, .07], true);
  for (const x of [-2.15, 2.15]) {
    a.box(root, '#253f3c', [x, 1.47, 1.73], [1.27, .94, .12]);
    a.box(root, '#a6c390', [x, 1.48, 1.82], [.06, .9, .04], true);
    a.box(root, '#9fb685', [x, 1.45, 1.82], [1.24, .04, .04], true);
  }
  // Solar cells and rooftop communications equipment.
  for (let i = 0; i < 3; i++) {
    const panel = a.box(root, '#284a58', [-1.65 + i * 1.2, 3.07, -.6], [1.06, .09, 2.6]); panel.rotation.x = -.12;
    for (let j = 0; j < 4; j++) a.box(root, '#839b99', [-1.65 + i * 1.2, 3.16, -1.53 + j * .65], [1.08, .018, .018]);
  }
  const antenna = new THREE.Group(); antenna.position.set(2.4, 0, -1.8); root.add(antenna);
  for (const x of [-.28, .28]) a.mesh(antenna, 'cylinder', '#9da591', [x, 3.1, 0], [.045, 6.2, .045]);
  for (let y = .8; y < 6; y += .65) a.box(antenna, '#7f8e7b', [0, y, 0], [.58, .05, .07]).rotation.z = .6;
  a.box(antenna, '#a1b39b', [0, 5.3, 0], [2.6, .065, .065]);
  a.box(antenna, '#a1b39b', [0, 5.8, 0], [1.6, .065, .065]);
  const beacon = a.mesh(antenna, 'sphere', '#d8f4a0', [0, 6.35, 0], [.16, .16, .16], true);
  // Segmented perimeter leaves an entrance on each side.
  const armor = new THREE.Group(), spikes = new THREE.Group(), gates = []; root.add(armor, spikes);
  for (let side = 0; side < 4; side++) {
    const fence = new THREE.Group(); fence.rotation.y = side * Math.PI / 2; root.add(fence);
    const gate = a.box(fence, '#91b58a', [0, .85, 4.65], [2.3, 1.5, .18]); gates.push(gate);
    a.box(fence, '#c7e4a0', [0, 1.63, 4.65], [2.5, .08, .2], true);
    for (let j = -4; j <= 4; j++) {
      if (Math.abs(j) < 2) continue;
      const spike = a.mesh(spikes, 'cone', '#bca47c', [j, .55, 5.35], [.17, 1.4, .17]);
      spike.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), side * Math.PI / 2);
      spike.rotation.set(.45 * Math.cos(side * Math.PI / 2), 0, -.45 * Math.sin(side * Math.PI / 2));
    }
    for (const sign of [-1, 1]) {
      for (let row = 0; row < 2; row++) for (let j = 0; j < 5; j++) {
        a.box(fence, row ? '#8b876a' : '#736f57', [sign * (1.55 + j * .7), .32 + row * .4, 4.65], [.76, .42, .7]);
      }
      a.box(fence, '#526454', [sign * 4.95, 1.03, 4.65], [.23, 2.1, .25]);
      const plate = a.box(armor, '#718473', [sign * 3, 1.2, 4.7], [2.3, 1.7, .14]);
      plate.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), side * Math.PI / 2); plate.rotation.y = side * Math.PI / 2;
    }
  }
  armor.visible = false;
  const infirmary = new THREE.Group(); infirmary.position.set(-2.4, 0, 3.25); root.add(infirmary);
  a.box(infirmary, '#e0d7b9', [0, .43, 0], [1.2, .8, .65]);
  a.box(infirmary, '#b76557', [0, .87, 0], [.2, .03, .5]);
  a.box(infirmary, '#b76557', [0, .87, 0], [.6, .03, .17]);
  const generator = new THREE.Group(); generator.position.set(2.4, 0, 3.25); root.add(generator);
  a.box(generator, '#b39b58', [0, .5, 0], [1.3, 1, .85]);
  for (let j = 0; j < 4; j++) a.box(generator, '#354941', [-.4 + j * .26, .5, .44], [.1, .6, .04]);
  a.mesh(generator, 'cylinder', '#64756d', [.4, 1.2, -.2], [.09, .5, .09]);
  const generatorLamp = a.box(generator, '#b8e787', [-.35, .93, .45], [.16, .08, .05], true);
  for (const x of [-4.45, 4.45]) {
    a.mesh(root, 'cylinder', '#566a5c', [x, 1.65, 3.8], [.07, 3.3, .07]);
    a.box(root, '#d6c79e', [x, 3.3, 3.8], [.35, .19, .3], true);
  }
  const health = new THREE.Group(); health.position.set(0, .2, 5.05); root.add(health);
  a.box(health, '#2c4131', [0, 0, 0], [4, .04, .12]);
  const fill = a.box(health, '#b4d97d', [0, .025, 0], [4, .04, .12], true);
  root.userData.fadeMeshes = [walls, roof];
  return { root, beacon, armor, fill, gates, spikes, infirmary, generator, generatorLamp };
}

export function lootCrate(a, type) {
  const root = new THREE.Group(), color = { relay: '#87d4d3', medical: '#d5997d', lumber: '#d8a56d', technology: '#b6a0e1' }[type] || '#c2cd89';
  a.box(root, '#3c4c40', [0, .34, 0], [1.04, .62, .75]);
  const lid = new THREE.Group(); lid.position.set(0, .64, -.37); root.add(lid);
  a.box(lid, '#56644c', [0, .03, .37], [1.08, .14, .8]);
  for (const x of [-.34, .34]) { a.box(lid, color, [x, .11, .37], [.12, .03, .81]); a.box(root, color, [x, .34, .385], [.12, .61, .025]); }
  a.box(root, color, [0, .4, .405], [.13, .19, .04], true);
  const marker = new THREE.Group(); root.add(marker);
  const diamond = a.mesh(marker, 'sphere', color, [0, 1.4, 0], [.14, .2, .14], true);
  if (type === 'lumber') for (let j = 0; j < 3; j++) a.box(lid, '#be9567', [-.3 + j * .3, .2, .37], [.22, .15, 1.1]);
  if (type === 'technology') { a.box(lid, '#b6a0e1', [0, .17, .37], [.4, .15, .4]); a.box(lid, '#d5eddf', [0, .26, .37], [.2, .03, .2], true); }
  if (type === 'relay') {
    a.mesh(root, 'cylinder', '#789c99', [0, 1.05, 0], [.05, 1.4, .05]);
    a.box(root, color, [0, 1.62, 0], [.9, .045, .045], true);
    a.ring(marker, color, 1.15, .025);
  }
  return { root, lid, marker, diamond };
}

export function turret(a) {
  const root = new THREE.Group(), head = new THREE.Group(); head.position.y = 1.15; root.add(head);
  for (let i = 0; i < 3; i++) {
    const leg = a.box(root, '#5c6e65', [Math.sin(i * 2.094) * .35, .35, Math.cos(i * 2.094) * .35], [.12, .85, .12]); leg.rotation.z = Math.cos(i * 2.094) * .5; leg.rotation.x = Math.sin(i * 2.094) * .5;
  }
  a.box(head, '#7d9280', [0, 0, 0], [.7, .5, .7]);
  a.box(head, '#31473e', [0, 0, -.65], [.18, .18, .86]);
  a.box(head, '#b7e491', [0, .3, -.1], [.2, .08, .3], true);
  return { root, head };
}

export function wreck(a, color = '#606e61') {
  const root = new THREE.Group();
  a.box(root, '#26332e', [0, .36, 0], [1.7, .28, 3.2]);
  a.box(root, color, [0, .68, 0], [1.8, .53, 3.4]);
  a.box(root, '#3a5152', [0, 1.12, -.2], [1.53, .5, 1.6]);
  a.box(root, color, [0, 1.4, -.2], [1.66, .13, 1.75]);
  for (const x of [-.9, .9]) for (const z of [-1.04, 1.04]) {
    const wheel = a.mesh(root, 'cylinder', '#222d2c', [x, .35, z], [.35, .21, .35]); wheel.rotation.z = Math.PI / 2;
  }
  for (const x of [-.55, .55]) a.box(root, '#b4ac7b', [x, .75, -1.72], [.3, .16, .05]);
  return root;
}
