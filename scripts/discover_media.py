#!/usr/bin/env python3
"""Discover MP3/SRT pairs and generate a stable Tụng Kinh 3 catalog.

Usage:
  python3 scripts/discover_media.py --output www/tracks.json
  python3 scripts/discover_media.py --strict

In a standalone build, this script is the single source of truth for packaged
media paths. tracks.json in the repo remains legacy metadata/fallback for App Hub.
The generated www/tracks.json is the catalog delivered with the APK/OTA.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
PREFIX = re.compile(r"^\s*(\d{1,3})(?=\s|[-_.])")
SUBTITLE_TIME = re.compile(
    r"\d{2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*\d{2}:\d{2}:\d{2}", re.M
)
SUPPORTED = {'.mp3', '.srt'}
REQUIRED = {1, 2, 3}


class MediaError(ValueError):
    pass


def normalized(stem: str) -> str:
    return ' '.join(unicodedata.normalize('NFC', stem).casefold().split())


def number(stem: str) -> int | None:
    match = PREFIX.match(stem)
    return int(match.group(1)) if match else None


@dataclass(frozen=True)
class Pair:
    mp3: Path
    srt: Path
    order: int | None


def candidate_files(root: Path) -> list[Path]:
    # Only known source directories; never copy generated www/, tests/ or npm files.
    paths = [p for p in root.iterdir() if p.is_file() and not p.is_symlink()]
    media = root / 'media'
    if media.exists():
        paths.extend(p for p in media.rglob('*')
                     if p.is_file() and not p.is_symlink()
                     and not any(part.startswith('.') for part in p.relative_to(media).parts))
    return sorted((p for p in paths if p.suffix.casefold() in SUPPORTED),
                  key=lambda p: p.relative_to(root).as_posix().casefold())


def discover(root: Path, strict: bool = False) -> tuple[list[Pair], list[str]]:
    files = candidate_files(root)
    groups: dict[tuple[Path, str], dict[str, Path]] = {}
    errors: list[str] = []
    for p in files:
        key = (p.parent.relative_to(root), normalized(p.stem))
        ext = p.suffix.casefold()
        if ext in groups.setdefault(key, {}):
            errors.append(f'Hai tệp cùng loại trùng tên sau chuẩn hóa: {p} / {groups[key][ext]}')
        else:
            groups[key][ext] = p
    pairs: list[Pair] = []
    for (_, _), fileset in groups.items():
        mp3, srt = fileset.get('.mp3'), fileset.get('.srt')
        if not mp3 or not srt:
            orphan = mp3 or srt
            errors.append(f'Chưa đủ MP3 + SRT cùng tên trong cùng thư mục: {orphan.relative_to(root)}')
            continue
        if mp3.stat().st_size == 0:
            errors.append(f'MP3 rỗng: {mp3.relative_to(root)}')
        if srt.stat().st_size == 0 or not SUBTITLE_TIME.search(srt.read_text('utf-8-sig', errors='replace')):
            errors.append(f'SRT rỗng hoặc không có mốc thời gian hợp lệ: {srt.relative_to(root)}')
        pairs.append(Pair(mp3, srt, number(mp3.stem)))

    seen: dict[int, Pair] = {}
    for pair in pairs:
        if pair.order is not None:
            if pair.order in seen:
                prev = seen[pair.order]
                errors.append(f'TRÙNG SỐ BÀI {pair.order:02d}: {prev.mp3.relative_to(root)} và {pair.mp3.relative_to(root)}')
            else:
                seen[pair.order] = pair
    if strict:
        for missing in sorted(REQUIRED - set(seen)):
            errors.append(f'Thiếu bài {missing:02d} (cần một cặp MP3/SRT cùng tên)')
    pairs.sort(key=lambda pair: (pair.order is None,
                                  pair.order if pair.order is not None else 999999,
                                  normalized(pair.mp3.stem)))
    return pairs, errors


def make_catalog(root: Path, pairs: list[Pair]) -> list[dict]:
    presets = json.loads((root / 'tracks.json').read_text(encoding='utf-8'))
    by_number = {number(item.get('title', '')): item for item in presets
                 if isinstance(item, dict) and number(item.get('title', '')) is not None}
    catalog = []
    for pair in pairs:
        preset = by_number.get(pair.order, {})
        # Keep canonical titles/mp3Name for the three existing lessons so saved
        # settings referring to their original names are not inadvertently lost.
        title = preset.get('title') or unicodedata.normalize('NFC', pair.mp3.stem)
        mp3_name = preset.get('mp3Name') or pair.mp3.name
        catalog.append({
            'title': title,
            'mp3Name': mp3_name,
            'sources': [{
                'mp3': './' + pair.mp3.relative_to(root).as_posix(),
                'srt': './' + pair.srt.relative_to(root).as_posix(),
            }],
        })
    return catalog


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=BASE, help='Thư mục gốc của repo')
    parser.add_argument('--output', type=Path, help='Nơi ghi tracks.json đã nhận diện')
    parser.add_argument('--strict', action='store_true', help='Yêu cầu đầy đủ bài 01/02/03 và không có file thiếu cặp')
    args = parser.parse_args(argv)
    root = args.root.resolve()
    pairs, problems = discover(root, args.strict)
    for problem in problems:
        print(('LỖI' if args.strict else 'CẢNH BÁO') + ': ' + problem, file=sys.stderr)
    # Duplicate numbers or duplicate normalized stems are dangerous, even on a
    # partial APK build: never silently pick the wrong subtitle.
    fatal = args.strict or any('TRÙNG SỐ' in problem or 'trùng tên' in problem for problem in problems)
    if problems and fatal:
        print('Không phát hành: hãy ghép đúng cặp / sửa trùng số bài trước.', file=sys.stderr)
        return 1
    catalog = make_catalog(root, pairs)
    for pair in pairs:
        print(f'  {pair.order:02d}' if pair.order is not None else '  --',
              pair.mp3.relative_to(root), ' + ', pair.srt.relative_to(root))
    print(f'Đã nhận diện {len(catalog)} bài; không đổi tên tệp gốc.')
    if args.output:
        output = args.output if args.output.is_absolute() else root / args.output
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print('Đã tạo', output)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
