"""Build sense-bound examples from attributed ThaiReader v42 authored examples.
Inputs are explicit paths to the downloaded TSVs and translation cache.
"""
import pathlib,csv,json,re,functools,argparse
ap=argparse.ArgumentParser();ap.add_argument('--data',required=True);args=ap.parse_args();D=pathlib.Path(args.data);P=pathlib.Path(__file__).resolve().parents[1]
words=json.load(open(P/'dist/word-bank.json'));rows=list(csv.DictReader(open(D/'examples.tsv'),delimiter='\t'));group={}
for row in rows:group.setdefault((row['id'],int(row['n'])),[]).append(row)
lex={r['word']:r['reading'] for r in csv.DictReader(open(D/'list.tsv'),delimiter='\t')}
lex.update({'นึง':'nʉng','ซัก':'sák','ศุกร์':'sùk','กรุงเทพฯ':'grung-têep','ขลุ่ย':'klùi','ตุ้ม':'tûm','เน็ต':'nét','มนตร์':'mon','สะพาย':'sà-paai'})
senses={(r['id'],int(r['n'])):r for r in csv.DictReader(open(D/'senses.tsv'),delimiter='\t')}
def roman(s):
 for a,b in [('kh','KH'),('th','TH'),('ph','PH')]:s=re.sub(r'(^|[- ])'+a,r'\1'+b,s)
 for a,b in [('k','kh'),('t','th'),('p','ph')]:s=re.sub(r'(^|[- ])'+a,r'\1'+b,s)
 s=s.replace('bp','p').replace('dt','t');s=re.sub(r'(^|[- ])g',r'\1k',s);s=re.sub(r'(^|[- ])j',r'\1c',s)
 return s.replace('KH','kh').replace('TH','th').replace('PH','ph').replace('-',' ')
@functools.lru_cache(None)
def split(s):
 if not s:return []
 if s in lex:return [s]
 for n in range(len(s),0,-1):
  if s[:n] in lex:
   rest=split(s[n:])
   if rest is not None:return [s[:n]]+rest
 return None
cache=json.load(open(D/'example-ja-cache.json'));manual=json.load(open(P/'scripts/example-ja-reviewed.json'))
result={};missing=[]
for w in words:
 for meaning in w['meanings']:
  n=meaning['sourceSense'];chosen=min(group[w['id'],n],key=lambda r:(r['pick']!='1',int(r['level'] or 5000),len(r['thai'])))
  readings=[]
  for token in chosen['tokens'].split('|'):
   if token=='ๆ':
    assert readings,chosen;readings.append(readings[-1]);continue
   if token in ['30','90']:readings.append({'30':'sǎam sìp','90':'kâao sìp'}[token]);continue
   if not re.search('[ก-๛]',token):continue
   parts=split(token);assert parts is not None,(token,chosen['thai'])
   reading=[]
   for part in parts:
    r=senses[w['id'],n]['reading'] if part==w['th'] else lex[part]
    reading.append(roman(r or lex[part]))
   readings.append(' '.join(reading))
  ja=manual.get(chosen['thai']) or cache.get(chosen['english'])
  if not ja:missing.append(chosen['english']);continue
  if not chosen['thai'] in manual:
   ja=ja.replace('お前','あなた').replace('おまえ','あなた').replace('貴様','あなた').replace('俺','私')
   if ja=='2 + 2 = 4':ja='2＋2は4です。'
  result[w['id']+'#'+str(n)]={'th':chosen['thai'],'ro':' '.join(readings),'ja':ja,'en':chosen['english'],'checked':chosen['thai'] in manual,'sourceExample':chosen['example_id']}
assert not missing,missing[:10]
assert len(result)==sum(len(w['meanings']) for w in words)==7411
(P/'dist/sense-examples.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
print('Examples:',len(result),'Japanese reviewed:',sum(e['checked'] for e in result.values()),'unique Thai:',len(set(e['th'] for e in result.values())))
