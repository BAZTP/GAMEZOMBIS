import { test, expect } from '@playwright/test';

test('WebGL draws solid geometry and projected aiming hits after camera rotation', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/tests/browser/renderer.html');
  await page.waitForFunction(() => !!window.fixture);
  const result = await page.evaluate(() => {
    const { renderer: r, game: g, THREE } = window.fixture;
    const target = new THREE.WebGLRenderTarget(128, 128);
    r.gpu.setRenderTarget(target); r.gpu.render(r.scene, r.camera);
    const pixels = new Uint8Array(128 * 128 * 4); r.gpu.readRenderTargetPixels(target, 0, 0, 128, 128, pixels);
    r.gpu.setRenderTarget(null); target.dispose();
    const colors = new Set(); for (let i = 0; i < pixels.length; i += 64) colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);
    const errors = [], kills = [], directions = [];
    g.spawnTimer = 1000;
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      g.enemies = []; g.spawnEnemy('walker');
      const e = g.enemies[0]; Object.assign(e, { x: g.player.x + 100, y: g.player.y + 30, hp: 25, speed: 0 });
      g.shotTimer = 0; g.magazines[0] = 12;
      r.yawGoal = angle; r.updateCamera(1, true); r.draw(g, angle + 3);
      const screen = r.project(e.x, e.y, 1.12), aim = r.screenToWorld(screen.x, screen.y);
      errors.push(Math.hypot(aim.x - e.x, aim.y - e.y));
      const before = g.kills;
      for (let i = 0; i < 6; i++) g.update(.025, { shoot: true, angle: Math.atan2(aim.y - g.player.y, aim.x - g.player.x) });
      kills.push(g.kills - before);
      // A screen-right movement must project to the right at every camera azimuth.
      const movement = r.movementToWorld(1, 0), center = r.project(g.player.x, g.player.y);
      const moved = r.project(g.player.x + movement.x * 30, g.player.y + movement.y * 30);
      directions.push(moved.x > center.x && Math.abs(moved.y - center.y) < 2);
      r.draw(g, angle + 4);
    }
    return { webgl: r.gpu.getContext() instanceof WebGL2RenderingContext, colors: colors.size, triangles: r.gpu.info.render.triangles, errors, kills, directions, enemyModels: r.enemyModels.size };
  });
  expect(result.webgl).toBe(true); expect(result.colors).toBeGreaterThan(25); expect(result.triangles).toBeGreaterThan(10000);
  expect(Math.max(...result.errors)).toBeLessThan(.001); expect(result.kills).toEqual([1,1,1,1]);
  expect(result.directions).toEqual([true,true,true,true]); expect(result.enemyModels).toBe(0); expect(errors).toEqual([]);
});

test('restart releases GPU resources and night lighting and built turrets update', async ({ page }) => {
  await page.goto('/tests/browser/renderer.html'); await page.waitForFunction(() => !!window.fixture);
  const result = await page.evaluate(() => {
    const { renderer: r, Game } = window.fixture;
    const counts = [];
    for (let i = 0; i < 4; i++) { const g = new Game({ seed: 42 }); r.draw(g, i + 1); counts.push({ ...r.gpu.info.memory }); }
    const g = r.currentGame; const daylight = r.sun.intensity;
    g.inventory.scrap = 100; g.inventory.energy = 50; g.inventory.wood = 50; g.inventory.parts = 20; g.purchase('turret'); g.purchase('walls');
    g.startNight(); for (let i = 0; i < 40; i++) r.draw(g, 5 + i * .1);
    const result = { counts, daylight, night: r.sun.intensity, flashlight: r.flashlight.intensity, turrets: r.turretModels.size, armor: r.baseModel.armor.visible };
    r.dispose(); return result;
  });
  expect(result.counts.every(c => c.geometries === result.counts[0].geometries && c.textures === result.counts[0].textures)).toBe(true);
  expect(result.night).toBeLessThan(result.daylight / 2); expect(result.flashlight).toBeGreaterThan(0);
  expect(result.turrets).toBe(1); expect(result.armor).toBe(true);
});

test('camera buttons, wheel zoom and keyboard remain usable in the live game', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'INICIAR SUPERVIVENCIA' }).click();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-renderer', 'webgl2');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-world', 'ready');
  await page.getByRole('button', { name: 'Girar cámara a la derecha' }).click();
  await page.getByRole('button', { name: 'Acercar cámara' }).click();
  await page.keyboard.press('z');
  const canvas = page.locator('#game-canvas'); await canvas.hover(); await page.mouse.wheel(0, -100);
  await page.keyboard.press('v');
  await page.keyboard.press('Escape'); await expect(page.getByRole('heading', { name: 'Toma un respiro.' })).toBeVisible();
  await page.getByRole('button', { name: 'VOLVER AL SECTOR' }).click();
  await expect(page.locator('#graphics-status')).toBeHidden();
});

test('missing WebGL shows an actionable message and does not start a broken game', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, options) { return type.includes('webgl') ? null : getContext.call(this, type, options); };
  });
  await page.goto('/'); await expect(page.locator('#graphics-status')).toContainText('El modo 3D necesita WebGL 2.');
  await expect(page.locator('#start-btn')).toBeDisabled();
  await page.getByRole('button', { name: 'Ver controles' }).click();
  await expect(page.getByRole('heading', { name: 'Aprende a seguir vivo.' })).toBeVisible();
});
