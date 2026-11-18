"""Build dist/ja-readings.js: hiragana readings of the Japanese glosses, so the dictionary finds
มะรืน from あさって as well as from 明後日.

Search aid only; readings are never shown. Each term of a gloss (split exactly like jaTerms() in
words-app.js) that contains kanji gets every distinct reading from SudachiPy (split mode C) and
pykakasi, plus everyday readings from IRREGULAR below, which both dictionaries miss
(明後日 → あさって, not みょうごにち).

Dev-only dependencies:  pip install sudachipy sudachidict_core pykakasi
Run after any change to word-bank*.json / slang-bank.json, before build-kana-search.py.
"""
import json,pathlib,re
from sudachipy import dictionary,tokenizer
import pykakasi
P=pathlib.Path(__file__).resolve().parents[1]
SUDACHI=dictionary.Dictionary(dict='core').create();MODE=tokenizer.Tokenizer.SplitMode.C
KAKASI=pykakasi.kakasi()
# Everyday readings (mostly jukujikun) that the dictionaries do not give, or give only in a formal reading.
IRREGULAR={
 '明後日':'あさって','一昨日':'おととい','一昨年':'おととし','明日':'あした','今日':'きょう','昨日':'きのう','今朝':'けさ','今年':'ことし',
 '一人':'ひとり','二人':'ふたり','一日':'ついたち','二日':'ふつか','二十歳':'はたち','大人':'おとな','果物':'くだもの','眼鏡':'めがね',
 '時計':'とけい','部屋':'へや','土産':'みやげ','風邪':'かぜ','下手':'へた','上手':'じょうず','梅雨':'つゆ','七夕':'たなばた','紅葉':'もみじ',
 '雪崩':'なだれ','吹雪':'ふぶき','景色':'けしき','素人':'しろうと','玄人':'くろうと','息子':'むすこ','母さん':'かあさん','父さん':'とうさん',
 '兄さん':'にいさん','姉さん':'ねえさん','叔父':'おじ','伯父':'おじ','叔母':'おば','伯母':'おば','従兄弟':'いとこ','従姉妹':'いとこ',
 '田舎':'いなか','心地':'ここち','浴衣':'ゆかた','博士':'はかせ','迷子':'まいご','為替':'かわせ','真面目':'まじめ','相撲':'すもう',
 '芝生':'しばふ','白髪':'しらが','笑顔':'えがお','八百屋':'やおや','お巡りさん':'おまわりさん','日和':'ひより','清水':'しみず',
 '五月雨':'さみだれ','二十日':'はつか','一寸':'ちょっと','仲人':'なこうど','若人':'わこうど','時雨':'しぐれ','足袋':'たび','竹刀':'しない',
 '海苔':'のり','山葵':'わさび','煙草':'たばこ','蕎麦':'そば','欠伸':'あくび','美味しい':'おいしい','可愛い':'かわいい','面白い':'おもしろい',
}
KANJI=re.compile(r'[㐀-鿿々〆ヶ]')
def ja_terms(ja):
    # Mirror of jaTerms() in dist/words-app.js; the readings array is aligned with its output.
    ja=re.sub(r'（[^）]*）|\([^)]*\)','',str(ja))
    return [t for t in (re.sub('[〜～]','',x).strip() for x in re.split(r'[・／/、，,；;]',ja)) if t]
def kata2hira(s):return ''.join(chr(ord(c)-0x60) if 'ァ'<=c<='ヶ' else c for c in s)
def sudachi(t):return kata2hira(''.join(m.reading_form() for m in SUDACHI.tokenize(t,MODE)))
def kakasi(t):return ''.join(x['hira'] for x in KAKASI.convert(t))
def readings(term):
    out=[]
    def add(r):
        r=re.sub(r'\s+','',r)
        if r and r not in out and re.fullmatch(r'[ぁ-ゖー]+',r):out.append(r)
    with_irregular=term
    for k in sorted(IRREGULAR,key=len,reverse=True):with_irregular=with_irregular.replace(k,IRREGULAR[k])
    if with_irregular!=term:add(kakasi(with_irregular))
    add(sudachi(term));add(kakasi(term))
    return out
words=[]
for n in ('word-bank.json','word-bank-more.json','slang-bank.json','slang-bank-more.json'):
    f=P/'dist'/n
    if f.exists():words+=json.loads(f.read_text())
out={};terms=0
for w in words:
    per={}
    for m in w['meanings']:
        ts=ja_terms(m['ja'])
        rs=[readings(t) if KANJI.search(t) else [] for t in ts]
        if any(rs):per[str(m['sourceSense'])]=rs;terms+=sum(bool(r) for r in rs)
    if per:out.setdefault(w['id'],{}).update(per)
# Kanji spellings of glosses written in kana (美味しい → おいしい, 沢山 → たくさん): a query typed in kanji also finds
# the kana gloss. Single words only (Sudachi normalized form), plus a few everyday alternative spellings.
ALT_KANJI={'綺麗':'きれい','奇麗':'きれい','可愛い':'かわいい','美味い':'うまい','旨い':'うまい','御免':'ごめん','有難う':'ありがとう','宜しく':'よろしく','下さい':'ください','頂く':'いただく','出来る':'できる','分かる':'わかる','解る':'わかる','判る':'わかる','御飯':'ごはん','煩い':'うるさい','五月蝿い':'うるさい','嫌い':'きらい','凄い':'すごい','素晴らしい':'すばらしい','易しい':'やさしい','優しい':'やさしい','面倒臭い':'めんどうくさい','駄目':'だめ','大丈夫':'だいじょうぶ'}
kana_terms=set()
for w in words:
    for m in w['meanings']:
        for t in ja_terms(m['ja']):
            if re.fullmatch(r'[ぁ-ゖー]+',t):kana_terms.add(t)
alias={}
for t in sorted(kana_terms):
    ms=SUDACHI.tokenize(t,MODE)
    if len(ms)==1:
        n=ms[0].normalized_form()
        if n!=t and KANJI.search(n) and len(n)>=2 and len(t)>=3 and n not in alias:alias[n]=t
for k,v in ALT_KANJI.items():
    if v in kana_terms:alias.setdefault(k,v)
# Japanese synonym groups for search (scripts/search/ja-synonyms.json, AI-made): kept when at least two members
# are gloss terms in the dictionary, so each group links real entries.
SYN=P/'scripts/search/ja-synonyms.json'
cores={re.sub(r'(?:を|に)?する$','',t) for w in words for m in w['meanings'] for t in ja_terms(m['ja'])}
synonyms=[]
for g in (json.loads(SYN.read_text()) if SYN.exists() else []):
    g=[x for x in dict.fromkeys(x.strip() for x in g) if x]
    if 2<=len(g)<=12 and sum(x in cores for x in g)>=2:synonyms.append(g)
# Slang for sexual and bodily topics (ja-synonyms-adult.json, hand-made): learners type ちんこ・おっぱい・オナニー while
# the glosses say 男性器・乳房・自慰. These groups also match glosses that contain a member (男性器を指す卑俗な語).
ADULT=P/'scripts/search/ja-synonyms-adult.json'
alltext=' '.join(m['ja'] for w in words for m in w['meanings'])
for g in (json.loads(ADULT.read_text()) if ADULT.exists() else []):
    ts=[x for x in dict.fromkeys(re.sub(r'（[^）]*）','',x).strip() for x in g['terms']) if len(x)>1]
    if any(x in alltext for x in ts):synonyms.append({'c':1,'t':ts})
(P/'dist/ja-readings.js').write_text('// Hiragana readings of Japanese glosses for dictionary search only (SudachiPy + pykakasi + everyday readings); not shown in the app.\nconst JA_READINGS='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\nconst JA_KANJI_ALIAS='+json.dumps(alias,ensure_ascii=False,separators=(',',':'))+';\nconst JA_SYNONYMS='+json.dumps(synonyms,ensure_ascii=False,separators=(',',':'))+';\n')
print(f'{len(out)} words, {terms} kanji terms with readings')
