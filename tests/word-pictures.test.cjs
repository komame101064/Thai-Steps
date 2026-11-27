// Word pictures (scripts/illust/): one allowed emoji per pictured sense, general senses only, never on a question face that asks for the meaning.
const fs=require('fs'),assert=require('assert'),vm=require('vm');
const allowed=new Set(fs.readFileSync('scripts/illust/allowed.tsv','utf8').trim().split('\n').slice(1).map(l=>l.split('\t')[0]));
const approved=JSON.parse(fs.readFileSync('scripts/illust/approved.json','utf8'));
const banks=Object.fromEntries(['word-bank','word-bank-more','slang-bank','slang-bank-more'].map(f=>[f,JSON.parse(fs.readFileSync(`dist/${f}.json`,'utf8'))]));
const senses=new Map();for(const [f,ws] of Object.entries(banks))for(const w of ws)for(const m of w.meanings)senses.set(`${w.id}#${m.sourceSense}`,{f,w,m});
for(const [k,e] of Object.entries(approved)){assert(allowed.has(e),`${k}: ${e} is not in allowed.tsv`);const s=senses.get(k);assert(s,`${k}: no such sense`);assert(!s.f.startsWith('slang')&&!s.m.isSlang,`${k}: slang deck has no pictures`);assert.equal(s.m.pic,e,`${k}: pic not applied`)}
let n=0;for(const [k,{m}] of senses)if(m.pic){n++;assert.equal(approved[k],m.pic,`${k}: picture not in approved.json`)}
assert(!/🔊|🔈|🙏/.test(Object.values(approved).join('')),'audio-like and ambiguous emoji are not used');
// Question faces: タイ語→日本語 and 音声→日本語 show no picture before answering; 日本語→タイ語 shows it with the prompt.
const js=fs.readFileSync('dist/words-app.js','utf8');
const face=js.slice(js.indexOf("s.kind==='cards'||s.mode==='th-ja'?"),js.indexOf("${s.kind==='cards'?`${s.revealed?"));
assert(!/wordPic\([^)]*\)\}<div class="w-flash-th"/.test(face)&&/wordPic\(w\.meanings\[0\],'is-q'\)\}<h2 class="w-ja-question"/.test(face),'picture only on the 日本語→タイ語 prompt');
assert(!js.slice(js.indexOf('<div class="w-choices">'),js.indexOf('<div class="w-choices">')+400).includes('wordPic'),'no pictures on the choices');
console.log(`PASS: ${n} senses have a picture (${Object.keys(approved).length} approved), all from the allowed list; none on meaning question faces or choices`);
