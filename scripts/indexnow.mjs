// IndexNow submitter for https://shiftingvibration.vercel.app
// Run after each deploy:  node scripts/indexnow.mjs        (add --all to force-submit every sitemap URL)
// Submits only canonical sitemap URLs whose HTML changed since the last successful run,
// plus URLs that were removed from the sitemap (so engines can see the 404).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'shiftingvibration.vercel.app';
const SITE = 'https://' + HOST;
const KEY = readFileSync(join(ROOT, 'key.txt'), 'utf8').trim();
const KEY_LOCATION = SITE + '/key.txt';
const STATE = join(ROOT, 'scripts', '.indexnow-state.json');
const force = process.argv.includes('--all');

const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).filter(u => u.startsWith(SITE + '/'));
const fileFor = u => { const p = u.slice(SITE.length + 1); return join(ROOT, p === '' ? 'index.html' : p); };
const hash = f => createHash('sha256').update(readFileSync(f)).digest('hex');

const prev = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {};
const next = {};
const changed = [];
for (const u of urls) {
  const f = fileFor(u);
  if (!existsSync(f)) continue;
  next[u] = hash(f);
  if (force || prev[u] !== next[u]) changed.push(u);
}
const removed = Object.keys(prev).filter(u => !(u in next));
const list = [...changed, ...removed];
if (!list.length) { console.log('IndexNow: no changed URLs, nothing submitted.'); process.exit(0); }

// Verify the key file is live before submitting
const kr = await fetch(KEY_LOCATION).catch(e => ({ ok: false, status: String(e) }));
const kt = kr.ok ? (await kr.text()).trim() : '';
if (kt !== KEY) { console.error(`Key file check failed (${kr.status}). Deploy first, then rerun.`); process.exit(1); }

const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: list });
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body });
    console.log(`IndexNow response: HTTP ${r.status} for ${list.length} URL(s)`);
    if (r.status === 200 || r.status === 202) {
      writeFileSync(STATE, JSON.stringify(next, null, 2));
      console.log('Accepted. (Accepted means received, not indexed.)');
      process.exit(0);
    }
    if (r.status === 400 || r.status === 403 || r.status === 422) { console.error(await r.text()); process.exit(1); }
  } catch (e) { console.error('Attempt ' + attempt + ' failed:', e.message); }
  await new Promise(res => setTimeout(res, 2000 * attempt));
}
console.error('IndexNow: gave up after 3 attempts; state not updated.');
process.exit(1);
