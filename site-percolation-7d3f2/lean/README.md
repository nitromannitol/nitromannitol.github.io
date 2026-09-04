# Lean source snapshot

This directory contains the 193 modules from the `KN` directory used in the checked build. It is a
source snapshot, not a standalone Lake project. The theorem for Bernoulli site percolation on
`ℤ^d`, for `d ≥ 3`, is in `FinalCriticality.lean`:

```lean
theorem KNAll.Site.site_no_percolation_at_critical
    (d : ℕ) (hd : 3 ≤ d) :
    thetaSite d (criticalProbSiteI d) = 0
```

These files extend Anthropic's Lean percolation library at
[`795efb86f191735c5481675763537cfb4ff37e55`](https://github.com/anthropics/formal-math/tree/795efb86f191735c5481675763537cfb4ff37e55/percolation).
To reproduce the build, place the `.lean` files under that project's `KN/` directory. The checked
build used Lean 4.32.0 and Mathlib commit `81a5d257c8e410db227a6665ed08f64fea08e997`.

To expose the final module as a Lake target, add `KN.FinalCriticality` to the `roots` array of the
project's `Percolation` Lean library. Then run:

```sh
lake exe cache get
lake -R build KN.FinalCriticality
```

`FINAL_CHECK.txt` records the theorem type and its axiom report. The included `acceptance.py` is the
checker used in the release workspace; it expects a first argument naming a directory that contains
both `build/percolation/KN/` and the `knc.sh` compilation script. For example:

```sh
python3 acceptance.py /path/to/workspace \
  FinalCriticality.site_no_percolation_at_critical
```

The checker rejects substantive proposition-valued hypotheses and axioms outside the standard set
allowed for this development. The reported axioms are `propext`, `Classical.choice`, and
`Quot.sound`.

The current checked site theorem is for `d ≥ 3`. The classical planar site theorem is not part of
this Lean declaration.
