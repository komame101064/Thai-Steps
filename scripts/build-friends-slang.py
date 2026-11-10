import pathlib,json,csv,collections
P=pathlib.Path(__file__).resolve().parents[1];D=pathlib.Path('/workspace/data');core=json.load(open(P/'dist/word-bank.json'));examples=json.load(open(P/'dist/sense-examples.json'));senses={(r['id'],int(r['n'])):r for r in csv.DictReader(open(D/'senses.tsv'),delimiter='\t')}
styles={'casual':'口語','slang':'口語・スラング','net':'ネット表記','rough':'粗い口語','adult':'口語・性的な話題','adultRough':'かなり粗い・性的な俗語','neutralAdult':'標準語・性的な話題','casualAdult':'口語・性的な話題'}
def style(tags):
 for t,label in [('vulgar','粗い口語'),('slang','口語・スラング'),('colloquial','口語'),('royal','王室の敬語'),('archaic','古語'),('dated','古めの表現'),('literary','文語'),('formal','改まった表現')]:
  if t in tags:return label
 return '標準語（口語限定ではない）'
for w in core:
 for m in w['meanings']:
  tags=senses[w['id'],m['sourceSense']]['tags'].split('|');m['registerTags']=[t for t in tags if t];m['isSlang']=any(t in tags for t in ['slang','vulgar']);m['speechStyle']=style(tags)
 w['speechStyle']=w['meanings'][0]['speechStyle'];w['generalHidden']=all(m['isSlang'] for m in w['meanings'])
# Sentence labels are about the sentence, separately from the headword.
source={r['example_id']:r for r in json.load(open(D/'chosen-examples.json'))};byth={w['th']:w for w in core}
for key,e in examples.items():
 row=source.get(e['sourceExample']);tags=set()
 if row:
  for token in row['tokens'].split('|'):
   if token in byth:tags.update(byth[token]['meanings'][0]['registerTags'])
 if 'vulgar' in tags:e['speechStyle']='粗い口語'
 elif 'slang' in tags:e['speechStyle']='口語・スラング'
 elif any(t in e['th'] for t in ['ครับ','ค่ะ','คะ']):e['speechStyle']='丁寧な会話文'
 elif 'colloquial' in tags:e['speechStyle']='口語'
 else:e['speechStyle']='標準的な用例文'
rowfile=P/'scripts/friends-slang.tsv'
rows=[l.rstrip('\n').split('\t') for l in rowfile.read_text().splitlines()] if rowfile.exists() else [l.strip().split('|') for l in open(D/'friends-slang.txt')];assert all(len(r)==10 for r in rows)
# Keep authored source in the repository, not just generated files.
(P/'scripts/friends-slang.tsv').write_text('\n'.join('\t'.join(r) for r in rows)+'\n')
extra=[];extraex={};curatedforms=set();idbyth={}
noun={'กู','มึง','กิ๊ก','คนคุย','คู่จิ้น','ติ่ง','สายเปย์','สายตี้','ควย','หี','หำ','จู๋','จิ๋ม','ตูด','รูตูด','นม','ไข่','เซ็กซ์','วันไนต์สแตนด์','เพื่อนนอน','ถุงยาง'}
for i,(th,ro,freq,group,reg,ja,note,eth,ero,eja) in enumerate(rows,10001):
 id=f'tl-{i}';curatedforms.add(th);idbyth[th]=id;adult=group=='下ネタ';label=styles[reg];pos='名詞' if th in noun else '定型表現';
 if th in ['กู','มึง']:pos='代名詞'
 elif th in ['วะ','ว่ะ','เว้ย','ค้าบ','น้า']:pos='助詞'
 elif th in ['เออ','เฮ้ย','555','อิอิ','จริงดิ','เอาจริงดิ']:pos='間投詞'
 elif th in ['ชิล','เจ๋ง','โคตร','เซ็ง','นอยด์','เฟล','หัวร้อน','หมดไฟ','ซวย','ถังแตก','ปัง','เริ่ด','จึ้ง','ฟิน','แซ่บ','เวอร์','พีค','แป้ก','เด็ด','แจ่ม','เฟี้ยว','กาก','ห่วย','ห่วยแตก','หื่น','เงี่ยน','ทะลึ่ง','ลามก','เสียว','มีอารมณ์','เซ็กซี่','กรึ่ม','เมาค้าง']:pos='形容詞・状態語'
 elif th in ['เปย์','มโน','เม้าท์','เผือก','ส่อง','เล่นใหญ่','ปั่น','ขิง','แซว','แซะ','อิน','จิ้น','มูฟออน','เท','โดนเท','นก','แห้ว','อ่อย','คลั่งรัก','ติดแฟน','ตี้','ชนแก้ว','หมดแก้ว','เบี้ยว','เนียน','จอย','เสร็จ','แตก','ชักว่าว','ช่วยตัวเอง','เย็ด','ปี้','เอากัน','ได้กัน','นอนด้วยกัน','ฟัน']:pos='動詞'
 m={'ja':ja,'en':'','pos':pos,'use':'この学習欄で扱う意味','checked':True,'sourceSense':1,'speechStyle':label,'note':note,'isSlang':True}
 w={'id':id,'th':th,'ro':ro,'frequency':int(freq),'frequencyEstimated':True,'frequencyBasis':'editorial','corpusRank':100000+i,'pos':pos,'category':'スラング｜'+group,'meanings':[m],'relations':{},'relationDetails':{},'tags':['colloquial']+(['vulgar'] if reg in ['rough','adultRough'] else ['slang'] if reg in ['slang','net'] else []),'kind':'expression','bucket':5000,'collection':'slang','speechStyle':label,'adult':adult,'editorial':True}
 e={'th':eth,'ro':ero,'ja':eja,'en':'','checked':True,'sourceExample':f'thai-steps-{i}','speechStyle':label}
 if th=='555':w['speechText']='ฮ่า ฮ่า ฮ่า';e['speechText']='โอเค ฮ่า ฮ่า ฮ่า'
 extra.append(w);extraex[id+'#1']=e
# Existing slang senses also get their own entries; literal meanings stay in the general deck.
for i,w in enumerate(core,20001):
 ms=[m for m in w['meanings'] if m['isSlang']]
 if not ms or w['th'] in curatedforms:continue
 id=f'tl-{i}';new={**w,'id':id,'meanings':ms,'collection':'slang','sourceWord':w['id'],'category':'スラング｜粗い言葉' if any('vulgar' in m['registerTags'] for m in ms) else 'スラング｜一般','speechStyle':ms[0]['speechStyle'],'relations':{},'relationDetails':{}}
 for m in ms:
  # Existing translations remain explicitly marked when not reviewed.
  m.setdefault('note','元データにスラング・粗い用法として収録。親しさや場面によって響きが変わります。')
  e={**examples[w['id']+'#'+str(m['sourceSense'])],'speechStyle':m['speechStyle']};extraex[id+'#'+str(m['sourceSense'])]=e
 extra.append(new)
# Closely related expressions, never presented as universal replacements.
pairs=[('เจ๋ง','ปัง'),('ได้ปะ','โอเคปะ'),('ว่างปะ','ได้ปะ'),('แป๊บนึง','แป๊บนะ'),('ห่วย','ห่วยแตก'),('นก','แห้ว'),('เท','โดนเท'),('กิ๊ก','คนคุย'),('อ่อย','แซว'),('หื่น','ทะลึ่ง'),('ชักว่าว','ช่วยตัวเอง'),('เอากัน','ได้กัน'),('เซ็กซ์','เย็ด'),('ควย','จู๋'),('หี','จิ๋ม'),('ตี้','สายตี้'),('เปย์','สายเปย์')]
byid={w['id']:w for w in extra}
for a,b in pairs:
 for x,y in [(a,b),(b,a)]:
  if x in idbyth and y in idbyth:byid[idbyth[x]]['relations'].setdefault('related',[]).append(idbyth[y])
for w in extra:
 base=byth.get(w['th'])
 if base and any(not m['isSlang'] for m in base['meanings']):w['relations'].setdefault('related',[]).append(base['id'])
reviewPath=P/'scripts/legacy-slang-reviewed.tsv'
if not reviewPath.exists():reviewPath.write_text((D/'auto-slang-review.txt').read_text().replace('|','\t'))
reviews=dict(l.rstrip('\n').split('\t',1) for l in reviewPath.read_text().splitlines())
for w in extra:
 if w.get('editorial'):continue
 w['frequency']=min(7,w['frequency']);w['frequencyEstimated']=True;w['frequencyBasis']='editorial'
 if w['th'] in ['น้ำ','หอย','รุก']:w['frequency']=5
 if w['th'] in ['มืด','ปัญญาอ่อน','ตัวเมีย']:w['frequency']=2
 if w['th'] in ['เก็บ','ผง']:w['frequency']=4
 vals=reviews[w['th']].split(';');assert len(vals)==len(w['meanings']),(w['th'],vals)
 for m,ja in zip(w['meanings'],vals):m['ja']=ja;m['checked']=True
 w['pos']=w['meanings'][0]['pos']
 if w['th'] in ['น้ำ','หอย','รุก']:
  w['category']='スラング｜下ネタ';w['adult']=True;w['speechStyle']='口語・性的な話題'
  for m in w['meanings']:m['speechStyle']=w['speechStyle'];extraex[w['id']+'#'+str(m['sourceSense'])]['speechStyle']=w['speechStyle']
 if w['th'] in ['มืด','ปัญญาอ่อน','ตัวเมีย']:
  w['speechStyle']='差別的な罵り（理解用）';w['category']='スラング｜差別的表現'
  for m in w['meanings']:m['note']='差別や侮蔑につながる呼び方です。意味を理解するために収録し、友達への気軽な呼び方としては扱いません。';m['speechStyle']=w['speechStyle']
 if w['th']=='มืด':
  w['th']='ไอ้มืด';w['ro']='âi mʉ̂ʉt'
  for m in w['meanings']:extraex[w['id']+'#'+str(m['sourceSense'])]={'th':'ไอ้มืดเป็นคำเหยียดผิว','ro':'âi mʉ̂ʉt pen kham yìiat phǐu','ja':'「アイムート」は人種差別的な呼び方です。','en':'','checked':True,'sourceExample':'thai-steps-usage-note','speechStyle':'差別語について説明する文'}
 if w['th']=='ตัวเมีย':w['th']='หน้าตัวเมีย';w['ro']='nâa tua miia'
(P/'dist/word-bank.json').write_text(json.dumps(core,ensure_ascii=False,separators=(',',':')))
(P/'dist/sense-examples.json').write_text(json.dumps(examples,ensure_ascii=False,separators=(',',':')))
reviewed_words=P/'scripts/slang-word-review.json'
if reviewed_words.exists():
 word_overrides=json.loads(reviewed_words.read_text())
 extra=[word_overrides.get(w['id'],w) for w in extra]
(P/'dist/slang-bank.json').write_text(json.dumps(extra,ensure_ascii=False,separators=(',',':')))
reviewed_examples=P/'scripts/slang-example-review.json'
if reviewed_examples.exists():
 overrides=json.loads(reviewed_examples.read_text())
 assert set(overrides)==set(extraex), 'Reviewed slang example keys changed; review new/removed senses first'
 extraex.update(overrides)
(P/'dist/slang-examples.json').write_text(json.dumps(extraex,ensure_ascii=False,separators=(',',':')))
print('curated',len(rows),'all slang entries',len(extra),'slang examples',len(extraex),'adult curated',sum(w.get('adult',False) for w in extra),'core entirely separated',sum(w['generalHidden'] for w in core))
