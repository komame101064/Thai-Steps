"""Apply traceable sense corrections; validate retained IDs and audit every entry."""
import json,re,pathlib,collections
P=pathlib.Path(__file__).resolve().parents[1]
p=P/'dist/word-bank.json'; words=json.loads(p.read_text()); edits=json.loads((P/'scripts/review-overrides.json').read_text()); by={w['id']:w for w in words}
changed=0
for id,e in edits.items():
 w=by[id]; assert w['th']==e['th']
 for n,patch in e['senses'].items():
  sense=next(s for s in w['meanings'] if s['sourceSense']==int(n));assert sense['en']==patch['en'],(id,n,'upstream sense changed')
  if sense['ja']!=patch['ja']:changed+=1
  sense.update({k:patch[k] for k in ('ja','pos','note') if k in patch},checked=True,reviewed='2026-11-10')
# Sense-specific parts of speech govern the default badge and sorting.
for w in words:
 w['pos']=w['meanings'][0]['pos']
 for s in w['meanings']:
  s['ja']=s['ja'].strip().strip('・,、。;；').strip()
  assert s['ja'] and not re.search(r'準備中|[ก-๛]',s['ja']),(w['th'],s['ja'])
 assert 1<=w['frequency']<=10 and w['ro'] and not re.search('[ก-๛]',w['ro'])
 for kind,ids in w['relations'].items():
  assert len(ids)==len(set(ids)) and all(id in by and id!=w['id'] for id in ids)
assert len(words)==5000 and len(by)==5000 and len(set(w['th'] for w in words))==5000
# Keep explicit coverage: a vocabulary-wide structural audit is not linguistic verification.
report={'date':'2026-11-10','entries':len(words),'meanings':sum(len(w['meanings']) for w in words),'senseCorrectionsReviewed':sum(len(e['senses']) for e in edits.values()),'headwordsWithCorrections':len(edits),'primaryChecked':sum(w['meanings'][0]['checked'] for w in words),'referenceMeanings':sum(not s['checked'] for w in words for s in w['meanings']),'coverage':'全件の形式・参照整合性を点検。日本語語義の個別見直しは記載の範囲。全語の辞書照合・ネイティブ校閲は未完了。','checks':['5000の固有見出し・ID','読み・訳・品詞・分類・頻度の欠損','語義番号と修正対象英語語義の一致','対義語・類義語の参照先・重複・自己参照','参考訳をテスト対象から除外']}
p.write_text(json.dumps(words,ensure_ascii=False,separators=(',',':')))
(P/'dist/vocabulary-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(dict(changed=changed,**report),ensure_ascii=False))
