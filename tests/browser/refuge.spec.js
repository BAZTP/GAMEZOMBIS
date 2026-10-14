import { test, expect } from '@playwright/test';

test('workshop explains material costs, missing supplies and all seven weapons', async ({ page }) => {
  await page.goto('/'); await page.locator('#start-btn').click();
  await expect(page.locator('#wood')).toHaveText('0'); await expect(page.locator('#parts')).toHaveText('0');
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-buy="walls"]')).toBeDisabled();
  await expect(page.locator('[data-buy="walls"]')).toContainText('14 Madera');
  await expect(page.locator('[data-buy="walls"]')).toContainText('2 Componentes');
  await page.getByRole('tab', { name: 'Arsenal' }).click();
  await expect(page.locator('[data-equip]')).toHaveCount(7);
  await expect(page.locator('[data-equip="5"]')).toBeDisabled();
  await expect(page.locator('[data-buy="crossbow"]')).toContainText('16 Madera');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Suministros' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-buy="bolts"]')).toBeDisabled();
  await expect(page.locator('[data-buy="rockets"]')).toContainText('Granadas ×6');
});

test('recovered materials build the refuge and unlock weapons through the real interface', async ({ page }) => {
  test.setTimeout(60000);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  // Controlled expedition state served only by this test, with no debug API in the shipped game.
  await page.route('**/src/engine.js', async route => {
    const response = await route.fetch();
    const source = (await response.text()).replace('this.makeWorld();', `this.makeWorld();
      Object.assign(this.inventory, { scrap: 999, energy: 999, wood: 999, parts: 999 });
      Object.assign(this.player, { x: 1200, y: 900 }); this.enemies = []; this.spawnTimer = 1000;`);
    await route.fulfill({ response, body: source });
  });
  await page.goto('/'); await page.locator('#start-btn').click();
  await expect(page.locator('#refuge-safety')).toHaveText('PROTEGIDO DENTRO DEL REFUGIO');
  await page.keyboard.press('Tab');
  for (const id of ['walls', 'spikes', 'infirmary', 'generator', 'turret']) await page.locator(`[data-buy="${id}"]`).click();
  await expect(page.locator('#base-hp')).toHaveText('420 / 420');
  await expect(page.locator('#defenses')).toContainText('BLINDAJE 1/3 · 1 TORRETAS');
  await page.getByRole('tab', { name: 'Arsenal' }).click();
  for (const id of ['shotgun', 'rifle', 'smg', 'sniper', 'crossbow', 'launcher']) await page.locator(`[data-buy="${id}"]`).click();
  await page.locator('[data-equip="5"]').click();
  await expect(page.locator('[data-equip="5"]')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: '/tmp/zombis-arsenal.png' });
  await page.keyboard.press('Escape');
  await expect(page.locator('#ammo-kind')).toHaveText('VIROTES');
  await expect(page.locator('#clip')).toHaveText('1'); await expect(page.locator('#ammo')).toHaveText('11');
  const box = await page.locator('#game-canvas').boundingBox();
  await page.mouse.click(box.x + box.width * .75, box.y + box.height * .6);
  await expect(page.locator('#clip')).toHaveText('0');
  await page.keyboard.press('r');
  await expect(page.locator('#clip')).toHaveText('1', { timeout: 5000 });
  await expect(page.locator('#ammo')).toHaveText('10');
  await page.keyboard.press('7'); await expect(page.locator('#ammo-kind')).toHaveText('GRANADAS');
  await expect(page.locator('#clip')).toHaveText('3'); await expect(page.locator('#ammo')).toHaveText('3');
  await page.locator('#weapon-cycle').click(); await expect(page.locator('#weapon-name')).toHaveText('PISTOLA M9');
  await page.keyboard.press('4'); await expect(page.locator('#weapon-name')).toHaveText('SUBFUSIL RÁFAGA');
  await page.keyboard.press('5'); await expect(page.locator('#weapon-name')).toHaveText('RIFLE VIGÍA');
  await page.screenshot({ path: '/tmp/zombis-refuge.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('3D constructions, weapon attachments and explosions follow gameplay state', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/tests/browser/renderer.html'); await page.waitForFunction(() => !!window.fixture);
  const result = await page.evaluate(() => {
    const { game: g, renderer: r } = window.fixture;
    g.enemies = []; g.spawnTimer = 1000;
    Object.assign(g.inventory, { scrap: 999, energy: 999, wood: 999, parts: 999 });
    const before = ['spikes', 'infirmary', 'generator'].map(id => r.baseModel[id].visible);
    for (const id of ['walls', 'spikes', 'infirmary', 'generator', 'shotgun', 'rifle', 'smg', 'sniper', 'crossbow', 'launcher']) g.purchase(id);
    const weapons = [];
    for (let i = 0; i < 7; i++) { g.switchWeapon(i); r.draw(g, i + 2); weapons.push(r.hero.attachments.map(a => a.visible)); }
    g.shotTimer = 0; g.player.angle = 0; g.shoot();
    for (let i = 0; i < 45; i++) g.update(.025);
    r.draw(g, 10);
    return { before, built: ['armor', 'spikes', 'infirmary', 'generator'].map(id => r.baseModel[id].visible), weapons, blasts: r.blastModels.filter(m => m.visible).length, finite: r.hero.gun.scale.toArray().every(Number.isFinite) };
  });
  expect(result.before).toEqual([false, false, false]); expect(result.built).toEqual([true, true, true, true]);
  for (let i = 0; i < 7; i++) expect(result.weapons[i]).toEqual(Array.from({ length: 7 }, (_, j) => j === i));
  expect(result.blasts).toBe(1); expect(result.finite).toBe(true); expect(errors).toEqual([]);
});
