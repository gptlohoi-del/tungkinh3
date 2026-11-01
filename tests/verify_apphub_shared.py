"""Usage after App Hub collect: python3 tests/verify_apphub_shared.py public/modules
Requires both public/modules/kinhtest2 and public/modules/tungkinh3.
"""
import json
from pathlib import Path
import sys
from urllib.parse import unquote

modules = Path(sys.argv[1] if len(sys.argv) > 1 else 'public/modules').resolve()
our_dir = modules / 'tungkinh3'
assert our_dir.is_dir(), f'Not found: {our_dir}'
tracks = json.loads((our_dir/'tracks.json').read_text(encoding='utf-8'))
for track in tracks:
    ok = False
    checked = []
    for source in track['sources']:
        # Actual filenames may contain literal '#' and Unicode. URL paths in the
        # config are not yet percent-encoded; keep them unchanged for filesystem checks.
        mp3 = (our_dir / unquote(source['mp3'])).resolve()
        sub = (our_dir / unquote(source['srt'])).resolve()
        checked.append(f'{mp3}\n{sub}')
        if mp3.is_file() and sub.is_file():
            ok = True
            break
    if not ok:
        raise AssertionError(f"Missing both MP3 and SRT for '{track['title']}'. Candidates:\n"+'\n'.join(checked))
    print('OK:', track['title'])
print('OK: every declared track is available from the collected App Hub modules.')
