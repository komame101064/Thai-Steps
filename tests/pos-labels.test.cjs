// Every sense uses one of the 17 part-of-speech labels in scripts/word-review/POS_GUIDE.md, and the app can show and group each one.
const fs=require('fs'),assert=require('assert');
const LABELS='名詞 代名詞 疑問詞 動詞 助動詞 形容詞・状態語 副詞 指示詞 限定詞 類別詞 数詞 前置詞 接続詞 助詞 間投詞 接頭辞 定型表現'.split(' ');
const banks=['word-bank','word-bank-more','slang-bank','slang-bank-more'].flatMap(f=>JSON.parse(fs.readFileSync(`dist/${f}.json`,'utf8')));
const used=new Set(banks.flatMap(w=>w.meanings.map(m=>m.pos)));
for(const p of used)assert(LABELS.includes(p),`unknown POS label: ${p}`);
for(const w of banks)assert.equal(w.pos,w.meanings[0].pos,`${w.id}: entry pos must follow its first sense`);
const app=fs.readFileSync('dist/app.js','utf8'),words=fs.readFileSync('dist/words-app.js','utf8');
const order=JSON.parse(app.match(/FAV_POS_ORDER=(\[[^\]]*\])/)[1].replace(/'/g,'"'));
assert.deepEqual([...order].sort(),[...LABELS].sort(),'FAV_POS_ORDER lists every label once');
const short=[...words.match(/POS_SHORT=\[(.*?)\];/)[1].matchAll(/\[\/(.*?)\/,'(.*?)'\]/g)].map(m=>[new RegExp(m[1]),m[2]]);
for(const p of LABELS)assert(short.some(([r])=>r.test(p)),`no POS_SHORT for ${p}`);
const get=th=>banks.find(w=>w.th===th&&!w.collection);
// Rulings from the guide (spot checks).
assert.equal(get('หิว').meanings[0].pos,'形容詞・状態語');assert.equal(get('กลัว').meanings[0].pos,'動詞');
assert.equal(get('ตอนนี้').meanings[0].pos,'名詞');assert.equal(get('กิโลกรัม').meanings[0].pos,'名詞');assert.equal(get('ครั้ง').meanings[0].pos,'類別詞');
console.log(`PASS: ${banks.length} entries use ${used.size} of the ${LABELS.length} POS labels; favourites order and short labels cover all`);
