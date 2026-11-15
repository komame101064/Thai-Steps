"""Build dist/tone-sets.js: groups of one-syllable words that differ only in tone or vowel length
(khàao ニュース / khâao ご飯 / khǎao 白い / khǎo 彼 …) for the listening practice in 文字 › 0. 発音と声調.
Ordinary words only (no loanwords with ์, particles or interjections), frequency 4+, one word per exact reading."""
import json,pathlib,unicodedata,re,collections
P=pathlib.Path(__file__).resolve().parents[1]
bank=[w for n in ('word-bank.json','word-bank-more.json') for w in json.loads((P/'dist'/n).read_text())]
strip=lambda r:''.join(c for c in unicodedata.normalize('NFD',r) if unicodedata.category(c)!='Mn')
best={}
for w in bank:
    ro=w['ro'].strip();m=w['meanings'][0]
    if w.get('collection')=='slang' or w.get('generalHidden') or ' ' in ro or '์' in w['th'] or w['frequency']<4:continue
    if any(x in m['pos'] for x in ('助詞','間投詞')):continue
    if any(x in (m.get('note') or '')+m['ja']+(m.get('speechStyle') or '') for x in ('粗い','失礼','罵','下品','性的')):continue
    if ro not in best or w['frequency']>best[ro]['frequency']:best[ro]=w
g=collections.defaultdict(list)
for ro,w in best.items():g[re.sub(r'(.)\1',r'\1',strip(ro))].append(w)
gloss=lambda s:re.split(r'[・、（(]',s)[0].strip()[:12]
sets=[]
for k,ws in g.items():
    if len(ws)<3:continue
    ws=sorted(ws,key=lambda w:-w['frequency'])[:8]
    sets.append({'k':k,'f':sum(w['frequency'] for w in ws),'w':[[w['id'],w['th'],w['ro'],gloss(w['meanings'][0]['ja'])] for w in sorted(ws,key=lambda w:w['ro'])]})
sets.sort(key=lambda s:-s['f'])
for s in sets:del s['f']
(P/'dist/tone-sets.js').write_text('// Similar-sounding words (tone / vowel length) for listening practice. Built by scripts/build-tone-sets.py.\nconst TONE_SETS='+json.dumps(sets,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(sets),'sets',sum(len(s['w']) for s in sets),'words')
