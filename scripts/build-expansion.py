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
assert len({w['id'] for w in words+slang_words})==len(words+slang_words)
keys={f"{w['id']}#{m['sourceSense']}" for w in words+slang_words for m in w['meanings']};assert keys==set(examples)
report['published']=len(words)+len(slang_words);report['general']=len(words);report['slang']=len(slang_words);report['senses']=len(keys)
dump=lambda o:json.dumps(o,ensure_ascii=False,separators=(',',':'))+'\n'
(P/'dist/word-bank-more.json').write_text(dump(words));(P/'dist/slang-bank-more.json').write_text(dump(slang_words));(P/'dist/more-examples.json').write_text(dump(examples))
(P/'dist/expansion-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
