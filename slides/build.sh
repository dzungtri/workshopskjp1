#!/bin/bash
# build with auto-furigana (needs uv)
cd "$(dirname "$0")" && uv run --quiet --with fugashi --with unidic-lite python build.py
