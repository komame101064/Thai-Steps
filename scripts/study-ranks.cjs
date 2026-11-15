// Print {id: studyRank} for the general deck's study order (as the app computes it). Used by build scripts.
const fs=require('fs'),vm=require('vm'),path=require('path');const D=path.join(__dirname,'..','dist');
const ctx={console,window:{scrollTo(){}},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({}),getElementById:()=>null}};vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','word-topics','words-app'])vm.runInContext(fs.readFileSync(path.join(D,n+'.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(D,'app.js'),'utf8').split("window.addEventListener('hashchange'")[0],ctx);
const read=n=>JSON.parse(fs.readFileSync(path.join(D,n),'utf8'));ctx.fetch=async u=>({ok:true,json:async()=>read(String(u).split('?')[0].replace(/^\.?\//,''))});ctx.loadLazyScript=async()=>{};
(async()=>{await vm.runInContext('loadWordBank()',ctx);const o=vm.runInContext('stepOrder()',ctx),out={};o.forEach((w,i)=>{out[w.id]=i+1});process.stdout.write(JSON.stringify(out))})();
