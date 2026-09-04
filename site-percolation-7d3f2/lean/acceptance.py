#!/usr/bin/env python3
"""Acceptance test for the unconditional theorem.

`#print axioms` cannot see hypothesis parameters: `theorem t (h : Hard) : Goal`
is axiom-clean and still conditional.  So we ask Lean to print the elaborated
type and flag every *open proposition* that occurs as a top-level argument.

Open propositions are discovered from the sources, never hand-listed: a hand
list silently misses propositions introduced later, which is the failure this
test exists to catch.
"""
from dataclasses import dataclass
import re, os, subprocess, sys, pathlib
KN = pathlib.Path(__file__).parent / "KN"
BUILD_KN = [pathlib.Path(a) / "build/percolation/KN" for a in sys.argv[1:2]]

_DECL_KINDS = {"def", "abbrev", "opaque", "theorem", "lemma",
               "structure", "inductive", "class"}
_DECL_MODIFIERS = {"private", "protected", "noncomputable", "unsafe", "partial"}


@dataclass(frozen=True)
class Declaration:
    """The source-level part of a Lean declaration needed by this audit."""

    kind: str
    name: str
    header: str
    private: bool = False


def _mask_lean_comments_and_strings(text):
    """Replace comments and strings with spaces, preserving offsets/newlines.

    Lean block comments nest.  Keeping offsets lets the declaration parser take
    headers from the original source after finding their delimiters in the mask.
    """
    out = list(text)
    i, block_depth, in_string = 0, 0, False
    while i < len(text):
        if block_depth:
            if text.startswith("/-", i):
                out[i:i + 2] = "  "; block_depth += 1; i += 2
            elif text.startswith("-/", i):
                out[i:i + 2] = "  "; block_depth -= 1; i += 2
            else:
                if text[i] != "\n": out[i] = " "
                i += 1
        elif in_string:
            if text[i] == "\\" and i + 1 < len(text):
                out[i:i + 2] = "  "; i += 2
            else:
                if text[i] == '"': in_string = False
                if text[i] != "\n": out[i] = " "
                i += 1
        elif text.startswith("--", i):
            while i < len(text) and text[i] != "\n":
                out[i] = " "; i += 1
        elif text.startswith("/-", i):
            out[i:i + 2] = "  "; block_depth = 1; i += 2
        elif text[i] == '"':
            out[i] = " "; in_string = True; i += 1
        else:
            i += 1
    return "".join(out)


_WORD = re.compile(r"[^\W\d][\w']*(?:\.(?:[^\W\d][\w']*|\u00ab[^\u00bb]+\u00bb))*", re.UNICODE)
_KIND = re.compile(r"\b(?:def|abbrev|opaque|theorem|lemma|structure|inductive|class)\b")


def _declaration_prefix(prefix):
    """Return modifiers when a line prefix can precede a declaration keyword."""
    prefix = prefix.strip()
    # Attributes may share the declaration's line.  Their payload is irrelevant here,
    # but brackets may nest, so consume them rather than trying to match their contents.
    while prefix.startswith("@["):
        depth, end = 0, None
        for i, ch in enumerate(prefix[1:], 1):
            if ch == "[": depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    end = i + 1; break
        if end is None: return None
        prefix = prefix[end:].strip()
    # `open Classical in private def ...` and similar scoped command prefixes.
    if re.search(r"\bin\b", prefix):
        prefix = re.split(r"\bin\b", prefix)[-1].strip()
    words = prefix.split()
    return words if all(word in _DECL_MODIFIERS for word in words) else None


def _header_end(masked, start):
    """Find a declaration's top-level `:=`/`where` body delimiter."""
    pairs = {"(": ")", "[": "]", "{": "}"}
    closing = set(pairs.values())
    stack, i = [], start
    while i < len(masked):
        ch = masked[i]
        if ch in pairs:
            stack.append(pairs[ch]); i += 1; continue
        if ch in closing:
            if stack and stack[-1] == ch: stack.pop()
            i += 1; continue
        if not stack and masked.startswith(":=", i): return i
        if not stack and masked.startswith("where", i):
            before = masked[i - 1] if i else " "
            after = masked[i + 5] if i + 5 < len(masked) else " "
            if not (before.isalnum() or before in "_'") and not (after.isalnum() or after in "_'"):
                return i
        i += 1
    return None


def declarations(text):
    """Parse declaration headers from Lean source without inspecting proof bodies.

    This is deliberately a lexer/header parser, not a declaration-shaped regular
    expression: comments and strings are masked, delimiters are balanced, layout is
    irrelevant after the command starts, and modifiers/attributes are separate tokens.
    """
    masked = _mask_lean_comments_and_strings(text)
    out = []
    for match in _KIND.finditer(masked):
        line_start = masked.rfind("\n", 0, match.start()) + 1
        modifiers = _declaration_prefix(masked[line_start:match.start()])
        if modifiers is None: continue
        kind = match.group(0)
        if kind not in _DECL_KINDS: continue
        name_start = match.end()
        while name_start < len(masked) and masked[name_start].isspace(): name_start += 1
        name_match = _WORD.match(masked, name_start)
        if not name_match: continue
        end = _header_end(masked, name_match.end())
        if end is None: continue
        out.append(Declaration(kind, name_match.group(0),
                               text[name_match.end():end], "private" in modifiers))
    return out


def _top_level_colon(text):
    stack, colon = [], None
    pairs = {"(": ")", "[": "]", "{": "}"}
    for i, ch in enumerate(text):
        if ch in pairs: stack.append(pairs[ch])
        elif ch in pairs.values():
            if stack and stack[-1] == ch: stack.pop()
        elif ch == ":" and not stack: colon = i
    return colon


_TYPE_TOKEN = re.compile(r"->|\u2192|\u2200|forall\b|Sort\b|Prop\b|[^\W\d][\w']*|\d+|[^\s]",
                         re.UNICODE)


def _strip_outer_parens(tokens):
    while len(tokens) >= 2 and tokens[0] == "(" and tokens[-1] == ")":
        depth, closes_at_end = 0, False
        for i, token in enumerate(tokens):
            if token == "(": depth += 1
            elif token == ")": depth -= 1
            if depth == 0:
                closes_at_end = i == len(tokens) - 1
                break
        if not closes_at_end: break
        tokens = tokens[1:-1]
    return tokens


def _top_level_positions(tokens, wanted):
    pairs = {"(": ")", "[": "]", "{": "}"}
    stack, out = [], []
    for i, token in enumerate(tokens):
        if token in pairs: stack.append(pairs[token])
        elif token in pairs.values():
            if stack and stack[-1] == token: stack.pop()
        elif not stack and token in wanted: out.append(i)
    return out


def _is_prop_former(type_text):
    """Whether an explicit type is `Prop` or a function ending in `Prop`."""
    tokens = _strip_outer_parens(_TYPE_TOKEN.findall(type_text))
    if tokens == ["Prop"] or tokens == ["Sort", "0"]: return True
    arrows = _top_level_positions(tokens, {"->", "\u2192"})
    if arrows: return _is_prop_former(" ".join(tokens[arrows[-1] + 1:]))
    if tokens and tokens[0] in {"\u2200", "forall"}:
        commas = _top_level_positions(tokens, {","})
        if commas: return _is_prop_former(" ".join(tokens[commas[0] + 1:]))
    return False


def _declaration_type(decl):
    colon = _top_level_colon(decl.header)
    return None if colon is None else decl.header[colon + 1:].strip()


def _prop_input_before_result(decl):
    """Recognize proposition-combinator helpers such as `gluePi`.

    Such a definition returns a proposition supplied as data; it does not name a
    new mathematical assumption.  This deliberately applies only to definitions,
    not Prop-valued structures/classes/inductives.
    """
    colon = _top_level_colon(decl.header)
    if colon is None: return False
    return bool(re.search(r"\bProp\b|\bSort\s+0\b", decl.header[:colon]))


def _conclusion_name(type_text):
    tokens = _strip_outer_parens(_TYPE_TOKEN.findall(type_text))
    if tokens and tokens[0] in {"\u2200", "forall"}:
        commas = _top_level_positions(tokens, {","})
        if commas: return _conclusion_name(" ".join(tokens[commas[0] + 1:]))
    arrows = _top_level_positions(tokens, {"->", "\u2192"})
    if arrows: return None  # proving P from an implication does not inhabit P outright
    tokens = _strip_outer_parens(tokens)
    return tokens[0] if tokens and _WORD.fullmatch(tokens[0]) else None


def _contains_decl_name(text, name):
    short = name.rsplit(".", 1)[-1]
    return bool(re.search(r"(?<![\w'])" + re.escape(short) + r"(?![\w'])", text,
                          re.UNICODE))


def open_props(roots=None):
    """Prop-valued defs in KN/ that no theorem inhabits. Multi-line safe.

    A theorem inhabits P only if it concludes in P *and* its signature takes no
    open proposition -- as an arrow OR as a binder `(h : P)`.  Binders are where
    an unproved hypothesis hides from `#print axioms`, so ignoring them would
    make this test report a conditional theorem as closed.
    """
    # Scan BOTH the repo copy and the live build tree: an agent's new module lives only in the
    # build tree until it is synced, and its open propositions must still be discovered.
    # BUILD TREE FIRST.  Dedup keeps the first file of a given name, and the build tree is
    # authoritative while the repo copy is a stale snapshot.  With the repo copy first, a
    # stale version SHADOWED the fresh one, so an open proposition introduced only in the
    # build tree was invisible and a conditional theorem could read as closed.
    roots = roots or ([r for r in BUILD_KN if r.exists()] + [KN])
    seen, src = set(), []
    for root in roots:
        for f in root.glob("*.lean"):
            if f.name in seen: continue
            seen.add(f.name); src.append(f.read_text())
    decls = [decl for text in src for decl in declarations(text)]
    props = set()
    for decl in decls:
        typ = _declaration_type(decl)
        if (decl.kind in {"def", "abbrev", "opaque", "structure", "inductive", "class"}
                and typ is not None and _is_prop_former(typ)
                and not (decl.kind in {"def", "abbrev", "opaque"}
                         and _prop_input_before_result(decl))):
            props.add(decl.name)
    inhabited = set()
    for decl in decls:
        if decl.kind not in {"theorem", "lemma"}: continue
        typ = _declaration_type(decl)
        if typ is None: continue
        conclusion = _conclusion_name(typ)
        if conclusion is None: continue
        target = next((q for q in props
                       if conclusion == q or conclusion.rsplit(".", 1)[-1] == q.rsplit(".", 1)[-1]),
                      None)
        if target is None: continue
        colon = _top_level_colon(decl.header)
        binders = decl.header[:colon]
        if any(_contains_decl_name(binders, q) for q in props): continue
        inhabited.add(target)
    return props - inhabited

def hypotheses(printed):
    """Every top-level hypothesis of a printed type, as raw text.

    A hypothesis is not always a bare name.  It may follow a binder group, as in
        forall {V} (H : Hypergraph V E), OneClusterInequality H S T -> ...
    or be a quantified statement whose conclusion is the assumption that matters,
        (forall x Y D, ... -> CSHHolds H x Y D o v) -> ...
    so we hand back the whole segment and let the caller search it.  Taking only
    the leading token missed both of these.
    """
    depth, seg, out = 0, "", []
    for ch in printed:
        if ch in "([{": depth += 1
        elif ch in ")]}": depth -= 1
        if ch == "\u2192" and depth == 0: out.append(seg); seg = ""
        else: seg += ch
    # A segment is appended only when its trailing arrow is seen, so the conclusion is
    # left in `seg` and never enters `out`.  Trimming here would drop the LAST hypothesis.
    return out

def check_chunks(printed):
    """One chunk per `#check` output, with the `#print axioms` lines removed.

    Batching several theorems concatenates their printed types.  `hypotheses` splits on
    top-level arrows, so without this the conclusion of one theorem ran together with the
    head of the next, and an intervening `'Name' depends on axioms:` line became part of a
    hypothesis segment.  That is how a batch of 25 reported a spurious `Nonempty` against a
    quoted theorem name.  Verdicts on single names were never affected, only batches.
    """
    lines = [l for l in printed.splitlines()
             if not re.match(r"^'.*' depends on axioms:", l)]
    chunks, cur = [], []
    for l in lines:
        if l.startswith("@") and cur:
            chunks.append("\n".join(cur)); cur = [l]
        else:
            cur.append(l)
    if cur: chunks.append("\n".join(cur))
    return chunks


def open_prop_hits(segments, props):
    """Names of discovered open propositions used by top-level hypotheses."""
    return sorted({q for q in props for seg in segments
                   if re.search(r"(?<![\w'])" + re.escape(q) + r"(?![\w'])", seg,
                                re.UNICODE)})

def candidates(scratch, module, name):
    """Fully-qualified names to try, derived from the module's own namespaces.

    Guessing a fixed `open` list cannot reach declarations in other namespaces, and a
    failed lookup reads as a build error rather than as an unchecked theorem -- which
    silently left much of the tree unverified.
    """
    src = None
    for root in (pathlib.Path(scratch) / "build/percolation/KN", KN):
        f = root / (module + ".lean")
        if f.exists(): src = f.read_text(); break
    out, seen = [name], set()
    if src:
        acc = []
        for m in re.finditer(r"^(namespace|end)\s+(\S+)", src, re.M):
            if m.group(1) == "namespace": acc.append(m.group(2))
            elif acc and acc[-1] == m.group(2): acc.pop()
            if acc:
                q = ".".join(acc)
                if q not in seen: seen.add(q); out.append(q + "." + name)
    # longest namespace first: the most specific match is the intended one
    return [out[0]] + sorted(out[1:], key=len, reverse=True)

def elementary_hypothesis(seg):
    """A bare numeric side condition constrains parameters but assumes no theorem."""
    tail = seg.rsplit(",", 1)[-1].strip()
    return bool(re.fullmatch(r"\d+\s*[\u2264<]\s*[A-Za-z][A-Za-z_'0-9]*", tail))


def main():
    scratch, names = sys.argv[1], sys.argv[2:]
    tag = "Acceptance_%d" % os.getpid()
    f = pathlib.Path(scratch) / ("build/percolation/KN/%s.lean" % tag)
    cands = [candidates(scratch, n.split(".")[0], n.split(".", 1)[1]) for n in names]
    out = ""
    for attempt in range(max(len(c) for c in cands)):
        pick = [c[min(attempt, len(c) - 1)] for c in cands]
        f.write_text("".join("import KN.%s\n" % n.split(".")[0] for n in names)
                     + "open KNAll KNAll.Site\n"
                     + "".join("#check @%s\n#print axioms %s\n" % (q, q) for q in pick))
        out = subprocess.run([f"{scratch}/knc.sh", tag], capture_output=True, text=True).stdout
        if "unknownIdentifier" not in out and "Unknown constant" not in out: break
    (f.exists() and f.unlink())
    if "EXIT=0" not in out: print("BUILD FAILED"); print(out[-2000:]); return 1
    print("\n".join(l for l in out.splitlines() if l and not l.startswith(("EXIT", "Build", "info:"))))
    op = open_props()
    segs = [seg for chunk in check_chunks(out) for seg in hypotheses(chunk)]
    # The lookbehind must NOT exclude '.', or a qualified reference such as
    # `LeftImp.CertificateSound` is invisible and a conditional theorem reads as closed.
    hits = open_prop_hits(segs, op)
    # `Nonempty S` in a hypothesis assumes an inhabitant of a data structure.  That is exactly as
    # unproved as assuming a proposition, and `#print axioms` cannot see it either.
    # The lookbehind must exclude '.', or the CONCLUSION `(Bx ...).Nonempty` -- a Finset being
    # nonempty, which is a proved fact -- reads as an assumed inhabitant of a data structure.
    hits += ["Nonempty " + m.group(1) for seg in segs
             for m in re.finditer(r"(?<![A-Za-z_'0-9.])Nonempty\s+\(?\s*([A-Za-z_'0-9.]+)", seg)]
    hits = sorted(set(hits))
    print("%d top-level hypotheses; open propositions among them: %s"
          % (len(segs), ", ".join(hits) if hits else "none"))
    # Print every hypothesis.  A hypothesis spelled out as an inline formula rather than as a
    # named Prop-valued def is INVISIBLE to the open-proposition scan above, so the scan alone
    # must never be read as "this theorem is proved".  The capstone's `hdirectional` is exactly
    # such a hypothesis: undischarged, but not a named proposition, hence not flagged.
    for i, seg in enumerate(segs):
        flat = re.sub(r"\s+", " ", seg).strip()
        print("  h%d: %s" % (i + 1, flat[:160] + (" ..." if len(flat) > 160 else "")))
    if hits:
        print(); print("CONDITIONAL. Open propositions taken as hypotheses:")
        for h in hits: print("  " + h)
        return 1
    flat = re.sub(r"\s+", " ", out)
    STD = {"propext", "Classical.choice", "Quot.sound"}
    bad = []
    for m in re.finditer(r"'([^']+)' depends on axioms: \[([^\]]*)\]", flat):
        used = {a.strip() for a in m.group(2).split(",") if a.strip()}
        if not used <= STD: bad.append(m.group(0))
    if bad: print("EXTRA AXIOMS:"); print("\n".join(bad)); return 1
    # An "elementary" hypothesis is a bare numeric side condition such as `3 <= d`: it constrains
    # the dimension and assumes no mathematics.  Everything else -- `C.WellFormed`, a probability
    # bound, any quantified statement -- must be discharged before the result may be called proved.
    segs = [seg for seg in segs if not elementary_hypothesis(seg)]
    print()
    if segs:
        # Reserve the word UNCONDITIONAL for a theorem that assumes NOTHING.  It is the string
        # staged/sync.sh gates publication on, so overclaiming it here would let an undischarged
        # hypothesis reach a published page.
        print("NOT CLOSED: no open proposition and no extra axiom, but %d substantive "
              "hypotheses remain (listed above; bare numeric side conditions are not counted)."
              % len(segs))
        print("The theorem is closed only when every one is discharged by a separate result.")
        return 0
    print("UNCONDITIONAL: no substantive hypothesis, no open proposition, no extra axiom.")
    return 0
if __name__ == "__main__":
    sys.exit(main())
