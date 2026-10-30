// 北高 連絡帳 Service Worker
// v1.2.14：保存の名前を更新。あわせて、画面ファイルを取りに行くときにブラウザ側の一時保存（GitHub Pagesは約10分）を
//   飛ばして、毎回サーバーに「更新があるか」を確認するようにした（cache:'no-cache'）。
// v1.2.16：足跡（出没レーダーの写真つき近況）を追加したため、保存の名前を更新。
// v1.2.17：足跡の写真選択の不具合対応（index_full.html）。保存の名前を更新。
// v1.2.18：足跡の全画面ビューア（左右のスライド）を追加。保存の名前を更新。
// v1.2.19：足跡の一覧のカードにサムネイルを並べる表示に変更。保存の名前を更新。
// v1.2.20：足跡の全画面ビューアを、タップした足跡の写真だけで終わるように修正。保存の名前を更新。
// v1.2.21：足跡にコメントを追加、場所の選択肢に四国4県を追加。保存の名前を更新。
// v1.2.22：足跡のコメントを、見つけやすく・入れやすく変更（index_full.html）。保存の名前を更新。
// v1.2.23：消す操作の確認を、アプリ内の確認画面に変更（index_full.html）。保存の名前を更新。
// v1.2.24：足跡のカードに、最新のコメントを1行だけ表示（index_full.html）。保存の名前を更新。
// v1.2.25：入口の土台工事（招待コード・noindex）。register.html／welcome.html／index_full.htmlを更新したため、保存の名前を更新。
// v1.2.26：近況更新の不具合を修正（Code_full.gs）、本人確認の専用画面と閲覧の鍵を追加（index_full.html／Code_full.gs）。register.html／welcome.htmlは版数の表記のみ。保存の名前を更新。
// v1.2.27：コードの中の誕生日の復元用データと復元処理を削除（Code_full.gs）。ほかのファイルは版数の表記のみ。保存の名前を更新。
const CACHE_NAME = 'mk18-v1.2.27';
const STATIC_ASSETS = [
  '/mk18-renrakucho/',
  '/mk18-renrakucho/index.html',
  '/mk18-renrakucho/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/3.19.0/iconfont/tabler-icons.min.css'
];

// インストール：静的ファイルをキャッシュ
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// アクティベート：古いキャッシュを削除
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// フェッチ：ネットワーク優先、失敗時はキャッシュ
self.addEventListener('fetch', function(e) {
  // GAS APIはキャッシュしない（常にネットワーク）
  if (e.request.url.includes('script.google.com')) {
    return;
  }
  // 取得（GET）以外は、Service Workerでは扱わない
  if (e.request.method !== 'GET') {
    return;
  }

  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(function(res) {
        // 成功したらキャッシュも更新
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return res;
      })
      .catch(function() {
        // オフライン時はキャッシュから返す
        return caches.match(e.request);
      })
  );
});

// プッシュ通知受信（OneSignal連携時に使用）
self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  var title = data.title || '北高 連絡帳';
  var options = {
    body: data.body || '新しいお知らせがあります',
    icon: '/mk18-renrakucho/icons/icon-192.png',
    badge: '/mk18-renrakucho/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/mk18-renrakucho/' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// 通知タップで該当ページを開く
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.openWindow(e.notification.data.url || '/mk18-renrakucho/')
  );
});
