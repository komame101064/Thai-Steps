const fs=require('fs'),vm=require('vm'),assert=require('assert');const store={};
const ctx={console,window:{scrollTo(){}},location:{hash:''},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({}),getElementById:()=>null}};vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','word-topics','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext('render=()=>{};toast=()=>{}',ctx);
// Example sentences can be favourited (saved with the word records, kept by backups, bad keys dropped).
vm.runInContext("toggleFavEx('tl-00077#1')",ctx);assert.deepEqual([...vm.runInContext('favExList()',ctx)],['tl-00077#1']);assert(JSON.parse(store['thai-steps-words-v1']).favEx.includes('tl-00077#1'));
const s=vm.runInContext("sanitizeWordState({favEx:['tl-00077#1','bad','tl-00001#2','tl-00077#1']})",ctx);assert.deepEqual([...s.favEx],['tl-00077#1','tl-00001#2']);
vm.runInContext("toggleFavEx('tl-00077#1')",ctx);assert.equal(vm.runInContext('favExList().length',ctx),0);
// A split chip's star favourites that word without re-rendering.
const btn={classList:{toggle(){}},setAttribute(){}};ctx.__b=btn;vm.runInContext("chipFav('tl-00077',__b)",ctx);assert(vm.runInContext("wordRec('tl-00077').favorite",ctx));
console.log('PASS: favourite example sentences and split-chip words — saved, backed up, toggled.');
