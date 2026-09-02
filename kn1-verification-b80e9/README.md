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
| `LICENSE`, `NOTICE` | Apache License 2.0, and the development's NOTICE reproduced as that licence requires. |
| `SOURCES.sha256` | SHA-256 of the development's 251 Lean source files and its three pin files (`lakefile.toml`, `lake-manifest.json`, `lean-toolchain`), 254 entries, against which this was checked. The tree hash `b80e9252…` quoted in `verification.log` is `grep -v '^#' SOURCES.sha256 \| shasum -a 256`. |

## How the proof goes

For an increasing F ≥ 0 of vertex sets, order the relays by m_a = E F(C_a) and let P^o_a be the event that a is the
first relay of o (o ↔ a and o ↮ a' for every relay a' of smaller rank). The development proves, for every finite
relay set and all weights in [0,1], the first-relay bound

    Σ_{a ∈ A} P(P^o_a) · E F(C_a) ≤ E[F(C_o); o ↔ A]

(`AGloc.gen_firstRank_of_surplusTransfer`, with its surplus-transfer hypothesis supplied by `CSH.cshAll`,
`CSH.surplusMargin_nonneg_of_csh`, `CSH.surplusTransfer_nondegenerate_of_surplusMargin` and the closure over weights 0
and 1 in `CSH.surplusTransfer_of_nondegenerate`). With F = 1{b ∈ ·} this reads
Σ_a P(P^o_a) P(a ↔ b) ≤ P(o ↔ A, o ↔ b) ≤ P(o ↔ b) (`AGloc.agloc_firstRank_of_gen`). The events P^o_a partition
{o ↔ A}, so Σ_a P(P^o_a) = P(o ↔ A), and pulling out the minimum gives Conjecture 1. The development's additive
gluing theorem comes from the same inequality and is then weakened by bounding t·P(o ↔ A) by t (the step `h5` of
`AGloc.additiveGluing_card_of_agloc_firstRank`); the file here keeps the factor. No new mathematical idea is
involved: all the mathematics is the development's conditioned slack hierarchy and its peeling argument, and the
development's own design note says as much (`Percolation/Continuity/CSH/Defs.lean`, lines 50–51: (S5) gives the
first-relay bound "and with it the additive and multiplicative gluing inequalities"). What is added here is the
closed statement and its machine-checked derivation, which the release does not contain ("Conjectures 1, 2 and 4
are neither proved nor stated in the release", `summary.tex`).

## How to check

1. Obtain the development and confirm it is the one checked here: from its root, run
   `shasum -a 256 -c /path/to/kn1-verification-b80e9/SOURCES.sha256` (all 254 entries should report `OK`).
2. Build it as its README says: `lake exe cache get && lake build`.
3. Copy the three `.lean` files into its root and run

       lake env lean -o .lake/build/lib/lean/KozmaNitzanConjecture1.olean KozmaNitzanConjecture1.lean
       lake env lean -o .lake/build/lib/lean/KN1Statement.olean KN1Statement.lean
       lake env lean KN1Bridge.lean

   Expected output: the `#print axioms` lines recorded in `verification.log`, each reading
   `[propext, Classical.choice, Quot.sound]`, with no errors and no `sorry` warnings.

## Status, and what is not claimed

* Correctness rests on the development's kernel-checked chain. The development has not been externally refereed
  (its README says so), and the corollary inherits that status; the mechanical checks are those in `verification.log`.
* The development's stated repository URL (github.com/anthropic-experimental/percolation) was not publicly
  accessible on 2 September 2026. This folder therefore does not redistribute the development; it pins its Lean
  sources and build pins by hash (its documentation files are not hashed).
* The corollary has not been run through the Palomar comparator, which compares only the two θ(p_c) = 0 statements
  of the development's `Challenge.lean`.
* Nothing is claimed about Kozma–Nitzan's Conjectures 2 and 4. Conjecture 4 puts the event {o ↔ A} inside the
  expectations on both sides, E[f(o); o ↔ A] ≥ min_a E[f(a); o ↔ A], whereas the first-relay bound has unrestricted
  relay means and only gives P(o ↔ A)·min_a E f(C_a), which by the Harris inequality is the weaker quantity; so this
  route does not reach it. Conjecture 2, the paper's "pre-FKG" form P(o ↔ b) ≥ min_a P(o ↔ A, a ↔ b), is stronger
  than Conjecture 1 and is likewise not given by this certificate.
* The Lean statement was compared with the paper's Conjecture 1 as printed on its page 3 ("Let G be a finite graph
  with arbitrary probabilities on its edges"; P(0 ↔ b) ≥ P(0 ↔ A) min{P(a ↔ b) : a ∈ A}) and with the development's
  transcription of it in `Percolation/Literature/KozmaNitzanReduction.lean`. The development formalises graphs on
  the vertex set `Fin n`, which represents every finite graph (absent edges have weight 0).

## Attribution

The mathematics is entirely the development's. Its internal docstring in `Percolation/Continuity/CSH/Defs.lean`
already notes that the first-relay bound yields "the additive and multiplicative gluing inequalities", in spite
of the release-level disclaimers, and its proof guide (`summary.tex`, the paragraph "Why (GEN) ⇒ (AG-loc) ⇒
(AG)") displays the intermediate estimate P(o ↔ A, o ↮ b) ≤ t·P(o ↔ A) before weakening it to t. What the
release lacks is the closed statement and its short assembly, which these files supply. (The paper's footnote on
p. 3 records that J. van den Berg and D. van Engelenburg independently considered the same inequality;
"Kozma–Nitzan's Conjecture 1" is used here as the conventional name.) This folder was produced entirely by AI
systems, Claude Fable 5.1 (max) and ChatGPT 5.6 sol (ultra): ChatGPT pointed out that Conjecture 1 follows by
the same methods, and Claude Fable 5.1 wrote and machine-checked the explicit corollary and this folder, which
was then checked by six AI review passes (three Claude Opus, three OpenAI Codex) before being posted. The three
Lean files are released under the Apache License 2.0, matching the development.
