const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console,window:{scrollTo(){}},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({}),getElementById:()=>null}};vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','word-topics','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
const read=n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8'));ctx.__b=[...read('word-bank.json'),...read('word-bank-more.json')];
const deck=d=>vm.runInContext(`__b.filter(w=>wordInDeck(w,'${d}'))`,ctx);
// Phrases are taught in the ครับ form; the ค่ะ/คะ duplicates leave every deck but stay in the bank, and the ครับ entry names the female form.
const P=deck('phrase'),G=deck('general');assert(P.length>440);
assert(!P.some(w=>/(ค่ะ|คะ)$/.test(w.th.replace(/\s/g,'')))&&!G.some(w=>/(ค่ะ|คะ)$/.test(w.th.replace(/\s/g,''))&&/ครับ/.test(w.meanings[0].note||'')));
for(const w of P.filter(w=>/ครับ$/.test(w.th))){const f=w.th.replace(/ครับ$/,'');if(ctx.__b.some(x=>x.th===f+'ค่ะ'||x.th===f+'คะ'))assert((w.meanings[0].note||'').includes('女性は'),w.th)}
assert(ctx.__b.some(w=>w.th==='ขอบคุณค่ะ'));
// Intensifier-only variants (ปวดท้องมาก, ร้อนจัง) are not separate phrases; set combinations stay.
const th=new Set(P.map(w=>w.th));for(const x of ['ปวดท้องมาก','ร้อนจัง','สวยจัง','ไม่สบายนิดหน่อย','อร่อยมาก'])assert(!th.has(x),x);for(const x of ['ขอบคุณมาก','ได้เลย','ช่วยด้วย','แพงไป','ขอเมนูหน่อย','เข้าใจแล้ว'])assert(th.has(x),x);
console.log(`PASS: phrases unified on the ครับ form — ${P.length} phrases, female duplicates hidden but kept, female form noted.`);
