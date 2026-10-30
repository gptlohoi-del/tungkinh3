"""Static smoke tests; run with Python stdlib: python tests/smoke.py"""
from pathlib import Path
import json, re, sys
root = Path(__file__).resolve().parents[1]
manifest = json.loads((root/'manifest.json').read_text(encoding='utf-8'))
assert manifest['short_name'] == 'tungkinh3'
assert manifest['start_url'].startswith('./')
for icon in manifest['icons']:
    assert (root/icon['src']).is_file(), f"missing icon: {icon['src']}"
tracks = json.loads((root/'tracks.json').read_text(encoding='utf-8'))
assert len(tracks) >= 4
pairs = {}
for name in tracks:
    assert (root/name).is_file(), f'missing track: {name}'
    stem = Path(name).stem.casefold()
    pairs.setdefault(stem, set()).add(Path(name).suffix.casefold())
assert all('.mp3' in exts and ('.srt' in exts or '.txt' in exts) for exts in pairs.values())
assert all((root/x).is_file() for x in ('index.html','practice.js','practice.css','sw.js','README.md','IPA.txt'))
html = (root/'index.html').read_text(encoding='utf-8')
for tag in ('practicePrevBtn','practiceNextBtn','practiceRecBtn','practiceSampleBtn','practiceCompareBtn','practiceSelfBtn','practiceSelfAudio','practiceStorageMode','practiceStorageLocation','practiceExportAllBtn'):
    assert tag in html, f'missing element {tag}'
assert "this.select(this.index + 1, { scroll: false })" in (root/'practice.js').read_text(encoding='utf-8')
assert "this.select(this.index - 1, { scroll: false })" in (root/'practice.js').read_text(encoding='utf-8')
for key in ('MediaRecorder', 'getUserMedia', 'indexedDB', 'zipArchive', 'showDirectoryPicker'):
    assert key in (root/'practice.js').read_text(encoding='utf-8')
for name in tracks:
    if name.casefold().endswith('.srt'):
        srt=(root/name).read_text(encoding='utf-8-sig')
        blocks=re.split(r'\n\s*\n',srt.replace('\r','').strip())
        assert sum('-->' in b for b in blocks) >= 1, f'malformed SRT {name}'
print(f'OK: {len(pairs)} cặp MP3/SRT, manifest, PWA, luyện đọc và cấu trúc repo')
