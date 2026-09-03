# Kozma–Nitzan's conjectures and questions: Lean certificate

Fifteen Lean modules on top of the development *θ(p_c) = 0 for Bernoulli bond percolation on ℤ^d* (Lean 4.32.0, the
development's Mathlib pin). Every theorem reports exactly `[propext, Classical.choice, Quot.sound]` (`VERIFICATION.log`); no
`sorry`, no axioms. Vocabulary: `prodBernoulli`, `openConn`, `openCluster` of the development; vertices `Fin n`, weights in
[0,1] on all pairs (absent edge = weight 0); `x ↔ y` = joined by an open path; `C_x` the open cluster; `o ↔ A` = `⋃_{a∈A} {o ↔ a}`.

## Machine-checked

* Conjecture 4 (p. 32), with the minimiser specified: if `a ∈ A` minimises `E F(C_x)` over `A` then `E[F(C_a); o ↔ A] ≤ E[F(C_o); o ↔ A]`
  (`conjecture4Fixed_holds`); hence `min_{x∈A} E[F(C_x); o ↔ A] ≤ E[F(C_o); o ↔ A]` (`conjecture4_holds`); also in the paper's
  vocabulary of monotone cluster properties (`conjecture4_clusterProperty_holds`).
* Conjecture 2 (p. 3), pre-FKG form (3): `min_{x∈A} P(x ↔ b, o ↔ A) ≤ P(o ↔ b, o ↔ A)` (`conjecture2Strong_holds`); hence
  `min_{x∈A} P(o ↔ A, x ↔ b) ≤ P(o ↔ b)` (`conjecture2_holds`).
* Question 7 (p. 36): if `a ∈ A` minimises `P(a ↔ b)` then `P(o ↔ A, a ↔ b) ≤ P(o ↔ b, o ↔ A)` (`question7_holds`).
* Conjecture 1 (p. 3): `P(o ↔ A) · min_{x∈A} P(x ↔ b) ≤ P(o ↔ b)` (`conjecture1_holds`, from (3) by Harris).
* Conjecture 3 (p. 15), from Conjecture 1 (`conjecture3_holds`).
* Question 5 (p. 32): coefficients `c_a ≥ 0` summing to 1, independent of `b`, with `Σ_a c_a P(o ↔ A, a ↔ b) ≤ P(o ↔ b)` for all `b`,
  display (38) (`question5_holds`; from `question5_dual`, i.e. Conjecture 4 for `F(K) = Σ_b y_b 1{b ∈ K}` with `y ≥ 0`, plus separation).
* Conjecture 6 (p. 34), reductions only: `P_{G⏚e}(v ↔ b, v ↔ A) ≥ P_{G⏚e}(a ↔ b, v ↔ A)` implies (40) (`conjecture6_of_conjecture6Strong`);
  hypothesis (39) follows from Conjecture 1 (`conjecture6_hypotheses_vacuous`); that inequality holds when `a` minimises
  `P_{G⏚e}(x ↔ b)` (`conjecture6Strong_of_forceOpen_min`); for `S = {v, w}` and any event `H` determined by `C_v ∪ C_w`,
  `E[(F(C_v ∪ C_w) − F(C_a)); S ↮ a, H] = E[φ_a(C_v ∪ C_w); S ↮ a, H]` with `φ_a(K) = F(K) − E F(C_a in the graph with all pairs meeting
  K removed)`, and `E[(F(C_v ∪ C_w) − F(C_a)); S ↮ a] ≥ 0` when `E F(C_a) ≤ E F(C_v)` (`PairSource`).

In print, Conjectures 2 and 4 are proved for two relays (Theorems 1 and 7), for three relays under extra
hypotheses (Theorems 2, 3 and 11), for an observer isolated in `G ∖ A` and its one-vertex extension (Theorems 4
and 5), and, for every graph and every relay set, for the cluster properties f = 1{|C| ≥ k} with k ≤ 4 (Theorem
9). Both were open in general.

## Not machine-checked

Conjecture 6 (in the form above, no endpoint hypotheses) and Question 9 are proved in the document
`../document/kozma_nitzan_all_conjectures_proof.pdf` by running the development's argument for the union of the clusters of a set
of vertices in place of a single cluster; Lean formalization in progress. Question 8 in the paper's reading (the minimiser of
`P(a ↔ b, o ↮ A)`) is not settled; the document's Question 8 argument concerns the minimiser of `P(o ↔ A, a ↔ b)`, which is
form (3) of Conjecture 2.

## Files

`AvoidedDefs`, `AvoidedPeelTools`, `AvoidedPeel`, `AvoidedTransfer`, `AvoidedGen`, `Projection`, `AvoidedClosure`, `Statements`, `Conjectures`, `ClusterProperty`, `Statements6`, `PairSource`, `Conjecture6Reduction`, `Question5Dual`, `Question5` (`.lean`, compile in this order); `Projection.REPORT.md`,
`AvoidedClosure.REPORT.md`; `VERIFICATION.log`.

## How to check

From the development's root (optionally first `shasum -a 256 -c /path/to/conjecture-1/SOURCES.sha256`), after
`lake exe cache get && lake build`, copy the fifteen `.lean` files to `KN/` and run

    mkdir -p .lake/build/lib/lean/KN
    for m in AvoidedDefs AvoidedPeelTools AvoidedPeel AvoidedTransfer AvoidedGen Projection AvoidedClosure Statements Conjectures ClusterProperty Statements6 PairSource Conjecture6Reduction Question5Dual Question5; do
      lake env lean -o .lake/build/lib/lean/KN/$m.olean -i .lake/build/lib/lean/KN/$m.ilean KN/$m.lean || break
    done

Expected: the fifteen `#print axioms` lines of `VERIFICATION.log`, all `[propext, Classical.choice, Quot.sound]`.

## Attribution

Produced entirely by AI systems, Claude Fable 5.1 (max) and ChatGPT 5.6 sol (ultra). The document is ChatGPT's.
Claude Fable 5.1 designed the Lean formalization, wrote and machine-checked eight of the fifteen modules and
this page, and specified the modules Projection, AvoidedClosure, PairSource and Question5, which were written by
the ChatGPT model through Codex and recompiled by Claude; ClusterProperty, Conjecture6Reduction and
Question5Dual were contributed by Claude Opus. All mathematics below the conditioned first-relay inequality is
the development's. Released under the Apache License 2.0, matching the development.
