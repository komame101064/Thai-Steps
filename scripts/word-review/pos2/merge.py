"""Check the second POS review (POS_GUIDE.md 第2版) and collect the proposed changes.

Every input row must come back exactly once, in order, with one of the 17 labels.
Writes changes.json: [{key, th, from, to, ja, reason, issue}] and issues.json.
"""
import json,pathlib,sys,collections
H=pathlib.Path(__file__).resolve().parent
LABELS=set('名詞 代名詞 疑問詞 動詞 助動詞 形容詞・状態語 副詞 指示詞 限定詞 類別詞 数詞 前置詞 接続詞 助詞 間投詞 接頭辞 定型表現'.split())
changes,issues,missing=[],[],[]
for inp in sorted((H/'input').glob('*.tsv')):
    rows=[l.split('\t') for l in inp.read_text().splitlines()[1:]]
    out=H/'results'/inp.name
    if not out.exists():missing.append(inp.name);continue
    res=[l.split('\t') for l in out.read_text().splitlines() if l.strip()]
    if [r[0] for r in res]!=[r[0] for r in rows]:sys.exit(f'{inp.name}: keys differ from input ({len(res)} vs {len(rows)})')
    for r,x in zip(rows,res):
        x+=['']*(4-len(x));to=x[1].strip()
        if to not in LABELS:sys.exit(f'{inp.name} {r[0]}: bad label {to!r}')
        if x[3].strip():issues.append({'key':r[0],'th':r[1],'pos':to,'ja':r[3],'issue':x[3].strip(),'chunk':inp.stem})
        if to!=r[2]:changes.append({'key':r[0],'th':r[1],'from':r[2],'to':to,'ja':r[3],'ex':r[6],'reason':x[2].strip(),'chunk':inp.stem})
(H/'changes.json').write_text(json.dumps(changes,ensure_ascii=False,indent=1)+'\n')
(H/'issues.json').write_text(json.dumps(issues,ensure_ascii=False,indent=1)+'\n')
print('missing:',missing)
print(len(changes),'changes;',len(issues),'issues')
for k,v in collections.Counter((c['from'],c['to']) for c in changes).most_common():print(f'  {k[0]}→{k[1]}\t{v}')
