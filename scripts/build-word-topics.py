"""Build a thematic browsing index without changing word IDs, meanings or learning records."""
import json,re,pathlib,collections
P=pathlib.Path(__file__).resolve().parents[1]
W=json.loads((P/'dist/word-bank.json').read_text())
MORE=P/'dist/word-bank-more.json'
if MORE.exists():W+=json.loads(MORE.read_text())  # reviewed expansion entries
TOPICS=[('body','体・健康','口・手・鼻、体の部位や体調の表現'),('food','食べ物・飲み物','食材・料理・飲み物、食事の言い方'),('sports','スポーツ・運動','競技・運動、試合やトレーニング'),('animals','動物・生き物','身近な動物、鳥・魚・虫'),('nature','自然・天気','空・雨・植物、季節や自然'),('travel','旅行・交通','乗り物・移動、旅先で使う言葉'),('home','家・暮らし','部屋・家具・道具、毎日の暮らし'),('clothes','服・身だしなみ','服・靴・アクセサリー、おしゃれ'),('people','人・家族','家族・友人、人の呼び方や関係'),('feelings','気持ち・性格','感情・人柄、人との付き合い'),('work','仕事・学校','働く・学ぶ、職業や学校生活'),('shopping','お金・買い物','値段・支払い、店でのやり取り'),('leisure','趣味・娯楽','映画・音楽・ゲーム、休日の楽しみ'),('tech','スマホ・IT','スマホ・ネット、機器やアプリ'),('society','社会・文化','社会の仕組み、文化や行事'),('time','時間・日付','時刻・曜日、過去や未来'),('numbers','数字・量・比較','数・量・単位、多い・少ない'),('actions','日常の動作','する・使う・動く、基本の動詞'),('description','様子・状態','大きい・小さい、物事の状態'),('conversation','あいさつ・会話','あいさつ・返事、人に話しかける'),('grammar','文法・つなぎ言葉','助詞・疑問詞、文を組み立てる表現'),('other','その他の言葉','特定の場面に限らない言葉'),('trend','流行語・新語','SNS・AI・ネット生活など最近広まった言葉と、ある時期の流行語')]
# Curated anchors avoid confusing short body/food words with grammatical or figurative senses.
ANCHORS={
'body':'ร่างกาย ตัว หัว ศีรษะ หน้า ผม เส้นผม ตา หู จมูก ปาก ฟัน ลิ้น เหงือก ริมฝีปาก คาง แก้ม คิ้ว ขนตา หน้าผาก คอ ไหล่ แขน ข้อศอก มือ ฝ่ามือ นิ้ว นิ้วมือ นิ้วเท้า เล็บ ข้อมือ อก หน้าอก หลัง เอว ท้อง สะดือ สะโพก ก้น ขา เข่า เท้า ส้นเท้า ข้อเท้า ผิว ผิวหนัง เลือด กระดูก กล้ามเนื้อ สมอง หัวใจ ปอด ตับ ไต ลำไส้ กระเพาะ เส้นเลือด กระดูกสันหลัง น้ำตา เหงื่อ น้ำลาย หนวด เครา สุขภาพ หมอ แพทย์ พยาบาล โรงพยาบาล คลินิก ยา ยาแก้ปวด ฉีดยา ผ่าตัด รักษาโรค ป่วย โรค เจ็บ ปวด ไข้ ไอ จาม เป็นหวัด เป็นไข้ ปวดหัว ปวดท้อง ท้องเสีย เวียนหัว ไม่สบาย บาดเจ็บ แผล ตั้งท้อง ตั้งครรภ์ นวด อาบน้ำ แปรงฟัน หายใจ นอนหลับ ง่วง พักผ่อน ส่วนสูง น้ำหนัก ลดน้ำหนัก',
'food':'อาหาร กิน ทาน รับประทาน ดื่ม ข้าว น้ำ น้ำเปล่า นม ชา กาแฟ เบียร์ เหล้า ไวน์ น้ำผลไม้ น้ำอัดลม น้ำแข็ง เนื้อ หมู ไก่ เป็ด ปลา ปู กุ้ง หอย ปลาหมึก ไข่ ผัก ผลไม้ ขนม ขนมปัง เค้ก ของหวาน ของว่าง ลูกอม ไอศกรีม ชีส เนย ข้าวเหนียว ข้าวผัด ผัดไทย ก๋วยเตี๋ยว แกง ส้มตำ ต้มยำ สลัด ซุป กับข้าว ราดข้าว อาหารเช้า อาหารกลางวัน อาหารเย็น มื้อเช้า มื้อเที่ยง มื้อค่ำ ร้านอาหาร เมนู เช็คบิล หิว อิ่ม อร่อย หวาน เปรี้ยว เค็ม ขม เผ็ด จืด รส รสชาติ เกลือ น้ำตาล พริก น้ำปลา ซอส กะทิ กระเทียม เห็ด ถั่ว ส้ม กล้วย มะม่วง มะพร้าว มะนาว แตงโม สับปะรด มะละกอ ทุเรียน แอปเปิล องุ่น ย่าง ผัด ต้ม ทอด นึ่ง ชิม ริน จาน ชาม ช้อน ส้อม ตะเกียบ แก้วน้ำ มีด',
'sports':'กีฬา ฟุตบอล เทนนิส บาส บาสเกตบอล วอลเลย์บอล แบดมินตัน กอล์ฟ มวย โยคะ ปิงปอง ว่ายน้ำ วิ่ง เดินเล่น ออกกำลังกาย ลดน้ำหนัก ฝึกซ้อม แข่งขัน นักกีฬา โค้ช สนาม สนามกีฬา สระว่ายน้ำ ลู่ ชก เตะ ตีบอล ลูกบอล บอล ประตู ยิม ฟิตเนส ปั่นจักรยาน จักรยาน ปีนเขา ตกปลา',
'animals':'สัตว์ หมา สุนัข แมว ม้า วัว ควาย หมู ไก่ เป็ด ปลา ปู กุ้ง หอย นก ช้าง เสือ สิงโต ลิง งู จระเข้ เต่า กระต่าย หนู กบ แมลง ยุง มด ผึ้ง ผีเสื้อ แมลงสาบ แมงมุม ปลาหมึก สัตว์เลี้ยง เลี้ยงสัตว์',
'nature':'ฝน ฝนตก ท้องฟ้า ฟ้า แดด พระอาทิตย์ ดวงอาทิตย์ พระจันทร์ ดวงจันทร์ ดาว ลม เมฆ หิมะ พายุ อากาศ ร้อน หนาว ฤดู ฤดูกาล น้ำท่วม ทะเล แม่น้ำ ภูเขา ป่า ต้นไม้ ดอกไม้ ใบไม้ ดิน ทราย หิน หญ้า สิ่งแวดล้อม โลก ธรรมชาติ',
'clothes':'เสื้อ เสื้อผ้า เสื้อยืด เสื้อเชิ้ต กางเกง กางเกงยีนส์ กระโปรง ชุด ถุงเท้า รองเท้า หมวก เข็มขัด แว่นตา แว่นกันแดด นาฬิกา กระเป๋า สร้อย แหวน ต่างหู เครื่องประดับ แต่งตัว แต่งหน้า เครื่องสำอาง น้ำหอม ทรงผม',
'leisure':'เกม เล่นเกม เพลง ฟังเพลง ร้องเพลง ดนตรี นักร้อง นักแสดง ดารา ศิลปิน ภาพยนตร์ หนัง ดูหนัง ละคร การ์ตูน คอนเสิร์ต กล้อง ถ่ายรูป ถ่ายภาพ ศิลปะ วาดรูป งานอดิเรก ปาร์ตี้ ดูดวง',
'conversation':'สวัสดี หวัด ขอบคุณ ขอบใจ ขอโทษ ยินดีต้อนรับ ลาก่อน ยินดี สบายดี ใช่ ไม่ใช่ โอเค อรุณสวัสดิ์ ราตรีสวัสดิ์',
'grammar':'เป็น คือ มี ได้ จะ แล้ว ก็ ว่า ที่ ใน ของ ให้ กับ แต่ หรือ และ เพราะ ถ้า เมื่อ ซึ่ง โดย เพื่อ จึง ถึง จาก กว่า ไม่ อย่า ยัง นะ ครับ ค่ะ คะ สิ ล่ะ เลย เหรอ ไหม อะไร ใคร ทำไม อย่างไร ยังไง ไหน เท่าไร กี่'
}
# Misleading isolated first glosses/words are overridden where the actual source senses differ.
EXCLUDE={'body':{'ตัว','ผม','หาย','เกิด','ตาย','ลอง','แพ้','ประกัน','หวัด','เลี้ยง','รักษา'},'sports':{'ประตู'},'food':{'ใส่','หอม','สั่ง','ยำ','หมึก','กระหาย'}}
# Keywords are matched as complete English words against normal (non-slang) senses.
RULES={
'body':r'\b(?:nose|nostril|mouth|lip|tooth|teeth|tongue|ear|eyebrow|eyelash|forehead|chin|cheek|shoulder|elbow|wrist|finger|thumb|knee|ankle|heel|toe|lung|liver|kidney|stomach|intestine|spine|muscle|bone|blood|skin|brain|heart|sweat|saliva|fever|cough|sneeze|headache|diarrh|disease|illness|hospital|clinic|medicine|medical|surgery|nurse|physician|pregnan|health|injur|wound|vaccine|symptom)(?:s|es)?\b',
'food':r'\b(?:food|meal|breakfast|lunch|dinner|supper|restaurant|menu|rice|noodle|bread|cake|dessert|candy|sweet|snack|ice cream|chocolate|cheese|butter|yogurt|milk|coffee|tea|beer|wine|juice|soda|beverage|drinking water|vegetable|fruit|banana|mango|coconut|pineapple|watermelon|papaya|durian|grape|potato|tomato|cucumber|onion|garlic|ginger|chili|sugar|salt|pepper|sauce|curry|soup|salad|pork|beef|chicken|shrimp|prawn|crab|seafood|egg|sausage|flour|honey|spoon|fork|chopstick|tasty|delicious|spicy|salty|sour|bitter|hungry|cook|fry|boil|grill|steam)(?:s|es)?\b',
'sports':r'\b(?:sport|soccer|football|tennis|badminton|volleyball|basketball|golf|boxing|yoga|swimming|stadium|athlete|exercise|fitness|workout|tournament|medal|referee|goalkeeper)(?:s|es)?\b',
'animals':r'\b(?:animal|dog|cat|horse|cow|buffalo|pig|duck|chicken|bird|fish|elephant|tiger|lion|monkey|snake|crocodile|turtle|rabbit|mouse|mice|frog|insect|mosquito|ant|bee|butterfly|cockroach|spider|pet)\b',
'nature':r'\b(?:nature|weather|rain|snow|storm|wind|cloud|sun|moon|star|sky|river|mountain|forest|tree|flower|leaf|leaves|plant|soil|sand|stone|grass|ocean|sea|earthquake|flood|environment)\b',
'clothes':r'\b(?:clothes|clothing|shirt|t-shirt|trousers|pants|jeans|skirt|socks|shoe|hat|cap|belt|sunglasses|necklace|bracelet|earrings|jewel|cosmetics|makeup|perfume|fashion|hairstyle)\b',
'leisure':r'\b(?:music|song|singer|musician|concert|movie|cinema|film|drama|cartoon|comic|hobby|photograph|camera|guitar|piano|art|artist|actor|actress|game|party|festival)\b',
'people':r'\b(?:family|father|mother|parent|brother|sister|grandfather|grandmother|grandparent|uncle|aunt|nephew|niece|cousin|husband|wife|son|daughter|friend|neighbor|boyfriend|girlfriend|baby|child|children|adult|relative|person|people|man|woman|boy|girl)\b',
'work':r'\b(?:job|occupation|profession|office|company|factory|employee|employer|salary|boss|colleague|meeting|manager|engineer|technician|teacher|student|school|university|classroom|homework|exam|lesson|textbook|education|research|study|learn|teach|graduate)(?:s|es)?\b',
'shopping':r'\b(?:money|price|cost|pay|payment|cash|coin|banknote|baht|discount|purchase|shopping|customer|shop|market|store|buy|sell|cheap|expensive|receipt|invoice|debt|loan|tax|bank account|credit card)(?:s|es)?\b',
'travel':r'\b(?:travel|tourism|tourist|passport|visa|hotel|airport|airplane|flight|ticket|taxi|bus|train|station|railway|bicycle|motorcycle|vehicle|traffic|road|street|transport|luggage|journey|trip|boat|ship|port|bridge|map|direction)\b',
'home':r'\b(?:house|home|room|bedroom|bathroom|kitchen|living room|toilet|furniture|table|chair|sofa|bed|pillow|blanket|curtain|door|window|floor|ceiling|roof|wall|lamp|light bulb|refrigerator|washing machine|towel|soap|shampoo|toothbrush|toothpaste|broom|laundry|cleaning|utensil)\b',
'feelings':r'\b(?:feeling|emotion|happy|sad|angry|lonely|bored|worry|anxious|afraid|fear|love|hate|jealous|shy|embarrassed|proud|disappointed|excited|kind|patient|honest|generous|selfish|lazy|rude|polite|personality)\b',
'tech':r'\b(?:computer|internet|website|email|e-mail|smartphone|mobile phone|telephone|app|application|software|hardware|keyboard|mouse \(computer\)|screen|password|download|upload|online|digital|battery|charger|headphones|microphone|printer|network)\b',
'society':r'\b(?:government|politics|political|minister|parliament|election|law|legal|court|judge|police|crime|criminal|military|soldier|democracy|citizen|country|nation|religion|Buddhis|temple|monk|culture|tradition|ceremony)(?:s|es)?\b',
'time':r'\b(?:time|hour|minute|second \(time\)|day|week|month|year|today|yesterday|tomorrow|morning|afternoon|evening|night|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|calendar|date \(calendar\))\b',
'numbers':r'\b(?:number|quantity|amount|percent|percentage|kilogram|kilometer|centimeter|meter|liter|dozen|hundred|thousand|million|billion)\b'
}
oldmap={'日常の動作':'actions','性質・状態':'description','人・家族':'people','時間':'time','数字':'numbers','数え方':'numbers','量・程度・比較':'numbers','お金・買い物':'shopping','仕事・学習':'work','家・場所':'home','移動・道案内':'travel','社会・制度':'society','接続表現':'grammar','場所・前置詞':'grammar','文法・時制':'grammar','代名詞・呼びかけ':'grammar','指示表現':'grammar','助詞・語気':'grammar','疑問詞':'grammar','否定':'grammar','挨拶・会話':'conversation'}
INDEX={}
for w in W:
 normal=[m for m in w['meanings'] if not m.get('isSlang')]
 if not normal:continue
 # Include common senses, excluding rare and figurative English labels from automatic topic matching.
 en='; '.join(m['en'] for m in normal if m['use']!='少なめの用法')
 en=re.sub(r'[^;]*\((?:figurative|slang|idiom)[^;]*','',en,flags=re.I)
 topics=[]
 for t,terms in ANCHORS.items():
  if w['th'] in terms.split() and w['th'] not in EXCLUDE.get(t,set()):topics.append(t)
 for t,pattern in RULES.items():
  if normal[0]['pos'] in ['助詞','接続詞','代名詞','前置詞','接頭辞','限定詞','類別詞']:continue
  if t not in topics and re.search(pattern,en,re.I) and w['th'] not in EXCLUDE.get(t,set()):topics.append(t)
 if not topics:topics=[oldmap.get(w['category'],'actions' if normal[0]['pos']=='動詞' else 'description' if normal[0]['pos']=='形容詞・状態語' else 'grammar' if normal[0]['pos'] in ['助詞','接続詞','代名詞','前置詞','接頭辞','限定詞','類別詞'] else 'other')]
 INDEX[w['id']]=topics
# Explicit reviewed exceptions to keyword collisions. Meanings are untouched.
overrides={'กีฬา':['sports'],'วิ่ง':['sports','actions'],'ว่ายน้ำ':['sports','actions'],'เทนนิส':['sports'],'ฟุตบอล':['sports'],'ประตู':['home','sports'],'ฤดูกาล':['nature','sports'],'ขน':['actions'],'หมึก':['other'],'ผม':['grammar','body'],'ตัว':['grammar','body'],'หวัด':['conversation'],'เกิด':['actions'],'ลอง':['actions'],'ใส่':['actions'],'แพ้':['sports','body'],'หาย':['actions'],'เลี้ยง':['actions'],'ภาพ':['leisure'],'วันเกิด':['time','people'],'กิจกรรม':['leisure'],'เที่ยว':['travel','leisure'],'สี':['description'],'เกม':['leisure'],'คอมพิวเตอร์':['tech'],'โทรศัพท์':['tech'],'โทรศัพท์มือถือ':['tech'],'แอพ':['tech'],'แอป':['tech'],'กระเป๋า':['clothes','travel'],'จักรยาน':['travel','sports'],'สนาม':['sports'],'ชก':['sports','actions'],'ขม':['food'],'หวาน':['food'],'เปรี้ยว':['food'],'ผัด':['food','actions'],'อาหาร':['food'],'ไอ':['body'],'ยำ':['food'],'ตา':['body','people'],'ท้อง':['body'],'กระหาย':['description'],'ถ่าย':['leisure','actions'],'รักษา':['actions','body'],'สมุด':['work'],'โจทย์':['work'],'ปากซอย':['travel'],'คำ':['grammar'],'ดวง':['numbers'],'ซี่':['numbers'],'ใจกลาง':['description'],'ใจ':['feelings'],'จิตใจ':['feelings'],'ความในใจ':['feelings'],'อกหัก':['feelings'],'ปวดใจ':['feelings'],'พระทัย':['feelings'],'ดวงใจ':['feelings','people'],'ใจอ่อน':['feelings'],'ถอดใจ':['feelings'],'ชื่นใจ':['feelings'],'จับใจ':['feelings'],'คาบ':['time','work'],'ครรภ์':['body'],'หนาม':['nature'],'ระดม':['actions'],'ขนาน':['actions'],'สลาย':['actions'],'ก่อนกำหนด':['time'],'พอง':['description'],'ขั้วโลก':['nature'],'แผ่นดิน':['nature'],'แผ่นดินไหว':['nature'],'หูฟัง':['tech'],'ต่างหู':['clothes'],'สยอง':['feelings'],'ปั่นป่วน':['description'],'ท่วม':['nature'],'ผลัด':['time','actions'],'เล่นงาน':['actions'],'ภาวนา':['society'],'หมดตัว':['shopping'],'พิชิต':['actions'],'แหลก':['description'],'ก่อนหน้านี้':['time'],'ก่อนหน้า':['time'],'ก่อน':['time','grammar'],'ทาน':['food'],'ป้อน':['food','actions'],'ขาว':['description'],'เร็ว':['description'],'เช้า':['time'],'เมื่อเช้า':['time'],'แต่เช้า':['time'],'เฮีย':['people'],'หุบปาก':['conversation'],'โรคจิต':['feelings'],'แบกรับ':['actions'],'ปิดปาก':['actions'],'กรอก':['actions'],'ท้อ':['feelings'],'ลูก':['people','numbers'],'คัน':['numbers'],'จ๊ะจ๋า':['conversation','feelings'],'ไพเราะ':['leisure','description'],'อ่อนหวาน':['feelings'],'น่ารักๆ':['feelings','description'],'หากิน':['work','actions'],'รีด':['clothes','actions'],'หยอด':['actions'],'กลิ่นหอม':['description'],'ฟอง':['description','numbers']}
for w in W:
 if w['id'] in INDEX and w['th'] in overrides:INDEX[w['id']]=overrides[w['th']]
# Match a topic to its actual senses so hair/eye/door do not become pronoun/relative/door questions in the wrong topic.
SENSES={}
extra_body=r'\b(?:hair|face|hand|arm|leg|foot|feet|head|back|body|mouth|eye|breath)\b'
for w in W:
 if w['id'] not in INDEX:continue
 normal=[m for m in w['meanings'] if not m.get('isSlang')]
 per={}
 for topic in INDEX[w['id']]:
  pattern=RULES.get(topic,'')
  if topic=='body':pattern='(?:'+pattern+')|(?:'+extra_body+')'
  matched=[m['sourceSense'] for m in normal if pattern and re.search(pattern,m['en'],re.I)]
  per[topic]=matched or [normal[0]['sourceSense']]
 SENSES[w['id']]=per
# Reviewed sense-level additions (scripts/topic-review/additions.json): basic words of a theme that the
# keyword rules miss or that sit in another displayed category (勝つ・投げる・打つ in sports). Each entry was
# found by a broad keyword pass or listed as missing, then kept by a reviewer for that exact sense.
REVIEW=P/'scripts/topic-review/additions.json'
if REVIEW.exists():
 BYW={w['id']:w for w in W};added=0
 for e in json.loads(REVIEW.read_text()):
  w=BYW.get(e['id']);assert w and w['th']==e['th'],e;assert e['theme'] in {t[0] for t in TOPICS},e
  m=next((m for m in w['meanings'] if m['sourceSense']==e['sense'] and not m.get('isSlang')),None);assert m,e
  ts=INDEX.setdefault(w['id'],[])
  if e['theme'] not in ts:
   if 'other' in ts:ts.remove('other');SENSES.get(w['id'],{}).pop('other',None)
   ts.append(e['theme']);added+=1
  per=SENSES.setdefault(w['id'],{}).setdefault(e['theme'],[])
  if e['sense'] not in per:per.append(e['sense'])
 print('reviewed additions',added)
# 流行語・新語: curated list (scripts/word-trends.json), added on top of each word's other themes.
SLANG=json.loads((P/'dist/slang-bank.json').read_text())
if (P/'dist/slang-bank-more.json').exists():SLANG+=json.loads((P/'dist/slang-bank-more.json').read_text())
BY={w['id']:w for w in W+SLANG};TRENDS={}
for e in json.loads((P/'scripts/word-trends.json').read_text()):
 w=BY[e['id']];assert w['th']==e['th'],e;assert e['kind'] in ('新語','流行語'),e
 own={m['sourceSense'] for m in w['meanings']};assert e['senses'] and set(e['senses'])<=own,e
 TRENDS[e['id']]={'kind':e['kind'],'era':e.get('era',''),'senses':e['senses']}
 if w.get('collection')!='slang':
  normal={m['sourceSense'] for m in w['meanings'] if not m.get('isSlang')};assert set(e['senses'])<=normal,e
  INDEX[e['id']]=[t for t in INDEX[e['id']] if t!='other']+['trend'];SENSES[e['id']]['trend']=e['senses']
  SENSES[e['id']].pop('other',None)
assert len(INDEX)==sum(any(not m.get('isSlang') for m in w['meanings']) for w in W),len(INDEX)
assert all(t in {t[0] for t in TOPICS} for ts in INDEX.values() for t in ts)
(P/'dist/word-topics.js').write_text('// Thematic browsing index; multiple common senses may belong to more than one topic.\nconst WORD_TOPICS='+json.dumps([{'id':t,'label':label,'description':desc} for t,label,desc in TOPICS],ensure_ascii=False,separators=(',',':'))+';\nconst WORD_TOPIC_INDEX='+json.dumps(INDEX,ensure_ascii=False,separators=(',',':'))+';\nconst WORD_TOPIC_SENSES='+json.dumps(SENSES,ensure_ascii=False,separators=(',',':'))+';\nconst WORD_TRENDS='+json.dumps(TRENDS,ensure_ascii=False,separators=(',',':'))+';\n')
print('trends',len(TRENDS))
for t,label,_ in TOPICS:
 print(label,sum(t in ts for ts in INDEX.values()))
