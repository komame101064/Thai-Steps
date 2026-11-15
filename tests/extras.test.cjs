// 番外編: Thai number readings (เอ็ด / ยี่สิบ rules, หมื่น・แสน・ล้าน) and the two chapters render.
const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={icon:()=>'',shuffle:a=>[...a],course:()=>''};vm.createContext(c);
vm.runInContext(fs.readFileSync('dist/extras.js','utf8')+';this.t={thaiNumber,EXTRAS,extraView,toneOf,TONE_POOL,setId:i=>extraId=i,setFrom:f=>extraFrom=f}',c);const t=c.t;
for(const [n,th,ro] of [[0,'ศูนย์','sǔun'],[11,'สิบเอ็ด','sìp èt'],[20,'ยี่สิบ','yîi sìp'],[21,'ยี่สิบเอ็ด','yîi sìp èt'],[101,'หนึ่งร้อยเอ็ด','nʉ̀ng rɔ́ɔi èt'],[250,'สองร้อยห้าสิบ','sɔ̌ɔng rɔ́ɔi hâa sìp'],[35000,'สามหมื่นห้าพัน','sǎam mʉ̀ʉn hâa phan'],[120000,'หนึ่งแสนสองหมื่น','nʉ̀ng sɛ̌ɛn sɔ̌ɔng mʉ̀ʉn'],[2500000,'สองล้านห้าแสน','sɔ̌ɔng láan hâa sɛ̌ɛn']])assert.deepStrictEqual({...t.thaiNumber(n)},{th,ro},String(n));
for(const [id,f,label] of [['numbers','course','0. 数字'],['sounds','script','0. 発音と声調'],['tones','script','0. 発音と声調']]){t.setFrom(f);t.setId(id);const h=t.extraView();assert(h.includes(label)&&h.includes(t.EXTRAS[id].title),id)}
assert.deepStrictEqual(['khaa','khàa','khâa','kháa','khǎa'].map(t.toneOf),[0,1,2,3,4]);assert(t.TONE_POOL.length>=20&&new Set(t.TONE_POOL.map(x=>t.toneOf(x[1]))).size===5);
console.log('PASS: 番外編 numbers (เอ็ด, ยี่สิบ, หมื่น/แสน/ล้าน) and pronunciation chapters.');
{const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={console,Math,window:{},document:{}};vm.createContext(c);vm.runInContext('function icon(){return ""};function shuffle(a){return a}',c);vm.runInContext(fs.readFileSync('dist/extras.js','utf8'),c);
const T=(h,m)=>vm.runInContext(`thaiTime(${h},${m||0}).th`,c);
// Conversational time: ตี (1–5), โมงเช้า (6–11), เที่ยง, บ่าย (13–16), โมงเย็น (17–18), ทุ่ม (19–23), เที่ยงคืน; ครึ่ง and นาที.
assert.deepEqual([0,3,7,12,13,15,17,19,23].map(h=>T(h)),['เที่ยงคืน','ตีสาม','เจ็ดโมงเช้า','เที่ยง','บ่ายโมง','บ่ายสามโมง','ห้าโมงเย็น','หนึ่งทุ่ม','ห้าทุ่ม']);
assert.equal(T(8,30),'แปดโมงเช้าครึ่ง');assert.equal(T(14,15),'บ่ายสองโมงสิบห้านาที');
const E=vm.runInContext('EXTRAS',c);for(const id of ['time','dates']){const h=E[id].body();assert(h.includes('ex-say')&&!h.includes('undefined'),id)}
assert(vm.runInContext('extrasCards()',c).includes('時刻・時間'));
console.log('PASS: chapter 0 time and dates — conversational clock, half/minutes, weekdays, months, dates and relative days.')}
{const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={console,Math,window:{},document:{}};vm.createContext(c);vm.runInContext('function icon(){return ""};function shuffle(a){return a};function esc(s){return String(s)};var view="extra";function render(){}',c);vm.runInContext(fs.readFileSync('dist/tone-sets.js','utf8'),c);vm.runInContext(fs.readFileSync('dist/extras.js','utf8'),c);
const S=vm.runInContext('TONE_SETS',c);assert(S.length>=60);
// Each set: 3+ different readings of one sound skeleton (tone / length only), no loanwords; ข้าว・ข่าว・ขาว・เขา are in one set.
const strip=r=>r.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/(.)\1/g,'$1'),key=r=>strip(r).replace(/^(kh|ph|th|ch|k|p|t|c)([lr]?)/,(m,a)=>({kh:'k',ph:'p',th:'t',ch:'c'})[a]||a);for(const s of S){assert(s.w.length>=3&&s.w.length<=12);assert.equal(new Set(s.w.map(x=>x[2])).size,s.w.length);assert.equal(new Set(s.w.map(x=>key(x[2]))).size,1,s.k);assert(s.w.every(x=>!x[1].includes('์')))}
// Soft l/r clusters and aspiration share a set: ไก่ kài / ไกล klai / ไข่ khài.
{const g=S.find(s=>s.w.some(x=>x[1]==='ไกล'));assert(g&&['ไก่','ไข่'].every(t=>g.w.some(x=>x[1]===t)),'kai/klai/khai')}
const kh=S.find(s=>s.w.some(x=>x[1]==='ข้าว')).w.map(x=>x[1]);for(const t of ['ข้าว','ข่าว','ขาว','เขา','กาว','เข่า'])assert(kh.includes(t));
assert(vm.runInContext("soundCards()",c).includes('似た音の聞き分け'));c.setTimeout=()=>{};vm.runInContext("setTimeout=()=>{};pairQuizNew();pairPick(pairQuiz.qs[0].ans)",c);assert.equal(vm.runInContext('pairQuiz.ok',c),1);
console.log(`PASS: similar-sound listening — ${S.length} sets (tone, length, l/r, aspiration), quiz scores by ear.`)}
