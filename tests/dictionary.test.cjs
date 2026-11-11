const fs=require('fs'),vm=require('vm'),assert=require('assert');const read=n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8'));
const files={'word-bank.json':read('word-bank.json'),'slang-bank.json':read('slang-bank.json')};if(fs.existsSync('dist/word-bank-more.json'))files['word-bank-more.json']=read('word-bank-more.json');
const ctx={window:{},localStorage:{getItem:()=>null,setItem(){}},fetch:async u=>u in files?{ok:true,json:async()=>files[u]}:{ok:false},view:'home',render(){},esc:s=>String(s),icon:()=>'',toast(){},document:{getElementById:()=>null}};vm.createContext(ctx);
for(const n of ['kana-search','word-topics','word-origins','ja-readings','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext('this.t={load:loadWordBank,results:dictionaryResults,setLevel:n=>{wordState.level=n},setTopic:t=>{wordTopic=t},WEAK:DICT_WEAK}',ctx);
(async()=>{const t=ctx.t;await t.load();const ths=q=>t.results(q).map(x=>x.w.th),top=(q,n)=>ths(q).slice(0,n);
 // Exact meaning first; theme-label-only matches come after every real match.
 assert.equal(ths('家族')[0],'ครอบครัว');const fam=t.results('家族');assert(fam.findIndex(x=>x.score>=t.WEAK)>0);assert(fam.every((x,i)=>i===0||fam[i-1].score<=x.score));
 assert.deepEqual(top('食べる',3).sort(),['กิน','ทาน','รับประทาน'].sort());
 // Compounds of an exact match rank above weak matches; "contains" alone is not a compound (เกิน is not กิน).
 const eat=ths('食べる');assert(eat.includes('ของกิน')&&eat.includes('หากิน'));assert(!eat.includes('เกิน'));
 assert.equal(ths('先生')[0],'ครู');assert.equal(ths('水')[0],'น้ำ');
 // Thai script must survive normalization (NFKC splits the vowel ำ).
 assert.equal(ths('น้ำ')[0],'น้ำ');assert.equal(ths('กิน')[0],'กิน');
 // Romanization with or without tone marks, and katakana pronunciation.
 assert.equal(ths('kin')[0],'กิน');assert.equal(ths('khrɔ̂ɔp khruua')[0],'ครอบครัว');assert(top('カーオ',10).includes('ข้าว'));
 // English: exact gloss first, simple inflections, multi-word glosses; romanization homophones do not crowd out English hits.
 assert.deepEqual(top('eat',2).sort(),['กิน','ทาน'].sort());assert(top('man',3).includes('ผู้ชาย'));assert(!top('man',3).includes('มัน'));
 assert.equal(ths('eating')[0],'กิน');assert.equal(ths('cats')[0],'แมว');assert.equal(ths('thank you')[0],'ขอบคุณ');assert.equal(ths('dog')[0],'หมา');
 assert(ths('to eat').length<30,'multi-word English must not match every syllable "to"');assert(!top('go',10).includes('เงิน'));
 const hit=t.results('water').find(x=>x.w.th==='น้ำ');assert.equal(hit.via,'en');assert(hit.en.includes('water'));
 // A romanized query that is also a rare English gloss stays a romanization match first.
 assert.equal(ths('kin')[0],'กิน');assert.equal(ths('khrɔ̂ɔp')[0],'ครอบ');
 // Hiragana finds the Japanese gloss through its reading, including everyday readings the dictionaries miss.
 assert.equal(ths('あさって')[0].startsWith('มะรืน'),true);assert.equal(ths('あした')[0],'พรุ่งนี้');assert.equal(ths('かぞく')[0],'ครอบครัว');
 assert.equal(ths('たべる')[0],'กิน');assert.equal(ths('せんせい')[0],'ครู');assert(top('めがね',2).includes('แว่นตา'));assert(top('おとな',1).includes('ผู้ใหญ่'));
 // Hiragana reads as Japanese first; katakana stays a Thai-pronunciation search first.
 assert(top('かお',2).includes('หน้า'));assert(!top('カオ',3).includes('หน้า'));assert(ths('カオ').includes('หน้า'));
 // The dictionary ignores the study range and theme filters.
 t.setLevel(500);t.setTopic('food');assert.equal(ths('家族')[0],'ครอบครัว');assert(ths('ありがとう').includes('ขอบคุณ'));
 console.log('PASS: dictionary search ranks exact meanings/headwords first, then compounds, then theme-only matches; Thai, romanization, katakana, hiragana readings and English glosses; independent of study filters.')})().catch(e=>{console.error(e);process.exit(1)});
