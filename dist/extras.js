// Chapter 0 of grammar (発音と数字): numbers and pronunciation/tones. Reference chapters outside the 47 lessons; they do not
// change lesson ids or grammar progress. Readings follow the app's romanization (same as the word bank).
const NUM_TH=['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'],NUM_RO=['sǔun','nʉ̀ng','sɔ̌ɔng','sǎam','sìi','hâa','hòk','cèt','pɛ̀ɛt','kâao'];
const NUM_UNIT=[['',''],['สิบ','sìp'],['ร้อย','rɔ́ɔi'],['พัน','phan'],['หมื่น','mʉ̀ʉn'],['แสน','sɛ̌ɛn']];
// Thai reading of 0–9,999,999: 1 in the ones place after other digits is เอ็ด, 1 and 2 in the tens place are สิบ / ยี่สิบ.
function thaiNumber(n){if(n===0)return {th:NUM_TH[0],ro:NUM_RO[0]};if(n>=1000000){const hi=thaiNumber(Math.floor(n/1000000)),lo=n%1000000,rest=lo?thaiNumber(lo):null;return {th:hi.th+'ล้าน'+(rest?rest.th:''),ro:hi.ro+' láan'+(rest?' '+rest.ro:'')}}
 const ds=String(n).split('').map(Number).reverse(),th=[],ro=[];for(let p=ds.length-1;p>=0;p--){const d=ds[p];if(!d)continue;
  if(p===1){if(d===1){th.push('สิบ');ro.push('sìp')}else if(d===2){th.push('ยี่สิบ');ro.push('yîi sìp')}else{th.push(NUM_TH[d]+'สิบ');ro.push(NUM_RO[d]+' sìp')}}
  else if(p===0){if(d===1&&n>=10){th.push('เอ็ด');ro.push('èt')}else{th.push(NUM_TH[d]);ro.push(NUM_RO[d])}}
  else{th.push(NUM_TH[d]+NUM_UNIT[p][0]);ro.push(NUM_RO[d]+' '+NUM_UNIT[p][1])}}
 return {th:th.join(''),ro:ro.join(' ')}}
const THAI_DIGITS='๐๑๒๓๔๕๖๗๘๙',toThaiDigits=n=>String(n).replace(/\d/g,d=>THAI_DIGITS[d]);
let extraId=null,extraQuiz=null;
function openExtra(id){extraId=id;extraQuiz=null;view='extra';render();window.scrollTo(0,0)}
const xSay=(th,ro,ja)=>`<div class="ex-say"><button class="w-audio" onclick="speakThaiText('${th}')" aria-label="${th}を再生">${icon('audio')}</button><span class="ex-th" lang="th">${th}</span><b class="ex-ro">${ro}</b>${ja?`<span class="ex-ja">${ja}</span>`:''}</div>`;

// 時刻のふつうの言い方（会話）：0時 เที่ยงคืน／1〜5時 ตี〜／6〜11時 〜โมงเช้า／12時 เที่ยง／13時 บ่ายโมง／14〜16時 บ่าย〜โมง／17〜18時 〜โมงเย็น／19〜23時 〜ทุ่ม
function thaiHour(h){const n=k=>thaiNumber(k);
 if(h===0)return {th:'เที่ยงคืน',ro:'thîiang khʉʉn'};if(h<=5)return {th:'ตี'+n(h).th,ro:'tii '+n(h).ro};
 if(h<=11)return {th:n(h).th+'โมงเช้า',ro:n(h).ro+' moong cháao'};if(h===12)return {th:'เที่ยง',ro:'thîiang'};
 if(h===13)return {th:'บ่ายโมง',ro:'bàai moong'};if(h<=16)return {th:'บ่าย'+n(h-12).th+'โมง',ro:'bàai '+n(h-12).ro+' moong'};
 if(h<=18)return {th:n(h-12).th+'โมงเย็น',ro:n(h-12).ro+' moong yen'};return {th:n(h-18).th+'ทุ่ม',ro:n(h-18).ro+' thûm'}}
function thaiTime(h,m=0){const x=thaiHour(h);if(!m)return x;if(m===30)return {th:x.th+'ครึ่ง',ro:x.ro+' khrʉ̂ng'};const y=thaiNumber(m);return {th:x.th+y.th+'นาที',ro:x.ro+' '+y.ro+' naa thii'}}
const hm=(h,m=0)=>`${h}:${String(m).padStart(2,'0')}`;
const sayTime=(h,m=0)=>{const x=thaiTime(h,m);return xSay(x.th,x.ro,hm(h,m))};
const sayN=(n,unitTh,unitRo,ja)=>{const x=thaiNumber(n);return xSay(x.th+unitTh,x.ro+' '+unitRo,ja)};
const WEEK=[['วันจันทร์','wan can','月曜日'],['วันอังคาร','wan ang khaan','火曜日'],['วันพุธ','wan phút','水曜日'],['วันพฤหัส','wan phá rʉ́ hàt','木曜日'],['วันศุกร์','wan sùk','金曜日'],['วันเสาร์','wan sǎo','土曜日'],['วันอาทิตย์','wan aa thít','日曜日']];
const MONTHS=[['มกราคม','mók kà raa khom'],['กุมภาพันธ์','kum phaa phan'],['มีนาคม','mii naa khom'],['เมษายน','mee sǎa yon'],['พฤษภาคม','phrʉ́t sà phaa khom'],['มิถุนายน','mí thù naa yon'],['กรกฎาคม','kà rá kà daa khom'],['สิงหาคม','sǐng hǎa khom'],['กันยายน','kan yaa yon'],['ตุลาคม','tù laa khom'],['พฤศจิกายน','phrʉ́t sà cì kaa yon'],['ธันวาคม','than waa khom']];
let timeQuiz=null;
function timeQuizNew(){const pool=[[0,0],[2,0],[6,0],[8,30],[10,0],[12,0],[13,0],[14,0],[15,30],[17,0],[18,0],[19,0],[20,30],[22,0],[23,0],[9,15]];const qs=shuffle(pool).slice(0,6).map(t=>({t,choices:shuffle([t,...shuffle(pool.filter(x=>thaiTime(...x).th!==thaiTime(...t).th)).slice(0,3)])}));timeQuiz={qs,i:0,ok:0,picked:null}}
function timePick(k){const q=timeQuiz.qs[timeQuiz.i];timeQuiz.picked=k;if(q.choices[k]===q.t)timeQuiz.ok++;if(typeof speakThaiText==='function')speakThaiText(thaiTime(...q.t).th,false,true);render()}
function timeQuizView(){if(!timeQuiz)return `<p>時刻を見て、ふつうの言い方を選びます（6問）。</p><button class="btn" onclick="timeQuizNew();render()">確認テストを始める</button>`;const q=timeQuiz.qs[timeQuiz.i];if(!q)return `<p class="ex-score">${timeQuiz.ok} / ${timeQuiz.qs.length} 問正解</p><button class="btn" onclick="timeQuizNew();render()">もう一度</button>`;
 return `<div class="ex-q"><div class="ex-q-top">${timeQuiz.i+1} / ${timeQuiz.qs.length}</div><div class="ex-q-num">${hm(...q.t)}</div><div class="ex-q-choices">${q.choices.map((c,k)=>{const x=thaiTime(...c),st=timeQuiz.picked===null?'':c===q.t?' is-right':k===timeQuiz.picked?' is-wrong':'';return `<button class="option${st}" ${timeQuiz.picked!==null?'disabled':''} onclick="timePick(${k})"><span lang="th">${x.th}</span><small>${x.ro}</small></button>`}).join('')}</div>${timeQuiz.picked!==null?`<button class="btn" onclick="timeQuiz.i++;timeQuiz.picked=null;render()">次へ →</button>`:''}</div>`}
const EXTRAS={
 tones:{title:'声調',lead:'5つの声調の出し方、聞き分け、文字から声調を決めるしくみ、会話での注意。最後に聞き取りの確認テスト。',body:()=>`
 <section class="ex-sec"><h2>声調とは</h2><p>タイ語は、同じ音でも<b>声の高さの動き（声調）</b>が違うと別の語になります。声調は5つ。ローマ字では母音の上の記号で表します（記号なし・à・â・á・ǎ）。まずは同じ「khaa」の5つを聞き比べてください。</p>
 <div class="ex-grid">${xSay('คา','khaa','挟まる（平声）')}${xSay('ข่า','khàa','ガランガル（低声）')}${xSay('ค่า','khâa','値段・価値（下声）')}${xSay('ค้า','kháa','商売する（高声）')}${xSay('ขา','khǎa','脚（上声）')}</div></section>
 <section class="ex-sec"><h2>音の高さの動き</h2><p>線は声の高さ（上ほど高い）を左から右へ表したものです。</p>${toneChart()}</section>
 <section class="ex-sec"><h2>1つずつの出し方</h2>
 <div class="ex-tone"><h3>平声（記号なし）</h3><p>ふつうの高さで、まっすぐ伸ばします。力を抜いて「あー」と言う感じ。日本語の感覚で平らに言えば、たいていこの声調になります。</p>${xSay('มา','maa','来る')}${xSay('ดู','duu','見る')}</div>
 <div class="ex-tone"><h3>低声（à）</h3><p>平声より低く始め、少し下がりながら言います。落ち着いた低めの声。最後まで低いままで、上げないのがこつです。</p>${xSay('ไก่','kài','鶏')}${xSay('ป่า','pàa','森')}</div>
 <div class="ex-tone"><h3>下声（â）</h3><p>高いところから一気に下げます。がっかりしたときの「えー」や、強く言い切る「ダメ！」の下がり方に近い音です。</p>${xSay('ไม่','mâi','〜ない')}${xSay('ข้าว','khâao','ご飯')}</div>
 <div class="ex-tone"><h3>高声（á）</h3><p>高めに始めて、さらに少し上げます。のどを少し締めた、張りのある高い声。短い母音ではきゅっと詰まって聞こえます。</p>${xSay('ม้า','máa','馬')}${xSay('รถ','rót','車')}</div>
 <div class="ex-tone"><h3>上声（ǎ）</h3><p>いったん低く下げてから、ぐっと上げます。聞き返すときの「ええ？」に近い動き。最初に下げる部分を省かないのがこつです。</p>${xSay('หมา','mǎa','犬')}${xSay('ขาว','khǎao','白い')}</div></section>
 <section class="ex-sec"><h2>間違えやすい組</h2><p>声調だけが違う語の組です。音声で何度も聞き比べましょう。</p>
 <div class="ex-pairs">${[['ใกล้','klâi','近い','ไกล','klai','遠い'],['เสือ','sʉ̌ʉa','虎','เสื้อ','sʉ̂ʉa','服'],['ป่า','pàa','森','ป้า','pâa','おば'],['ปู','puu','カニ','ปู่','pùu','祖父'],['หน้า','nâa','顔','หนา','nǎa','厚い']].map(([a,ar,aj,b,br,bj])=>`<div class="ex-pair">${xSay(a,ar,aj)}${xSay(b,br,bj)}</div>`).join('')}<div class="ex-pair">${xSay('ขาว','khǎao','白い')}${xSay('ข่าว','khàao','ニュース')}${xSay('ข้าว','khâao','ご飯')}</div></div></section>
 <section class="ex-sec"><h2>文字から声調を決めるしくみ</h2><p>タイ文字では、①子音字のグループ（中子音・高子音・低子音）、②音節が「生きている」か「死んでいる」か、③声調記号、の3つで声調が決まります。</p>
 <ul class="ex-rules"><li><b>生きた音節</b>：長い母音で終わる、または m・n・ng・i・o で終わる（例：มา、ลม）。</li><li><b>死んだ音節</b>：短い母音で終わる、または k・t・p で終わる（例：เด็ก、รถ）。</li></ul>
 <div class="ex-scroll"><table class="ex-table ex-rule-table"><thead><tr><th></th><th>生きた・記号なし</th><th>死んだ・記号なし</th><th>่（マイエーク）</th><th>้（マイトー）</th><th>๊</th><th>๋</th></tr></thead><tbody>
 <tr><th>中子音<small>ก จ ด ต บ ป อ など</small></th><td>平</td><td>低</td><td>低</td><td>下</td><td>高</td><td>上</td></tr>
 <tr><th>高子音<small>ข ฉ ถ ผ ฝ ส ห など</small></th><td>上</td><td>低</td><td>低</td><td>下</td><td>—</td><td>—</td></tr>
 <tr><th>低子音<small>ค ช ท พ ม น ร ล など</small></th><td>平</td><td>短い母音：高<br>長い母音：下</td><td>下</td><td>高</td><td>—</td><td>—</td></tr></tbody></table></div>
 <p>同じ記号でもグループで声調が変わる点に注意。例えば ่ は中子音・高子音では低声、低子音では下声になります。</p>
 <div class="ex-grid">${xSay('ป้า','pâa','中子音＋้＝下声')}${xSay('ข่า','khàa','高子音＋่＝低声')}${xSay('ค่า','khâa','低子音＋่＝下声')}${xSay('ค้า','kháa','低子音＋้＝高声')}${xSay('รถ','rót','低子音・死んだ短母音＝高声')}${xSay('พูด','phûut','低子音・死んだ長母音＝下声')}</div>
 <p class="ex-note">字ごとのグループや例外は「文字」の各課で少しずつ学べます。</p></section>
 <section class="ex-sec"><h2>会話でのポイント</h2><ul class="ex-rules">
 <li><b>疑問文でも語尾を上げない</b>：日本語の「〜ですか↑」の上げ調子で言うと、別の声調に聞こえます。疑問の ไหม（mǎi）はもともと上声なので、その声調のまま言えば十分です。${xSay('ไหม','mǎi','〜ですか')}</li>
 <li><b>丁寧な語尾は声調まで覚える</b>：男性の ครับ（khráp・高声）。女性は答えるときの ค่ะ（khâ・下声）と、尋ねるときの คะ（khá・高声）を使い分けます。${xSay('ครับ','khráp','男性')}${xSay('ค่ะ','khâ','女性・答える')}${xSay('คะ','khá','女性・尋ねる')}</li>
 <li><b>よく使う語は会話で声調が変わることがある</b>：ฉัน（chǎn）や เขา（khǎo）は、会話では高声（chán・kháo）に近く発音されることがよくあります。</li>
 <li><b>感情で高さを変えすぎない</b>：驚きや強調で声全体が高くなっても、声調の「形」（上がる・下がる・平ら）は保たれます。形を崩さないことが大切です。</li></ul></section>
 <section class="ex-sec"><h2>練習のしかた</h2><ol class="ex-rules"><li>新しい語はローマ字の記号を見て、声調の線を指で空中に描きながら言う。</li><li>คา・ข่า・ค่า・ค้า・ขา の5つを毎日声に出す（順番を変えても言えるように）。</li><li>音声を聞いて、まねして、録音して聞き比べる。</li><li>「文字」の文字ゲーム「声調あて」で聞き分けを鍛える。</li></ol></section>
 <section class="ex-sec ex-quiz-sec"><h2>確認テスト</h2>${toneQuizView()}</section>`},
 numbers:{title:'数字',lead:'0〜100万までの数え方、タイ数字、順番・数え方・値段・電話番号の言い方。',body:()=>`
 <section class="ex-sec"><h2>0〜10</h2><div class="ex-grid">${NUM_TH.map((t,i)=>xSay(t,NUM_RO[i],String(i))).join('')}${xSay('สิบ','sìp','10')}</div></section>
 <section class="ex-sec"><h2>11〜99：十の位と一の位を並べる</h2><p>「十」は <b>สิบ</b>。12は สิบสอง、30は สามสิบ のように並べます。<b>2つだけ例外</b>があります。</p>
 <ul class="ex-rules"><li><b>一の位の1は <span lang="th">เอ็ด</span>（èt）</b>：11 สิบเอ็ด、21 ยี่สิบเอ็ด、101 หนึ่งร้อยเอ็ด。</li><li><b>20台は <span lang="th">ยี่สิบ</span>（yîi sìp）</b>：สองสิบ とは言いません。</li></ul>
 <div class="ex-grid">${[11,12,19,20,21,25,30,47,99].map(n=>{const x=thaiNumber(n);return xSay(x.th,x.ro,String(n))}).join('')}</div></section>
 <section class="ex-sec"><h2>大きな数：万と十万に専用の語がある</h2><p>日本語と違い、<b>1万</b>と<b>10万</b>にそれぞれの語があります。百以上は หนึ่ง を付けて言うのがふつうです（หนึ่งร้อย）。</p>
 <div class="ex-grid">${[[100,'百'],[1000,'千'],[10000,'万'],[100000,'十万'],[1000000,'百万']].map(([n,j])=>{const x=thaiNumber(n);return xSay(x.th,x.ro,`${n.toLocaleString()}（${j}）`)}).join('')}</div>
 <p class="ex-note">組み合わせ：大きい単位から順に読みます。</p><div class="ex-grid">${[250,1500,2026,35000,120000,2500000].map(n=>{const x=thaiNumber(n);return xSay(x.th,x.ro,n.toLocaleString())}).join('')}</div></section>
 <section class="ex-sec"><h2>タイ数字</h2><p>値段表・カレンダー・公文書などでは、アラビア数字の代わりに<b>タイ数字</b>も使われます。</p><div class="ex-digits">${[...THAI_DIGITS].map((d,i)=>`<span><b lang="th">${d}</b><small>${i}</small></span>`).join('')}</div><p class="ex-note">例：<span lang="th">${toThaiDigits(2569)}</span> = 2569（タイの仏暦。西暦2026年）</p></section>
 <section class="ex-sec"><h2>使い方</h2>
 <h3>数える：名詞＋数＋類別詞</h3><p>物を数えるときは、数のあとに<b>類別詞</b>（物の種類ごとの数え方）を付けます。</p>${xSay('กาแฟสองแก้ว','kaa fɛɛ sɔ̌ɔng kɛ̂ɛo','コーヒー2杯')}${xSay('ไข่สามใบ','khài sǎam bai','卵3個')}
 <h3>順番：ที่＋数</h3>${xSay('ที่หนึ่ง','thîi nʉ̀ng','1番目・1位')}${xSay('ที่สอง','thîi sɔ̌ɔng','2番目')}
 <h3>値段：数＋บาท</h3>${xSay('ห้าสิบบาท','hâa sìp bàat','50バーツ')}${xSay('สองร้อยบาท','sɔ̌ɔng rɔ́ɔi bàat','200バーツ')}
 <h3>半分：ครึ่ง</h3>${xSay('ครึ่ง','khrʉ̂ng','半分')}
 <h3>電話番号：1桁ずつ読む</h3><p>電話番号は1桁ずつ読みます。2は สาม（3）と聞き間違えないように <b><span lang="th">โท</span>（thoo）</b>と言うことがよくあります。0は ศูนย์。</p>${xSay('ศูนย์แปดหนึ่ง','sǔun pɛ̀ɛt nʉ̀ng','081…')}
 </section>
 <section class="ex-sec ex-quiz-sec"><h2>確認テスト</h2>${extraQuizView()}</section>`},
 time:{title:'時刻・時間',lead:'1日を朝・昼・夕方・夜で言い分けるタイ式の時刻、24時間制、分・半、時間の長さ。最後に確認テスト。',body:()=>`
 <section class="ex-sec"><h2>何時？</h2>${xSay('กี่โมงแล้ว','kìi moong lɛ́ɛo','何時になった？（今何時？）')}${xSay('ตอนนี้กี่โมง','tɔɔn níi kìi moong','今何時？')}</section>
 <section class="ex-sec"><h2>会話の時刻：時間帯で言い方が変わる</h2><p>会話では、1日をいくつかの時間帯に分け、<b>時間帯ごとに違う語</b>で時刻を言います。数字は時間帯の中で数え直します（夜7時が「1」）。</p>
 <ul class="ex-rules"><li><b>午前1〜5時</b>：<span lang="th">ตี</span>（tii）＋数</li><li><b>午前6〜11時</b>：数＋<span lang="th">โมงเช้า</span>（moong cháao）</li><li><b>正午</b>：<span lang="th">เที่ยง</span>（thîiang）　<b>午前0時</b>：<span lang="th">เที่ยงคืน</span>（thîiang khʉʉn）</li><li><b>午後1〜4時</b>：<span lang="th">บ่าย</span>（bàai）＋数＋<span lang="th">โมง</span>。1時だけ บ่ายโมง</li><li><b>午後5〜6時</b>：数＋<span lang="th">โมงเย็น</span>（moong yen）</li><li><b>午後7〜11時</b>：数＋<span lang="th">ทุ่ม</span>（thûm）。7時が หนึ่งทุ่ม</li></ul>
 <div class="ex-grid">${[0,1,5,6,8,11,12,13,14,16,17,18,19,20,23].map(h=>sayTime(h)).join('')}</div></section>
 <section class="ex-sec"><h2>分と半</h2><p>分は数＋<b><span lang="th">นาที</span></b>（naa thii）、30分は<b><span lang="th">ครึ่ง</span></b>（khrʉ̂ng＝半）を時刻の後ろに付けます。</p><div class="ex-grid">${sayTime(8,30)}${sayTime(14,30)}${sayTime(20,30)}${sayTime(9,15)}${sayTime(13,45)}</div></section>
 <section class="ex-sec"><h2>24時間制（改まった言い方）</h2><p>ニュース・駅・空港・公式の案内では、数＋<b><span lang="th">นาฬิกา</span></b>（naa lí kaa）の24時間制を使います。</p><div class="ex-grid">${[[9,'9:00'],[14,'14:00'],[21,'21:00']].map(([h,j])=>{const x=thaiNumber(h);return xSay(x.th+'นาฬิกา',x.ro+' naa lí kaa',j)}).join('')}</div></section>
 <section class="ex-sec"><h2>時間の長さ</h2><p>長さは数＋<b><span lang="th">ชั่วโมง</span></b>（時間）・<b><span lang="th">นาที</span></b>（分）・<b><span lang="th">วินาที</span></b>（秒）。「約」は前に <span lang="th">ประมาณ</span>（prà maan）。</p>
 <div class="ex-grid">${sayN(2,'ชั่วโมง','chûua moong','2時間')}${sayN(30,'นาที','naa thii','30分')}${xSay('ครึ่งชั่วโมง','khrʉ̂ng chûua moong','30分（半時間）')}${xSay('ประมาณหนึ่งชั่วโมง','prà maan nʉ̀ng chûua moong','約1時間')}</div></section>
 <section class="ex-sec"><h2>1日の時間帯</h2><div class="ex-grid">${xSay('ตอนเช้า','tɔɔn cháao','朝・午前中')}${xSay('ตอนบ่าย','tɔɔn bàai','午後')}${xSay('ตอนเย็น','tɔɔn yen','夕方')}${xSay('ตอนกลางคืน','tɔɔn klaang khʉʉn','夜')}${xSay('กลางวัน','klaang wan','昼間')}${xSay('ดึก','dʉ̀k','夜遅い')}</div></section>
 <section class="ex-sec ex-quiz-sec"><h2>確認テスト</h2>${timeQuizView()}</section>`},
 dates:{title:'日付・曜日',lead:'曜日、月、日付と年（仏暦）、昨日・明日・来週などの言い方、「〜日前・〜日後」。',body:()=>`
 <section class="ex-sec"><h2>曜日</h2><p>曜日は <span lang="th">วัน</span>（日）＋曜日名。「何曜日？」は วันอะไร。</p><div class="ex-grid">${WEEK.map(([t,r,j])=>xSay(t,r,j)).join('')}</div>${xSay('วันนี้วันอะไร','wan níi wan à rai','今日は何曜日？')}</section>
 <section class="ex-sec"><h2>月</h2><p>31日まである月は <b>-คม</b>（khom）、30日の月は <b>-ยน</b>（yon）で終わります（2月だけ -พันธ์）。</p><div class="ex-grid">${MONTHS.map(([t,r],i)=>xSay(t,r,(i+1)+'月')).join('')}</div></section>
 <section class="ex-sec"><h2>日付：日・月・年の順</h2><p>日付は <span lang="th">วันที่</span>（wan thîi）＋日＋月＋年の順。「何日？」は วันที่เท่าไร。</p>
 ${(()=>{const d=thaiNumber(14);return xSay('วันที่'+d.th+' พฤศจิกายน','wan thîi '+d.ro+' phrʉ́t sà cì kaa yon','11月14日')})()}${xSay('วันนี้วันที่เท่าไร','wan níi wan thîi thâo rai','今日は何日？')}
 <h3>年は仏暦（พ.ศ.）</h3><p>タイでは仏暦がふつうで、<b>西暦＋543</b>です。西暦は <span lang="th">ค.ศ.</span>（khɔɔ sɔ̌ɔ）と言って区別します。</p>${(()=>{const y=thaiNumber(2569);return xSay('พ.ศ. '+y.th,'phɔɔ sɔ̌ɔ '+y.ro,'仏暦2569年（西暦2026年）')})()}</section>
 <section class="ex-sec"><h2>昨日・今日・明日</h2><div class="ex-grid">${xSay('เมื่อวานซืน','mʉ̂ʉa waan sʉʉn','おととい')}${xSay('เมื่อวาน','mʉ̂ʉa waan','昨日')}${xSay('วันนี้','wan níi','今日')}${xSay('พรุ่งนี้','phrûng níi','明日')}${xSay('มะรืนนี้','má rʉʉn níi','明後日')}${xSay('ทุกวัน','thúk wan','毎日')}</div></section>
 <section class="ex-sec"><h2>先週・今週・来週</h2><p>「来〜」は後ろに <span lang="th">หน้า</span>（nâa）、「先〜」は <span lang="th">ที่แล้ว</span>（thîi lɛ́ɛo）、「今〜」は <span lang="th">นี้</span>（níi）。週は会話では <span lang="th">อาทิตย์</span>、改まると <span lang="th">สัปดาห์</span>。</p>
 <div class="ex-grid">${xSay('อาทิตย์ที่แล้ว','aa thít thîi lɛ́ɛo','先週')}${xSay('อาทิตย์นี้','aa thít níi','今週')}${xSay('อาทิตย์หน้า','aa thít nâa','来週')}${xSay('เดือนที่แล้ว','dʉʉan thîi lɛ́ɛo','先月')}${xSay('เดือนนี้','dʉʉan níi','今月')}${xSay('เดือนหน้า','dʉʉan nâa','来月')}${xSay('ปีที่แล้ว','pii thîi lɛ́ɛo','去年')}${xSay('ปีนี้','pii níi','今年')}${xSay('ปีหน้า','pii nâa','来年')}</div></section>
 <section class="ex-sec"><h2>〜日前・〜日後</h2><p>「〜前」は数＋単位＋<span lang="th">ที่แล้ว</span>、「〜後」は <span lang="th">อีก</span>（ìik）＋数＋単位。</p>
 <div class="ex-grid">${(()=>{const n=thaiNumber(3);return xSay(n.th+'วันที่แล้ว',n.ro+' wan thîi lɛ́ɛo','3日前')+xSay('อีก'+n.th+'วัน','ìik '+n.ro+' wan','3日後')})()}${(()=>{const n=thaiNumber(2);return xSay(n.th+'ปีที่แล้ว',n.ro+' pii thîi lɛ́ɛo','2年前')+xSay('อีก'+n.th+'อาทิตย์','ìik '+n.ro+' aa thít','2週間後')})()}</div></section>`},
 sounds:{title:'発音の基本',lead:'母音の長さ、息の強さ、詰まる音、日本語にない音。アプリのローマ字の読み方もここで確認できます。',body:()=>`
 <section class="ex-sec"><h2>母音の長さ</h2><p>短い母音と長い母音で別の語になります。ローマ字では<b>長い母音を2つ重ねて</b>書きます（a / aa）。</p>${xSay('เข้า','khâo','入る（短い）')}${xSay('ข้าว','khâao','ご飯（長い）')}</section>
 <section class="ex-sec"><h2>息の強さ（有気音・無気音）</h2><p><b>kh・ph・th</b> は息を強く出す音、<b>k・p・t</b> は息をほとんど出さない音です。日本語の「カ・パ・タ」はその中間なので、意識して分けましょう。th は英語の th ではなく「息の強いタ」です。</p>
 ${xSay('ไก่','kài','鶏（息なし）')}${xSay('ไข่','khài','卵（息あり）')}${xSay('ตา','taa','目（息なし）')}${xSay('ถาม','thǎam','尋ねる（息あり）')}</section>
 <section class="ex-sec"><h2>詰まる音で終わる語</h2><p>語末の <b>-k・-t・-p</b> は、口の形だけ作って音を出しません（「ック」「ット」「ップ」の最後を言わない感じ）。</p>${xSay('หก','hòk','6')}${xSay('แปด','pɛ̀ɛt','8')}${xSay('กลับ','klàp','帰る')}</section>
 <section class="ex-sec"><h2>日本語にない音</h2><ul class="ex-rules"><li><b>ng</b>（語頭）：「ング」を1音で。${xSay('งู','nguu','蛇')}</li><li><b>ʉ</b>：口を横に引いたまま「ウ」。${xSay('เสือ','sʉ̌ʉa','虎')}</li><li><b>ə</b>：口を軽く開けたあいまいな「ウ／ア」。${xSay('เดิน','dəən','歩く')}</li><li><b>ɛ</b>：口を大きく開けた「エ」。${xSay('แม่','mɛ̂ɛ','母')}</li><li><b>ɔ</b>：口を大きく開けた「オ」。${xSay('พ่อ','phɔ̂ɔ','父')}</li></ul>
 <p class="ex-note">くだけた会話では r を l で発音したり（ร→ล）、kr・pr などの r を落としたりすることがよくあります。声調は次の「0-2 声調」でくわしく扱います。</p></section>`}
};
const TONES=[['平声','mid','M8 30 H92'],['低声','low','M8 40 C40 42 70 46 92 50'],['下声','falling','M8 14 C40 12 70 34 92 52'],['高声','high','M8 22 C40 20 70 14 92 8'],['上声','rising','M8 38 C34 50 56 50 92 12']];
function toneChart(){return `<div class="ex-tones">${TONES.map(([n,k,d])=>`<figure class="ex-tone-fig"><svg viewBox="0 0 100 60" aria-hidden="true"><path d="M0 10H100M0 30H100M0 50H100" class="g"/><path d="${d}" class="c"/></svg><figcaption>${n}</figcaption></figure>`).join('')}</div>`}
// Tone of a romanized syllable from its first tone mark: none mid, grave low, circumflex falling, acute high, caron rising.
function toneOf(ro){const d=String(ro).normalize('NFD');return /̌/.test(d)?4:/́/.test(d)?3:/̂/.test(d)?2:/̀/.test(d)?1:0}
const TONE_POOL=[['คา','khaa'],['ข่า','khàa'],['ค่า','khâa'],['ค้า','kháa'],['ขา','khǎa'],['ขาว','khǎao'],['ข่าว','khàao'],['ข้าว','khâao'],['ไกล','klai'],['ใกล้','klâi'],['เสือ','sʉ̌ʉa'],['เสื้อ','sʉ̂ʉa'],['ป่า','pàa'],['ป้า','pâa'],['ปู','puu'],['ปู่','pùu'],['หน้า','nâa'],['หนา','nǎa'],['มา','maa'],['ม้า','máa'],['หมา','mǎa'],['ไม่','mâi'],['ไม้','máai'],['ใหม่','mài'],['รถ','rót'],['พูด','phûut'],['ช้าง','cháang'],['หมู','mǔu'],['ดู','duu'],['ไก่','kài']];
let toneQuiz=null;
function toneQuizNew(){toneQuiz={qs:shuffle(TONE_POOL).slice(0,8),i:0,ok:0,picked:null};toneSay()}
function toneSay(){const q=toneQuiz&&toneQuiz.qs[toneQuiz.i];if(q&&typeof speakThaiText==='function')setTimeout(()=>speakThaiText(q[0],false,true),200)}
function tonePick(t){const q=toneQuiz.qs[toneQuiz.i];toneQuiz.picked=t;if(t===toneOf(q[1]))toneQuiz.ok++;render()}
function toneQuizView(){if(!toneQuiz)return `<p>音声を聞いて、どの声調かを選びます（8問）。</p><button class="btn" onclick="toneQuizNew();render()">確認テストを始める</button>`;const q=toneQuiz.qs[toneQuiz.i];if(!q)return `<p class="ex-score">${toneQuiz.ok} / ${toneQuiz.qs.length} 問正解</p><button class="btn" onclick="toneQuizNew();render()">もう一度</button>`;const ans=toneOf(q[1]);
 return `<div class="ex-q"><div class="ex-q-top">${toneQuiz.i+1} / ${toneQuiz.qs.length}</div><div class="ex-q-word"><button class="w-audio" onclick="speakThaiText('${q[0]}')" aria-label="もう一度聞く">${icon('audio')}</button><span lang="th">${q[0]}</span>${toneQuiz.picked!==null?`<b>${q[1]}</b>`:''}</div><div class="ex-q-choices ex-tone-choices">${TONES.map(([n],k)=>{const st=toneQuiz.picked===null?'':k===ans?' is-right':k===toneQuiz.picked?' is-wrong':'';return `<button class="option${st}" ${toneQuiz.picked!==null?'disabled':''} onclick="tonePick(${k})"><span>${n}</span></button>`}).join('')}</div>${toneQuiz.picked!==null?`<button class="btn" onclick="toneQuiz.i++;toneQuiz.picked=null;render();toneSay()">次へ →</button>`:''}</div>`}
function extraQuizNew(){const pool=[11,15,20,21,37,48,99,100,101,250,999,1500,2026,10000,35000,120000];const qs=shuffle(pool).slice(0,6).map(n=>{const others=shuffle(pool.filter(x=>x!==n)).slice(0,3);return {n,choices:shuffle([n,...others])}});extraQuiz={qs,i:0,ok:0,picked:null}}
function extraQuizView(){if(!extraQuiz)return `<p>数字を見て、正しい読み方を選びます（6問）。</p><button class="btn" onclick="extraQuizNew();render()">確認テストを始める</button>`;const q=extraQuiz.qs[extraQuiz.i];if(!q)return `<p class="ex-score">${extraQuiz.ok} / ${extraQuiz.qs.length} 問正解</p><button class="btn" onclick="extraQuizNew();render()">もう一度</button>`;
 return `<div class="ex-q"><div class="ex-q-top">${extraQuiz.i+1} / ${extraQuiz.qs.length}</div><div class="ex-q-num">${q.n.toLocaleString()}</div><div class="ex-q-choices">${q.choices.map(c=>{const x=thaiNumber(c),st=extraQuiz.picked===null?'':c===q.n?' is-right':c===extraQuiz.picked?' is-wrong':'';return `<button class="option${st}" ${extraQuiz.picked!==null?'disabled':''} onclick="extraPick(${c})"><span lang="th">${x.th}</span><small>${x.ro}</small></button>`}).join('')}</div>${extraQuiz.picked!==null?`<button class="btn" onclick="extraQuiz.i++;extraQuiz.picked=null;render()">次へ →</button>`:''}</div>`}
function extraPick(c){const q=extraQuiz.qs[extraQuiz.i];extraQuiz.picked=c;if(c===q.n)extraQuiz.ok++;const x=thaiNumber(q.n);if(typeof speakThaiText==='function')speakThaiText(x.th,false,true);render()}
function extraView(){const x=EXTRAS[extraId];if(!x)return course();const sc=extraFrom==='script';return `<button class="textbtn back" onclick="go('${sc?'script':'course'}')">← ${sc?'文字':'文法'}に戻る</button><article class="ex-ch"><div class="eyebrow">${sc?'文字 · 0. 発音と声調':'文法 · 0. 数字と時間'}</div><h1>${x.title}</h1><p class="ex-lead">${x.lead}</p>${x.body()}</article>`}
// Shown as chapter 0 of the grammar page (before 1. 文の土台), outside the 47 numbered lessons.
let extraFrom='course';
function extraChapter(title,ids,from,iconName){return `<section class="x-course-chapter ex-chapter0"><div class="x-section-head"><h2><span class="x-chapter-icon" aria-hidden="true">${icon(iconName)}</span>${title}<small>入門</small></h2><span>${ids.length}課</span></div><div class="x-lessons">${ids.map((id,k)=>{const x=EXTRAS[id];return `<button class="x-lesson-row" onclick="extraFrom='${from}';openExtra('${id}')"><span class="x-lesson-num">0-${k+1}</span><span class="x-lesson-body"><b>${x.title}</b><small>${x.lead}</small></span><span class="x-lesson-end">${icon('arrow')}</span></button>`}).join('')}</div></section>`}
// Grammar chapter 0: numbers, time, dates. 文字 chapter 0: pronunciation and tones.
function extrasCards(){return extraChapter('0. 数字と時間',['numbers','time','dates'],'course','course')}
function soundCards(){return extraChapter('0. 発音と声調',['sounds','tones'],'script','audio')}
