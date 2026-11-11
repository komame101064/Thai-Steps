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
(P/'dist/ja-readings.js').write_text('// Hiragana readings of Japanese glosses for dictionary search only (SudachiPy + pykakasi + everyday readings); not shown in the app.\nconst JA_READINGS='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
print(f'{len(out)} words, {terms} kanji terms with readings')
