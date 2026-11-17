"""Auto furigana: wrap kanji words in <ruby class="fu">…<rt>よみ</rt></ruby>.
Uses MeCab (fugashi + unidic-lite). Skips text inside code/pre/style/script/svg/ruby/title/textarea.
Readings are hidden by default; toggled with key H (body.furi).
"""
import re
from fugashi import Tagger

_tagger = Tagger()
KANJI = re.compile(r'[一-鿿々〆ヶ]')
SKIP = {'code', 'pre', 'style', 'script', 'svg', 'ruby', 'title', 'textarea'}
COUNTERS = set('日回個件行分人本年月円割週時秒歳枚台社名階度倍番号体')
# fixed readings for words MeCab tends to get wrong in this context
FIX = {'他': 'ほか', '今日': 'きょう', '一人': 'ひとり', '1人': 'ひとり', '何個': 'なんこ', '何日': 'なんにち', '何層': 'なんそう',
       '止まり': 'とまり', '方': 'かた'}


def hira(s):
    return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)


def is_kana(c):
    return '぀' <= c <= 'ヿ'


def ruby(surface, reading):
    s, r = hira(surface), reading
    if s == r:
        return surface
    pre = suf = ''
    i, j = len(surface), len(r)
    while i > 0 and j > 0 and is_kana(surface[i - 1]) and hira(surface[i - 1]) == r[j - 1]:
        i -= 1; j -= 1
    suf, core, r = surface[i:], surface[:i], r[:j]
    k = 0
    while k < len(core) and k < len(r) and is_kana(core[k]) and hira(core[k]) == r[k]:
        k += 1
    pre, core, r = core[:k], core[k:], r[k:]
    if not core or not r:
        return surface
    return f'{pre}<ruby class="fu">{core}<rt>{r}</rt></ruby>{suf}'


def annotate_text(text):
    if not KANJI.search(text):
        return text
    return ''.join(_line(l) for l in re.split(r'(\n)', text))


def _line(text):
    if not KANJI.search(text):
        return text
    out = []
    prev_num = False
    for w in _tagger(text):
        sur = w.surface
        ws = w.white_space or ''
        kana = None
        try:
            kana = w.feature.kana
        except Exception:
            pass
        piece = sur
        if KANJI.search(sur):
            if sur in FIX:
                piece = ruby(sur, FIX[sur])
            elif len(sur) == 1 and sur in COUNTERS and prev_num:
                piece = sur  # 8日, 3回 … easy counters: leave as is
            elif kana and kana != '*':
                piece = ruby(sur, hira(kana))
        out.append(ws + piece)
        prev_num = bool(re.fullmatch(r'[0-9０-９,.]+', sur))
    res = ''.join(out)
    # MeCab drops leading/trailing whitespace of the segment differently; restore edges
    lead = re.match(r'\s*', text).group(0)
    trail = re.search(r'\s*$', text).group(0)
    return lead + res.strip() + trail if res.strip() else text


def annotate_html(html):
    parts = re.split(r'(<!--.*?-->|<[^>]+>)', html, flags=re.S)
    stack = []
    out = []
    for p in parts:
        if p.startswith('<!--'):
            out.append(p); continue
        if p.startswith('<'):
            m = re.match(r'<(/?)([a-zA-Z0-9]+)', p)
            if m:
                closing, name = m.group(1) == '/', m.group(2).lower()
                if name in SKIP and not p.endswith('/>'):
                    if closing:
                        if name in stack:
                            while stack and stack.pop() != name:
                                pass
                    else:
                        stack.append(name)
            out.append(p)
        else:
            out.append(p if stack or not p.strip() else annotate_text(p))
    return ''.join(out)
