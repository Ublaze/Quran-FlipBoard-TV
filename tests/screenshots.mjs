// End-to-end test of the webOS bundle (dist-src) in headless Chrome over raw CDP (no dependencies).
// Usage: serve dist-src on :8765 (python -m http.server 8765 -d dist-src), then: node tests/e2e.mjs
// Env: APP_URL, CHROME_PATH. Screenshots + results.json land in ./test-output.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'test-output');
const URL = process.env.APP_URL || 'http://localhost:8765/index.html';
const PORT = 9336;
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

  // Store / UX-scenario screenshots. In-order mode so the primary shot is Al-Fatihah 1:1.
  const settled = async () => { for (let i = 0; i < 40; i++) { if (await ev(`document.getElementById('surah-ref').classList.contains('visible')`)) return; await sleep(250); } };
  const fresh = async (pos, extra) => {
    await send('Page.navigate', { url: URL }); await sleep(800);
    await ev(`localStorage.clear(); localStorage.setItem('quranFlipboard.v1', JSON.stringify({settings:Object.assign({pace:45000, order:'sequential'}, ${JSON.stringify(extra || {})}), position:${pos}})); 1`);
    await load(); await sleep(1200); await settled(); await sleep(1500);
  };
  await fresh(0); await sleep(9000); await shot('screenshot-1-main');            // hint has faded
  await fresh(27); await key(13, 'Enter'); await sleep(700); await shot('screenshot-2-controls');
  await fresh(63); await key(404); await key(40); await sleep(700); await shot('screenshot-3-settings');
  await fresh(88); await key(19); await sleep(900); await shot('screenshot-4-paused');
  await fresh(45, { show: 'arabic' }); await sleep(9000); await shot('screenshot-5-arabic-only');
  await fresh(101, { show: 'english' }); await sleep(9000); await shot('screenshot-6-english-only');
  await fresh(12); await sleep(1000); await shot('ux-main-with-hint');
  check('screenshots captured', true);
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
