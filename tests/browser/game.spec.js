import { test, expect } from '@playwright/test';

test('desktop: start, movement, shooting, reload, workshop, map and pause', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Que no se apague.' })).toBeVisible();
  await page.screenshot({ path: '/tmp/zombis-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'INICIAR SUPERVIVENCIA' }).click();
  await expect(page.locator('#welcome')).toBeHidden();
  const canvas = page.locator('#game-canvas'), box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(400); await page.mouse.up();
  await expect(page.locator('#clip')).not.toHaveText('12');
  await page.keyboard.press('r'); await expect(page.locator('#clip')).toHaveText('12', { timeout: 4000 });
  await page.keyboard.press('Tab'); await expect(page.getByRole('heading', { name: 'Taller del refugio.' })).toBeVisible();
  await page.getByRole('tab', { name: 'Suministros' }).click();
  const ammoBefore = Number(await page.locator('#ammo').textContent());
  await page.locator('[data-buy="ammo"]').click(); await expect(page.locator('#scrap')).toHaveText('16');
  await page.keyboard.press('Escape'); await expect(page.locator('#ammo')).toHaveText(String(ammoBefore + 60));
  await page.keyboard.press('m'); await expect(page.locator('#big-map')).toBeVisible(); await page.keyboard.press('Escape');
  await page.keyboard.down('d'); await page.waitForTimeout(450); await page.keyboard.up('d');
  await page.keyboard.press('Escape'); await expect(page.getByRole('heading', { name: 'Toma un respiro.' })).toBeVisible();
  const timer = await page.locator('#timer').textContent(); await page.waitForTimeout(1100); await expect(page.locator('#timer')).toHaveText(timer);
  await page.getByRole('button', { name: 'VOLVER AL SECTOR' }).click();
  await page.keyboard.press('Tab'); await page.getByRole('button', { name: 'ADELANTAR LA NOCHE' }).click();
  await expect(page.locator('#day-label')).toHaveText('NOCHE 01');
  await page.screenshot({ path: '/tmp/zombis-playing.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('mobile layout and touch controls work without horizontal overflow', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage(); await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.getByRole('button', { name: 'INICIAR SUPERVIVENCIA' }).tap();
  await expect(page.locator('#joystick')).toBeVisible(); await expect(page.locator('#touch-fire')).toBeVisible();
  const fire = await page.locator('#touch-fire').boundingBox();
  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: fire.x + fire.width / 2, y: fire.y + fire.height / 2 }] });
  await page.waitForTimeout(400);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#clip')).not.toHaveText('12');
  await page.getByRole('button', { name: 'Ver controles' }).tap(); await expect(page.getByRole('heading', { name: 'Aprende a seguir vivo.' })).toBeVisible();
  await page.getByRole('button', { name: 'ENTENDIDO' }).tap();
  await page.screenshot({ path: '/tmp/zombis-mobile.png' });
  await context.close();
});

test('sound preference persists and bundled assets need no external requests', async ({ page }) => {
  const external = []; page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:5173') && !r.url().startsWith('data:')) external.push(r.url()); });
  await page.goto('/'); await page.getByRole('button', { name: 'Desactivar sonido' }).click();
  await page.reload(); await expect(page.getByRole('button', { name: 'Activar sonido' })).toBeVisible();
  expect(external).toEqual([]);
});
