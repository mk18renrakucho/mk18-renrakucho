// 北高 連絡帳 Service Worker
const CACHE_NAME = 'mk18-v1';
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

  e.respondWith(
    fetch(e.request)
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
