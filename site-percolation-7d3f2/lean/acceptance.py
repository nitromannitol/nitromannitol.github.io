#!/usr/bin/env python3
"""Acceptance test for the unconditional theorem.

`#print axioms` cannot see hypothesis parameters: `theorem t (h : Hard) : Goal`
is axiom-clean and still conditional.  So we ask Lean to print the elaborated
type and flag every *open proposition* that occurs as a top-level argument.

Open propositions are discovered from the sources, never hand-listed: a hand
list silently misses propositions introduced later, which is the failure this
test exists to catch.
"""
import re, os, subprocess, sys, pathlib
KN = pathlib.Path(__file__).parent / "KN"
BUILD_KN = [pathlib.Path(a) / "build/percolation/KN" for a in sys.argv[1:2]]

def open_props():
    """Prop-valued defs in KN/ that no theorem inhabits. Multi-line safe.

    A theorem inhabits P only if it concludes in P *and* its signature takes no
    open proposition -- as an arrow OR as a binder `(h : P)`.  Binders are where
    an unproved hypothesis hides from `#print axioms`, so ignoring them would
    make this test report a conditional theorem as closed.
    """
    # Scan BOTH the repo copy and the live build tree: an agent's new module lives only in the
    # build tree until it is synced, and its open propositions must still be discovered.
    roots = [KN] + [r for r in BUILD_KN if r.exists()]
    seen, src = set(), []
    for root in roots:
        for f in root.glob("*.lean"):
            if f.name in seen: continue
            seen.add(f.name); src.append(f.read_text())
    DEF = r"^def\s+([A-Za-z_'0-9.]+)((?:[^\n]|\n(?!\S))*?):="
    THM = r"^(?:theorem|lemma)\s+([A-Za-z_'0-9.]+)((?:[^\n]|\n(?!\S))*?):="
    # `structure P ... : Prop where` is just as much an assumption as `def P ... : Prop`,
    # and is a favourite hiding place: it is never `sorry`, merely never constructed.
    STR = r"^(?:structure|inductive|class)\s+([A-Za-z_'0-9.]+)((?:[^\n]|\n(?!\S))*?)\bwhere\b"
    props = {m.group(1) for text in src for m in re.finditer(DEF, text, re.M)
             if re.search(r":\s*Prop\s*$", m.group(2).strip())}
    props |= {m.group(1) for text in src for m in re.finditer(STR, text, re.M)
              if re.search(r":\s*Prop\s*$", m.group(2).strip())}
    inhabited = set()
    for text in src:
        for m in re.finditer(THM, text, re.M):
            sig = m.group(2)
            tail = sig.rsplit(":", 1)[-1].strip()
            if "\u2192" in tail: continue
            c = re.match(r"([A-Za-z_'0-9.]+)", tail)
            if not c or c.group(1) not in props: continue
            body = sig[:sig.rfind(":")]
            if any(re.search(r"\b" + re.escape(q) + r"\b", body) for q in props): continue
            inhabited.add(c.group(1))
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
    segs = hypotheses(out)
    # The lookbehind must NOT exclude '.', or a qualified reference such as
    # `LeftImp.CertificateSound` is invisible and a conditional theorem reads as closed.
    hits = sorted({q for q in op for seg in segs
                   if re.search(r"(?<![A-Za-z_'0-9])" + re.escape(q) + r"(?![A-Za-z_'0-9])", seg)})
    print("%d top-level hypotheses; open propositions among them: %s"
          % (len(segs), ", ".join(hits) if hits else "none"))
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
    print(); print("UNCONDITIONAL: no open proposition taken as a hypothesis, no extra axiom.")
    return 0
sys.exit(main())
