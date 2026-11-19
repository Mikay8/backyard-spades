// Restore the binary image files from the base64 data URIs embedded in
// src/assets/images.ts (the GitHub connector cannot push binaries, so the
// PNGs live only in the local tree — see README). Runs before the web
// export on Railway so the deployed site gets the real app icon, favicon
// and splash image instead of Expo defaults. In-app portraits/icons already
// render from the data URIs, so this is only for the config-referenced
// files (app.json: icon, splash, favicon).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const imagesTs = fs.readFileSync(path.join(ROOT, 'src/assets/images.ts'), 'utf8');

// IMG_app_icon is the 1024x1024 app icon (navy pixel spade on picnic check).
const match = imagesTs.match(/export const IMG_app_icon: string = 'data:image\/png;base64,([A-Za-z0-9+/=]+)'/);
if (!match) {
  console.error('ensure-assets: IMG_app_icon not found in src/assets/images.ts');
  process.exit(1);
}
const buf = Buffer.from(match[1], 'base64');
console.log(`ensure-assets: app icon ${buf.length} bytes, sha256 ${crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12)}`);

const targets = [
  'assets/icon.png',
  'assets/images/favicon.png',
  'assets/images/splash-icon.png',
];
for (const rel of targets) {
  const fp = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, buf);
  console.log(`ensure-assets: wrote ${rel}`);
}
