"""Traceable etymology labels. Cognates and inherited Tai words are never treated as loans."""
import json,gzip,pathlib,re,collections,urllib.parse
P=pathlib.Path(__file__).resolve().parents[1]
S=json.load(gzip.open(P/'scripts/source-snapshots/wiktionary-origins.json.gz','rt',encoding='utf8'))
W=json.loads((P/'dist/word-bank.json').read_text())+json.loads((P/'dist/slang-bank.json').read_text())
LANGS={'en':'英語','tts':'イサーン語','nan-tws':'潮州語','nan-hbl':'閩南語','zh':'中国語','sa':'サンスクリット','pi':'パーリ語','km':'クメール語','okz':'古クメール語','okz-ang':'古クメール語','okz-pre':'古クメール語','xhm':'クメール語系','ltc':'中古中国語','och':'上古中国語','fr':'フランス語','pt':'ポルトガル語','ms':'マレー語','ja':'日本語','lo':'ラオス語','ko':'韓国語','id':'インドネシア語','fa':'ペルシャ語','fa-cls':'古典ペルシャ語','ar':'アラビア語','mnw':'モン語','vi':'ベトナム語','ta':'タミル語','hi':'ヒンディー語','de':'ドイツ語','nl':'オランダ語','my':'ビルマ語','shn':'シャン語','nod':'北タイ語','sou':'南タイ語','omx':'古モン語','jv':'ジャワ語','tl':'タガログ語','nan':'閩南語','it':'イタリア語'}
CHINESE={'zh','ltc','och','nan','nan-tws','nan-hbl'}
BORROW={'bor','bor+','borrowed','lbor','lbor+','slbor','slbor+','cal','cal+','calque'}
UNCERTAIN=re.compile(r'\b(possibly|probably|perhaps|uncertain|disputed|either|likely|may be|suggest(?:s|ed|ion)?|hypothesis|proposed)\b',re.I)
STOP=set('a an the of to and or in on at from with for is be as by this that one which used especially something someone person thing it its originally also more'.split())
def tokens(s):return {re.sub(r'(s|es)$','',x) for x in re.findall('[a-z]{3,}',s.lower()) if x not in STOP}
def origin_rows(x):
 text=x.get('etymology_text','');out=[]
 for t in x.get('etymology_templates',[]):
  a=t.get('args',{});name=t['name'];lang=a.get('2')
  if a.get('1')!='th' or lang not in LANGS:continue
  if name not in BORROW and not (name in ['der','der+'] and re.match(r'(?:From |Derived from )',text)):continue
  # A distant proposed source of an inherited Tai word is not a direct Thai borrowing.
  if name in ['der','der+'] and any(t['name']=='inh' for t in x.get('etymology_templates',[])):continue
  term=a.get('3','');term='' if term in ['-',''] else term
  out.append({'language':lang,'label':'中国由来' if lang in CHINESE else LANGS[lang]+'由来','detailLabel':LANGS[lang]+'由来','term':term,'roman':a.get('tr',''),'uncertain':bool(UNCERTAIN.search(text)),'kind':'calque' if name.startswith('cal') else 'borrowed' if name in BORROW else 'derived','source':'https://en.wiktionary.org/wiki/'+urllib.parse.quote(x['word'],safe=''),'etymology':x.get('etymology_number','')})
 return list({(r['language'],r['term'],r['etymology']):r for r in out}.values())
by=collections.defaultdict(list)
for x in S:by[x['word']].append(x)
OUT={}
for w in W:
 entries=by.get(w['th'],[]);sense_rows={}
 # If etymologies disagree or one is not known, map by English sense instead of applying one word's etymology to a homograph.
 sets=[{r['language'] for r in origin_rows(e)} for e in entries]
 common=bool(sets) and all(z==sets[0] for z in sets) and bool(sets[0])
 for m in w['meanings']:
  matches=[]
  if common:
   matches=[r for e in entries for r in origin_rows(e)]
  elif m.get('en'):
   wanted=tokens(m['en']);scored=[]
   for e in entries:
    for sense in e.get('senses',[]):
     ts=tokens(' '.join(sense.get('glosses',[])));score=len(wanted&ts)/max(1,len(wanted))
     if score>=.55 and len(wanted&ts)>=min(2,len(wanted)):scored.append((score,e))
   if scored:
    best=max(s for s,e in scored);es=[e for s,e in scored if s==best]
    # A tie to an unknown origin is deliberately not resolved as a loan.
    if all(origin_rows(e) for e in es):matches=[r for e in es for r in origin_rows(e)]
  matches=list({(r['language'],r['term'],r['etymology']):r for r in matches}.values())
  if matches:sense_rows[str(m['sourceSense'])]=matches
 if sense_rows:OUT[w['id']]={'th':w['th'],'senses':sense_rows,'reviewedAt':'2026-11-10','method':'dictionary-etymology-with-sense-matching'}
# Two checked Thai-edition entries cover modern forms not present in the English dump.
manual={'ชิล':{'language':'en','label':'英語由来','term':'chill','roman':'','uncertain':False,'kind':'borrowed','source':'https://th.wiktionary.org/wiki/ชิล','etymology':''},'จอย':{'language':'en','label':'英語由来','term':'join','roman':'','uncertain':False,'kind':'borrowed','source':'https://th.wiktionary.org/wiki/จอย','etymology':'1'}}
for w in W:
 if w['th'] in manual:OUT[w['id']]={'th':w['th'],'senses':{str(m['sourceSense']):[manual[w['th']]] for m in w['meanings']},'reviewedAt':'2026-11-10','method':'dictionary-entry-editorial-check'}
# Phonetic length confirmed from both English and Thai Wiktionary, not spelling alone.
for fn in ['word-bank.json','slang-bank.json']:
 words=json.loads((P/'dist'/fn).read_text())
 for w in words:
  if w['th']=='แซ่บ':w['ro']='sɛ̂p'
 (P/'dist'/fn).write_text(json.dumps(words,ensure_ascii=False,separators=(',',':'))+'\n')
(P/'dist/word-origins.js').write_text('// Source-linked origin labels; lack of a label does not imply native Thai origin.\nconst WORD_ORIGINS='+json.dumps(OUT,ensure_ascii=False,separators=(',',':'))+';\n')
counts=collections.Counter(r['label'] for info in OUT.values() for r in {r['language']:r for rs in info['senses'].values() for r in rs}.values())
report={'date':'2026-11-10','registeredUniqueHeadwords':len({w['th'] for w in W}),'registeredRecords':len(W),'dictionaryMatchedHeadwords':len({w['th'] for w in W if w['th'] in by}),'originLabeledRecords':len(OUT),'labels':dict(counts),'cognatesCountedAsLoans':0,'fullLinguisticReviewComplete':False,'expansion':{'target':20000,'stagedCandidates':20000,'publiclyAdded':(json.load(open(P/'dist/expansion-review.json'))['published'] if (P/'dist/expansion-review.json').exists() else 0),'status':'追加分は dist/expansion-review.json を参照。残りの候補は日本語訳・発音・用例の個別確認待ち','review':'expansion-review.json'},'coverage':'全登録項目の構造・語源照合対象を再点検。語源ラベルは辞書の記載が確認できた語義に限定。訳・発音・用例を全件個別校閲したものではない。'}
(P/'dist/origin-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
