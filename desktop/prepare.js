// Builds desktop/app/ from ../mechanics-sandbox.html for the offline desktop app:
// the two CDN <script> links are pointed at local copies of the same pinned versions.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = path.join(__dirname, 'app');
const vendor = path.join(app, 'vendor');
// Where planck and mathjax are installed. The website build installs just those two somewhere else
// (VENDOR_NODE_MODULES) instead of the whole desktop toolchain.
const nm = process.env.VENDOR_NODE_MODULES || path.join(__dirname, 'node_modules');

// The local copies must be exactly the versions the page asks the CDN for.
const LIBS = [
  { name: 'planck', version: '1.5.0', cdn: 'https://cdn.jsdelivr.net/npm/planck@1.5.0/dist/planck.min.js', local: 'vendor/planck/planck.min.js' },
  { name: 'mathjax', version: '3.2.2', cdn: 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js', local: 'vendor/mathjax/tex-svg.js' },
];
for (const lib of LIBS) {
  const v = JSON.parse(fs.readFileSync(path.join(nm, lib.name, 'package.json'), 'utf8')).version;
  if (v !== lib.version) throw new Error(`${lib.name} ${v} is installed but the page uses ${lib.version}`);
}

fs.rmSync(app, { recursive: true, force: true });
fs.mkdirSync(path.join(vendor, 'planck'), { recursive: true });

let html = fs.readFileSync(path.join(root, 'mechanics-sandbox.html'), 'utf8');
for (const lib of LIBS) {
  if (!html.includes(lib.cdn)) throw new Error('CDN link not found in the page: ' + lib.cdn);
  html = html.split(lib.cdn).join(lib.local);
}
fs.writeFileSync(path.join(app, 'index.html'), html);

fs.copyFileSync(path.join(nm, 'planck', 'dist', 'planck.min.js'), path.join(vendor, 'planck', 'planck.min.js'));
// MathJax: tex-svg.js plus the components it can load on demand. Skip the speech engine and
// the "-full" bundles (big, and the page doesn't use them).
fs.cpSync(path.join(nm, 'mathjax', 'es5'), path.join(vendor, 'mathjax'), {
  recursive: true,
  filter: (src) => !/[\\/]sre([\\/]|$)/.test(src) && !/-full/.test(path.basename(src)),
});
console.log('desktop/app ready');
