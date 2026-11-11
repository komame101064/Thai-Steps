"""Search-only approximations from the existing tone romanization, never shown as pronunciation guidance."""
import json,re,unicodedata,pathlib
P=pathlib.Path(__file__).resolve().parents[1]
MORE=P/'dist/word-bank-more.json'
words=json.loads((P/'dist/word-bank.json').read_text())+(json.loads(MORE.read_text()) if MORE.exists() else [])+json.loads((P/'dist/slang-bank.json').read_text())
# Token arrays support digraph katakana without splitting them.
rows={k: v.split() for k,v in {'':'ア イ ウ エ オ','k':'カ キ ク ケ コ','g':'ガ ギ グ ゲ ゴ','c':'チャ チ チュ チェ チョ','ch':'チャ チ チュ チェ チョ','t':'タ ティ トゥ テ ト','d':'ダ ディ ドゥ デ ド','p':'パ ピ プ ペ ポ','b':'バ ビ ブ ベ ボ','r':'ラ リ ル レ ロ','l':'ラ リ ル レ ロ','m':'マ ミ ム メ モ','n':'ナ ニ ヌ ネ ノ','s':'サ シ ス セ ソ','y':'ヤ イ ユ イェ ヨ','w':'ワ ウィ ウ ウェ ウォ','h':'ハ ヒ フ ヘ ホ','f':'ファ フィ フ フェ フォ','ng':'ンガ ンギ ング ンゲ ンゴ'}.items()}
vowels={'a':(0,''),'aa':(0,'ー'),'ai':(0,'イ'),'aai':(0,'ーイ'),'ao':(0,'オ'),'aao':(0,'ーオ'),'i':(1,''),'ii':(1,'ー'),'iu':(1,'ウ'),'iia':(1,'ア'),'ia':(1,'ア'),'iiao':(1,'アオ'),'iao':(1,'アオ'),'u':(2,''),'uu':(2,'ー'),'uua':(2,'ア'),'ua':(2,'ア'),'uuai':(2,'アイ'),'uai':(2,'アイ'),'ui':(2,'イ'),'uui':(2,'ーイ'),'ʉ':(2,''),'ʉʉ':(2,'ー'),'ʉʉa':(2,'ア'),'ʉa':(2,'ア'),'ʉʉai':(2,'アイ'),'e':(3,''),'ee':(3,'ー'),'ɛ':(3,''),'ɛɛ':(3,'ー'),'ə':(2,''),'əə':(2,'ー'),'əəi':(2,'ーイ'),'o':(4,''),'oo':(4,'ー'),'ɔ':(4,''),'ɔɔ':(4,'ー'),'ɔɔi':(4,'ーイ'),'ooi':(4,'ーイ'),'oi':(4,'イ'),'ɛɛo':(3,'ーオ'),'ɛo':(3,'オ'),'eeo':(3,'ーオ'),'eo':(3,'オ')}
def syllable(s):
 s=''.join(c for c in unicodedata.normalize('NFD',s) if not unicodedata.combining(c)).lower().strip('.,?!’\"()')
 if not s:return ''
 onset=re.match(r'^(khw|khr|khl|phr|phl|thr|pr|pl|tr|kr|kl|kw|ng|kh|ph|th|ch|[kgctpdbrlmnsywhfjv])',s)
 c=onset[0] if onset else '';v=s[len(c):]
 final=''
 if v not in vowels:
  end=re.search(r'(ng|[mnkptwyjlf])$',v)
  if end:final=end[0];v=v[:-len(final)]
 if v not in vowels:return ''
 prefix=''
 c={'kh':'k','ph':'p','th':'t','j':'c','v':'w'}.get(c,c)
 if len(c)>1 and c not in ['ch','ng']:
  prefix={'k':'ク','p':'プ','t':'トゥ'}.get(c[0],'');c=c[-1]
 if c not in rows:return ''
 i,tail=vowels[v];return prefix+rows[c][i]+tail+{'ng':'ン','n':'ン','m':'ム','k':'ク','t':'ト','p':'プ','w':'オ','y':'イ','j':'イ','l':'ル','f':'フ'}.get(final,'')
manual={'สวัสดี':['サワディー','サワッディー','サワディ'],'ขอบคุณ':['コップン','コープクン','コップクン','カップクン','コプクン'],'ครับ':['クラップ','カップ','クラプ'],'ค่ะ':['カー','カ'],'คะ':['カ','カァ'],'ใช่':['チャイ'],'ไม่':['マイ'],'กิน':['キン','ギン'],'อร่อย':['アロイ'],'อะไร':['アライ'],'เป็น':['ペン'],'เพื่อน':['プアン','プエアン'],'เหมือน':['ムアン','ムエアン'],'เริ่ม':['ルーム','ルー厶','ルァム'],'เจอ':['ジュー','ジャー','チュー'],'เธอ':['トゥー','ター'],'เปล่า':['プラオ','プラーオ'],'มาก':['マーク','マック'],'รัก':['ラック','ラク'],'น้ำ':['ナーム','ナム'],'ห้องน้ำ':['ホンナム','ホンナーム'],'ชอบ':['チョープ','チョップ'],'ครึ่งหนึ่ง':['クルンヌン','クルンヌング'],'ชิล':['チル','チウ'],'นอยด์':['ノイ'],'เซ็ง':['セン'],'กู':['グー','クー'],'มึง':['ムン'],'เงี่ยน':['ギアン','ンギアン'],'ควย':['クアイ','クワイ'],'ฟิว':['フィウ','フィル'],'555':['ハハハ'],'แป๊บนึง':['ペップヌン','ペップヌング'],'เดี๋ยว':['ディアオ','ディアウ'],'ให้':['ハイ'],'ทำให้':['タムハイ'],'เข้า':['カオ','カーオ'],'เลิก':['ルーク','ルァーク'],'เร็ว':['レオ','レウ'],'แบรนด์':['ブランド','ブレーン'],'ฟรี':['フリー'],'เคส':['ケース','ケート'],'โพสต์':['ポスト','ポート'],'บล็อก':['ブロック','ブロク'],'เบรก':['ブレーク','ブレク'],'ชีส':['チーズ','チート'],'บอส':['ボス','ボート'],'คลาส':['クラス','クラート']}
out={}
for w in words:
 generated=''.join(syllable(s) for s in re.split(r'[\s\-]+',w['ro']))
 variants=[generated,re.sub('ン([ガギグゲゴ])',lambda m:m[1],generated)]
 aliases=list(dict.fromkeys(variants+manual.get(w['th'],[])));out[w['id']]=[x for x in aliases if x]
assert all(out.values()),[w['th'] for w in words if not out[w['id']]]
(P/'dist/kana-search.js').write_text('// Search aliases only: approximate Japanese spellings; the tone romanization remains the pronunciation guide.\nconst WORD_KANA='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\nconst WORD_LIBRARY='+json.dumps({'unique':len(set(w['th'] for w in words)),'general':sum(not w.get('generalHidden') for w in words if w.get('collection')!='slang'),'slang':sum(w.get('collection')=='slang' for w in words)},separators=(',',':'))+';\n')
print('Kana search aliases:',len(out))
