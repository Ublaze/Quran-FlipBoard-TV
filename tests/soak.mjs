// Soak test of the webOS bundle (dist-src) in headless Chrome over raw CDP (no dependencies).
// Usage: serve dist-src on :8765 (python -m http.server 8765 -d dist-src), then: node tests/e2e.mjs
// Env: APP_URL, CHROME_PATH. Screenshots + results.json land in ./test-output.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'test-output');
const URL = process.env.APP_URL || 'http://localhost:8765/index.html';
const PORT = 9335;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = path.join(OUT, 'chrome-profile');
fs.mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--window-size=' + (process.env.W || 1920) + ',' + (process.env.H || 1080), '--autoplay-policy=no-user-gesture-required', 'about:blank',
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
  const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });

  // Soak: fresh install, 10 s pace, sample once a minute for SOAK_MIN minutes
  const SOAK_MIN = +(process.env.SOAK_MIN || 30);
  await send('Page.navigate', { url: URL }); await sleep(800);
  await ev(`localStorage.clear(); localStorage.setItem('quranFlipboard.v1', JSON.stringify({settings:{pace:10000}})); 1`);
  await load();
  const samples = [];
  for (let m = 1; m <= SOAK_MIN; m++) {
    await sleep(60000);
    const s = await ev(`({verses: window.__log.length, heapMB: +(performance.memory.usedJSHeapSize/1048576).toFixed(1), nodes: document.getElementsByTagName('*').length})`);
    samples.push({ min: m, ...s });
    console.log(`min ${m}: verses=${s.verses} heap=${s.heapMB}MB nodes=${s.nodes}`);
  }
  const per = samples.map((s, i) => s.verses - (i ? samples[i - 1].verses : 0));
  check('never stalls (every minute advanced >= 3 verses)', per.every(v => v >= 3), JSON.stringify(per));
  check('DOM size stable', Math.max(...samples.map(s => s.nodes)) - Math.min(...samples.map(s => s.nodes)) <= 5);
  check('heap does not grow unbounded (<2x first sample)', samples[samples.length - 1].heapMB < samples[0].heapMB * 2, `${samples[0].heapMB} -> ${samples[samples.length - 1].heapMB} MB`);
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
