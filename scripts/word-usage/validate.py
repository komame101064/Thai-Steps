#!/usr/bin/env python3
"""Check scripts/word-usage/part-NN.json against SPEC.md. Prints errors; exit 1 if any."""
import json, glob, pathlib, re, sys
R = pathlib.Path(__file__).resolve().parent
ROOT = R.parent.parent
bank = {}
for f in ['word-bank.json', 'word-bank-more.json']:
    for w in json.loads((ROOT / 'dist' / f).read_text()):
        bank[w['id']] = w
errs = []; n = ok = 0
for f in sorted(R.glob('part-*.json')):
    nn = f.stem.split('-')[1]
    inp = {x['gid']: x for x in json.loads((R / f'input-{nn}.json').read_text())}
    for g in json.loads(f.read_text()):
        n += 1; gid = g.get('gid'); e = lambda m: errs.append(f'{f.name} {gid}: {m}')
        if gid not in inp: e('unknown gid'); continue
        if g.get('status') == 'skip':
            if not g.get('reason'): e('skip without reason')
            continue
        if g.get('status') != 'ok': e('status must be ok or skip'); continue
        ok += 1
        ids = [w['id'] for w in inp[gid]['words']]
        keep, add = g.get('keep', []), g.get('add', [])
        if any(i not in ids for i in keep): e('keep has an id outside the group')
        if len(add) > 3 or any(i not in bank or bank[i].get('collection') == 'slang' for i in add): e('bad add')
        allw = keep + add
        if len(set(allw)) < 2: e('fewer than 2 words')
        items = g.get('items', [])
        if sorted(i.get('id') for i in items) != sorted(set(allw)): e('items must cover keep+add exactly')
        for i in items:
            if not i.get('use') or len(i['use']) > 36: e(f"use length {i.get('id')}")
            if re.search(r'[a-z]{2,}[\u0300-\u036f]', i.get('use','')): e(f"romanization written into use {i.get('id')}")
        if not g.get('lead') or len(g['lead']) > 45: e('lead missing/too long')
        if g.get('tip') and len(g['tip']) > 45: e('tip too long')
        for x in g.get('examples', [])[:5]:
            if not all(x.get(k) for k in ('th', 'ro', 'ja')): e('example needs th/ro/ja')
            elif not any(bank[i]['th'] in x['th'] for i in allw if i in bank): e('example lacks a compared word')
            elif re.search(r'[฀-๿]', x['ro']): e('Thai letters in ro')
        if len(g.get('examples', [])) > 2: e('more than 2 examples')
        if re.search(r'\bS\s*[+＋]\s*V|\bSVO\b', json.dumps(g, ensure_ascii=False)): e('S/V/O symbols')
print(f'{n} groups, {ok} ok')
for x in errs: print(x)
sys.exit(1 if errs else 0)
