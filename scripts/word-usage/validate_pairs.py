#!/usr/bin/env python3
"""Check scripts/word-usage/pairs-NN.json (see SPEC.md 「同じ文で比べる」)."""
import json, pathlib, re, sys
R = pathlib.Path(__file__).resolve().parent; ROOT = R.parent.parent
bank = {}
for f in ['word-bank.json', 'word-bank-more.json']:
    for w in json.loads((ROOT / 'dist' / f).read_text()): bank[w['id']] = w
errs = []; n = 0
for f in sorted(R.glob('pairs-*.json')):
    nn = f.stem.split('-')[1]
    part = {g['gid']: g for g in json.loads((R / f'part-{nn}.json').read_text())}
    for gid, ps in json.loads(f.read_text()).items():
        e = lambda m: errs.append(f'{f.name} {gid}: {m}')
        g = part.get(gid)
        if not g or g.get('status') != 'ok': e('not an ok group of the part'); continue
        ids = set(g.get('keep', []) + g.get('add', []))
        if not 2 <= len(ps) <= 3: e('needs 2-3 sentences')
        for p in ps:
            n += 1
            if p.get('id') not in ids: e(f"id {p.get('id')} not compared in the group"); continue
            if not all(p.get(k) for k in ('th', 'ro', 'ja', 'point')): e('needs th/ro/ja/point'); continue
            if bank[p['id']]['th'] not in p['th']: e(f"{p['id']} not in its sentence")
            if re.search(r'[฀-๿]', p['ro']): e('Thai letters in ro')
            if len(p['point']) > 22: e('point too long')
            if len(p['th']) > 30: e('sentence too long')
        if len({p.get('id') for p in ps}) != len(ps): e('one sentence per word')
print(f'{n} sentences')
for x in errs: print(x)
sys.exit(1 if errs else 0)
