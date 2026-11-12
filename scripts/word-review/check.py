import json,pathlib,sys,csv
W=pathlib.Path(__file__).resolve().parent;chunk=sys.argv[1]
idx={r['id']:r for r in csv.DictReader(open(W/'index.tsv'),delimiter='\t')}
inp={json.loads(l)['id']:json.loads(l) for l in open(W/f'input/{chunk}.jsonl')}
errs=[];seen=set();n=0
for i,l in enumerate(open(W/f'results/{chunk}.jsonl'),1):
    l=l.strip()
    if not l:continue
    try:r=json.loads(l)
    except Exception as e:errs.append(f'line {i}: bad JSON {e}');continue
    n+=1;x=inp.get(r.get('id'))
    if not x:errs.append(f'line {i}: id not in chunk {r.get("id")}');continue
    if r['id'] in seen:errs.append(f'line {i}: duplicate {r["id"]}')
    seen.add(r['id']);senses={s['n'] for s in x['senses']}
    f=r.get('formality')
    if not isinstance(f,int) or not 1<=f<=10:errs.append(f'{r["id"]}: formality must be int 1-10')
    for s in r.get('literary') or []:
        if s not in senses:errs.append(f'{r["id"]}: literary sense {s} not found')
    for e in r.get('rel') or []:
        t=idx.get(e.get('id'))
        if e.get('type') not in ('syn','ant','related'):errs.append(f'{r["id"]}: bad rel type {e}')
        elif not t:errs.append(f'{r["id"]}: rel id not in index {e}')
        elif e['id']==r['id']:errs.append(f'{r["id"]}: self relation')
        elif x['deck']=='general' and t['deck']=='slang':errs.append(f'{r["id"]}: general->slang relation {e}')
        if 's' in e and e['s'] not in senses:errs.append(f'{r["id"]}: rel source sense {e}')
    for fx in r.get('fix') or []:
        if fx.get('field')=='ro':cur=x['ro']
        elif fx.get('field')=='sense.ja':cur=next((s['ja'] for s in x['senses'] if s['n']==fx.get('sense')),None)
        else:errs.append(f'{r["id"]}: bad fix field {fx}');continue
        if cur!=fx.get('from'):errs.append(f'{r["id"]}: fix.from does not match current text {fx.get("from")!r} vs {cur!r}')
    fq=r.get('freq')
    if fq is not None and not (isinstance(fq,dict) and isinstance(fq.get('to'),int) and 1<=fq['to']<=10):errs.append(f'{r["id"]}: bad freq {fq}')
print(f'{n} results, {len(errs)} errors');print('\n'.join(errs[:40]))
