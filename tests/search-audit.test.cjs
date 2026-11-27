// Dictionary search audit (scripts/search-audit/queries.json) in node, without a browser: a fixed subset of the audit
// queries must keep their expected headwords in the top 3, plus targeted checks for each ranking rule they pin.
const fs=require('fs'),vm=require('vm'),assert=require('assert');const read=n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8'));
const files={'word-bank.json':read('word-bank.json'),'slang-bank.json':read('slang-bank.json')};for(const n of ['word-bank-more.json','slang-bank-more.json'])if(fs.existsSync('dist/'+n))files[n]=read(n);
const ctx={window:{},localStorage:{getItem:()=>null,setItem(){}},fetch:async u=>u in files?{ok:true,json:async()=>files[u]}:{ok:false},view:'home',render(){},esc:s=>String(s),icon:()=>'',toast(){},document:{getElementById:()=>null}};vm.createContext(ctx);
for(const n of ['kana-search','word-topics','word-origins','ja-readings','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext('this.t={load:loadWordBank,results:dictionaryResults,WEAK:DICT_WEAK}',ctx);
const QUERIES=JSON.parse(fs.readFileSync('scripts/search-audit/queries.json','utf8'));
// Fixed subset: every input type, and the queries behind each rule (loose romanization, syllable-aligned prefixes,
// English vs romanization, theme labels, short katakana, long vowels, guidebook kana, hiragana as Japanese, hiragana
// prefixes, hiragana synonyms, related compounds, register, listed glosses, tie-break).
const SUBSET={
 ja:['食べる','高い','水','家','仕事','学校','寝る','見る','時間','好き','犬','先生'],
 hira:['たかい','すき','いく','くる','のむ','えき','きょう','ねこ','たべる','みず','しごと','いぬ'],
 kana:['ティー','ディー','ガイ','カイ','スワイ','スアイ','ナーム','カーオ','チョープ','ローン','ガパオ','アロイ'],
 ro:['sawasdee','sawadee','khob khun','kin','rak','ron','baan','kop kun','sawatdi','aroi','nam','khop khun khrap'],
 th:['กิน','นอน','แพง','บ้าน','ไข่','น้ำ','รัก'],
 en:['sleep','go','come','water','cat','egg','expensive','hot','like','house','eat'],
};
(async()=>{const t=ctx.t;await t.load();const cache=new Map(),res=q=>{if(!cache.has(q))cache.set(q,t.results(q));return cache.get(q)},ths=q=>res(q).map(x=>x.w.th),top=(q,n)=>ths(q).slice(0,n);
 const at=(q,th)=>ths(q).indexOf(th),above=(q,a,b)=>{const ia=at(q,a),ib=at(q,b);assert(ia>=0&&(ib<0||ia<ib),`${q}: ${a}@${ia+1} must rank above ${b}@${ib+1}`)};
 let n=0;for(const [type,qs] of Object.entries(SUBSET))for(const q of qs){const item=QUERIES.find(x=>x.q===q&&x.type===type);assert(item,'query not in queries.json: '+q);
  const t3=top(q,3);for(const th of item.expect)assert(t3.includes(th),`${type} ${q}: expected ${th} in top 3, got ${t3.join(' ')}`);for(const [a,b] of item.before||[])above(q,a,b);n++}
 assert(n>=60&&Object.keys(SUBSET).length===6);
 // C1 loose spellings: sawasdee, sawadee, khob khun.
 for(const [q,th] of [['sawasdee','สวัสดี'],['sawadee','สวัสดี'],['khob khun','ขอบคุณ']])assert.equal(ths(q)[0],th,q);
 // C2 a prefix that cuts a syllable ranks after whole-syllable prefixes but is still found (typing in progress).
 assert(!top('rak',8).includes('ราคา'));assert(!top('baan',5).includes('บาง'));assert(ths('aro').includes('อร่อย'));assert(ths('kin kh').includes('กินข้าว'));
 // C3 English does not split romanization results.
 above('kin','กินข้าว','ญาติพี่น้อง');
 // C4 theme labels only when there are almost no real matches.
 assert(res('家').length<400&&!res('家').some(x=>x.score>=t.WEAK),'家: '+res('家').length);
 // C5 short katakana queries do not list every word containing them.
 assert(res('ティー').length<500,'ティー: '+res('ティー').length);assert(!res('カイ').some(x=>x.via==='kana'&&x.score>=9));
 // C6 the long-vowel mark prefers long vowels; C7 guidebook kana (ガイ, スワイ), ティー/ディー stay apart.
 above('ナーム','น้ำ','นำ');above('チョープ','ชอบ','จบ');{const t4=top('ティー',4);assert(t4.includes('ที')&&t4.includes('ตี')&&!t4.includes('ดี'))}assert.equal(ths('ディー')[0],'ดี');
 // C8/C9 hiragana reads as Japanese first and a reading prefix does not cross into another word.
 above('すき','ชอบ','สุกี้');assert(!top('くる',3).includes('รถ'));assert(!top('ねこ',3).includes('นอน'));assert(!top('きょう',3).includes('สนใจ'));assert(ths('たべ').includes('กิน'));
 // C10 hiragana reaches the synonym groups of its kanji spelling.
 above('たかい','แพง','สูงๆ');
 // C11 compounds are promoted only when related in meaning.
 for(const [q,th] of [['寝る','แน่นอน'],['sleep','แน่นอน'],['expensive','กำแพง'],['egg','ไข่มุก'],['cat','แมวน้ำ']])assert(!top(q,8).includes(th),q+' → '+th);
 for(const [q,th] of [['sleep','ห้องนอน'],['犬','ลูกหมา'],['house','กลับบ้าน'],['eat','กินข้าว']])assert(top(q,8).includes(th),q+' → '+th);
 // C12 everyday words before slang, royal and literary ones.
 above('寝る','หลับ','มีอะไรกัน');above('go','วิ่ง','เสด็จ');assert(!top('水',3).includes('ชล'));above('sleep','หลับนอน','บรรทม');
 // C13 a noun listed before a phrase (仕事・授業などが終わる) is not a standalone meaning; C14 stable tie-break (見る → เห็น).
 above('仕事','ทำงาน','เลิก');assert(top('見る',3).includes('เห็น'));
 console.log(`PASS: search audit — ${n} audit queries keep their expected headwords in the top 3 (ja, hiragana, katakana, romanization, Thai, English), with checks for each ranking rule.`)})().catch(e=>{console.error(e);process.exit(1)});
