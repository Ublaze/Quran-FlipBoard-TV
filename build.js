/**
 * Build script: bundles ES modules into a single IIFE for webOS compatibility.
 * Usage: node build.js            -> dist-src/      (1920x1080, UHD TVs)
 *        node build.js --res=720  -> dist-src-720/  (1280x720, Full HD TVs)
 * Output is ready for ares-package. LG only publishes a 1920x1080 package on UHD models,
 * so Full HD models need the separate 1280x720 package.
 */
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const RES720 = process.argv.includes('--res=720');
const DIST = path.join(__dirname, RES720 ? 'dist-src-720' : 'dist-src');

// Clean and recreate dist-src
// Empty the folder rather than deleting it: on Windows a process using it as cwd
// (e.g. a local test server) makes rmSync on the folder itself fail with EPERM
fs.mkdirSync(DIST, { recursive: true });
for (const entry of fs.readdirSync(DIST)) {
  fs.rmSync(path.join(DIST, entry), { recursive: true, force: true });
}

// Copy static assets
const copyDirs = ['css', 'fonts', 'assets'];
for (const dir of copyDirs) {
  const src = path.join(SRC, dir);
  const dst = path.join(DIST, dir);
  if (fs.existsSync(src)) {
    fs.mkdirSync(dst, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      if (file === 'generate-assets.html') continue;
      fs.copyFileSync(path.join(src, file), path.join(dst, file));
    }
  }
}

// Copy appinfo.json (720 variant declares its graphics resolution)
const appinfo = JSON.parse(fs.readFileSync(path.join(SRC, 'appinfo.json'), 'utf8'));
if (RES720) appinfo.resolution = '1280x720';
fs.writeFileSync(path.join(DIST, 'appinfo.json'), JSON.stringify(appinfo, null, 2) + '\n', 'utf8');

// Read all JS source files in dependency order
const jsFiles = [
  'js/constants.js',
  'data/verses.js',
  'js/Store.js',
  'js/TvPlatform.js',
  'js/Tile.js',
  'js/Board.js',
  'js/SoundEngine.js',
  'js/VerseRotator.js',
  'js/Settings.js',
  'js/ControlBar.js',
  'js/RemoteController.js',
  'js/main.js',
];

let bundle = '(function() {\n"use strict";\n\n';

for (const file of jsFiles) {
  let code = fs.readFileSync(path.join(SRC, file), 'utf8');

  // Strip import/export statements
  code = code.replace(/^import\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
  code = code.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');
  code = code.replace(/^export\s+(const|let|var|class|function|default)\s/gm, '$1 ');
  code = code.replace(/^export\s+\{[^}]*\};?\s*$/gm, '');

  // webOS 5 runs Chromium 68: no optional chaining (?.) or nullish coalescing (??).
  // Fail loudly instead of rewriting them. A blind ?. -> . rewrite is what froze v0.1.0.
  const banned = code.match(/\?\.(?!\d)|\?\?/);
  if (banned) {
    const line = code.slice(0, banned.index).split('\n').length;
    console.error(`BUILD FAILED: ${file}:${line} uses "${banned[0]}", which webOS 5 (Chromium 68) cannot run.`);
    process.exit(1);
  }

  bundle += `// --- ${file} ---\n${code}\n\n`;
}

bundle += '})();\n';

const leftover = bundle.match(/^\s*(import|export)\s.*$/m);
if (leftover) {
  console.error('BUILD FAILED: unstripped module syntax in bundle: ' + leftover[0].trim());
  process.exit(1);
}

// Write bundled JS
fs.mkdirSync(path.join(DIST, 'js'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'js', 'app.bundle.js'), bundle, 'utf8');

// Create index.html pointing to bundle
let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
html = html.replace('<script type="module" src="js/main.js"></script>', '<script src="js/app.bundle.js"></script>');
if (RES720) html = html.replace('content="width=1920, initial-scale=1.0"', 'content="width=1280, initial-scale=1.0"');
fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');

console.log(`Build complete → ${path.basename(DIST)}/ (${appinfo.resolution})`);
console.log(`Bundle size: ${(fs.statSync(path.join(DIST, 'js', 'app.bundle.js')).size / 1024).toFixed(1)} KB`);
