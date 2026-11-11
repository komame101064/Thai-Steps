"""Mechanical checks for authored expansion entries (scripts/expansion/batch-XXX/part-NN.json).

Hard errors (schema, vocabulary, missing headword in example, malformed romanization) must be
zero before a batch is built. Flags are consistency hints for a human/AI reviewer: tone or
vowel-length disagreement with the source list's reading, or a headword reading that does not
reappear in its own example reading. Usage: python3 scripts/expansion/validate.py batch-001
"""
import gzip,json,pathlib,re,sys,unicodedata
P=pathlib.Path(__file__).resolve().parents[2]
CATEGORIES=set('一般語彙 日常の動作 家・場所 時間 性質・状態 食べ物・飲み物 人・家族 体・健康 自然・天気・色 量・程度・比較 お金・買い物 仕事・学習 場所・前置詞 接続表現 挨拶・会話 数え方 趣味・メディア 社会・制度 文法・時制 代名詞・呼びかけ 指示表現 数字 助詞・語気 疑問詞 移動・道案内 否定'.split())
POS=set('名詞 動詞 形容詞・状態語 副詞 間投詞 接続詞 前置詞 助詞 代名詞 類別詞 定型表現 接頭辞 数詞'.split())
USE=['よく使う意味','よく使う別の意味','少なめの用法']
REGISTER={'標準語（口語限定ではない）':[],'口語':['colloquial'],'改まった表現':['formal'],'文語':['literary'],'王室の敬語':['royal'],'古めの表現':['dated'],'粗い口語':['colloquial','vulgar']}
ONSET=r'(?:khr|khl|khw|phr|phl|kr|kl|kw|pr|pl|tr|thr|br|bl|fr|dr|kh|ch|th|ph|ng|[kcsydtnbpfmrlwh])?'
VOWEL=r'(?:iiao|iao|uui|uuai|ʉʉai|iia|ʉʉa|uua|aai|aao|ɔɔi|əəi|ooi|eeo|ɛɛo|ia|ʉa|ua|ai|ao|ui|iu|eo|ɛo|əi|ɔi|oi|aa|ii|ʉʉ|uu|ee|ɛɛ|oo|ɔɔ|əə|[aiʉueɛoɔə])'
SYL=re.compile('^'+ONSET+VOWEL+r'(?:ng|[ktpnm])?$')
TONES={'̀':'low','́':'high','̂':'falling','̌':'rising','̆':'rising'}
THAI=re.compile(r'[฀-๿]');JA=re.compile(r'[぀-ヿ㐀-鿿]')
def split_tone(s):
    d=unicodedata.normalize('NFD',s);marks=[TONES[c] for c in d if c in TONES]
    base=''.join(c for c in d if not unicodedata.combining(c))
    return base,(marks[0] if marks else 'mid'),len(marks)
def check_ro(ro,where,errors):
    out=[]
    if ro!=ro.strip() or '  ' in ro or not ro:errors.append(f'{where}: spacing in ro "{ro}"')
    for s in ro.split():
        base,tone,n=split_tone(s)
        if n>1:errors.append(f'{where}: two tone marks in "{s}"')
        if not SYL.match(base):errors.append(f'{where}: syllable "{s}" is not in the app romanization')
        out.append((base,tone))
    return out
def hint_syllables(h):
    out=[]
    for s in re.split(r"[-\s]+",h.strip()):
        if not s:continue
        base,tone,_=split_tone(s);out.append((':' in s,tone))
    return out
MONO=re.compile('^'+ONSET+r'(aa|ii|ʉʉ|uu|ee|ɛɛ|oo|ɔɔ|əə|[aiʉueɛoɔə])(?:ng|[ktpnm])?$')
def validate(batch):
    cand={('tl-%05d'%(20000+int(float(x['sourceIndex'])))):x for x in json.load(gzip.open(P/'scripts/source-snapshots/expansion-candidates-20000.json.gz','rt',encoding='utf8')) if not x['registered']}
    errors=[];flags=[];items=[]
    # A reviewer's corrected entry replaces the authored one, so the checks cover what is published.
    fixed={r['id']:r['fixed'] for f in sorted((P/'scripts/expansion'/batch).glob('review-[0-9][0-9].json')) for r in json.loads(f.read_text()) if r.get('verdict')=='fix'}
    for f in sorted((P/'scripts/expansion'/batch).glob('part-[0-9][0-9].json')):
        for it in json.loads(f.read_text()):
            it=fixed.get(it.get('id'),it)
            items.append(it);k=it.get('id');src=cand.get(k)
            if not src or src['th']!=it.get('th'):errors.append(f'{k}: id/th does not match a candidate');continue
            if it.get('action')=='skip':
                if not it.get('skipReason'):errors.append(f'{k}: skip without reason')
                continue
            if it.get('action')!='add':errors.append(f'{k}: bad action');continue
            if it.get('kind') not in('word','expression'):errors.append(f'{k}: kind')
            if it.get('category') not in CATEGORIES:errors.append(f'{k}: category {it.get("category")}')
            head=check_ro(it.get('ro',''),k,errors)
            hint=hint_syllables(src['readingSource'])
            if len(hint)!=len(head):flags.append(f'{k} {it["th"]}: {len(head)} syllables "{it.get("ro")}" vs source reading "{src["readingSource"]}"')
            else:
                for (base,tone),(hl,ht) in zip(head,hint):
                    if tone!=ht:flags.append(f'{k} {it["th"]}: tone "{it["ro"]}" vs source "{src["readingSource"]}"');break
                    m=MONO.match(base)
                    if m and (len(m.group(1))==2)!=hl:flags.append(f'{k} {it["th"]}: vowel length "{it["ro"]}" vs source "{src["readingSource"]}"');break
            senses=it.get('senses') or []
            if not 1<=len(senses)<=3:errors.append(f'{k}: {len(senses)} senses')
            seen=set()
            for i,s in enumerate(senses,1):
                w=f'{k}#{i}'
                if s.get('sourceSense')!=i:errors.append(f'{w}: sourceSense')
                if s.get('pos') not in POS:errors.append(f'{w}: pos {s.get("pos")}')
                if s.get('use') not in USE or (i==1)!=(s.get('use')==USE[0]):errors.append(f'{w}: use {s.get("use")}')
                if REGISTER.get(s.get('speechStyle'))!=s.get('registerTags'):errors.append(f'{w}: register {s.get("speechStyle")} {s.get("registerTags")}')
                if not JA.search(s.get('ja','')) or THAI.search(s.get('ja','')):errors.append(f'{w}: ja "{s.get("ja")}"')
                if not s.get('en') or JA.search(s['en']):errors.append(f'{w}: en')
                if 'note' in s and not JA.search(s['note']):errors.append(f'{w}: note')
                e=s.get('example') or {}
                if e.get('origin') not in('source','authored'):errors.append(f'{w}: example origin')
                th=e.get('th','')
                if it['th'] not in th:errors.append(f'{w}: example lacks headword: {th}')
                if th==it['th'] or len(th)<len(it['th'])+3:errors.append(f'{w}: example is not a sentence: {th}')
                if th in seen:errors.append(f'{w}: duplicate example')
                seen.add(th)
                if e.get('origin')=='source' and th not in src['examplesThai'].split('\n'):errors.append(f'{w}: "source" example is not verbatim from the source list')
                if THAI.search(e.get('ro','')):errors.append(f'{w}: Thai script in example ro')
                ex=check_ro(e.get('ro',''),w+' example',errors)
                if not JA.search(e.get('ja','')) or not re.search(r'[。？！」]$',e.get('ja','')):errors.append(f'{w}: example ja "{e.get("ja")}"')
                if not e.get('en'):errors.append(f'{w}: example en')
                hs=[b+'/'+t for b,t in (check_ro(s['ro'],w,[]) if s.get('ro') else head)];es=[b+'/'+t for b,t in ex]
                if not any(es[j:j+len(hs)]==hs for j in range(len(es)-len(hs)+1)):flags.append(f'{w} {it["th"]}: headword reading "{s.get("ro") or it.get("ro")}" not found in example reading "{e.get("ro")}"')
    ids=[i.get('id') for i in items]
    if len(ids)!=len(set(ids)):errors.append('duplicate ids')
    return items,errors,flags
if __name__=='__main__':
    batch=sys.argv[1];items,errors,flags=validate(batch)
    print(f'{len(items)} items, {sum(i.get("action")=="add" for i in items)} add, {sum(i.get("action")=="skip" for i in items)} skip')
    print(f'{len(errors)} errors');[print('  E',e) for e in errors]
    print(f'{len(flags)} flags');[print('  F',f) for f in flags]
    sys.exit(1 if errors else 0)
