#!/usr/bin/env python3
"""Checker for script-data.json (Thai script course).

1. Gating: every reading / tone question uses only consonants, vowel forms, marks,
   digits and spelling rules introduced in that lesson or earlier.
2. Coverage: all 44 consonants (and every vowel form, mark, sign, digit) are taught.
3. Tone/ro: re-derives romanization and tone of every reading from the Thai spelling
   (class, live/dead, vowel length, tone mark) and compares with stated ro/tone;
   also compares with ro-lexicon.tsv where the word is listed.

Usage: python3 check_script_data.py [script-data.json] [seg-hints.json] [ro-lexicon.tsv]
Segment hints: '|' separates syllables, '(..)' = unwritten (virtual) letters,
'[..]' = written but silent letters, '{H}'/'{M}' = class override for that syllable.
"""
import json, re, sys, unicodedata, os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "script-data.json")
HINTS = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "seg-hints.json")
LEX = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, "ro-lexicon.tsv")

N = lambda s: unicodedata.normalize("NFC", s)

# ---------------- independent reference tables ----------------
MID = set("กจฎฏดตบปอ")
HIGH = set("ขฃฉฐถผฝศษสห")
LOW = set("คฅฆงชซฌญฑฒณทธนพฟภมยรลวฬฮ")
ALL44 = "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ"
assert len(ALL44) == 44 and MID | HIGH | LOW == set(ALL44)

INIT = {}
for chars, ro in [("ก", "k"), ("ขฃคฅฆ", "kh"), ("ง", "ng"), ("จ", "c"), ("ฉชฌ", "ch"),
                  ("ซศษส", "s"), ("ยญ", "y"), ("ดฎ", "d"), ("ตฏ", "t"), ("ถทธฐฑฒ", "th"),
                  ("นณ", "n"), ("บ", "b"), ("ป", "p"), ("ผพภ", "ph"), ("ฝฟ", "f"), ("ม", "m"),
                  ("ร", "r"), ("ลฬ", "l"), ("ว", "w"), ("หฮ", "h"), ("อ", "")]:
    for c in chars:
        INIT[c] = ro
ALT_INIT = {"ฑ": "d"}  # บัณฑิต ban dìt
FIN = {}
for chars, ro in [("กขคฆ", "k"), ("จชซฎฏฐฑฒดตถทธศษส", "t"), ("บปพฟภ", "p"),
                  ("ง", "ng"), ("นณญรลฬ", "n"), ("ม", "m"), ("ย", "i"), ("ว", "u")]:
    for c in chars:
        FIN[c] = ro
NOFINAL = set("ฃฅฉฌผฝหอฮ")
assert set(FIN) | NOFINAL == set(ALL44)

CLUSTERS = {"กร": "kr", "กล": "kl", "กว": "kw", "ขร": "khr", "ขล": "khl", "ขว": "khw",
            "คร": "khr", "คล": "khl", "คว": "khw", "ปร": "pr", "ปล": "pl", "พร": "phr",
            "พล": "phl", "ผล": "phl", "ตร": "tr"}
FAKE = {"ทร": "s", "สร": "s", "ศร": "s", "ซร": "s", "จร": "c"}
LEADH = set("งญนมยรลว")

MARKS = {"่": "ek", "้": "tho", "๊": "tri", "๋": "cattawa"}
TDIA = {"mid": "", "low": "̀", "falling": "̂", "high": "́", "rising": "̌"}

# spelled-short syllables pronounced long (accepted, reported)
IRREG = {"น้ำ": ("náam", "high", "–ำ"), "ได้": ("dâai", "falling", "ไ–"),
         "เก้า": ("kâao", "falling", "เ–า"),
         "ไม้": ("máai", "high", "ไ–")}

# template, vowel ro, length, vowel form id
TEMPLATES = [
    ("Cา", "aa", "L", "–า"), ("CาF", "aa", "L", "–า"),
    ("Cี", "ii", "L", "–ี"), ("CีF", "ii", "L", "–ี"),
    ("Cือ", "ʉʉ", "L", "–ือ"), ("CืF", "ʉʉ", "L", "–ื–"),
    ("Cู", "uu", "L", "–ู"), ("CูF", "uu", "L", "–ู"),
    ("เC", "ee", "L", "เ–"), ("เCF", "ee", "L", "เ–"),
    ("แC", "ɛɛ", "L", "แ–"), ("แCF", "ɛɛ", "L", "แ–"),
    ("โC", "oo", "L", "โ–"), ("โCF", "oo", "L", "โ–"),
    ("Cอ", "ɔɔ", "L", "–อ"), ("CอF", "ɔɔ", "L", "–อ"),
    ("เCอ", "əə", "L", "เ–อ"), ("เCิF", "əə", "L", "เ–ิ–"), ("เCย", "əə", "L", "เ–ย"),
    ("เCีย", "iia", "L", "เ–ีย"), ("เCียF", "iia", "L", "เ–ีย"),
    ("เCือ", "ʉʉa", "L", "เ–ือ"), ("เCือF", "ʉʉa", "L", "เ–ือ"),
    ("Cัว", "uua", "L", "–ัว"), ("CวF", "uua", "L", "–ว–"),
    ("Cะ", "a", "S", "–ะ"), ("CัF", "a", "S", "–ั–"),
    ("Cิ", "i", "S", "–ิ"), ("CิF", "i", "S", "–ิ"),
    ("Cึ", "ʉ", "S", "–ึ"), ("CึF", "ʉ", "S", "–ึ"),
    ("Cุ", "u", "S", "–ุ"), ("CุF", "u", "S", "–ุ"),
    ("เCะ", "e", "S", "เ–ะ"), ("เC็F", "e", "S", "เ–็–"),
    ("แCะ", "ɛ", "S", "แ–ะ"), ("แC็F", "ɛ", "S", "แ–็–"),
    ("โCะ", "o", "S", "โ–ะ"), ("CF", "o", "S", "–(o)–"),
    ("เCาะ", "ɔ", "S", "เ–าะ"), ("เCอะ", "ə", "S", "เ–อะ"),
    ("Cำ", "am", "X", "–ำ"), ("ไC", "ai", "X", "ไ–"), ("ใC", "ai", "X", "ใ–"),
    ("เCา", "ao", "X", "เ–า"),
]
TRX = []
for t, v, ln, form in TEMPLATES:
    rx = "^" + t.replace("C", "(?P<C>[ก-ฮ]{1,2})").replace("F", "(?P<F>[ก-ฮ])") + "$"
    TRX.append((re.compile(rx), v, ln, form, "F" in t))


def tone_of(cls, live, length, mark):
    if mark == "ek":
        return "low" if cls in ("mid", "high") else "falling"
    if mark == "tho":
        return "falling" if cls in ("mid", "high") else "high"
    if mark == "tri":
        return "high"
    if mark == "cattawa":
        return "rising"
    if live:
        return "rising" if cls == "high" else "mid"
    if cls == "low":
        return "high" if length == "S" else "falling"
    return "low"


def cls_of(c):
    return "mid" if c in MID else "high" if c in HIGH else "low"


def put_tone(vowel, tone):
    if not TDIA[tone]:
        return vowel
    return N(vowel[0] + TDIA[tone] + vowel[1:])


def analyse_initial(C):
    """-> list of (ro, class, features, letters)"""
    out = []
    if len(C) == 1:
        if C in INIT:
            out.append((INIT[C], cls_of(C), set(), C))
            if C in ALT_INIT:
                out.append((ALT_INIT[C], "mid", {"alt_init"}, C))  # read like ด
    else:
        a, b = C
        if C in CLUSTERS:
            out.append((CLUSTERS[C], cls_of(a), {"cluster"}, C))
        if C in FAKE:
            out.append((FAKE[C], cls_of(a), {"cluster"}, C))
        if a == "ห" and b in LEADH:
            out.append((INIT[b], "high", {"lead"}, C))
        if C == "อย":
            out.append(("y", "mid", {"lead"}, C))
    return out


def parse_syllable(s, override=None):
    """All analyses of one orthographic syllable (virtual letters already inserted)."""
    marks = [ch for ch in s if ch in MARKS]
    if len(marks) > 1:
        return []
    mark = MARKS[marks[0]] if marks else None
    core = "".join(ch for ch in s if ch not in MARKS)
    res = []
    if s in IRREG:
        ro_, tone_, form_ = IRREG[s]
        res.append(dict(ro=N(ro_), tone=tone_, form=form_, feats={"irregular"}, cls=cls_of(s[0]),
                        live=True, letters="", mark=mark))

    def finish(init_ro, cls, feats, vro, ln, form, fin, letters):
        if override:
            cls = {"H": "high", "M": "mid", "L": "low"}[override]
            feats = feats | {"override"}
        if fin is not None:
            live = FIN[fin] in ("ng", "n", "m", "i", "u")
            feats = feats | {"final_live" if live else "final_dead"}
            fro = FIN[fin]
            if fro == "u":
                fro = "u" if vro in ("i",) else "o"
            length = "S" if ln in ("S", "X") else "L"
        else:
            live = ln in ("L", "X")
            fro = ""
            length = "S" if ln in ("S", "X") else "L"
        if mark in ("tri", "cattawa") and cls != "mid":
            feats = feats | {"BAD_MARK_CLASS"}
        tone = tone_of(cls, live, length, mark)
        v = vro + fro
        if v == "iu" or (vro == "i" and fro == "u"):
            v = "iu"
        ro = init_ro + put_tone(v, tone)
        res.append(dict(ro=N(ro), tone=tone, form=form, feats=feats, cls=cls,
                        live=live, letters=letters + (fin or ""), mark=mark))

    # ฤ / ฤๅ
    if core == "ฤ":
        finish("r", "low", set(), "ʉ", "S", "ฤ", None, "")
    if core == "ฤๅ":
        finish("r", "low", set(), "ʉʉ", "L", "ฤๅ", None, "")
    m = re.match("^([ก-ฮ])ฤ([ก-ฮ])?$", core)
    if m and m.group(1) in INIT:
        x = m.group(1)
        finish(INIT[x] + "r", cls_of(x), {"cluster"}, "i", "S", "ฤ", m.group(2), x)
    for rx, vro, ln, form, hasF in TRX:
        mm = rx.match(core)
        if not mm:
            continue
        C = mm.group("C")
        F = mm.group("F") if hasF else ("ย" if form == "เ–ย" else None)
        if F is not None and F not in FIN:
            continue
        if form == "เ–" and F == "ย":
            continue
        for iro, cls, feats, letters in analyse_initial(C):
            finish(iro, cls, set(feats), vro, ln, form, F, letters)
    return res


# ---------------- word level ----------------
ROWORD = re.compile(r"\s+")


def parse_hint(h):
    sylls = []
    for part in h.split("|"):
        override = None
        m = re.match(r"^\{([HML])\}", part)
        if m:
            override = m.group(1)
            part = part[m.end():]
        surface, full, virt, silent = "", "", False, False
        i = 0
        while i < len(part):
            ch = part[i]
            if ch == "(":
                j = part.index(")", i)
                full += part[i + 1:j]
                virt = True
                i = j + 1
            elif ch == "[":
                j = part.index("]", i)
                surface += part[i + 1:j]
                silent = True
                i = j + 1
            else:
                surface += ch
                full += ch
                i += 1
        sylls.append(dict(surface=surface, full=full, override=override, virt=virt, silent=silent))
    return sylls


def auto_clean(th):
    """Remove ฯ, expand ๆ, drop silent consonant (+ิ/ุ) before ์. Returns (string, feats)."""
    feats = set()
    s = th
    if "ฯ" in s:
        s = s.replace("ฯ", "")
    if "์" in s:
        s = re.sub("[ก-ฮ][ิุ]?์", "", s)
        feats.add("silent")
    return s, feats


def segmentations(s, k, maxlen=7):
    """All splits of s into k syllables that each have >=1 parse."""
    memo = {}

    def go(i, k):
        if (i, k) in memo:
            return memo[(i, k)]
        out = []
        if k == 0:
            out = [[]] if i == len(s) else []
        else:
            for j in range(i + 1, min(len(s), i + maxlen) + 1):
                ps = parse_syllable(s[i:j])
                if ps:
                    for rest in go(j, k - 1):
                        out.append([ps] + rest)
        memo[(i, k)] = out
        return out
    return go(0, k)


def product(lists):
    if not lists:
        yield []
        return
    for x in lists[0]:
        for rest in product(lists[1:]):
            yield [x] + rest


DIGITS = "๐๑๒๓๔๕๖๗๘๙"
DIGWORD = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"]


def number_words(n):
    if n == 0:
        return ["ศูนย์"]
    w = []
    th, h, t, u = n // 1000, n // 100 % 10, n // 10 % 10, n % 10
    if th:
        w += [DIGWORD[th], "พัน"]
    if h:
        w += [DIGWORD[h], "ร้อย"]
    if t == 1:
        w += ["สิบ"]
    elif t == 2:
        w += ["ยี่", "สิบ"]
    elif t:
        w += [DIGWORD[t], "สิบ"]
    if u == 1 and n > 10 and t:
        w += ["เอ็ด"]
    elif u:
        w += [DIGWORD[u]]
    return w


def analyse_word(th, hints):
    """-> list of candidate analyses; each = list of syllable dicts (+ 'extra' feats)."""
    if all(c in DIGITS for c in th):
        n = int("".join(str(DIGITS.index(c)) for c in th))
        sy = []
        for w in number_words(n):
            s, _ = auto_clean(w)
            ps = parse_syllable(s)
            irr = [p for p in ps if "irregular" in p["feats"]]
            ps = (irr or ps)[:1]
            if not ps:
                return [], {"digits"}
            sy.append(ps[0])
        return [sy], {"digits"}
    extra = set()
    if th in hints:
        hs = parse_hint(hints[th])
        surf = "".join(h["surface"] for h in hs)
        if surf != th.replace("ฯ", ""):
            raise ValueError(f"hint surface {surf} != {th}")
        lists = []
        for h in hs:
            s = h["full"]
            s = re.sub("[ก-ฮ][ิุ]?์", "", s) if "์" in s else s
            ps = parse_syllable(s, h["override"])
            if h["virt"]:
                for p in ps:
                    p["feats"] = p["feats"] | {"implied"}
            if h["silent"]:
                extra.add("silent")
            lists.append(ps)
        if "ฯ" in th:
            extra.add("paiyan")
        return list(product(lists)), extra
    s, extra = auto_clean(th)
    if "ฯ" in th:
        extra.add("paiyan")
    rep = False
    if "ๆ" in s:
        base = s.replace("ๆ", "")
        s = base
        rep = True
        extra.add("repeat")
    return ("REP" if rep else "", s), extra


def candidates_for(th, ro_n, hints):
    res, extra = analyse_word(th, hints)
    if isinstance(res, tuple):
        rep, s = res
        k = ro_n // 2 if rep else ro_n
        out = []
        for seg in segmentations(s, k):
            for combo in product(seg):
                out.append(combo + combo if rep else combo)
        return out, extra
    return res, extra


def roword(sy):
    return " ".join(p["ro"] for p in sy)


# ---------------- main ----------------
def main():
    data = json.load(open(DATA, encoding="utf-8"))
    hints = json.load(open(HINTS, encoding="utf-8")) if os.path.exists(HINTS) else {}
    lex = {}
    for line in open(LEX, encoding="utf-8"):
        p = line.rstrip("\n").split("\t")
        if len(p) >= 2:
            lex.setdefault(p[0], N(p[1]))
    errors, warns, notes = [], [], []
    E = errors.append
    W = warns.append

    # consonant table
    cons = {c["ch"]: c for c in data["consonants"]}
    if set(cons) != set(ALL44):
        E(f"consonant set mismatch: missing {set(ALL44)-set(cons)} extra {set(cons)-set(ALL44)}")
    for ch, c in cons.items():
        if c["cls"] != cls_of(ch):
            E(f"class {ch}: {c['cls']} != {cls_of(ch)}")
        if c["initial"] != INIT.get(ch):
            E(f"initial {ch}: {c['initial']} != {INIT.get(ch)}")
        want = FIN.get(ch)
        if c["final"] != want:
            E(f"final {ch}: {c['final']} != {want}")
        if not c["name"].startswith(ch + " "):
            E(f"name {ch}: {c['name']}")
    # names / tone-mark names / signs: check readings
    named = []
    for c in data["consonants"]:
        nm = c["name"].split(" ", 1)
        named.append(((nm[0] + "อ" if nm[0] != "อ" else "ออ") + " " + nm[1], c["nameRo"], "consonant name"))
    for t in data["toneMarks"]:
        named.append((t["name"], t["nameRo"], "tone mark name"))
    for t in data.get("signs", []):
        named.append((t["name"], t["nameRo"], "sign name"))
    for d in data["digits"]:
        named.append((d["ch"], d["ro"], "digit"))
    for th, ro, what in named:
        ro = N(ro)
        words = th.split(" ")
        ros = ro.split(" ")
        # match word by word using syllable counts from the hint / greedy split
        ok = False
        if len(words) == 1:
            cands, _ = candidates_for(th, len(ros), hints)
            ok = any(roword(c) == ro for c in cands)
        else:
            # try all ways to distribute ro syllables over the words
            def dist(wi, ri):
                if wi == len(words):
                    return ri == len(ros)
                for k in range(1, len(ros) - ri + 1):
                    cands, _ = candidates_for(words[wi], k, hints)
                    if any(roword(c) == " ".join(ros[ri:ri + k]) for c in cands):
                        if dist(wi + 1, ri + k):
                            return True
                return False
            ok = dist(0, 0)
        if not ok:
            E(f"{what} '{th}' ro '{ro}' not derivable")

    # inventories
    vforms = {v["form"]: v for v in data["vowels"]}
    marks_all = {t["mark"] for t in data["toneMarks"]} | {s["mark"] for s in data.get("signs", [])}
    digits_all = {d["ch"] for d in data["digits"]}
    if set(DIGITS) != digits_all:
        E("digits incomplete")

    FEATURE_START = {"final_live": "s10", "final_dead": "s11", "lead": "s15", "cluster": "s15",
                     "implied": "s16", "override": "s16", "silent": "s16", "repeat": "s16",
                     "paiyan": "s16", "alt_init": "s18"}
    order = [l["id"] for l in data["lessons"]]

    def started(feat, lid):
        return order.index(lid) >= order.index(FEATURE_START[feat])

    seen_c, seen_v, seen_m, seen_d = set(), set(), set(), set()
    intro_count = {}
    total_r = total_q = 0
    prev_stage = 0
    for L in data["lessons"]:
        lid = L["id"]
        if L["stage"] < prev_stage:
            E(f"{lid}: stage order")
        prev_stage = L["stage"]
        for c in L["newConsonants"]:
            if c not in cons:
                E(f"{lid}: unknown consonant {c}")
            intro_count[c] = intro_count.get(c, 0) + 1
            seen_c.add(c)
        for v in L["newVowels"]:
            if v not in vforms:
                E(f"{lid}: unknown vowel form {v}")
            intro_count[v] = intro_count.get(v, 0) + 1
            seen_v.add(v)
        for m in L["newMarks"]:
            if m not in marks_all:
                E(f"{lid}: unknown mark {m}")
            intro_count[m] = intro_count.get(m, 0) + 1
            seen_m.add(m)
        for d in L.get("newDigits", []):
            seen_d.add(d)
            intro_count[d] = intro_count.get(d, 0) + 1
        nnew = len(L["newConsonants"]) + len(L["newVowels"]) + len(L["newMarks"])
        if not (1 <= nnew <= 6) and not L.get("newDigits") and L["stage"] < 8:
            W(f"{lid}: {nnew} new symbols (guideline 4–6)")
        glyphs = set(seen_c) | set(seen_m) | set(seen_d) | {" "}
        for v in seen_v:
            glyphs |= {ch for ch in v if ch not in "–()o a"}
        nr = len(L["readings"])
        total_r += nr
        if not (8 <= nr <= 15):
            W(f"{lid}: {nr} readings (spec 8–15)")
        nq = len(L.get("toneQuestions", []))
        total_q += nq
        if L["stage"] >= 3 and not (3 <= nq <= 6):
            E(f"{lid}: {nq} tone questions (spec 3–6 from stage 3)")
        nons = sum(1 for r in L["readings"] if not r.get("ja"))
        if nons > 3:
            W(f"{lid}: {nons} nonsense syllables")

        def gate(th, analysis, extra, where):
            bad = [ch for ch in th if ch not in glyphs]
            if bad:
                E(f"{lid} {where} '{th}': glyph(s) not yet taught: {''.join(sorted(set(bad)))}")
            for p in analysis:
                if p["form"] not in seen_v and not ("implied" in p["feats"] and "–(a)" in seen_v
                                                   and p["form"] == "–ะ"):
                    E(f"{lid} {where} '{th}': vowel form {p['form']} not yet taught")
                for f in p["feats"]:
                    if f == "BAD_MARK_CLASS":
                        E(f"{lid} {where} '{th}': ๊/๋ on non-mid consonant")
                    elif f in FEATURE_START and not started(f, lid):
                        E(f"{lid} {where} '{th}': rule '{f}' not yet taught (starts {FEATURE_START[f]})")
            for f in extra:
                if f in FEATURE_START and not started(f, lid):
                    E(f"{lid} {where} '{th}': rule '{f}' not yet taught")

        for r in L["readings"]:
            th, ro = r["th"], N(r["ro"])
            ros = ro.split(" ")
            tones = r["tone"].split(" ")
            if len(tones) != len(ros):
                E(f"{lid} reading '{th}': tone count {len(tones)} != syllables {len(ros)}")
            if ro != ro.lower() or "-" in ro:
                E(f"{lid} reading '{th}': ro formatting")
            cands, extra = candidates_for(th, len(ros), hints)
            match = [c for c in cands if roword(c) == ro]
            if not match:
                alt = sorted({roword(c) for c in cands})[:6]
                E(f"{lid} reading '{th}' ro '{ro}' not derived; candidates: {alt}")
                continue
            ctones = [p["tone"] for p in match[0]]
            if any("irregular" in p["feats"] for p in match[0]):
                W(f"{lid} reading '{th}': irregular vowel length accepted ({ro})")
            if ctones != tones:
                E(f"{lid} reading '{th}': tone {tones} != derived {ctones}")
            gate(th, match[0], extra, "reading")
            key = th
            if key in lex and lex[key] != ro:
                W(f"{lid} reading '{th}': ro '{ro}' differs from lexicon '{lex[key]}'")
            elif key in lex:
                notes.append(f"lexicon ok: {th}")
        for q in L.get("toneQuestions", []):
            th = q["th"]
            cands, extra = candidates_for(th, 1, hints)
            tset = {c[0]["tone"] for c in cands}
            if not cands:
                E(f"{lid} toneQ '{th}': cannot parse as one syllable")
                continue
            if len(tset) > 1:
                # prefer the parse whose ro matches lexicon
                if th in lex:
                    cands = [c for c in cands if c[0]["ro"] == lex[th]]
                    tset = {c[0]["tone"] for c in cands}
                if len(tset) != 1:
                    E(f"{lid} toneQ '{th}': ambiguous tone {tset}")
                    continue
            if q["tone"] not in tset:
                E(f"{lid} toneQ '{th}': tone {q['tone']} != derived {tset}")
            if th in lex and lex[th] != cands[0][0]["ro"]:
                W(f"{lid} toneQ '{th}': derived ro {cands[0][0]['ro']} vs lexicon {lex[th]}")
            gate(th, cands[0], extra, "toneQ")
            if not q.get("why"):
                E(f"{lid} toneQ '{th}': missing why")

    for k, n in intro_count.items():
        if n > 1:
            E(f"symbol {k} introduced {n} times")
    miss_c = [c for c in ALL44 if c not in seen_c]
    if miss_c:
        E(f"consonants never taught: {''.join(miss_c)}")
    miss_v = [v for v in vforms if v not in seen_v]
    if miss_v:
        E(f"vowel forms never taught: {miss_v}")
    miss_m = [m for m in marks_all if m not in seen_m]
    if miss_m:
        E(f"marks/signs never taught: {miss_m}")
    if seen_d != set(DIGITS):
        E("digits not all taught")

    print(f"lessons: {len(data['lessons'])}, readings: {total_r}, tone questions: {total_q}")
    print(f"consonants taught: {len(seen_c)}/44, vowel forms: {len(seen_v)}/{len(vforms)}, "
          f"marks+signs: {len(seen_m)}/{len(marks_all)}, digits: {len(seen_d)}/10")
    print(f"readings confirmed by ro-lexicon: {len(notes)}")
    for w in warns:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    print(f"{len(errors)} errors, {len(warns)} warnings")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
