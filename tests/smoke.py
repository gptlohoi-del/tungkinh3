"""Run: python3 tests/smoke.py [path/to/App-Hub/public/modules]
Static checks using the Python standard library. Never requires internet or APK.
"""
from pathlib import Path
from html.parser import HTMLParser
import json
import re
import sys

root = Path(__file__).resolve().parents[1]

class IDs(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.add(a['id'])

manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
assert manifest['short_name'] == 'tungkinh3'
assert manifest['start_url'].startswith('./')
assert all((root / x['src']).is_file() for x in manifest['icons'])
config = json.loads((root / 'apphub.json').read_text(encoding='utf-8'))
assert config['id'] == 'tungkinh3' and config['version'] == '1.2.0'
tracks = json.loads((root / 'tracks.json').read_text(encoding='utf-8'))
assert isinstance(tracks, list) and len(tracks) == 3
assert len({t['mp3Name'] for t in tracks}) == len(tracks)
for t in tracks:
    assert t.get('sources') and t.get('title')
    for source in t['sources']:
        assert source['mp3'].lower().endswith('.mp3')
        assert source['srt'].lower().endswith(('.srt', '.txt'))
        assert ('../kinhtest2/' in source['mp3']) == ('../kinhtest2/' in source['srt'])
        if source['mp3'].startswith('./'):
            assert (root / source['mp3']).is_file()
            assert (root / source['srt']).is_file()
        elif source['mp3'].startswith('../kinhtest2/'):
            # Shared files intentionally absent from Tụng Kinh 3; checked when
            # --modules-root is supplied after App Hub collects both modules.
            assert not (root / Path(source['mp3']).name).exists(), 'MP3 shared was unexpectedly duplicated'
        else:
            raise AssertionError('Unrecognized media path: ' + source['mp3'])
for file in ('index.html','practice.js','practice.css','enhancements.css',
             'app-config.js','sw.js','README.md','IPA.txt','tracks.json'):
    assert (root / file).is_file(), file
html = (root / 'index.html').read_text(encoding='utf-8')
parser = IDs(); parser.feed(html)
needed_ids = ('practicePrevBtn','practiceNextBtn','practiceRecBtn','practiceSampleBtn',
 'practiceSlowBtn','practiceCompareBtn','practiceSelfBtn','practiceSelfAudio',
 'practiceStorageLocation','practiceExportAllBtn','practiceExportScope','sentenceCounter',
 'practiceFavBtn','practiceHardBtn','practiceVnEditor','learningProgress','appTheme',
 'appEasyMode','practiceCue','exportPreferencesBtn','importPreferencesFile', 'practiceFolderStatus')
# practiceStorageLocation is a name (radio group), rather than an HTML id.
needed_ids = [x for x in needed_ids if x != 'practiceStorageLocation']
assert set(needed_ids) <= parser.ids, sorted(set(needed_ids) - parser.ids)
assert 'name="practiceStorageLocation"' in html
assert 'user-scalable=no' not in html
assert 'playSampleOnce(.75)' in (root / 'practice.js').read_text(encoding='utf-8')
assert 'window.rememberSentence' in (root / 'practice.js').read_text(encoding='utf-8')
assert 'function selectSavedList' in html
assert 'function updateSentenceCounter' in html
sw = (root / 'sw.js').read_text(encoding='utf-8')
assert 'tungkinh3-offline-v4' in sw
assert './enhancements.css' in sw and './app-config.js' in sw
ipa = [s.strip() for s in (root / 'IPA.txt').read_text(encoding='utf-8-sig').splitlines() if s.strip()]
assert len(ipa) % 2 == 0
words = dict(zip(ipa[::2], ipa[1::2]))
assert all(w == w.lower() and v for w, v in words.items())
for track in tracks:
    for src in track['sources']:
        if src['srt'].startswith('./'):
            srt = (root / src['srt']).read_text(encoding='utf-8-sig')
            chunks = [c for c in re.split(r'\n\s*\n', srt.replace('\r','')) if '-->' in c]
            assert chunks, 'No SRT blocks in ' + src['srt']
            for chunk in chunks:
                lines = chunk.splitlines()
                text = ' '.join(lines[lines.index(next(l for l in lines if '-->' in l)) + 1:]).split('|')[0]
                missing = set(re.findall(r'[a-z]+', text.lower())) - words.keys()
                assert not missing, f"Missing IPA words for {src['srt']}: {sorted(missing)}"
modules_root = Path(sys.argv[1]).resolve() if len(sys.argv)>1 else None
if modules_root:
    from subprocess import run
    p = run([sys.executable, str(root/'tests'/'verify_apphub_shared.py'), str(modules_root)])
    assert p.returncode == 0, 'Shared App Hub media verification failed'
print('OK: repo 1.2.0, 3 tracks, IPA for local SRT, UI, practice, offline assets and storage code')
