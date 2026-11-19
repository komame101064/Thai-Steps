// Thai Steps の収益化の設定。空欄のものは画面に出ません（未設定なら何も表示しない）。
// 値を入れたら dist/index.html の ?v= を上げて公開してください。
const SUPPORT_CONFIG={
  // 応援（寄付）ページのURL。例：Ko-fi・OFUSE・pixivFANBOX・Buy Me a Coffee・GitHub Sponsors のページ。
  supportUrl:'',
  supportName:'',            // 表示するサービス名（例 'Ko-fi'）。空なら「応援ページ」
  // Amazonアソシエイトのトラッキングタグ（例 'thaisteps-22'）。入れると下の教材リンクに付きます。
  amazonTag:'',
  // おすすめ教材。q はAmazonの検索語（特定の商品ではなく検索結果へ案内）、url を書けばそちらを使う。
  materials:[
    {title:'タイ語の入門書・文法書',q:'タイ語 入門 文法',note:'アプリの文法の課と並行して、体系的に読む一冊に。'},
    {title:'タイ語の単語帳（音声付き）',q:'タイ語 単語帳 音声',note:'声調を耳で確かめながら覚えたい人に。'},
    {title:'タイ語の会話フレーズ集',q:'タイ語 会話 フレーズ',note:'旅行・生活の場面別に使える表現を増やす。'},
    {title:'タイ文字の練習帳',q:'タイ文字 練習帳',note:'書き方練習のシートと合わせて。'},
    {title:'タイ語の辞書',q:'タイ語 辞書',note:'用例が多い紙・電子の辞書。'}
  ],
  // オンライン家庭教師などの紹介リンク（任意）。{title,url,note} を並べる。
  extraLinks:[]
};
