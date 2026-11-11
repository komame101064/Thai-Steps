"""Build dist/word-bank-more.json, dist/slang-bank-more.json and dist/more-examples.json from reviewed batches.

Input per batch (scripts/expansion/batch-XXX/):
  part-NN.json    authored entries (see scripts/expansion/SPEC.md)
  review-NN.json  independent second-pass verdicts: [{id, verdict: ok|fix|reject, issues, fixed?}]
Only entries the reviewer accepted (ok, or fix with a corrected entry that passes validation)
are published. Skipped, rejected and unreviewed entries stay out and are listed in the report.
Two kinds of batch: batch-XXX (frequency-list candidates, ids tl-2xxxx published as tl-4xxxx) and
editorial-XXX (words chosen by the editors, see EDITORIAL.md; ids tl-5xxxx general, tl-6xxxx slang,
published as is). word-bank.json and slang-bank.json are never modified. Afterwards run
build-word-topics.py, build-ja-readings.py and build-kana-search.py.
"""
import json,pathlib,sys,collections
P=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(P/'scripts/expansion'));import validate as V
DATE='2026-11-11';METHOD='AIによる作成と、別担当のAIによる点検'
def frequency(rank):
    # Textbook-list rank is not conversational frequency; keep these estimates in the lower half.
    return 5 if rank<=1000 else 4 if rank<=2000 else 3 if rank<=4000 else 2 if rank<=8000 else 1
registered=[w for n in ('word-bank.json','slang-bank.json') for w in json.loads((P/'dist'/n).read_text())]
existing={w['th'] for w in registered};used_ids={w['id'] for w in registered}
# Editorial batches check duplicates per list: the same spelling may be both a general word and a slang item.
general_th={w['th'] for w in registered if w.get('collection')!='slang'};slang_th={w['th'] for w in registered if w.get('collection')=='slang'}
# Authoring files use tl-(20000+source rank). The slang bank already owns some tl-2xxxx ids, and ids key
# learners' records, so published ids are tl-(40000+source rank): a range no existing record uses.
def public_id(authoring_id):return 'tl-%05d'%(int(authoring_id[3:])+20000)
assert not any(i>='tl-40000' for i in used_ids)
def publish_editorial(it,deck,batch):
    k=it['id'];assert k not in used_ids,k;used_ids.add(k);n=int(k[3:])
    if deck=='general':
        assert it['th'] not in general_th,(k,'already a general word');general_th.add(it['th']);ms=[]
        for s in it['senses']:
            m={'ja':s['ja'],'en':s['en'],'pos':s['pos'],'use':s['use'],'checked':True,'sourceSense':s['sourceSense'],'registerTags':s['registerTags'],'isSlang':False,'speechStyle':s['speechStyle']}
            if s.get('note'):m['note']=s['note']
            elif it.get('note') and s is it['senses'][0]:m['note']=it['note']
            m.update(reviewStatus='reviewed',reviewed=DATE,reviewMethod=METHOD);ms.append(m)
            e=s['example'];examples[f"{k}#{s['sourceSense']}"]={'th':e['th'],'ro':e['ro'],'ja':e['ja'],'en':e['en'],'checked':True,'sourceExample':'thai-steps-'+batch,'speechStyle':'標準的な用例文','reviewStatus':'reviewed','reviewed':DATE,'reviewMethod':METHOD}
        tags=[];[tags.append(t) for m in ms for t in m['registerTags'] if t not in tags]
        words.append({'id':k,'th':it['th'],'ro':it['ro'],'frequency':it['frequency'],'frequencyEstimated':True,'frequencyBasis':'editorial','corpusRank':100000+n,'pos':ms[0]['pos'],'category':it['category'],'meanings':ms,'relations':{},'tags':tags,'kind':it['kind'],'bucket':20000,'relationDetails':{},'speechStyle':ms[0]['speechStyle'],'generalHidden':False,'expansion':batch,'source':'thai-steps-editorial'})
    else:
        assert it['th'] not in slang_th,(k,'already a slang item');slang_th.add(it['th']);ms=[]
        for s in it['senses']:
            m={'ja':s['ja'],'en':s.get('en',''),'pos':s['pos'],'use':'この学習欄で扱う意味','checked':True,'sourceSense':s['sourceSense'],'speechStyle':s['speechStyle'],'note':s['note'],'isSlang':True,'reviewStatus':'reviewed','reviewed':DATE,'reviewMethod':METHOD}
            ms.append(m);e=s['example']
            examples[f"{k}#{s['sourceSense']}"]={'th':e['th'],'ro':e['ro'],'ja':e['ja'],'checked':True,'sourceExample':'thai-steps-'+batch,'speechStyle':s['speechStyle'],'context':e['context'],'reviewStatus':'reviewed','reviewed':DATE,'reviewMethod':METHOD}
        slang_words.append({'id':k,'th':it['th'],'ro':it['ro'],'frequency':it['frequency'],'frequencyEstimated':True,'frequencyBasis':'editorial','corpusRank':100000+n,'pos':ms[0]['pos'],'category':it['category'],'meanings':ms,'relations':{},'relationDetails':{},'tags':it.get('tags',[]),'kind':it['kind'],'bucket':5000,'collection':'slang','speechStyle':ms[0]['speechStyle'],'adult':it['adult'],'editorial':True,'expansion':batch})
words=[];slang_words=[];examples={};report={'date':DATE,'method':METHOD,'nativeReview':False,'batches':[]}
for bdir in sorted((P/'scripts/expansion').glob('batch-*'))+sorted((P/'scripts/expansion').glob('editorial-*')):
    editorial=bdir.name.startswith('editorial-');deck={x['id']:x['deck'] for x in json.loads((bdir/'input.json').read_text())} if editorial else {}
    items,errors,flags=V.validate(bdir.name);assert not errors,(bdir.name,errors[:5])
    by={i['id']:i for i in items}
    verdicts={}
    for f in sorted(bdir.glob('review-[0-9][0-9].json')):
        for r in json.loads(f.read_text()):
            assert r['id'] in by and r['id'] not in verdicts,r['id'];verdicts[r['id']]=r
    stat=collections.Counter()
    for it in items:
        k=it['id'];r=verdicts.get(k)
        if it['action']=='skip':stat['skippedByAuthor']+=1;continue
        if not r:stat['unreviewed']+=1;continue
        if r['verdict']=='reject':stat['rejectedByReviewer']+=1;continue
        if r['verdict']=='fix':
            assert it is r['fixed'] or it==r['fixed'],k;stat['fixedByReviewer']+=1  # validate() already substituted it
        else:assert r['verdict']=='ok',k;stat['acceptedAsWritten']+=1
        if editorial:
            publish_editorial(it,deck[k],bdir.name);continue
        assert it['th'] not in existing,(k,'already registered');existing.add(it['th']);general_th.add(it['th'])
        rank=int(k[3:])-20000;pid=public_id(k);assert pid not in used_ids,pid;used_ids.add(pid);ms=[]
        for s in it['senses']:
            m={'ja':s['ja'],'en':s['en'],'pos':s['pos'],'use':s['use'],'checked':True,'sourceSense':s['sourceSense'],'registerTags':s['registerTags'],'isSlang':False,'speechStyle':s['speechStyle']}
            if s.get('ro') and s['ro']!=it['ro']:m['ro']=s['ro']
            if s.get('note'):m['note']=s['note']
            elif it.get('note') and s is it['senses'][0]:m['note']=it['note']  # some authors put the note on the entry; show it on the first sense
            m.update(reviewStatus='reviewed',reviewed=DATE,reviewMethod=METHOD);ms.append(m)
            e=s['example']
            examples[f"{pid}#{s['sourceSense']}"]={'th':e['th'],'ro':e['ro'],'ja':e['ja'],'en':e['en'],'checked':True,'sourceExample':'newthai-v2.4' if e['origin']=='source' else 'thai-steps-'+bdir.name,'speechStyle':'標準的な用例文','reviewStatus':'reviewed','reviewed':DATE,'reviewMethod':METHOD}
        tags=[];[tags.append(t) for m in ms for t in m['registerTags'] if t not in tags]
        words.append({'id':pid,'authoringId':k,'th':it['th'],'ro':it['ro'],'frequency':frequency(rank),'frequencyEstimated':True,'frequencyBasis':'textbook','corpusRank':10000+rank,'pos':ms[0]['pos'],'category':it['category'],'meanings':ms,'relations':{},'tags':tags,'kind':it['kind'],'bucket':20000,'relationDetails':{},'speechStyle':ms[0]['speechStyle'],'generalHidden':False,'expansion':bdir.name,'source':'newthai-v2.4'})
    report['batches'].append({'batch':bdir.name,'candidates':len(items),'published':sum(w['expansion']==bdir.name for w in words+slang_words),**stat,'consistencyFlags':len(flags)})

# ---- Frequency on one scale (2026-11-12) ----------------------------------------------------------
# The 5,000 base words carry conversational deciles (1-10). Added general words had two other scales
# (textbook rank capped at 5, editors' estimates), so ไทย showed below ประเทศไทย. Put added words on the
# base scale: corpus counts (Phupha web text and TNC, scripts/source-snapshots/corpus-counts.json.gz) are
# mapped to the base deciles by quantile matching on the base words, the lower of the two corpus levels is
# used, written-register and bound forms are capped, and a compound never ranks above its parts.
# Base words and slang are left as measured.
import gzip,math,bisect,unicodedata,re
_cc=json.load(gzip.open(P/'scripts/source-snapshots/corpus-counts.json.gz','rt',encoding='utf-8'))['counts']
base_general=[w for w in json.loads((P/'dist/word-bank.json').read_text()) if w.get('collection')!='slang']
def _count(src,th):
    d=_cc[src];return d.get(th) or d.get(th.replace('ฯ','').strip())
def _thresholds(src):
    xs=sorted((math.log10(_count(src,w['th'])),w['frequency']) for w in base_general if _count(src,w['th']))
    vals=[x for x,_ in xs];cnt=collections.Counter(f for _,f in xs);th=[];acc=0
    for f in range(1,10):acc+=cnt[f];th.append(vals[min(acc,len(vals)-1)])
    return th
_TH={src:_thresholds(src) for src in ('phupha','tnc')}
def corpus_level(th):
    lv=[1+bisect.bisect_right(_TH[src],math.log10(c)) for src in ('phupha','tnc') for c in [_count(src,th)] if c]
    return min(lv) if lv else None
def _fold(r):return ''.join(c for c in unicodedata.normalize('NFD',r) if not unicodedata.combining(c)).lower()
def _syl(r):return [x for x in _fold(r).split() if x]
def _onset(x):return re.match(r'^[^aeiouɛɔəʉ]*',x)[0]
PART_SKIP_POS={'助詞','間投詞'}
def parts_of(w,index):
    """Same split as the app's 成り立ち panel (words-app.js wordParts)."""
    th=w['th'];target=len(_syl(w['ro']))
    if target<2 or len(th)<3:return []
    best=[None]*(len(th)+1);best[0]=[]
    for i in range(1,len(th)+1):
        for j in range(max(0,i-14),i):
            if best[j] is None:continue
            piece=th[j:i]
            if piece==th:continue
            x=index.get(piece)
            if not x or all(m['pos'] in PART_SKIP_POS for m in x['meanings'] if not m.get('isSlang')):continue
            cand=best[j]+[x]
            if best[i] is None or len(cand)<len(best[i]):best[i]=cand
    out=best[len(th)]
    if not out or len(out)<2 or len(out)>5:return []
    whole=[_onset(x) for x in _syl(w['ro'])];joined=[_onset(x) for p in out for x in _syl(p['ro'])]
    return out if joined==whole else []
BOUND_NOTE=re.compile(r'複合語|組み合わせ|の形で使|の中で使|単独ではあまり|単独ではほとんど')
def capped(w,lv):
    m=w['meanings'][0];tags=set(m.get('registerTags') or [])
    if tags&{'literary','royal','dated'}:lv=min(lv,4)
    elif 'formal' in tags:lv=min(lv,6)
    if m['pos']=='接頭辞' or BOUND_NOTE.search(' '.join(x.get('note','') for x in w['meanings'])):lv=min(lv,4)
    # One-syllable spellings are counted inside longer words in both corpora (กา, รา, ซี), so their counts
    # say little. Keep them at or below the earlier estimate, except words checked to be common on their own.
    if len(_syl(w['ro']))<2 and w['th'] not in MONO_COMMON:lv=min(lv,w['frequencyPrior'],4)
    return max(1,lv)
MONO_COMMON={'ไทย','จีน','ลาว','นึง'}
# Reviewed by hand (2026-11-12): added words the corpora rate 7+ but that are mostly written, news or web-page
# words (site footers, forms, place names in listings), or whose taught sense is not the counted one.
FREQ_REVIEW={
 'ได้ที่':(3,'数えられているのは「〜で（できる）」の連なりで、教える語義「ちょうどよい具合」はまれ'),
 'คุณอา':(4,'親族名称。ウェブの人名表記で多く数えられる'),'นายก':(6,'ニュース語'),'พ.ศ.':(6,'書き言葉の表記'),
 'ที่มา':(5,'ウェブの出典表示で多い'),'ที่อยู่':(6,'ウェブのフォームで多い'),'เหล่านี้':(6,'書き言葉寄り'),
 'ก็ตาม':(6,'書き言葉寄り'),'ตำบล':(4,'行政区画名。住所表記で多い'),'เป็นต้น':(6,'書き言葉寄り'),'ตนเอง':(6,'やや改まった語'),
 'ผู้เขียน':(4,'ウェブの記事表示で多い'),'ผู้รับ':(4,'書類・ウェブで多い'),'ส่งออก':(5,'ニュース語'),'ชาติไทย':(4,'改まった語'),
 'สยาม':(4,'店名・ブランド名で多く数えられる'),'สมุทรปราการ':(5,'住所表記で多い'),'บุรีรัมย์':(5,'住所表記で多い'),
 'ปทุมธานี':(5,'住所表記で多い'),'นครราชสีมา':(5,'住所表記で多い（会話では โคราช）'),'เชียงใหม่':(7,'有名な都市。住所表記の分を割り引く'),
 'พัทยา':(6,'観光地名'),'อยุธยา':(6,'観光地名'),'เชียงราย':(6,'観光地名'),'จัดงาน':(6,'告知文で多い'),'โดยที่':(5,'書き言葉寄り'),
 'เป็นอัน':(5,'書き言葉寄り'),'พร้อมทั้ง':(5,'書き言葉寄り'),'การแข่งขัน':(6,'ニュース語'),'คิดเห็น':(6,'主に ความคิดเห็น の形で書き言葉に多い'),
 'เป็นไป':(6,'書き言葉寄り'),'พูดถึง':(7,'')}
freq_stat=collections.Counter()
for w in words:
    prior=w['frequency'];lv=corpus_level(w['th']) if 'ๆ' not in w['th'] or _count('phupha',w['th']) else None
    if lv is not None:w['frequencyBasis']='corpus';freq_stat['corpus']+=1
    elif w['frequencyBasis']=='editorial':lv=max(1,prior-2);freq_stat['editorialFallback']+=1
    else:lv=prior;freq_stat['textbookFallback']+=1
    w['frequencyPrior']=prior;w['frequency']=capped(w,lv)
    if w['th'] in FREQ_REVIEW:w['frequency']=min(w['frequency'],FREQ_REVIEW[w['th']][0]);freq_stat['reviewedByHand']+=1
# Reduplicated forms (Xๆ) and compounds: never above the base word / any part. Repeat until stable.
index={}
for x in base_general+words:
    if x.get('generalHidden'):continue
    cur=index.get(x['th'])
    if not cur or x['frequency']>cur['frequency']:index[x['th']]=x
for _ in range(6):
    changed=0
    for w in sorted(words,key=lambda x:len(x['th'])):
        lim=None
        if 'ๆ' in w['th']:
            b=index.get(w['th'].replace('ๆ','').strip())
            if b:lim=b['frequency'] if w['frequencyBasis']=='corpus' else max(1,b['frequency']-2)
        ps=parts_of(w,index)
        if ps:pl=min(p['frequency'] for p in ps);lim=pl if lim is None else min(lim,pl)
        if lim is not None and w['frequency']>lim:w['frequency']=lim;changed+=1
    if not changed:break
report['frequency']={'method':'追加の一般語はコーパス出現数（Phupha・TNC）を基本語5,000語の会話頻度の目盛りに合わせて推定。書き言葉寄りの語・結合形は上限あり。複合語は構成語より高くしない。基本語とスラングは変更なし。',**freq_stat,'thresholds':{k:[round(x,3) for x in v] for k,v in _TH.items()}}
assert len({w['id'] for w in words+slang_words})==len(words+slang_words)
keys={f"{w['id']}#{m['sourceSense']}" for w in words+slang_words for m in w['meanings']};assert keys==set(examples)
report['published']=len(words)+len(slang_words);report['general']=len(words);report['slang']=len(slang_words);report['senses']=len(keys)
dump=lambda o:json.dumps(o,ensure_ascii=False,separators=(',',':'))+'\n'
(P/'dist/word-bank-more.json').write_text(dump(words));(P/'dist/slang-bank-more.json').write_text(dump(slang_words));(P/'dist/more-examples.json').write_text(dump(examples))
(P/'dist/expansion-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
# Reviewed text fixes for the files rebuilt here (scripts/native-review/fixes.json); idempotent.
import importlib.util as _u
_s=_u.spec_from_file_location('anr',P/'scripts/apply-native-review.py');_m=_u.module_from_spec(_s);_s.loader.exec_module(_m)
print('native-review fixes',_m.apply({'word-bank-more.json','slang-bank-more.json','more-examples.json'}))
