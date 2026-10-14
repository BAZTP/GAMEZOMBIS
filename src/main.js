import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-800.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './style.css';
import { Game, WEAPONS, UPGRADES, RESOURCES, WEAPON_AMMO_LABELS, dist } from './engine.js';
import { Renderer } from './render.js';
import { drawMinimap } from './minimap.js';
import { Sound } from './audio.js';

const icons = {
  mark: '<svg viewBox="0 0 32 32"><path d="M7 5h21L13 20h13v7H4v-6L19 11H7z" fill="currentColor"/></svg>',
  target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><path d="M12 1v7m0 8v7M1 12h7m8 0h7"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="m14 2-9 12h6l-1 8 9-13h-6z"/></svg>',
  box: '<svg viewBox="0 0 24 24"><path d="m3 7 9-4 9 4v11l-9 4-9-4zM3 7l9 4 9-4M12 11v11M7 5l10 5"/></svg>',
  signal: '<svg viewBox="0 0 24 24"><path d="M12 13v9M8 22h8M7 16a7 7 0 0 1 0-10m10 0a7 7 0 0 1 0 10M4 19a11 11 0 0 1 0-16m16 0a11 11 0 0 1 0 16"/><circle cx="12" cy="11" r="2"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-5v16l-5-5H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  map: '<svg viewBox="0 0 24 24"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16"/></svg>',
};
const $ = s => document.querySelector(s);
const sound = new Sound();
let game = new Game({ seed: 90210 });
let started = false, paused = false, modalType = '', saved = null, lastHud = 0, lastFrame = 0, lastRender = 0, endRecorded = false;
try { saved = JSON.parse(localStorage.getItem('zombis-record') || 'null'); sound.enabled = localStorage.getItem('zombis-sound') !== 'off'; } catch {}
document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="Zombis, inicio">${icons.mark}<span>ZOMBIS<small>ÚLTIMA SEÑAL</small></span></a>
    <div class="top-status"><span class="status-dot"></span> CONEXIÓN LOCAL <i></i><span>SECTOR 07</span></div>
    <div class="top-actions"><span class="version">PROTOCOLO DE SUPERVIVENCIA / EDICIÓN 3D</span><button id="audio-btn" class="icon-btn" aria-label="Desactivar sonido" title="Sonido">${icons.sound}</button><button id="help-btn" class="icon-btn help" aria-label="Ver controles" title="Controles">?</button></div>
  </header>
  <main class="dashboard">
    <section class="play-column">
      <div class="section-heading"><div><span class="eyebrow">OPERACIÓN: ÚLTIMA SEÑAL</span><h1>Que no se apague.</h1></div><span class="live-label"><span class="status-dot"></span> <span id="mode-label">ESPERANDO SUPERVIVIENTE</span></span></div>
      <div class="game-shell">
        <canvas id="game-canvas" tabindex="0" aria-label="Mundo 3D. Muévete con WASD, apunta con el ratón y dispara con clic. E para recoger recursos; Z y X para girar la cámara."></canvas>
        <div id="graphics-status" class="graphics-status" role="alert" hidden></div>
        <div class="camera-controls"><span>3D</span><button id="camera-left" aria-label="Girar cámara a la izquierda" title="Girar cámara (Z)">↶</button><button id="camera-right" aria-label="Girar cámara a la derecha" title="Girar cámara (X)">↷</button><button id="camera-in" aria-label="Acercar cámara">+</button><button id="camera-out" aria-label="Alejar cámara">−</button><button id="camera-reset" aria-label="Restablecer cámara" title="Restablecer cámara (V)">⌖</button><button id="fullscreen-btn" aria-label="Pantalla completa" title="Pantalla completa">⛶</button></div>
        <div id="world-compass" class="world-compass" aria-hidden="true"></div>
        <div class="field-top"><div class="day-block"><span id="phase-icon">☀</span><div><strong id="day-label">DÍA 01</strong><small id="phase-label">VENTANA DE EXPLORACIÓN</small></div></div><div class="field-clock"><span id="timer">01:20</span><small id="timer-caption">HASTA EL ANOCHECER</small></div></div>
        <div class="coordinates">ZONA DE EXCLUSIÓN <span>23° 41′ N / 104° 52′ O</span></div>
        <div class="welcome" id="welcome"><div class="welcome-tag"><span></span> NO ESTÁS SOLO. TODAVÍA.</div><h2>EL MUNDO CAYÓ.<br><em>TÚ SIGUES AQUÍ.</em></h2><p>Tres relés. Cinco noches. Una última oportunidad.<br>Explora las ruinas y protege la señal que puede salvarte.</p><button class="primary start-button" id="start-btn">INICIAR SUPERVIVENCIA <span>↗</span></button><div class="difficulty"><label for="difficulty">DIFICULTAD</label><select id="difficulty"><option value="story">Explorador</option><option value="normal" selected>Superviviente</option><option value="hard">Sin piedad</option></select></div><small class="welcome-foot">SIN DESCARGAS · SIN CUENTAS · SOLO SOBREVIVIR</small></div>
        <div class="field-bottom"><div class="vitals"><div><span class="heart">✚</span><strong id="hp">100</strong><small>SALUD</small></div><div class="health-track"><span id="hp-bar"></span></div><div class="stamina-track"><span id="stamina-bar"></span></div></div><div class="weapon-hud"><small id="ammo-kind">BALAS</small><button id="weapon-cycle" aria-label="Cambiar arma" title="Cambiar arma (1–7)"><span id="weapon-name">PISTOLA M9</span> ⇄</button><div><strong id="clip">12</strong><span>/ <b id="ammo">108</b></span><button id="reload-btn" aria-label="Recargar" title="Recargar (R)"><kbd>R</kbd></button></div></div></div>
        <div class="toast" id="toast" role="status" aria-live="polite"></div>
        <div class="interaction" id="interaction"></div>
        <div class="touch-controls"><div id="joystick" aria-label="Joystick de movimiento"><span></span></div><div class="touch-right"><button id="touch-interact" aria-label="Recoger recursos">E</button><button id="touch-heal" aria-label="Usar botiquín">✚</button><button id="touch-fire" aria-label="Disparar">${icons.target}</button></div></div>
        <div class="paused-tag" id="paused-tag" hidden>SEÑAL EN ESPERA</div>
      </div>
      <div class="controls-strip"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Moverse</span><span><b class="mouse-symbol">↖</b> Apuntar / disparar</span><span><kbd>E</kbd> Saquear</span><span><kbd>SHIFT</kbd> Correr</span><button id="all-controls">Todos los controles <span>↗</span></button></div>
      <div class="lower-grid"><button class="feature-card" id="workshop-btn"><span class="feature-icon">${icons.box}</span><div><span class="eyebrow">PREPARA TU SIGUIENTE MOVIMIENTO</span><h3>Taller del refugio <span>↗</span></h3><p>Mejora tu arsenal. Fortalece tu última defensa.</p></div><kbd>TAB</kbd></button><div class="record-card"><span class="eyebrow">TU HUELLA EN EL SECTOR</span><div><strong id="record">${saved?.best || '—'}</strong><span>MEJOR PUNTUACIÓN</span></div></div></div>
    </section>
    <aside class="sidebar">
      <div class="sidebar-heading"><span class="eyebrow">CENTRO DE MANDO</span><span class="tiny-pill">EN LÍNEA</span></div>
      <section class="panel mission"><div class="panel-heading"><h2>${icons.signal} La última transmisión</h2><span>01—05</span></div><p>Restablece la antena y sobrevive hasta que llegue la evacuación.</p><div class="objective"><span class="objective-num" id="relay-check">01</span><div><strong>Recupera los relés</strong><small>Explora las tres zonas señaladas</small></div><b id="relay-count">0/3</b></div><div class="objective"><span class="objective-num" id="night-check">02</span><div><strong>Resiste cinco noches</strong><small>El refugio debe seguir en pie</small></div><b id="night-count">0/5</b></div><div class="mission-progress"><span id="mission-bar"></span></div></section>
      <section class="panel shelter"><div class="panel-heading"><h2>${icons.shield} Refugio 07</h2><span id="base-status" class="text-green">ESTABLE</span></div><div class="base-stat"><span>Integridad estructural</span><strong id="base-hp">300 <small>/ 300</small></strong></div><div class="base-track"><span id="base-bar"></span></div><p id="refuge-safety" class="refuge-safety">ENTRA AL PERÍMETRO PARA PROTEGERTE</p><div class="shelter-footer"><span id="defenses">0 TORRETAS ACTIVAS</span><button id="repair-btn">REPARAR ↗</button></div></section>
      <section class="panel supplies"><div class="panel-heading"><h2>${icons.box} Suministros</h2><span>MOCHILA</span></div><div class="resource-grid"><div><span class="resource-icon scrap">▱</span><strong id="scrap">24</strong><small>CHATARRA</small></div><div><span class="resource-icon energy">ϟ</span><strong id="energy">6</strong><small>ENERGÍA</small></div><div><span class="resource-icon wood">▤</span><strong id="wood">0</strong><small>MADERA</small></div><div><span class="resource-icon parts">⚙</span><strong id="parts">0</strong><small>COMPONENTES</small></div><div><span class="resource-icon med">✚</span><strong id="medkits">2</strong><small>BOTIQUINES</small></div></div></section>
      <section class="panel radar"><div class="panel-heading"><h2>${icons.map} Radar del sector</h2><button id="map-btn" aria-label="Ampliar mapa" title="Mapa (M)">↗</button></div><button class="minimap-button" id="minimap-btn" aria-label="Abrir mapa del sector"><canvas id="minimap" width="480" height="280"></canvas><span class="radar-north">N ↑</span></button><div class="map-legend"><span><i class="green"></i>Refugio</span><span><i class="blue"></i>Relés</span><span><i class="orange"></i>Amenazas</span></div></section>
      <section class="noise-panel"><div>${icons.target}<span>HUELLA SONORA</span><strong id="noise-label">BAJA</strong></div><div class="noise-track">${Array.from({ length: 22 }, (_, i) => `<i data-noise="${i}"></i>`).join('')}</div><p id="noise-description">El silencio también es un arma.</p></section>
    </aside>
  </main>
  <footer><span><span class="status-dot"></span> REFUGIO 07 · NADIE SOBREVIVE POR CASUALIDAD</span><div><span id="kill-count">0 ELIMINADOS</span><i></i><button id="pause-btn">${icons.pause} PAUSA <kbd>ESC</kbd></button></div></footer>
  <dialog id="dialog" aria-labelledby="dialog-title"><div id="dialog-content"></div></dialog>
`;
const canvas = $('#game-canvas'), mini = $('#minimap'), dialog = $('#dialog');
let renderer;
try { renderer = new Renderer(canvas); }
catch {
  $('#graphics-status').hidden = false;
  $('#graphics-status').innerHTML = '<strong>El modo 3D necesita WebGL 2.</strong><p>Activa la aceleración gráfica y abre el juego en un navegador actualizado.</p><button onclick="location.reload()">VOLVER A INTENTAR</button>';
  $('#start-btn').disabled = true; $('#welcome').hidden = true;
  document.querySelectorAll('.camera-controls button').forEach(b => b.disabled = true);
}
const keys = new Set(), pointer = { x: 0, y: 0, active: false, down: false }, touch = { x: 0, y: 0, fire: false, interact: false, sprint: false };
$('#reload-btn').onclick = () => { if (started && !paused) game.reload(); };
$('#weapon-cycle').onclick = () => {
  if (!started || paused) return;
  for (let n = 1; n <= WEAPONS.length; n++) { const index = (game.weapon + n) % WEAPONS.length; if (game.switchWeapon(index)) break; }
};
function updateAudioButton() { $('#audio-btn').classList.toggle('muted', !sound.enabled); $('#audio-btn').setAttribute('aria-label', sound.enabled ? 'Desactivar sonido' : 'Activar sonido'); $('#audio-btn').setAttribute('aria-pressed', String(sound.enabled)); }
updateAudioButton();
$('#audio-btn').onclick = () => { sound.unlock(); sound.enabled = !sound.enabled; updateAudioButton(); try { localStorage.setItem('zombis-sound', sound.enabled ? 'on' : 'off'); } catch {} };
function start() {
  if (!renderer) return;
  game = new Game({ difficulty: $('#difficulty')?.value || game.difficulty }); started = true; paused = false; endRecorded = false;
  closeModal(); $('#welcome').hidden = true; $('.game-shell').classList.add('is-playing');
  $('#mode-label').textContent = 'SUPERVIVENCIA EN 3D'; sound.unlock(); renderer.resetCamera(game.player); canvas.focus();
}
$('#start-btn').onclick = start;
$('#camera-left').onclick = () => renderer?.rotate(-1);
$('#camera-right').onclick = () => renderer?.rotate(1);
$('#camera-in').onclick = () => renderer?.zoom(-4);
$('#camera-out').onclick = () => renderer?.zoom(4);
$('#camera-reset').onclick = () => renderer?.resetCamera(game.player);
$('#fullscreen-btn').hidden = !document.fullscreenEnabled;
$('#fullscreen-btn').onclick = async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('.game-shell').requestFullscreen(); }
  catch { game.notify('No se pudo abrir la pantalla completa.'); }
};
canvas.addEventListener('wheel', e => { if (!started || paused || !renderer) return; e.preventDefault(); renderer.zoom(Math.sign(e.deltaY) * 2); }, { passive: false });
canvas.addEventListener('webglcontextlost', e => {
  e.preventDefault(); if (started && !paused) openPause();
  $('#start-btn').disabled = true;
  $('#graphics-status').textContent = 'La conexión gráfica se ha interrumpido. Esperando recuperación…'; $('#graphics-status').hidden = false;
});
canvas.addEventListener('webglcontextrestored', () => { $('#graphics-status').hidden = true; $('#start-btn').disabled = false; });
$('.brand').onclick = e => { e.preventDefault(); if (started) openPause(); };
function closeModal() { dialog.close(); modalType = ''; paused = false; keys.clear(); pointer.down = false; touch.fire = false; touch.interact = false; if (started) canvas.focus(); }
function showModal(type, content) {
  modalType = type; paused = true; keys.clear(); pointer.down = false;
  touch.x = touch.y = 0; touch.fire = touch.interact = touch.sprint = false;
  $('#dialog-content').innerHTML = content; if (!dialog.open) dialog.showModal();
  $('#dialog-content').querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
}
const closeButton = '<button class="close-modal" data-close aria-label="Cerrar">×</button>';
function openHelp() {
  showModal('help', `${closeButton}<span class="eyebrow">MANUAL DE CAMPO / 07</span><h2 id="dialog-title">Aprende a seguir vivo.</h2><p class="modal-lead">Saquea de día, prepara tus defensas y protege el refugio de noche. Recupera los tres relés azules del mapa y sobrevive cinco noches para evacuar.</p><div class="help-grid">${[['W A S D / ↑ ↓ ← →','Moverse respecto a la cámara'],['RATÓN + CLIC','Apuntar y disparar'],['E (MANTENER)','Abrir cajas y recuperar relés'],['SHIFT','Correr · consume resistencia'],['R','Recargar el arma'],['Q','Usar un botiquín'],['1–7','Equipar una de las siete armas'],['TAB','Taller (cerca del refugio)'],['M','Consultar el mapa'],['ESC','Pausar / continuar'],['Z / X · V','Girar cámara · restablecer vista'],['RUEDA / + / −','Acercar o alejar la cámara']].map(([k,v]) => `<div><kbd>${k}</kbd><span>${v}</span></div>`).join('')}</div><div class="field-note"><strong>El refugio te protege.</strong> Dentro del perímetro los zombis no pueden entrar ni golpearte, pero atacan los muros. Si la integridad llega a cero, pierdes la partida. Las cajas marrones dan madera; las violetas, componentes. Úsalos en el taller para construir blindaje, estacas, enfermería y un generador que repara usando energía. <strong>Escucha el silencio.</strong> Correr y disparar aumenta tu huella sonora. Una huella alta atrae enemigos desde más lejos y acelera la horda. Cada amanecer recibes suministros. En móvil, usa el joystick y el botón de disparo con apuntado automático. Los botones 3D permiten girar y acercar la cámara.</div><button class="primary" data-close>ENTENDIDO <span>↗</span></button>`);
}
$('#help-btn').onclick = openHelp; $('#all-controls').onclick = openHelp;
function openPause() {
  if (!started) return openHelp();
  if (game.state !== 'playing') return showEnd();
  showModal('pause', `${closeButton}<span class="eyebrow">TRANSMISIÓN EN PAUSA</span><h2 id="dialog-title">Toma un respiro.</h2><p class="modal-lead">La noche puede esperar. Tu partida está en pausa.</p><div class="pause-stats"><div><strong>${game.day}</strong><span>DÍA</span></div><div><strong>${game.kills}</strong><span>ELIMINADOS</span></div><div><strong>${game.score}</strong><span>PUNTOS</span></div></div><button class="primary" data-close>VOLVER AL SECTOR <span>→</span></button><button class="secondary" id="restart-confirm">REINICIAR PARTIDA</button>`);
  $('#restart-confirm').onclick = () => {
    showModal('confirm', `${closeButton}<span class="eyebrow">NUEVA EXPEDICIÓN</span><h2 id="dialog-title">¿Empezar de nuevo?</h2><p class="modal-lead">Se perderá el progreso de esta partida. Tu récord se conserva.</p><button class="primary" id="restart-yes">SÍ, REINICIAR</button><button class="secondary" data-close>SEGUIR JUGANDO</button>`); $('#restart-yes').onclick = start;
  };
}
$('#pause-btn').onclick = openPause;
let workshopTab = 'refuge';
const workshopGroups = {
  refuge: { name: 'Refugio', ids: ['repair', 'walls', 'spikes', 'turret', 'infirmary', 'generator'] },
  arsenal: { name: 'Arsenal', ids: ['shotgun', 'rifle', 'smg', 'sniper', 'crossbow', 'launcher', 'damage'] },
  supplies: { name: 'Suministros', ids: ['ammo', 'bolts', 'rockets', 'medkit'] },
};
function workshop() {
  if (!started) { openHelp(); return; }
  if (game.state !== 'playing') return;
  const near = game.nearBase();
  showModal('workshop', `${closeButton}<span class="eyebrow">INGENIERÍA DE SUPERVIVENCIA</span><h2 id="dialog-title">Taller del refugio.</h2><p class="modal-lead">${near ? 'Explora, recupera materiales y construye un refugio más resistente.' : 'Acércate al refugio para fabricar o reparar.'}</p>
    <div class="workshop-balance">${Object.entries(RESOURCES).map(([id, r]) => `<span>${r.icon} <b>${game.inventory[id]}</b> ${r.label.toUpperCase()}</span>`).join('')}<span class="text-green">PARTIDA EN PAUSA</span></div>
    <div class="workshop-tabs" role="tablist" aria-label="Secciones del taller">${Object.entries(workshopGroups).map(([id, group]) => `<button role="tab" id="tab-${id}" aria-controls="workshop-panel" aria-selected="${workshopTab === id}" data-tab="${id}">${group.name}</button>`).join('')}</div>
    <section id="workshop-panel" role="tabpanel" aria-labelledby="tab-${workshopTab}">
    ${workshopTab === 'arsenal' ? `<div class="weapon-rack" aria-label="Equipar arma">${WEAPONS.map((w, i) => `<button data-equip="${i}" ${!game.weaponUnlocked(i) ? 'disabled' : ''} aria-pressed="${game.weapon === i}"><kbd>${i + 1}</kbd>${w.name}<small>${game.weapon === i ? 'EQUIPADA' : game.weaponUnlocked(i) ? 'EQUIPAR' : 'POR FABRICAR'}</small></button>`).join('')}</div>` : ''}
    ${workshopTab === 'refuge' ? '<p class="workshop-tip">Los zombis atacan desde fuera. El blindaje reduce el daño; las estacas y torretas defienden el perímetro. La enfermería te cura dentro y el generador consume energía solo al reparar.</p>' : ''}
    <div class="upgrade-grid">${workshopGroups[workshopTab].ids.map(id => {
      const u = UPGRADES[id], cost = game.upgradeCost(id), max = u.max && game.levels[id] >= u.max, full = id === 'repair' && game.base.hp >= game.base.maxHp;
      const afford = Object.entries(cost).every(([k, v]) => game.inventory[k] >= v);
      return `<button class="upgrade-card" data-buy="${id}" ${!near || !afford || max || full ? 'disabled' : ''}><span class="upgrade-icon">${u.icon}</span><div><h3>${u.title}${u.max ? `<small>${game.levels[id]}/${u.max}</small>` : ''}</h3><p>${u.description}</p><span class="upgrade-price">${max ? 'COMPLETADO' : full ? 'INTEGRIDAD MÁXIMA' : Object.entries(cost).map(([k, v]) => `<span class="${game.inventory[k] < v ? 'missing-resource' : ''}">${RESOURCES[k].icon} ${v} ${RESOURCES[k].label}</span>`).join(' · ')}</span></div><span class="upgrade-plus">+</span></button>`;
    }).join('')}</div></section><div class="workshop-bottom"><span>Armas: teclas 1–7 o toca el nombre del arma.</span>${game.phase === 'day' ? '<button class="secondary compact" id="night-btn">ADELANTAR LA NOCHE →</button>' : ''}</div>`);
  document.querySelectorAll('[data-tab]').forEach(b => {
    b.onclick = () => { workshopTab = b.dataset.tab; workshop(); $(`[data-tab="${workshopTab}"]`).focus(); };
    b.onkeydown = e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault(); const ids = Object.keys(workshopGroups); workshopTab = e.key === 'Home' ? ids[0] : e.key === 'End' ? ids.at(-1) : ids[(ids.indexOf(workshopTab) + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; workshop(); $(`[data-tab="${workshopTab}"]`).focus(); };
  });
  document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { if (game.purchase(b.dataset.buy)) { sound.play('craft'); workshop(); updateHud(); const next = $(`[data-buy="${b.dataset.buy}"]`); (next.disabled ? $(`[data-tab="${workshopTab}"]`) : next).focus(); } });
  document.querySelectorAll('[data-equip]').forEach(b => b.onclick = () => { game.switchWeapon(Number(b.dataset.equip)); workshop(); updateHud(); $(`[data-equip="${b.dataset.equip}"]`).focus(); });
  if ($('#night-btn')) $('#night-btn').onclick = () => { game.startNight(); closeModal(); };
}
$('#workshop-btn').onclick = workshop; $('#repair-btn').onclick = workshop;
function openMap() {
  showModal('map', `${closeButton}<span class="eyebrow">RECONOCIMIENTO DEL TERRENO</span><h2 id="dialog-title">Zona de exclusión.</h2><p class="modal-lead">Azul: relés · Marrón: madera · Violeta: componentes · Verde: suministros. Mantén E junto a una caja para recogerla. El cuadrado verde delimita el refugio protegido.</p><canvas id="big-map" width="840" height="630" aria-label="Mapa del sector con refugio, relés, suministros y enemigos"></canvas><div class="map-legend"><span><i class="green"></i>Refugio</span><span><i class="blue"></i>Relés</span><span><i class="orange"></i>Amenazas</span><span>△ Tu posición</span></div><button class="primary" data-close>VOLVER A LA EXPEDICIÓN →</button>`); drawMinimap($('#big-map'), game, true);
}
$('#map-btn').onclick = openMap; $('#minimap-btn').onclick = openMap;
function showEnd() {
  const won = game.state === 'won';
  if (!endRecorded) {
    game.score += won ? 1500 : 0; endRecorded = true;
    saved = { best: Math.max(saved?.best || 0, game.score), runs: (saved?.runs || 0) + 1, victories: (saved?.victories || 0) + (won ? 1 : 0) };
    try { localStorage.setItem('zombis-record', JSON.stringify(saved)); } catch {}
    $('#record').textContent = saved.best;
  }
  showModal('end', `<span class="eyebrow">${won ? 'TRANSMISIÓN RECIBIDA · EVACUACIÓN COMPLETA' : 'FIN DE LA TRANSMISIÓN'}</span><h2 id="dialog-title">${won ? 'La señal llegó.' : 'La noche te encontró.'}</h2><p class="modal-lead">${won ? 'Cinco noches. Tres relés. Un refugio que nunca se apagó. El equipo de rescate está aquí. Sobreviviste.' : game.base.hp <= 0 ? 'El refugio ha caído. Fabrica torretas y repara entre oleadas para resistir más tiempo.' : 'Has caído en el sector. Vigila tu salud, usa Q para curarte y evita atraer a toda la horda.'}</p><div class="pause-stats"><div><strong>${game.day}</strong><span>DÍA</span></div><div><strong>${game.kills}</strong><span>ELIMINADOS</span></div><div><strong>${game.score}</strong><span>PUNTOS</span></div></div><p class="record-note">RÉCORD LOCAL: ${saved.best} · EXPEDICIONES: ${saved.runs}</p><button class="primary" id="play-again">NUEVA EXPEDICIÓN <span>↗</span></button>`);
  $('#play-again').onclick = start;
}
dialog.addEventListener('cancel', e => { e.preventDefault(); if (modalType !== 'end') closeModal(); });
document.addEventListener('keydown', e => {
  if (e.target instanceof HTMLSelectElement) return;
  const key = e.key.toLowerCase();
  if (['tab', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) && started && !dialog.open) e.preventDefault();
  if (e.repeat) return;
  if (dialog.open) { if (key === 'm' && modalType === 'map' || key === 'tab' && modalType === 'workshop') { e.preventDefault(); closeModal(); } return; }
  if (!started) return;
  keys.add(key);
  if (key === 'escape') { e.preventDefault(); openPause(); }
  if (key === 'r') game.reload(); if (key === 'q') game.heal();
  if (/^[1-7]$/.test(key)) game.switchWeapon(Number(key) - 1);
  if (key === 'tab') workshop(); if (key === 'm') openMap();
  if (key === 'z') renderer?.rotate(-1); if (key === 'x') renderer?.rotate(1); if (key === 'v') renderer?.resetCamera(game.player);
});
document.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
canvas.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true; });
canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0 || !started || paused || game.state !== 'playing') return;
  const r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true;
  const aim = renderer.screenToWorld(pointer.x, pointer.y); game.player.angle = Math.atan2(aim.y - game.player.y, aim.x - game.player.x);
  // A short click must fire even when down/up both fall between animation frames.
  game.shoot(); pointer.down = true; canvas.setPointerCapture(e.pointerId); sound.unlock();
});
canvas.addEventListener('pointerup', () => pointer.down = false);
canvas.addEventListener('pointercancel', () => pointer.down = false);
canvas.addEventListener('contextmenu', e => e.preventDefault());
function loseFocus() { keys.clear(); pointer.down = false; touch.fire = false; touch.interact = false; touch.x = 0; touch.y = 0; if (started && !paused && game.state === 'playing') openPause(); }
window.addEventListener('blur', loseFocus);
document.addEventListener('visibilitychange', () => { if (document.hidden) loseFocus(); });
const joystick = $('#joystick');
function moveStick(e) { const r = joystick.getBoundingClientRect(); const dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2, len = Math.max(34, Math.hypot(dx, dy)); touch.x = dx / len; touch.y = dy / len; touch.sprint = len > 53; joystick.firstElementChild.style.transform = `translate(${touch.x * 27}px, ${touch.y * 27}px)`; }
joystick.onpointerdown = e => { e.preventDefault(); joystick.setPointerCapture(e.pointerId); moveStick(e); };
joystick.onpointermove = e => { if (joystick.hasPointerCapture(e.pointerId)) moveStick(e); };
joystick.onpointerup = joystick.onpointercancel = () => { touch.x = touch.y = 0; touch.sprint = false; joystick.firstElementChild.style.transform = ''; };
for (const [id, prop] of [['touch-fire', 'fire'], ['touch-interact', 'interact']]) {
  const b = $('#' + id); b.onpointerdown = e => { e.preventDefault(); b.setPointerCapture(e.pointerId); touch[prop] = true; sound.unlock(); }; b.onpointerup = b.onpointercancel = () => touch[prop] = false;
}
$('#touch-heal').onclick = () => game.heal();
function text(id, value) { const el = $('#' + id); if (el.textContent !== String(value)) el.textContent = value; }
function updateHud() {
  const g = game, night = g.phase === 'night';
  text('hp', Math.ceil(g.player.hp)); $('#hp-bar').style.width = g.player.hp + '%'; $('#stamina-bar').style.width = g.player.stamina + '%';
  text('clip', g.reloadTimer > 0 ? '··' : g.magazines[g.weapon]); text('ammo', g.inventory[WEAPONS[g.weapon].ammo]); text('ammo-kind', WEAPON_AMMO_LABELS[WEAPONS[g.weapon].ammo]); text('weapon-name', g.reloadTimer > 0 ? 'RECARGANDO...' : WEAPONS[g.weapon].name.toUpperCase());
  text('day-label', `${night ? 'NOCHE' : 'DÍA'} ${String(g.day).padStart(2, '0')}`); text('phase-icon', night ? '☾' : '☀');
  text('phase-label', night ? 'DEFIENDE EL REFUGIO' : g.phase === 'extraction' ? 'RECUPERA LOS RELÉS' : 'VENTANA DE EXPLORACIÓN');
  const remaining = Math.max(0, Math.ceil(g.time)); text('timer', Number.isFinite(remaining) ? `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}` : '∞');
  text('timer-caption', night ? 'HASTA EL AMANECER' : g.phase === 'extraction' ? 'EVACUACIÓN DISPONIBLE' : 'HASTA EL ANOCHECER');
  text('relay-count', `${g.inventory.relays}/3`); text('relay-check', g.inventory.relays === 3 ? '✓' : '01');
  const nights = g.phase === 'extraction' || g.state === 'won' ? 5 : g.day - 1;
  text('night-count', `${nights}/5`); $('#mission-bar').style.width = (g.inventory.relays / 3 * 45 + nights / 5 * 55) + '%';
  $('#base-hp').innerHTML = `${Math.ceil(g.base.hp)} <small>/ ${g.base.maxHp}</small>`; $('#base-bar').style.width = (g.base.hp / g.base.maxHp * 100) + '%';
  text('base-status', g.base.hp < g.base.maxHp * .3 ? 'CRÍTICO' : g.base.hp < g.base.maxHp * .7 ? 'DAÑADO' : 'ESTABLE');
  $('#base-status').classList.toggle('danger', g.base.hp < g.base.maxHp * .3);
  text('defenses', `BLINDAJE ${g.levels.walls}/3 · ${g.turrets.length} TORRETAS`);
  text('refuge-safety', g.base.hp <= 0 ? 'REFUGIO DESTRUIDO' : g.insideRefuge() ? 'PROTEGIDO DENTRO DEL REFUGIO' : 'ENTRA AL PERÍMETRO PARA PROTEGERTE');
  $('#refuge-safety').classList.toggle('protected', g.insideRefuge());
  for (const id of ['scrap', 'energy', 'wood', 'parts', 'medkits']) text(id, g.inventory[id]);
  text('kill-count', `${g.kills} ELIMINADOS`); text('noise-label', g.noise > 65 ? 'CRÍTICA' : g.noise > 30 ? 'ELEVADA' : 'BAJA');
  document.querySelectorAll('[data-noise]').forEach((el, i) => { el.classList.toggle('lit', i < Math.max(2, g.noise / 100 * 22)); el.classList.toggle('loud', g.noise > 65); });
  const toast = $('#toast'); text('toast', g.message); toast.classList.toggle('visible', started && g.messageTime > 0);
  const loot = g.nearestLoot(), interaction = $('#interaction');
  interaction.innerHTML = loot && started ? `<kbd>E</kbd> MANTÉN PARA ${({ relay: 'RECUPERAR RELÉ', lumber: 'RECOGER MADERA', technology: 'RECOGER COMPONENTES', medical: 'RECOGER MEDICINAS' }[loot.type] || 'SAQUEAR SUMINISTROS')} <span>${Math.floor(loot.progress * 100)}%</span>` : '';
  interaction.classList.toggle('visible', !!loot && started);
  $('#workshop-btn').classList.toggle('available', started && g.nearBase());
  drawMinimap(mini, g);
  if (renderer && started) {
    const targets = [{ x: 1200, y: 900, label: 'REFUGIO', color: '#c7f17c' }, ...g.loot.filter(l => l.type === 'relay' && !l.opened).map(l => ({ ...l, label: 'RELÉ', color: '#8de1e3' }))];
    $('#world-compass').innerHTML = targets.map(target => {
      const p = renderer.project(target.x, target.y), w = renderer.width, h = renderer.height;
      if (p.visible && p.x > 40 && p.x < w - 40 && p.y > 115 && p.y < h - 100) return '';
      const angle = Math.atan2(p.y - h / 2, p.x - w / 2), rx = w / 2 - 26, ry = h / 2 - 122;
      const f = Math.min(rx / Math.max(.001, Math.abs(Math.cos(angle))), Math.max(25, ry) / Math.max(.001, Math.abs(Math.sin(angle))));
      return `<span style="left:${w / 2 + Math.cos(angle) * f}px;top:${h / 2 + Math.sin(angle) * f}px;color:${target.color}"><i style="transform:rotate(${angle}rad)">▸</i>${target.label}</span>`;
    }).join('');
  }
}
function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000 || .016, .25); lastFrame = now;
  if (started && !paused && game.state === 'playing') {
    const aim = renderer.screenToWorld(pointer.x, pointer.y);
    let angle = pointer.active ? Math.atan2(aim.y - game.player.y, aim.x - game.player.x) : game.player.angle;
    if (touch.fire) { const enemy = [...game.enemies].sort((a, b) => dist(a, game.player) - dist(b, game.player))[0]; if (enemy) angle = Math.atan2(enemy.y - game.player.y, enemy.x - game.player.x); }
    const movement = renderer.movementToWorld((keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0) + touch.x, (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0) + touch.y);
    const input = { ...movement, sprint: keys.has('shift') || touch.sprint, shoot: pointer.down || touch.fire, interact: keys.has('e') || touch.interact, angle };
    // Fixed-size substeps keep physics and weapon timing stable at lower GPU frame rates.
    for (let remaining = dt; remaining > .00001; remaining -= .025) game.update(Math.min(.025, remaining), input);
    for (const e of game.events.splice(0)) sound.play(e);
    if (game.state !== 'playing') showEnd();
  }
  if (renderer && now - lastRender >= (paused ? 120 : started ? 0 : 70)) {
    renderer.draw(game, now / 1000, !started); renderer.setAim(pointer.x, pointer.y, started && !paused && pointer.active && !renderer.mobile); lastRender = now;
  }
  if (now - lastHud > 100) { updateHud(); lastHud = now; }
  requestAnimationFrame(frame);
}
updateHud(); requestAnimationFrame(frame);
