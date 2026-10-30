const CACHE_NAME = 'tungkinh3-offline-v2';

// Chỉ đưa các file cốt lõi chắc chắn tồn tại vào danh sách cài đặt ban đầu.
// Các cặp file .mp3 và .srt/.txt sẽ được tự động lưu vào Cache ngay khi người dùng chọn bài!
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './IPA.txt',
    './practice.js',
    './practice.css',
    './tracks.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // Lưu từng file độc lập để tránh lỗi 1 file thiếu làm hỏng toàn bộ Service Worker
            for (const asset of CORE_ASSETS) {
                try {
                    await cache.add(asset);
                } catch (err) {
                    console.warn('Bỏ qua file chưa tồn tại khi cài đặt:', asset);
                }
            }
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (key.startsWith('tungkinh3-offline-') && key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Chỉ xử lý các yêu cầu GET
    if (event.request.method !== 'GET') return;

    const reqUrl = new URL(event.request.url);
    const lowerPath = reqUrl.pathname.toLowerCase();

    // 1. Với yêu cầu quét danh sách file từ GitHub API:
    // Ưu tiên lấy mạng (Network-First) và lưu vào Cache theo URL gốc (bỏ ?t=...) để khi Offline vẫn có danh sách bài
    if (reqUrl.hostname === 'api.github.com') {
        const cleanApiUrl = reqUrl.origin + reqUrl.pathname;
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(cleanApiUrl, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(cleanApiUrl))
        );
        return;
    }

    // 2. MP3: cache bản đầy đủ để phát offline. Hỗ trợ HTTP Range (206) khi tua/nhảy câu.
    if (lowerPath.endsWith('.mp3')) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            let response = await cache.match(reqUrl.origin + reqUrl.pathname, { ignoreSearch: true });
            if (!response) {
                try {
                    // Bỏ Range để tải nguyên MP3, phục vụ cả lần phát sau khi offline.
                    response = await fetch(event.request.url);
                    if (response.ok && response.status === 200) {
                        await cache.put(reqUrl.origin + reqUrl.pathname, response.clone());
                    }
                } catch (err) {
                    return new Response('MP3 chưa được lưu offline', { status: 503 });
                }
            }
            const range = event.request.headers.get('range');
            if (!range || response.status !== 200) return response;
            const match = range.match(/^bytes=(\d*)-(\d*)$/);
            if (!match) return response;
            const data = await response.arrayBuffer();
            const size = data.byteLength;
            const suffix = !match[1];
            const startByte = suffix ? Math.max(0, size - Number(match[2])) : Number(match[1]);
            const endByte = suffix ? size - 1 : match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
            if (!size || startByte >= size || endByte < startByte) {
                return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
            }
            const chunk = data.slice(startByte, endByte + 1);
            return new Response(chunk, {
                status: 206,
                headers: {
                    'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
                    'Content-Length': String(chunk.byteLength),
                    'Content-Range': `bytes ${startByte}-${endByte}/${size}`,
                    'Accept-Ranges': 'bytes'
                }
            });
        })());
        return;
    }

    // 3. Với file code (index.html), từ điển (IPA.txt) và phụ đề (.srt, .txt):
    // Có mạng là tải bản mới nhất về và cập nhật bộ nhớ (Network-First), mất mạng thì lấy từ Cache.
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request, { ignoreSearch: true });
            })
    );
});
