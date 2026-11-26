const fs=require('fs'),vm=require('vm'),assert=require('assert');const read=n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8'));
const files={'word-bank.json':read('word-bank.json'),'slang-bank.json':read('slang-bank.json')};for(const n of ['word-bank-more.json','slang-bank-more.json'])if(fs.existsSync('dist/'+n))files[n]=read(n);
const ctx={window:{},localStorage:{getItem:()=>null,setItem(){}},fetch:async u=>u in files?{ok:true,json:async()=>files[u]}:{ok:false},view:'home',render(){},esc:s=>String(s),icon:()=>'',toast(){},document:{getElementById:()=>null}};vm.createContext(ctx);
for(const n of ['kana-search','word-topics','word-origins','ja-readings','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext('this.t={load:loadWordBank,results:dictionaryResults,setLevel:n=>{wordState.level=n},setTopic:t=>{wordTopic=t},WEAK:DICT_WEAK}',ctx);
(async()=>{const t=ctx.t;await t.load();const ths=q=>t.results(q).map(x=>x.w.th),top=(q,n)=>ths(q).slice(0,n);
 // Exact meaning first; theme-label-only matches come after every real match.
 assert.equal(ths('家族')[0],'ครอบครัว');const fam=t.results('家族');assert(fam.findIndex(x=>x.score>=t.WEAK)>0);{const g=x=>x.score>=t.WEAK?3:x.score>12?2:x.via==='similar'?1:0;assert(fam.every((x,i)=>i===0||g(fam[i-1])<=g(x)))}
 assert.deepEqual(top('食べる',3).sort(),['กิน','ทาน','รับประทาน'].sort());
 // Compounds of an exact match rank above weak matches; "contains" alone is not a compound (เกิน is not กิน).
 const eat=ths('食べる');assert(eat.includes('ของกิน')&&eat.includes('หากิน'));assert(!eat.includes('เกิน'));
 // The thing itself (警察官・警察署・日本人・日本語) ranks above glosses that only use the query in a phrase (警察に届け出る).
 assert.deepEqual(top('警察',3).sort(),['ตำรวจ','โรงพัก','สถานีตำรวจ'].sort());assert.equal(ths('警察')[0],'ตำรวจ');assert.deepEqual(top('日本',3).sort(),['ญี่ปุ่น','คนญี่ปุ่น','ภาษาญี่ปุ่น'].sort());
 // Word-for-word combinations in WORD_DROP (เรียกตำรวจ 警察を呼んで) are not in the dictionary.
 assert(!ths('警察').includes('เรียกตำรวจ'));assert(!ths('เรียกตำรวจ').includes('เรียกตำรวจ'));
 assert.equal(ths('先生')[0],'ครู');assert.equal(ths('水')[0],'น้ำ');
 // Thai script must survive normalization (NFKC splits the vowel ำ).
 assert.equal(ths('น้ำ')[0],'น้ำ');assert.equal(ths('กิน')[0],'กิน');
 // Romanization with or without tone marks, and katakana pronunciation.
 assert.equal(ths('kin')[0],'กิน');assert.equal(ths('khrɔ̂ɔp khruua')[0],'ครอบครัว');assert(top('カーオ',10).includes('ข้าว'));
 // English: exact gloss first, simple inflections, multi-word glosses; romanization homophones do not crowd out English hits.
 assert.deepEqual(top('eat',2).sort(),['กิน','ทาน'].sort());assert(top('man',3).includes('ผู้ชาย'));assert(!top('man',3).includes('มัน'));
 assert.equal(ths('eating')[0],'กิน');assert.equal(ths('cats')[0],'แมว');assert.equal(ths('thank you')[0],'ขอบคุณ');assert.equal(ths('dog')[0],'หมา');
 assert(ths('to eat').length<150,'multi-word English must not match every syllable "to"');assert(!top('go',10).includes('เงิน'));
 const hit=t.results('water').find(x=>x.w.th==='น้ำ');assert.equal(hit.via,'en');assert(hit.en.includes('water'));
 // A romanized query that is also a rare English gloss stays a romanization match first.
 assert.equal(ths('kin')[0],'กิน');assert.equal(ths('khrɔ̂ɔp')[0],'ครอบ');
 // Hiragana finds the Japanese gloss through its reading, including everyday readings the dictionaries miss.
 assert.equal(ths('あさって')[0].startsWith('มะรืน'),true);assert.equal(ths('あした')[0],'พรุ่งนี้');assert.equal(ths('かぞく')[0],'ครอบครัว');
 assert.equal(ths('たべる')[0],'กิน');assert.equal(ths('せんせい')[0],'ครู');assert(top('めがね',2).includes('แว่นตา'));assert(top('おとな',1).includes('ผู้ใหญ่'));
 // Hiragana reads as Japanese first; katakana stays a Thai-pronunciation search first.
 assert(top('かお',2).includes('หน้า'));assert(!top('カオ',3).includes('หน้า'));assert(ths('カオ').includes('หน้า'));
 // Kana matches respect mora boundaries: きゅうり must not match the reading of 給料 (きゅうりょう).
 assert(!ths('きゅうり').includes('เงินเดือน'));assert(!ths('キュウリ').includes('เงินเดือน'));
 // Neutral and slang ways to say 童貞 are both found.
 assert(ths('童貞').includes('ซิง'));assert(ths('童貞').includes('ไม่เคยผ่านผู้หญิง'));
 // Compounds are pulled in only by a first-sense exact hit on a general word: 精液 matches the slang sense of น้ำ,
 // which must not bring in อาบน้ำ, แม่น้ำ and other น้ำ compounds.
 assert(!ths('精液').some(th=>th!=='น้ำ'&&th.startsWith('น้ำ')||/น้ำ$/.test(th)&&th!=='น้ำ'),'no น้ำ compounds for 精液');assert(ths('精液').includes('อสุจิ'));
 // Glosses ending in ？ are found by the gloss itself; one kana left after punctuation does not match everything.
 assert(top('ん？',3).includes('หืม'));assert(ths('ん？').length<20);
 // The dictionary ignores the study range and theme filters.
 t.setLevel(300);t.setTopic('food');assert.equal(ths('家族')[0],'ครอบครัว');assert(ths('ありがとう').includes('ขอบคุณ'));
 // Same-meaning words: a partial query (性行) also lists words glossed セックス・性交・エッチ under 似た意味の語; an exact
 // synonym (スマホ → 携帯電話) ranks with exact matches; a kanji spelling finds a kana gloss (美味しい → おいしい).
 {const r=t.results('性行'),th=r.map(x=>x.w.th);assert(th.includes('ปี้')&&th.includes('เย็ด')&&th.includes('อึ๊บ'));assert(r.filter(x=>x.via==='similar').every(x=>x.score>8&&x.score<t.WEAK));
  assert(top('スマホ',5).includes('มือถือ'));assert(top('美味しい',3).includes('อร่อย'));assert(top('エッチ',6).includes('เซ็กซ์'));assert(ths('to eat').length<150)}
 // Sexual and bodily slang typed by learners reaches the glosses (ちんこ → 男性器を指す卑俗な語, おっぱい → 乳房).
 {for(const [q,th] of [['ちんこ','ควย'],['まんこ','หี'],['おっぱい','นม'],['オナニー','ช่วยตัวเอง'],['うんこ','ขี้'],['AV','หนังโป๊'],['ラブホ','ม่านรูด']])assert(top(q,8).includes(th),q+' → '+th);
  assert(!top('エロ',8).includes('ใบเหลือง'),'エロ is not イエロー');assert(!top('ちんこ',6).includes('หนังสติ๊ก'),'ちんこ is not パチンコ')}
 // Loose spellings typed without the romanization system, and one row per word (no general + slang twin).
 {assert.equal(ths('kop kun')[0],'ขอบคุณ');assert(top('sawatdi',3).includes('สวัสดี'));assert.equal(ths('aroi')[0],'อร่อย');const r=ths('食べる');assert.equal(r.filter(x=>x==='แดก').length,1,'แดก listed once')}
 // Katakana typed exactly beats a match that only works with voicing folded (ティー → ที・ตี, not ดี ディー first).
 {const t=top('ティー',4);assert(t.includes('ที')&&t.includes('ตี')&&!t.includes('ดี'),'ティー: '+t);assert.equal(ths('ディー')[0],'ดี')}
 console.log('PASS: dictionary search ranks exact meanings/headwords first, then compounds, then theme-only matches; Thai, romanization, katakana, hiragana readings and English glosses; independent of study filters.')})().catch(e=>{console.error(e);process.exit(1)});
