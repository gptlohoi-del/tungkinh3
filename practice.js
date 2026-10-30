/*
 * tungkinh3 — spoken-sentence trainer. Standalone vanilla JS (no servers or external libs).
 * Dependencies from the original index.html: media, sentences, availableTracks,
 * trackSelector, resetAB, stopSentenceLoop, updateMainSubtitle, updateHighlight.
 */
(() => {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const DB_NAME = 'tungkinh3-recordings-v1';
    const SETTINGS_KEY = 'tungkinh3-practice-settings-v1';
    const defaults = { selfPause: 2, comparePause: 1.5, repeatCount: 0, padding: 0.10,
        autoReplay: true, storageMode: 'latest', storageLocation: 'app' };
    const cfg = { ...defaults };
    let dbPromise;
    let folderHandle = null;

    function openDB() {
        if (!('indexedDB' in window)) return Promise.reject(new Error('Thiết bị không hỗ trợ IndexedDB'));
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, 1);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    const records = db.createObjectStore('recordings', { keyPath: 'id' });
                    records.createIndex('bySentence', 'trackSentence', { unique: false });
                    db.createObjectStore('metadata');
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error || new Error('Không mở được bộ nhớ'));
                req.onblocked = () => reject(new Error('Bộ nhớ đang được dùng ở tab khác'));
            }).catch(err => { dbPromise = null; throw err; });
        }
        return dbPromise;
    }

    async function dbGetAll(storeName, indexName, key) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = indexName ? store.index(indexName).getAll(key) : store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }
    async function dbGetMeta(key) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const req = db.transaction('metadata').objectStore('metadata').get(key);
            req.onsuccess = () => resolve(req.result?.value || null);
            req.onerror = () => reject(req.error);
        });
    }
    async function dbPutMeta(key, value) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('metadata', 'readwrite');
            tx.objectStore('metadata').put({ key, value });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }
    async function dbDelete(id) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('recordings', 'readwrite');
            tx.objectStore('recordings').delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }
    async function dbSave(record, mode) {
        const db = await openDB();
        const existing = mode === 'latest' ? await dbGetAll('recordings', 'bySentence', record.trackSentence) : [];
        return new Promise((resolve, reject) => {
            const tx = db.transaction('recordings', 'readwrite');
            const store = tx.objectStore('recordings');
            for (const old of existing) store.delete(old.id);
            store.put(record);
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }

    function keepBetween(value, min, max, fallback) {
        const n = Number(value);
        return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    }
    function loadSettings() {
        try {
            const loaded = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
            if (loaded && typeof loaded === 'object') Object.assign(cfg, loaded);
        } catch (_) { /* storage can be disabled */ }
        cfg.selfPause = keepBetween(cfg.selfPause, 0, 10, 2);
        cfg.comparePause = keepBetween(cfg.comparePause, 0, 10, 1.5);
        cfg.padding = keepBetween(cfg.padding, 0, 1, .10);
        cfg.repeatCount = [0, 5, 10].includes(Number(cfg.repeatCount)) ? Number(cfg.repeatCount) : 0;
        if (!['temporary', 'latest', 'multiple'].includes(cfg.storageMode)) cfg.storageMode = 'latest';
        if (!['app', 'folder'].includes(cfg.storageLocation)) cfg.storageLocation = 'app';
        cfg.autoReplay = cfg.autoReplay !== false;
        $('practiceSelfPause').value = cfg.selfPause;
        $('practiceComparePause').value = cfg.comparePause;
        $('practiceRepeatCount').value = cfg.repeatCount;
        $('practiceSamplePadding').value = cfg.padding;
        $('practiceAutoReplay').checked = cfg.autoReplay;
        document.querySelector(`input[name="practiceStorageMode"][value="${cfg.storageMode}"]`).checked = true;
        document.querySelector(`input[name="practiceStorageLocation"][value="${cfg.storageLocation}"]`).checked = true;
        updateStorageUI();
    }
    function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(cfg)); } catch (_) {} }
    function updateStorageUI() {
        $('practiceLocationSettings').hidden = cfg.storageMode === 'temporary';
        $('practiceChooseFolderBtn').disabled = cfg.storageLocation !== 'folder' || cfg.storageMode === 'temporary';
        $('practiceChooseFolderBtn').hidden = cfg.storageLocation !== 'folder' || cfg.storageMode === 'temporary';
        if (cfg.storageLocation === 'folder' && cfg.storageMode !== 'temporary' && !window.showDirectoryPicker) {
            $('practiceFolderStatus').textContent = 'Trình duyệt này không hỗ trợ chọn thư mục để tự ghi. Bản ghi vẫn lưu trong ứng dụng; hãy dùng Xuất tất cả hoặc nút tải bản ghi.';
        } else if (cfg.storageLocation === 'folder' && cfg.storageMode !== 'temporary') {
            $('practiceFolderStatus').textContent = folderHandle ? `Thư mục: ${folderHandle.name}. Nếu quyền hết hạn, hãy chọn lại thư mục.` : 'Nhấn “Chọn thư mục lưu” để cấp quyền. Nếu không khả dụng, vẫn có thể xuất bản ghi.';
        } else {
            $('practiceFolderStatus').textContent = 'Bản ghi được lưu trong bộ nhớ riêng của ứng dụng. Có thể xuất ra Files / Downloads khi cần.';
        }
    }
    function safeName(str) {
        const out = String(str || 'BaiKinh').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
        return out || 'BaiKinh';
    }
    function extensionFor(type) {
        if (type.includes('ogg')) return 'ogg';
        if (type.includes('mp4') || type.includes('aac')) return 'm4a';
        if (type.includes('mpeg')) return 'mp3';
        return 'webm';
    }
    function buildName(track, index, createdAt, mime, latest = false) {
        const stamp = new Date(createdAt).toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
        return `${safeName(track)}_Cau${String(index + 1).padStart(3, '0')}${latest ? '_GanNhat' : '_' + stamp}_${String(createdAt).slice(-3)}.${extensionFor(mime)}`;
    }
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.style.display = 'none';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }

    // ZIP (STORE, no compression) permits offline “Xuất tất cả” without libraries or network.
    const zipCrcTable = (() => {
        const t = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : c >>> 1;
            t[n] = c >>> 0;
        }
        return t;
    })();
    function crc32(data) {
        let crc = -1;
        for (const b of data) crc = zipCrcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
        return (crc ^ -1) >>> 0;
    }
    function zipHeader(size) { return new DataView(new ArrayBuffer(size)); }
    function zipArchive(entries) {
        const encoder = new TextEncoder();
        return (async () => {
            const files = [], directory = [];
            let offset = 0;
            for (const entry of entries) {
                const bytes = new Uint8Array(await entry.blob.arrayBuffer());
                if (bytes.byteLength > 0xffffffff) throw new Error('Một bản ghi quá lớn để xuất ZIP');
                const name = encoder.encode(entry.name);
                const sum = crc32(bytes);
                const local = zipHeader(30);
                local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true);
                local.setUint16(6, 0x0800, true); // UTF-8 name
                local.setUint16(8, 0, true); local.setUint32(14, sum, true);
                local.setUint32(18, bytes.length, true); local.setUint32(22, bytes.length, true);
                local.setUint16(26, name.length, true);
                files.push(local.buffer, name, bytes);
                const central = zipHeader(46);
                central.setUint32(0, 0x02014b50, true);
                central.setUint16(4, 20, true); central.setUint16(6, 20, true);
                central.setUint16(8, 0x0800, true); central.setUint16(10, 0, true);
                central.setUint32(16, sum, true); central.setUint32(20, bytes.length, true);
                central.setUint32(24, bytes.length, true); central.setUint16(28, name.length, true);
                central.setUint32(42, offset, true);
                directory.push(central.buffer, name);
                offset += 30 + name.length + bytes.length;
            }
            if (entries.length > 65535 || offset > 0xffffffff) throw new Error('Bộ bản ghi quá lớn để xuất ZIP');
            const centralSize = directory.reduce((n, part) => n + part.byteLength, 0);
            const end = zipHeader(22);
            end.setUint32(0, 0x06054b50, true);
            end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
            end.setUint32(12, centralSize, true); end.setUint32(16, offset, true);
            return new Blob([...files, ...directory, end.buffer], { type: 'application/zip' });
        })();
    }

    const trainer = {
        index: -1,
        track: '',
        session: null,
        sessionUrl: null,
        recorder: null,
        stream: null,
        recState: 'idle',
        playMode: 'idle',
        generation: 0,
        recordingGeneration: 0,
        timer: 0,
        sampleTimer: 0,
        cycles: 0,
        selfAudio: null,
        expectedSelfPlay: false,
        sampleEnd: 0,
        message(text, error = false) {
            $('practiceStatus').textContent = text;
            $('practiceStatus').classList.toggle('error', error);
        },
        trackName() { return availableTracks[Number(trackSelector.value)]?.mp3Name || availableTracks[Number(trackSelector.value)]?.title || ''; },
        sentenceKey() { return JSON.stringify([this.track, this.index]); },
        ownsSamplePlayback() { return this.playMode === 'sample' || this.playMode === 'compare'; },
        onListRendered() { document.querySelectorAll('.sentence-item.practicing').forEach(el => el.classList.remove('practicing')); if (this.index >= 0) $('sentence-' + this.index)?.classList.add('practicing'); },
        beforeTrackChange() {
            if (this.recState !== 'idle') {
                this.message('Hãy kết thúc REC trước khi đổi bài để không mất bản thu.', true);
                const old = availableTracks.findIndex(t => t.mp3Name === this.track || t.title === this.track);
                if (old >= 0) trackSelector.value = String(old);
                return false;
            }
            return true;
        },
        onTrackChange() {
            // The track picker runs before subtitles from the new track have loaded.
            this.cancelRecording(); this.stop(); this.index = -1; this.track = '';
            this.replaceSession(null);
            this.render();
            $('practiceHistoryList').textContent = 'Chưa chọn câu.';
        },
        onSentencesChanged() {
            this.cancelRecording(); this.stop(); this.index = -1; this.replaceSession(null);
            if (sentences.length) this.select(0, { scroll: false });
            else { this.render(); }
        },
        render() {
            const s = sentences[this.index];
            $('practiceTargetNumber').textContent = s ? `Câu ${this.index + 1} / ${sentences.length}` : 'Chưa chọn câu';
            $('practiceTargetEng').textContent = s?.text || 'Hãy chọn một câu để luyện đọc.';
            $('practiceTargetIpa').textContent = s?.ipa ? '/' + s.ipa + '/' : '';
            $('practiceTargetVn').textContent = s?.vnText || '';
            // Buttons remain next to the active sentence (important on long 86+ sentence lessons).
            // Disable them while recording so navigation cannot discard an unfinished take.
            $('practicePrevBtn').disabled = !s || this.index === 0 || this.recState !== 'idle';
            $('practiceNextBtn').disabled = !s || this.index >= sentences.length - 1 || this.recState !== 'idle';
            $('practiceRecBtn').disabled = !s || this.recState === 'starting' || this.recState === 'stopping';
            $('practiceRecBtn').classList.toggle('recording', this.recState === 'recording');
            $('practiceRecBtn').textContent = this.recState === 'recording' ? '⏹ Kết thúc REC' : '🎙 REC';
            $('practiceRecBtn').setAttribute('aria-label', this.recState === 'recording' ? 'Kết thúc ghi âm' : 'Bắt đầu ghi âm');
            $('practiceSampleBtn').disabled = !s || this.recState !== 'idle';
            $('practiceCompareBtn').disabled = !s || !this.session || this.recState !== 'idle';
            $('practiceSelfBtn').disabled = !this.session || this.recState !== 'idle';
            $('practiceDownloadBtn').disabled = !this.session || this.recState !== 'idle';
            $('practiceSelfAudio').style.display = this.session ? 'block' : 'none';
            this.onListRendered();
        },
        replaceSession(record) {
            if (this.sessionUrl) URL.revokeObjectURL(this.sessionUrl);
            this.session = record;
            this.sessionUrl = record?.blob ? URL.createObjectURL(record.blob) : null;
            this.selfAudio.pause();
            this.selfAudio.removeAttribute('src');
            if (this.sessionUrl) this.selfAudio.src = this.sessionUrl;
            this.selfAudio.load();
            this.render();
        },
        async select(index, opts = {}) {
            if (!sentences[index]) return;
            if (this.recState !== 'idle') { this.message('Hãy kết thúc REC trước khi chuyển câu.', true); return; }
            this.stop();
            media.pause();
            stopSentenceLoop(); resetAB();
            this.track = this.trackName();
            this.index = index;
            this.replaceSession(null);
            currentSentenceIndex = index;
            updateMainSubtitle(sentences[index].text, sentences[index].ipa, sentences[index].vnText);
            updateHighlight(index);
            this.message(`Đã chọn câu ${index + 1}. Nhấn REC để đọc.`);
            const token = ++this.generation;
            await this.refreshHistory(token, true);
            if (!opts.scroll) return;
            $('practicePanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        stop() {
            this.generation++;
            clearTimeout(this.timer); clearInterval(this.sampleTimer);
            this.timer = 0; this.sampleTimer = 0;
            const oldMode = this.playMode;
            this.playMode = 'idle';
            this.cycles = 0;
            this.expectedSelfPlay = false;
            this.selfAudio.pause();
            if (oldMode === 'sample' || oldMode === 'compare') media.pause();
        },
        cancelRecording() {
            // Used for track replacement; never save a partial recording to the wrong sentence.
            ++this.recordingGeneration;
            if (this.recorder && this.recorder.state !== 'inactive') {
                this.recorder.ondataavailable = null; this.recorder.onstop = null;
                try { this.recorder.stop(); } catch (_) {}
            }
            this.stream?.getTracks().forEach(t => t.stop());
            this.stream = null; this.recorder = null; this.recState = 'idle';
        },
        async toggleRecord() {
            if (this.recState === 'recording') { this.finishRecording(); return; }
            if (this.recState !== 'idle') return;
            if (this.index < 0) { this.message('Hãy chọn một câu để luyện.', true); return; }
            if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder || !window.isSecureContext) {
                this.message('Ghi âm yêu cầu Chrome trên HTTPS hoặc localhost và quyền microphone.', true);
                return;
            }
            this.stop(); stopSentenceLoop(); resetAB(); media.pause();
            this.recState = 'starting'; this.render();
            this.message('Đang xin quyền sử dụng microphone…');
            const token = ++this.recordingGeneration;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
                if (token !== this.recordingGeneration) { stream.getTracks().forEach(t => t.stop()); return; }
                this.stream = stream;
                const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
                    .find(t => MediaRecorder.isTypeSupported(t));
                const recorder = type ? new MediaRecorder(stream, { mimeType: type }) : new MediaRecorder(stream);
                this.recorder = recorder;
                const chunks = [];
                const originTrack = this.track;
                const originIndex = this.index;
                recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
                recorder.onerror = () => this.message('Ghi âm bị lỗi. Hãy thử lại.', true);
                recorder.onstop = () => this.processRecording(token, chunks, recorder.mimeType, originTrack, originIndex);
                recorder.start();
                this.recState = 'recording'; this.render();
                this.message('🔴 Đang ghi âm… Nhấn KẾT THÚC REC khi đọc xong.');
            } catch (e) {
                if (token !== this.recordingGeneration) return;
                this.stream?.getTracks().forEach(t => t.stop());
                this.stream = null; this.recorder = null; this.recState = 'idle'; this.render();
                this.message(e?.name === 'NotAllowedError' ? 'Microphone bị từ chối. Hãy cấp quyền trong cài đặt Chrome.' : `Không thể ghi âm: ${e.message || e}`, true);
            }
        },
        finishRecording() {
            if (this.recState !== 'recording' || !this.recorder) return;
            this.recState = 'stopping'; this.render();
            this.message('Đang hoàn tất bản ghi…');
            try { this.recorder.stop(); } catch (e) {
                this.cancelRecording(); this.render(); this.message('Không thể kết thúc REC: ' + e.message, true);
            }
        },
        async processRecording(token, chunks, mime, originalTrack, originalIndex) {
            this.stream?.getTracks().forEach(t => t.stop());
            this.stream = null; this.recorder = null;
            if (token !== this.recordingGeneration || this.track !== originalTrack || this.index !== originalIndex) return;
            this.recState = 'idle';
            const blob = new Blob(chunks, { type: mime || chunks[0]?.type || 'audio/webm' });
            if (!blob.size) { this.render(); this.message('Bản ghi rỗng. Hãy thử lại.', true); return; }
            const stamp = Date.now();
            const record = { id: `${stamp}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`,
                track: originalTrack, index: originalIndex, trackSentence: this.sentenceKey(),
                sentenceText: sentences[originalIndex].text, blob, mimeType: blob.type, createdAt: stamp,
                name: buildName(originalTrack, originalIndex, stamp, blob.type, cfg.storageMode === 'latest') };
            this.stop(); this.replaceSession(record);
            this.message('✅ Đã thu xong. Đang nghe giọng của bạn…');
            // Playback begins BEFORE IndexedDB/file writes, minimizing latency.
            if (cfg.autoReplay) void this.startSelfLoop();
            else this.message('✅ Đã thu xong. Nhấn “Nghe lại giọng mình” để phát.');
            if (cfg.storageMode !== 'temporary') {
                try {
                    await dbSave(record, cfg.storageMode);
                    await this.refreshHistory(this.generation, false);
                    if (cfg.storageLocation === 'folder') {
                        const synced = await this.writeToFolder(record);
                        if (!synced) this.message('Đã lưu trong ứng dụng. Chưa ghi được ra thư mục; mở Settings để cấp quyền hoặc xuất file.');
                    }
                } catch (err) {
                    this.message('Đã thu âm nhưng không lưu được trên thiết bị (' + err.message + '). Hãy dùng nút “Lưu bản ghi hiện tại”.', true);
                }
            } else { void this.refreshHistory(this.generation, false); }
        },
        async refreshHistory(token, loadLatest = false) {
            if (this.index < 0 || !this.track) return;
            const key = this.sentenceKey();
            let results = [];
            try { results = await dbGetAll('recordings', 'bySentence', key); }
            catch (e) {
                if (token === this.generation) $('practiceHistoryList').textContent = 'Không đọc được bộ nhớ trên thiết bị.';
                return;
            }
            if (token !== this.generation || this.sentenceKey() !== key) return;
            results.sort((a,b) => b.createdAt - a.createdAt);
            if (loadLatest && results.length && !this.session) this.replaceSession(results[0]);
            const box = $('practiceHistoryList');
            box.replaceChildren();
            if (!results.length) { box.textContent = 'Chưa có bản ghi đã lưu cho câu này.'; return; }
            for (const record of results) {
                const entry = document.createElement('div'); entry.className = 'practice-history-entry';
                const heading = document.createElement('div'); heading.className = 'practice-history-title';
                heading.textContent = new Date(record.createdAt).toLocaleString('vi-VN') + ` · ${Math.max(1, Math.round(record.blob.size / 1024))} KB`;
                const actions = document.createElement('div'); actions.className = 'practice-history-actions';
                for (const [label, handler] of [
                    ['▶ Nghe', () => { this.stop(); this.replaceSession(record); void this.startSelfLoop(); }],
                    ['⬇ Xuất', () => downloadBlob(record.blob, record.name)],
                    ['🗑 Xóa', async () => {
                        if (!confirm('Xóa bản ghi này khỏi bộ nhớ ứng dụng?')) return;
                        this.stop(); await dbDelete(record.id);
                        if (this.session?.id === record.id) this.replaceSession(null);
                        await this.refreshHistory(this.generation);
                    }]
                ]) {
                    const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = label;
                    btn.addEventListener('click', handler); actions.appendChild(btn);
                }
                entry.append(heading, actions); box.appendChild(entry);
            }
        },
        async startSelfLoop() {
            if (!this.session || this.recState !== 'idle') return;
            this.stop(); stopSentenceLoop(); resetAB(); media.pause();
            this.playMode = 'self'; this.cycles = 0;
            const token = this.generation;
            await this.playSelfSegment(token);
        },
        async playSampleOnce() {
            if (this.index < 0 || this.recState !== 'idle') return;
            this.stop(); stopSentenceLoop(); resetAB();
            this.playMode = 'sample';
            await this.playSampleSegment(this.generation);
        },
        async startCompare() {
            if (!this.session || this.recState !== 'idle') return;
            this.stop(); stopSentenceLoop(); resetAB();
            this.playMode = 'compare'; this.cycles = 0;
            this.message('🔁 So sánh: giọng mẫu → giọng bạn → lặp.');
            await this.playSampleSegment(this.generation);
        },
        async playSampleSegment(token) {
            if (token !== this.generation || !['sample', 'compare'].includes(this.playMode)) return;
            const s = sentences[this.index]; if (!s) return;
            this.selfAudio.pause();
            const pad = cfg.padding;
            const start = Math.max(0, s.start - pad);
            this.sampleEnd = s.end + pad;
            try {
                media.pause(); media.currentTime = start;
                // On mobile timeupdate can skip a boundary; interval keeps short clips accurate.
                await media.play();
                if (token !== this.generation) { media.pause(); return; }
                this.message(this.playMode === 'sample' ? '🔊 Đang nghe câu mẫu…' : '🔊 Giọng mẫu… Tiếp theo là giọng bạn.');
                this.sampleTimer = setInterval(() => {
                    if (token !== this.generation) return;
                    if (media.currentTime >= this.sampleEnd - .035 || media.ended) this.sampleFinished(token);
                }, 35);
            } catch (_) {
                if (token !== this.generation) return;
                this.stop(); this.message('Không thể tự phát MP3. Hãy nhấn “Nghe mẫu” lần nữa.', true);
            }
        },
        sampleFinished(token) {
            if (token !== this.generation) return;
            clearInterval(this.sampleTimer); this.sampleTimer = 0;
            media.pause();
            if (this.playMode === 'sample') { this.playMode = 'idle'; this.message('Đã nghe xong câu mẫu.'); return; }
            if (this.playMode === 'compare') this.schedule(token, cfg.comparePause, () => this.playSelfSegment(token));
        },
        async playSelfSegment(token) {
            if (token !== this.generation || !['self', 'compare'].includes(this.playMode) || !this.session) return;
            media.pause();
            try {
                this.selfAudio.pause(); this.selfAudio.currentTime = 0;
                this.expectedSelfPlay = true;
                await this.selfAudio.play();
                if (token !== this.generation) { this.selfAudio.pause(); return; }
                this.message(this.playMode === 'self' ? '🎧 Đang nghe giọng của bạn (tự lặp)…' : '🎤 Giọng của bạn… Tiếp theo là giọng mẫu.');
            } catch (_) {
                if (token !== this.generation) return;
                this.expectedSelfPlay = false;
                this.stop();
                this.message('Trình duyệt chặn phát tự động. Nhấn ▶ trên trình phát bản ghi để nghe.', true);
            }
        },
        selfFinished() {
            if (!['self', 'compare'].includes(this.playMode)) return;
            const token = this.generation;
            this.cycles++;
            if (cfg.repeatCount && this.cycles >= cfg.repeatCount) {
                this.stop(); this.message('✅ Đã hoàn tất số lần lặp.'); return;
            }
            if (this.playMode === 'self') this.schedule(token, cfg.selfPause, () => this.playSelfSegment(token));
            else this.schedule(token, cfg.comparePause, () => this.playSampleSegment(token));
        },
        schedule(token, seconds, action) {
            this.message(`⏳ Nghỉ ${seconds} giây…`);
            clearTimeout(this.timer);
            this.timer = setTimeout(() => { if (token === this.generation) void action(); }, seconds * 1000);
        },
        async chooseFolder() {
            if (!window.showDirectoryPicker) { this.message('Trình duyệt không hỗ trợ chọn thư mục. Hãy xuất file về Downloads.', true); return; }
            try {
                // MUST be called directly from a user click to preserve user activation.
                const handle = await window.showDirectoryPicker({ id: 'tungkinh3-recordings', mode: 'readwrite' });
                folderHandle = handle;
                await dbPutMeta('folderHandle', handle);
                updateStorageUI();
                this.message(`✅ Đã chọn thư mục ${handle.name}. Ghi âm tiếp để tự lưu tại đây.`);
            } catch (e) {
                if (e.name !== 'AbortError') this.message('Không chọn được thư mục: ' + e.message + '. Vẫn có thể lưu trong ứng dụng.', true);
            }
        },
        async writeToFolder(record) {
            if (!folderHandle) {
                try { folderHandle = await dbGetMeta('folderHandle'); } catch (_) {}
            }
            if (!folderHandle) return false;
            try {
                if ((await folderHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') return false;
                const file = await folderHandle.getFileHandle(record.name, { create: true });
                const writer = await file.createWritable();
                await writer.write(record.blob); await writer.close();
                return true;
            } catch (e) { console.warn('Không thể lưu vào thư mục:', e); return false; }
        },
        async exportAll() {
            const btn = $('practiceExportAllBtn'); btn.disabled = true;
            try {
                const records = await dbGetAll('recordings');
                if (!records.length) { this.message('Chưa có bản ghi đã lưu để xuất.'); return; }
                const total = records.reduce((n, r) => n + r.blob.size, 0);
                if (total > 80 * 1024 * 1024 && !confirm('Có nhiều bản ghi, file ZIP có thể lớn. Bạn muốn tiếp tục?')) return;
                this.message(`Đang đóng gói ${records.length} bản ghi…`);
                const entries = records.map(r => ({ name: `${safeName(r.track)}/${r.name}`, blob: r.blob }));
                const info = `tungkinh3 — Sao luu ghi am\nSo ban ghi: ${records.length}\nNgay xuat: ${new Date().toLocaleString('vi-VN')}\nKhong tai len may chu.\n`;
                entries.push({ name: 'README.txt', blob: new Blob([info], { type: 'text/plain' }) });
                const zip = await zipArchive(entries);
                downloadBlob(zip, `tungkinh3_BanGhi_${new Date().toISOString().slice(0, 10)}.zip`);
                this.message(`✅ Đã tạo ZIP gồm ${records.length} bản ghi. Kiểm tra Downloads/Files trên Android.`);
            } catch (e) { this.message('Không xuất được ZIP: ' + e.message, true); }
            finally { btn.disabled = false; }
        },
        async init() {
            this.selfAudio = $('practiceSelfAudio');
            loadSettings();
            $('practicePrevBtn').addEventListener('click', () => {
                if (this.index > 0) void this.select(this.index - 1, { scroll: false });
            });
            $('practiceNextBtn').addEventListener('click', () => {
                if (this.index >= 0 && this.index < sentences.length - 1) void this.select(this.index + 1, { scroll: false });
            });
            $('practiceSampleBtn').addEventListener('click', () => this.playSampleOnce());
            $('practiceRecBtn').addEventListener('click', () => this.toggleRecord());
            $('practiceCompareBtn').addEventListener('click', () => this.startCompare());
            $('practiceSelfBtn').addEventListener('click', () => this.startSelfLoop());
            $('practiceStopBtn').addEventListener('click', () => {
                if (this.recState === 'recording') { this.message('Nhấn “Kết thúc REC” để hoàn tất ghi âm.'); return; }
                this.stop(); this.message('Đã dừng phát.');
            });
            $('practiceDownloadBtn').addEventListener('click', () => {
                if (this.session) downloadBlob(this.session.blob, this.session.name);
            });
            this.selfAudio.addEventListener('ended', () => this.selfFinished());
            this.selfAudio.addEventListener('play', () => {
                if (this.recState !== 'idle') { this.selfAudio.pause(); return; }
                if (this.expectedSelfPlay) { this.expectedSelfPlay = false; return; }
                // Native Play on the audio bar is a manual ONE-SHOT, not a second concurrent loop.
                this.generation++; clearTimeout(this.timer); clearInterval(this.sampleTimer);
                this.timer = 0; this.sampleTimer = 0;
                this.playMode = 'idle'; this.cycles = 0;
                stopSentenceLoop(); resetAB(); media.pause();
                this.message('▶ Đang phát thủ công bản ghi. Nhấn “Nghe lại” để bật lặp.');
            });
            media.addEventListener('ended', () => {
                if (this.playMode === 'sample' || this.playMode === 'compare') this.sampleFinished(this.generation);
            });
            media.addEventListener('play', () => {
                if (this.playMode === 'self') this.stop();
            });
            for (const id of ['practiceSelfPause', 'practiceComparePause', 'practiceRepeatCount', 'practiceSamplePadding', 'practiceAutoReplay']) {
                $(id).addEventListener('change', () => {
                    cfg.selfPause = keepBetween($('practiceSelfPause').value, 0, 10, 2);
                    cfg.comparePause = keepBetween($('practiceComparePause').value, 0, 10, 1.5);
                    cfg.repeatCount = Number($('practiceRepeatCount').value);
                    cfg.padding = keepBetween($('practiceSamplePadding').value, 0, 1, .1);
                    cfg.autoReplay = $('practiceAutoReplay').checked;
                    $('practiceSelfPause').value = cfg.selfPause;
                    $('practiceComparePause').value = cfg.comparePause;
                    $('practiceSamplePadding').value = cfg.padding;
                    saveSettings();
                });
            }
            document.querySelectorAll('[name="practiceStorageMode"]').forEach(input => input.addEventListener('change', () => {
                cfg.storageMode = input.value; saveSettings(); updateStorageUI();
            }));
            document.querySelectorAll('[name="practiceStorageLocation"]').forEach(input => input.addEventListener('change', () => {
                cfg.storageLocation = input.value; saveSettings(); updateStorageUI();
            }));
            $('practiceChooseFolderBtn').addEventListener('click', () => this.chooseFolder());
            $('practiceExportAllBtn').addEventListener('click', () => this.exportAll());
            try { folderHandle = await dbGetMeta('folderHandle'); } catch (_) {}
            updateStorageUI();
            this.render();
        }
    };
    // practice.js is loaded after the legacy inline script but before its async init is complete.
    // Expose a narrow interface for the original app's track/list hooks.
    window.tungkinh3Practice = trainer;
    trainer.init().catch(error => console.error('Không khởi tạo được luyện đọc:', error));
})();
