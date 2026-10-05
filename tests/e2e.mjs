// End-to-end test of the webOS bundle (dist-src) in headless Chrome over raw CDP (no dependencies).
// Usage: serve dist-src on :8765 (python -m http.server 8765 -d dist-src), then: node tests/e2e.mjs
// Env: APP_URL, CHROME_PATH. Screenshots + results.json land in ./test-output.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'test-output');
const URL = process.env.APP_URL || 'http://localhost:8765/index.html';
const PORT = 9333;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = path.join(OUT, 'chrome-profile');
fs.mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--window-size=1920,1080', '--autoplay-policy=no-user-gesture-required', 'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = {}; const consoleMsgs = [];
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

function send(method, params = {}) {
  return new Promise((res, rej) => {
    const i = ++id; pending[i] = { res, rej };
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}
async function ev(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function key(code, name) {
  for (const type of ['rawKeyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', { type, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, key: name || '', code: name || '' });
  }
  await sleep(250);
}
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64'));
}
const ref = () => ev(`document.getElementById('surah-ref').textContent`);
const store = () => ev(`JSON.parse(localStorage.getItem('quranFlipboard.v1') || '{}')`);
async function armLog() {
  await ev(`window.__log=[];window.__t0=Date.now();(function(){var el=document.getElementById('surah-ref');
    new MutationObserver(function(){ if(el.textContent) window.__log.push([(Date.now()-window.__t0)/1000, el.textContent]); })
    .observe(el,{childList:true,characterData:true,subtree:true});})(); 1`);
}
async function load() {
  await send('Page.navigate', { url: URL });
  await sleep(1500);
  await armLog();
}

try {
  let targets;
  for (let i = 0; i < 160; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (targets.some(t => t.type === "page")) break; } catch {}
    await sleep(250);
  }
  const page = targets.find(t => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', m => {
    const d = JSON.parse(m.data);
    if (d.id && pending[d.id]) { d.error ? pending[d.id].rej(new Error(d.error.message)) : pending[d.id].res(d.result); delete pending[d.id]; }
    if (d.method === 'Runtime.consoleAPICalled') consoleMsgs.push(d.params.type + ': ' + d.params.args.map(a => a.value || a.description).join(' '));
    if (d.method === 'Runtime.exceptionThrown') consoleMsgs.push('EXCEPTION: ' + d.params.exceptionDetails.exception.description);
  });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });

  // --- 1. Fresh install: defaults + autoplay at 10s pace ---------------------
  await send('Page.navigate', { url: URL }); await sleep(800);
  await ev(`localStorage.clear(); localStorage.setItem('quranFlipboard.v1', JSON.stringify({settings:{pace:10000}})); 1`);
  await load();
  await sleep(4000); await shot('01-main');
  await sleep(56000);
  let log = await ev('window.__log');
  const changes = log.length;
  const gaps = log.slice(1).map((e, i) => +(e[0] - log[i][0]).toFixed(1));
  check('auto-advances unattended (>=4 verses in 60s @10s pace)', changes >= 4, `${changes} verses, gaps ${JSON.stringify(gaps)}s`);
  check('visibility is visible (headless)', (await ev('document.visibilityState')) === 'visible');
  check('flap sound off by default', (await store()).settings && (await store()).settings.sound !== true);

  // --- 2. Render failure no longer freezes rotation (the v0.1.0 bug class) ---
  await ev(`(function(){var r=document.getElementById('surah-ref'); var orig=r.classList.add.bind(r.classList); var n=0;
    r.classList.add=function(c){ if(n++<2) throw new Error('injected render failure'); return orig(c); };})(); 1`);
  const beforeErr = (await ev('window.__log')).length;
  await sleep(30000);
  const afterErr = await ev('window.__log.length');
  const errLogged = consoleMsgs.some(m => m.includes('render failed, continuing'));
  check('render exception is caught and rotation continues', errLogged && afterErr > beforeErr, `logged=${errLogged}, verses ${beforeErr}->${afterErr}`);

  // --- 3. Control bar via OK ---------------------------------------------------
  await key(13, 'Enter');
  check('OK shows control bar', await ev(`document.getElementById('control-bar').classList.contains('visible')`));
  await sleep(600); await shot('02-control-bar');
  // Pause via control bar (focus starts on play/pause)
  await key(13, 'Enter');
  check('OK on Pause pauses + badge shown', await ev(`document.getElementById('pause-badge').classList.contains('visible')`));
  const pausedRef = await ref();
  await sleep(1200); await shot('03-paused');
  await sleep(16000);
  check('stays on same verse while paused', (await ref()) === pausedRef);
  check('control bar auto-hid while paused', !(await ev(`document.getElementById('control-bar').classList.contains('visible')`)));
  await key(13, 'Enter'); // OK on main screen while paused
  check('OK resumes directly when paused', !(await ev(`document.getElementById('pause-badge').classList.contains('visible')`)));
  await key(19); // PAUSE key
  check('PAUSE key pauses', await ev(`document.getElementById('pause-badge').classList.contains('visible')`));
  await key(415); // PLAY key
  check('PLAY key resumes', !(await ev(`document.getElementById('pause-badge').classList.contains('visible')`)));

  // --- 4. Settings: GREEN opens, change pace, auto-close on idle --------------
  await key(404); // GREEN
  check('GREEN opens settings', await ev(`document.getElementById('settings-overlay').classList.contains('open')`));
  await key(40); // DOWN -> Pace
  await key(39); // RIGHT -> next pace
  await sleep(500); await shot('04-settings');
  const savedPace = (await store()).settings.pace;
  check('pace change saved instantly', savedPace === 15000, `pace=${savedPace}`);
  const refAtOpen = await ref();
  await sleep(21500);
  check('settings auto-close after 20s idle', !(await ev(`document.getElementById('settings-overlay').classList.contains('open')`)));
  check('rotation held while settings open (same verse)', (await ref()) === refAtOpen);
  const n1 = await ev('window.__log.length');
  await sleep(22000);
  check('rotation resumes after settings auto-close', (await ev('window.__log.length')) > n1);

  // --- 5. Order switch + persistence / resume on relaunch ---------------------
  await key(404); await key(40); await key(40); await key(39); // Order -> In order
  const s = await store();
  check('order change saved', s.settings.order === 'sequential', `order=${s.settings.order}`);
  await key(461); // BACK closes settings
  check('BACK closes settings (does not exit)', !(await ev(`document.getElementById('settings-overlay').classList.contains('open')`)));
  await sleep(23000);
  const before = await store();
  const refBefore = await ref();
  await load(); await sleep(6500);
  const after = await store();
  check('relaunch resumes same verse', (await ref()) === refBefore && after.position === before.position, `${refBefore} -> ${await ref()}`);
  check('settings survive relaunch', after.settings.pace === 15000 && after.settings.order === 'sequential');
  await shot('05-after-relaunch');

  // --- 6. Show mode Arabic only ------------------------------------------------
  await key(404); await key(39); await key(461);
  check('Show -> Arabic only hides board', await ev(`getComputedStyle(document.getElementById('board-section')).display === 'none'`));
  await sleep(800); await shot('06-arabic-only');
  await key(404); await key(39); await key(39); await key(461); // back to both

  // --- 7. No uncaught errors -----------------------------------------------------
  const exceptions = consoleMsgs.filter(m => m.startsWith('EXCEPTION'));
  check('no uncaught exceptions', exceptions.length === 0, exceptions.join(' | '));
} catch (e) {
  console.error('TEST HARNESS ERROR', e);
  results.push({ name: 'harness', ok: false, detail: String(e) });
} finally {
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ results, consoleMsgs }, null, 2));
  console.log(`\n${results.filter(r => r.ok).length}/${results.length} passed`);
  try { ws.close(); } catch {}
  chrome.kill();
  process.exit(0);
}
