const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console,window:{scrollTo(){}},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({}),getElementById:()=>null}};vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','word-topics','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
const read=n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8'));ctx.__b=[...read('word-bank.json'),...read('word-bank-more.json'),...read('slang-bank.json'),...read('slang-bank-more.json')];vm.runInContext("bank=__b;bankStatus='ready'",ctx);
const S=(a,b)=>vm.runInContext('speechText('+JSON.stringify(a)+','+JSON.stringify(b)+')',ctx);
// Thai voices repeat only the last syllable for ๆ; the app writes the repeated unit out, using the sentence's own reading.
assert.equal(S('มาแล้วๆ รอแป๊บนะ','maa lɛ́ɛo maa lɛ́ɛo rɔɔ pɛ́p ná'),'มาแล้ว มาแล้ว รอแป๊บนะ');
assert.equal(S('ร้านนี้มีของน่ารักๆ เยอะ','ráan níi mii khɔ̌ɔng nâa rák nâa rák yə́'),'ร้านนี้มีของน่ารัก น่ารัก เยอะ');
assert(!S('ใจเย็นๆ นะ ทุกอย่างจะดีเอง','cai yen yen ná thúk yàang cà dii eeng').includes('ใจเย็น ใจเย็น'));// ใจเย็นๆ = ใจเย็นเย็น
// Words with ๆ too: the repeated unit comes from the reading (ใจเย็นๆ cai yen yen → only เย็น), never a cut-off fragment.
assert.equal(S('ใจเย็นๆ','cai yen yen'),'ใจเย็น เย็น');assert.equal(S('ค่อยๆ','khɔ̂ɔi khɔ̂ɔi'),'ค่อย ค่อย');assert.equal(S('ไปๆมาๆ','pai pai maa maa'),'ไป ไปมา มา');
for(const w of [...read('word-bank.json'),...read('word-bank-more.json')].filter(w=>w.th.includes('ๆ')))assert(!/ [\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(S(w.th,w.ro)),w.th);
assert.equal(S('สวัสดีครับ','sà wàt dii khráp'),'สวัสดีครับ');
const ex={...read('sense-examples.json'),...read('more-examples.json'),...read('slang-examples.json')};
const dup=ro=>{const s=ro.replace(/[.,!?]/g,'').split(/\s+/);for(let n=2;n<=3;n++)for(let i=0;i+2*n<=s.length;i++)if(s.slice(i,i+n).join(' ')===s.slice(i+n,i+2*n).join(' '))return true;return false};
let left=0,n=0;for(const e of Object.values(ex)){if(!e.th.includes('ๆ'))continue;n++;if(S(e.th,e.ro).includes('ๆ')&&dup(e.ro))left++}assert(left<=2,left);
console.log(`PASS: speech writes out multi-syllable ๆ repeats (${n} examples with ๆ; ${left} left to the voice).`);
