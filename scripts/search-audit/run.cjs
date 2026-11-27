#!/usr/bin/env node
// Dictionary search regression snapshot.
// Usage: node scripts/search-audit/run.cjs <snapshot-out.json> [queries.json] [--base http://localhost:8765]
// Loads the built app (dist/ served over HTTP) in headless Chromium, runs every query through the page's own
// dictionaryResults(q), writes a snapshot (count + top 8 per query) and prints PASS/FAIL per query.
// Pass = every `expect` headword is within the top 3 (top 5 when expect has more than 3 items), and every optional
// `before: [[a, b], ...]` pair has a ranked above b. Timing is printed, not stored, so snapshots diff cleanly.
// Read-only: it does not change dist/ or any stored learning data.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(name); if (i < 0) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const base = flag('--base', 'http://localhost:8765');
const out = args[0];
const qfile = args[1] || path.join(__dirname, 'queries.json');
if (!out) { console.error('usage: node run.cjs <snapshot-out.json> [queries.json] [--base URL]'); process.exit(2); }
const queries = JSON.parse(fs.readFileSync(qfile, 'utf8'));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(base.replace(/\/$/, '') + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof go === 'function');
  await page.evaluate(() => go('words'));
  await page.waitForFunction(() => typeof bankStatus !== 'undefined' && bankStatus === 'ready' && Array.isArray(bank) && bank.length > 0, null, { timeout: 60000 });

  const rows = await page.evaluate(qs => {
    const bankSet = new Set(bank.map(w => w.th));
    let totalMs = 0;
    return qs.map(item => {
      const t0 = performance.now();
      const res = dictionaryResults(item.q);
      const ms = performance.now() - t0; totalMs += ms;
      const top = res.slice(0, 8).map(x => ({
        th: x.w.th, ro: x.w.ro, ja: x.w.meanings[0] ? x.w.meanings[0].ja : '', via: x.via,
        score: Math.round(x.score * 100) / 100, freq: x.w.frequency, id: x.w.id,
        ...(x.w.collection === 'slang' ? { slang: true } : {}),
      }));
      const ths = res.map(x => x.w.th);
      const pos = (item.expect || []).map(th => ({ th, rank: ths.indexOf(th) + 1, inBank: bankSet.has(th) }));
      const viaCounts = {};
      for (const x of res) viaCounts[x.via] = (viaCounts[x.via] || 0) + 1;
      // Optional ordering checks: [a, b] = a must rank above b (b may be absent).
      const order = (item.before || []).map(([a, b]) => ({ a, b, ra: ths.indexOf(a) + 1, rb: ths.indexOf(b) + 1 }));
      return { q: item.q, type: item.type, expect: item.expect || [], note: item.note || '', total: res.length, viaCounts, positions: pos, order, top };
    }).concat([{ totalMs }]);
  }, queries);
  const totalMs = rows.pop().totalMs;
  await browser.close();

  let pass = 0;
  const byType = {};
  for (const r of rows) {
    const limit = r.expect.length > 3 ? 5 : 3;
    r.missingFromBank = r.positions.filter(p => !p.inBank).map(p => p.th);
    r.orderOk = r.order.every(o => o.ra > 0 && (o.rb === 0 || o.ra < o.rb));
    r.pass = r.expect.length > 0 && r.positions.every(p => p.rank >= 1 && p.rank <= limit) && r.orderOk;
    const t = byType[r.type] || (byType[r.type] = { pass: 0, total: 0 });
    t.total++; if (r.pass) { t.pass++; pass++; }
    const where = r.positions.map(p => `${p.th}@${p.rank || '-'}${p.inBank ? '' : '(not in bank)'}`).join(' ');
    const top3 = r.top.slice(0, 3).map(x => `${x.th}[${x.via}${x.score}]`).join(' ');
    const ord = r.order.length ? '  order: ' + r.order.map(o => `${o.a}@${o.ra || '-'}<${o.b}@${o.rb || '-'}`).join(' ') : '';
    const tag = r.missingFromBank.length ? 'NOTINBANK' : r.pass ? 'PASS' : 'FAIL';
    console.log(`${tag}  ${r.type}  ${JSON.stringify(r.q)}  n=${r.total}  expect: ${where}${ord}  top: ${top3}`);
  }
  const counts = rows.map(r => r.total).sort((a, b) => a - b);
  const pct = p => counts[Math.min(counts.length - 1, Math.floor(p * (counts.length - 1)))];
  const summary = {
    queries: rows.length, pass, passRate: +(pass / rows.length).toFixed(3),
    byType, resultCount: { median: pct(0.5), p90: pct(0.9), max: counts[counts.length - 1], over300: counts.filter(c => c > 300).length },
    notInBank: rows.filter(r => r.missingFromBank.length).map(r => ({ q: r.q, missing: r.missingFromBank })),
    pageErrors: errors,
  };
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ summary, results: rows }, null, 1) + '\n');
  console.log(`\n${pass}/${rows.length} passed. by type: ${Object.entries(byType).map(([k, v]) => `${k} ${v.pass}/${v.total}`).join(', ')}`);
  console.log(`result counts: median ${summary.resultCount.median}, p90 ${summary.resultCount.p90}, max ${summary.resultCount.max}, >300: ${summary.resultCount.over300}`);
  if (summary.notInBank.length) console.log('expect headwords not in bank (fix queries.json):', JSON.stringify(summary.notInBank));
  console.log(`search time: ${Math.round(totalMs)} ms for ${rows.length} queries (not stored in the snapshot)`);
  if (errors.length) console.log('page errors:', errors);
  console.log('snapshot written to ' + out);
})().catch(e => { console.error(e); process.exit(1); });
