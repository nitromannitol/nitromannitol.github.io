# Kozma–Nitzan's Conjecture 1 as a corollary of the Lean proof of θ(p_c) = 0

## What this folder certifies

The Lean 4 / Mathlib development *θ(p_c) = 0 for Bernoulli bond percolation on ℤ^d in all dimensions d ≥ 2*
(written by Claude, Anthropic, under the direction of Justin Leder; Lake package `PercolationContinuity`, Lean
`leanprover/lean4:v4.32.0`, Mathlib commit `81a5d257c8e410db227a6665ed08f64fea08e997`) says in its README, its proof
guide and its registry metadata that Conjecture 1 of Kozma–Nitzan is not claimed beyond three relays ("Not claimed:
Kozma–Nitzan's Conjecture 1 beyond three relays"); its proof guide puts it as "Conjectures 1, 2 and 4 are neither
proved nor stated in the release", and its main-theorem docstring says that its additive gluing theorem "is not
Conjecture 1 itself".

The three Lean files here show that Conjecture 1, for arbitrary relay sets, is a formal consequence of theorems
already proved in that development:

    P(o ↔ b) ≥ P(o ↔ A) · min_{a ∈ A} P(a ↔ b)

for Bernoulli bond percolation on every finite graph with arbitrary edge probabilities in [0,1], every nonempty
finite set A of vertices and all vertices o, b, with no further hypothesis (G. Kozma and S. Nitzan, *A reduction of
the θ(p_c) = 0 problem to a conjectured inequality*, arXiv:2401.12397, Conjecture 1, p. 3). Lean accepts the proof
with exactly the standard axioms `propext`, `Classical.choice`, `Quot.sound` and no `sorry`.

## Files

| File | Content |
|---|---|
| `KN1Statement.lean` | The statement from Mathlib alone: `KN1Statement.MultiplicativeGluing`. Its three definitions (the product Bernoulli measure on pairs, the open graph, the connection event) are definitionally equal copies of the development's, with its abbreviation `BondConfig V` for `Set (Sym2 V)` unfolded. |
| `KozmaNitzanConjecture1.lean` | The proof from the development's theorems: `KN1Corollary.kozmaNitzan_conjecture1` (all new declarations live in the fresh namespace `KN1Corollary`, so that they cannot be mistaken for theorems of the development), together with the general forms `gen_all` (the first-relay bound for every relay set) and `multiplicativeGluing_all` (any common lower bound q in place of the minimum). |
| `KN1Bridge.lean` | `KN1Statement.multiplicativeGluing_holds`: the Mathlib-only statement proved, by definitional unfolding, from the theorem of `KozmaNitzanConjecture1.lean`. |
| `verification.log` | Recorded summary of a clean build of the development, the three compilations with their `#print axioms` output, and the complete output of the development's own axiom-audit script. |
| `SOURCES.sha256` | SHA-256 of the development's 251 Lean source files and its three pin files (`lakefile.toml`, `lake-manifest.json`, `lean-toolchain`), 254 entries, against which this was checked. The tree hash `b80e9252…` quoted in `verification.log` is `grep -v '^#' SOURCES.sha256 \| shasum -a 256`. |

## How to check

1. Obtain the development and confirm it is the one checked here: from its root, run
   `shasum -a 256 -c /path/to/kn1-verification-b80e9/conjecture-1/SOURCES.sha256` (all 254 entries should report `OK`).
2. Build it as its README says: `lake exe cache get && lake build`.
3. Copy the three `.lean` files into its root and run

       lake env lean -o .lake/build/lib/lean/KozmaNitzanConjecture1.olean KozmaNitzanConjecture1.lean
       lake env lean -o .lake/build/lib/lean/KN1Statement.olean KN1Statement.lean
       lake env lean KN1Bridge.lean

   Expected output: the `#print axioms` lines recorded in `verification.log`, each reading
   `[propext, Classical.choice, Quot.sound]`, with no errors and no `sorry` warnings.

## Attribution

Earlier certificate (Conjecture 1 only), extended by the folder `lean/`, which covers Conjectures 1–4 and Question 7 and re-derives Conjecture 1 on its own. `LICENSE` and `NOTICE` are at the root of this site. The mathematics is entirely the development's, whose internal docstring in
`Percolation/Continuity/CSH/Defs.lean` already notes the multiplicative consequence. Produced entirely by AI
systems, Claude Fable 5.1 (max) and ChatGPT 5.6 sol (ultra): ChatGPT pointed out that Conjecture 1 follows by
the development's methods, and Claude Fable 5.1 wrote and machine-checked the Lean corollary, which was then
checked by six AI review passes (three Claude Opus, three OpenAI Codex). Released under the Apache License 2.0,
matching the development.
