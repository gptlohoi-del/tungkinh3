#!/usr/bin/env python3
"""Self-contained tests for automatic MP3/SRT discovery, no npm needed."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from discover_media import discover, make_catalog

SRT = '1\n00:00:01,000 --> 00:00:03,000\nHello world.\n'


class DiscoveryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'media' / 'kinhtest2').mkdir(parents=True)
        (self.root / 'tracks.json').write_text(json.dumps([
            {'title': f'{n:02d} Existing {n}', 'mp3Name': f'{n:02d} old.mp3',
             'sources': [{'mp3': 'legacy', 'srt': 'legacy'}]}
            for n in (1, 2, 3)
        ]), encoding='utf-8')

    def pair(self, name, place=None, subtitle_name=None, srt_text=SRT):
        place = place or self.root / 'media' / 'kinhtest2'
        (place / (name + '.mp3')).write_bytes(b'ID3' + b'\0' * 16)
        (place / ((subtitle_name or name) + '.srt')).write_text(srt_text, encoding='utf-8')

    def test_unicode_original_names_and_new_fourth_song(self):
        self.pair('01 Kinh nhạc CHÁNH TINH TẤN eng')
        self.pair('02 Kinh doc CHANH TINH TAN eng')
        self.pair('03 ADDITIONAL PRAYER', place=self.root)
        self.pair('04 Cầu Nguyện #bản mới')
        pairs, problems = discover(self.root, strict=True)
        self.assertEqual(problems, [])
        self.assertEqual([p.order for p in pairs], [1, 2, 3, 4])
        catalog = make_catalog(self.root, pairs)
        self.assertEqual(catalog[0]['title'], '01 Existing 1')
        self.assertEqual(catalog[0]['mp3Name'], '01 old.mp3')
        self.assertIn('01 Kinh nhạc CHÁNH TINH TẤN eng.mp3', catalog[0]['sources'][0]['mp3'])
        self.assertEqual(catalog[3]['title'], '04 Cầu Nguyện #bản mới')
        self.assertEqual(catalog[3]['sources'][0]['srt'], './media/kinhtest2/04 Cầu Nguyện #bản mới.srt')
        self.assertEqual(catalog[2]['sources'][0]['mp3'], './03 ADDITIONAL PRAYER.mp3')

    def test_missing_srt_rejected_in_strict_mode(self):
        self.pair('01 Kinh 01')
        (self.root / 'media' / 'kinhtest2' / '02 No subtitles.mp3').write_bytes(b'ID3')
        self.pair('03 THIRD', place=self.root)
        _, problems = discover(self.root, strict=True)
        self.assertTrue(any('02 No subtitles' in item for item in problems))
        self.assertTrue(any('Thiếu bài 02' in item for item in problems))

    def test_duplicate_prefix_rejected(self):
        self.pair('01 Kinh original')
        self.pair('01 Kinh alternate')
        _, problems = discover(self.root)
        self.assertTrue(any('TRÙNG SỐ BÀI 01' in p for p in problems))

    def test_invalid_srt_rejected(self):
        self.pair('01 Test', srt_text='<html>not a subtitle</html>')
        _, problems = discover(self.root)
        self.assertTrue(any('mốc thời gian hợp lệ' in p for p in problems))

    def test_orphan_warns_in_partial_build(self):
        self.pair('03 THIRD', place=self.root)
        pairs, problems = discover(self.root, strict=False)
        self.assertEqual([p.order for p in pairs], [3])
        self.assertEqual(problems, [])


if __name__ == '__main__':
    unittest.main(verbosity=2)
