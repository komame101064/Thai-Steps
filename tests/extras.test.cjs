// 番外編: Thai number readings (เอ็ด / ยี่สิบ rules, หมื่น・แสน・ล้าน) and the two chapters render.
const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={icon:()=>'',shuffle:a=>[...a],course:()=>''};vm.createContext(c);
vm.runInContext(fs.readFileSync('dist/extras.js','utf8')+';this.t={thaiNumber,EXTRAS,extraView,setId:i=>extraId=i}',c);const t=c.t;
for(const [n,th,ro] of [[0,'ศูนย์','sǔun'],[11,'สิบเอ็ด','sìp èt'],[20,'ยี่สิบ','yîi sìp'],[21,'ยี่สิบเอ็ด','yîi sìp èt'],[101,'หนึ่งร้อยเอ็ด','nʉ̀ng rɔ́ɔi èt'],[250,'สองร้อยห้าสิบ','sɔ̌ɔng rɔ́ɔi hâa sìp'],[35000,'สามหมื่นห้าพัน','sǎam mʉ̀ʉn hâa phan'],[120000,'หนึ่งแสนสองหมื่น','nʉ̀ng sɛ̌ɛn sɔ̌ɔng mʉ̀ʉn'],[2500000,'สองล้านห้าแสน','sɔ̌ɔng láan hâa sɛ̌ɛn']])assert.deepStrictEqual({...t.thaiNumber(n)},{th,ro},String(n));
for(const id of ['numbers','sounds']){t.setId(id);const h=t.extraView();assert(h.includes('0. 発音と数字')&&h.includes(t.EXTRAS[id].title))}
console.log('PASS: 番外編 numbers (เอ็ด, ยี่สิบ, หมื่น/แสน/ล้าน) and pronunciation chapters.');
