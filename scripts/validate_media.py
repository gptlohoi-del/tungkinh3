#!/usr/bin/env python3
"""Validate autodiscovered media; strict mode requires all three original lessons."""
import sys
from discover_media import main

if __name__ == '__main__':
    raise SystemExit(main(['--strict'] if '--strict' in sys.argv else []))
