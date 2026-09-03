#!/usr/bin/env python3
"""Acceptance test for the unconditional theorem.

`#print axioms` cannot see hypothesis parameters: `theorem t (h : Hard) : Goal`
is axiom-clean and still conditional.  So we ask Lean to print the elaborated
type and flag every *open proposition* that occurs as a top-level argument.

Open propositions are discovered from the sources, never hand-listed: a hand
list silently misses propositions introduced later, which is the failure this
test exists to catch.
"""
import re, subprocess, sys, pathlib
KN = pathlib.Path(__file__).parent / "KN"

def open_props():
    """Prop-valued defs in KN/ that no theorem inhabits. Multi-line safe.

    A theorem inhabits P only if it concludes in P *and* its signature takes no
    open proposition -- as an arrow OR as a binder `(h : P)`.  Binders are where
    an unproved hypothesis hides from `#print axioms`, so ignoring them would
    make this test report a conditional theorem as closed.
    """
    src = [f.read_text() for f in KN.glob("*.lean")]
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

def main():
    scratch, names = sys.argv[1], sys.argv[2:]
    f = pathlib.Path(scratch) / "build/percolation/KN/Acceptance.lean"
    f.write_text("".join(f"import KN.{n.split('.')[0]}\n" for n in names)
                 + "open KNAll KNAll.Site\n"
                 + "".join(f"#check @{n.split('.',1)[1]}\n#print axioms {n.split('.',1)[1]}\n" for n in names))
    out = subprocess.run([f"{scratch}/knc.sh", "Acceptance"], capture_output=True, text=True).stdout
    (f.exists() and f.unlink())
    if "EXIT=0" not in out: print("BUILD FAILED"); print(out[-2000:]); return 1
    print("\n".join(l for l in out.splitlines() if l and not l.startswith(("EXIT", "Build", "info:"))))
    op = open_props()
    segs = hypotheses(out)
    hits = sorted({q for q in op for seg in segs
                   if re.search(r"(?<![A-Za-z_'0-9.])" + re.escape(q) + r"(?![A-Za-z_'0-9])", seg)})
    print("%d top-level hypotheses; open propositions among them: %s"
          % (len(segs), ", ".join(hits) if hits else "none"))
    print()
    if hits:
        print("CONDITIONAL. Open propositions taken as hypotheses:")
        for h in hits: print("  " + h)
        return 1
    # Lean wraps long output, so an axiom list can span lines: normalise whitespace
    # before matching, or a wrapped `[propext,` reads as an extra axiom.
    flat = re.sub(r"\s+", " ", out)
    bad = [m.group(0) for m in re.finditer(r"'[^']+' depends on axioms: \[[^\]]*\]", flat)
           if "[propext, Classical.choice, Quot.sound]" not in m.group(0)]
    if bad: print("EXTRA AXIOMS:"); print("\n".join(bad)); return 1
    print("UNCONDITIONAL: no open proposition taken as a hypothesis, no extra axiom.")
    return 0
sys.exit(main())
