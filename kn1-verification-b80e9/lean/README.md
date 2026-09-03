# The conjectures and questions of Kozma and Nitzan: Lean files

Thirty-three Lean modules on top of the development *θ(p_c) = 0 for Bernoulli bond percolation on ℤ^d* (Lean 4.32.0, the
development's Mathlib pin). Every theorem reports exactly `[propext, Classical.choice, Quot.sound]` (`VERIFICATION.log`); no
`sorry`, no axioms. Vocabulary: `prodBernoulli`, `openConn`, `openCluster` of the development; vertices `Fin n`, weights in
[0,1] on all pairs (absent edge = weight 0); `x ↔ y` = joined by an open path; `C_x` the open cluster; `o ↔ A` = `⋃_{a∈A} {o ↔ a}`.

## Theorems

* Conjecture 4 (p. 32), with the minimiser specified: if `a ∈ A` minimises `E F(C_x)` over `A` then `E[F(C_a); o ↔ A] ≤ E[F(C_o); o ↔ A]`
  (`conjecture4Fixed_holds`); hence `min_{x∈A} E[F(C_x); o ↔ A] ≤ E[F(C_o); o ↔ A]` (`conjecture4_holds`); also in the paper's
  vocabulary of monotone cluster properties (`conjecture4_clusterProperty_holds`).
* Conjecture 2 (p. 3), pre-FKG form (3): `min_{x∈A} P(x ↔ b, o ↔ A) ≤ P(o ↔ b, o ↔ A)` (`conjecture2Strong_holds`); hence
  `min_{x∈A} P(o ↔ A, x ↔ b) ≤ P(o ↔ b)` (`conjecture2_holds`).
* Question 7 (p. 36): if `a ∈ A` minimises `P(a ↔ b)` then `P(o ↔ A, a ↔ b) ≤ P(o ↔ b, o ↔ A)` (`question7_holds`).
* Conjecture 1 (p. 3): `P(o ↔ A) · min_{x∈A} P(x ↔ b) ≤ P(o ↔ b)` (`conjecture1_holds`); Conjecture 3 (p. 15) from it (`conjecture3_holds`).
* Question 5 (p. 32): coefficients `c_a ≥ 0` summing to 1, independent of `b`, with `Σ_a c_a P(o ↔ A, a ↔ b) ≤ P(o ↔ b)` for all `b`,
  display (38) (`question5_holds`).
* Conjecture 6 (p. 34), without its endpoint hypotheses: for `e = {v, w}` and `a ∈ A` minimising `P_G(x ↔ b)`, in the graph with the
  probability of `e` set to 1, `P(a ↔ b, v ↔ A) ≤ P(v ↔ b, v ↔ A)` (`Guarded.conjecture6Strong_holds`) and
  `P(v ↔ A) · P(a ↔ b) ≤ P(v ↔ b)`, display (40) (`Guarded.conjecture6_holds`); the paper's hypothesis (39) follows from Conjecture 1
  (`conjecture6_hypotheses_vacuous`).
* Question 9 (p. 36): the statement `Question9` (`Statements9`) follows from Conjecture 4 for the union of the clusters of an arbitrary
  finite set of vertices, `SetSourceFixedMin` (`question9_of_setSourceFixedMin`); `SetSourceFixedMin` itself is proved in the summary (`../document/kn_summary.pdf`).
* Question 8 (p. 36): the printed question with the minimiser of `P(a ↔ b, o ↮ A)`, in the reading for every minimiser, is false
  (`not_question8EveryMin`, the four-vertex path); the readings with a unique minimiser and with `P(o ↮ A) > 0` are stated
  (`Question8Strict`, `Question8Positive`) and are equivalent (`q8Strict_iff_q8Positive`); the settled cases (`q8_singleton`, `q8_bEqO`,
  `q8_degenerate_allMin`, `q8_zeroScore`); it suffices to treat weights in (0,1) (`q8Strict_of_interior`); a sufficient criterion
  (`q8_of_firstRelayCriterion`).

In print, Conjectures 2 and 4 are proved when `A` has two vertices (Theorems 1 and 7), three vertices under extra hypotheses
(Theorems 2, 3 and 11), when `o` is isolated in `G ∖ A` or joined only to `A` and one further vertex (Theorems 4 and 5), and, for
every graph and every `A`, for the cluster properties `f = 1{|C| ≥ k}` with `k ≤ 4` (Theorem 9).

## Files

`AvoidedDefs`, `AvoidedPeelTools`, `AvoidedPeel`, `AvoidedTransfer`, `AvoidedGen`, `Projection`, `AvoidedClosure`, `Statements`, `Conjectures`, `ClusterProperty`, `Statements6`, `PairSource`, `Conjecture6Reduction`, `Question5Dual`, `Question5`, `GuardedDefs`, `GuardedBasic`, `GuardedKernel`, `GuardedDecoy`, `GuardedTwoCluster`, `PairGuardedCSH`, `PairSurplus`, `PairSurplusClosure`, `PairFixedMin`, `Conjecture6Proof`, `Statements9`, `Question9Reduction`, `Question8Defs`, `Question8Cases`, `Question8Counterexample`, `Question8Equivalence`, `Question8Sufficient`, `Question8Interior` (`.lean`, compile in this order); `Projection.REPORT.md`, `AvoidedClosure.REPORT.md`; `VERIFICATION.log`.

## How to check

From the development's root (optionally first `shasum -a 256 -c /path/to/conjecture-1/SOURCES.sha256`), after
`lake exe cache get && lake build`, copy the `.lean` files to `KN/` and run

    mkdir -p .lake/build/lib/lean/KN
    for m in AvoidedDefs AvoidedPeelTools AvoidedPeel AvoidedTransfer AvoidedGen Projection AvoidedClosure Statements Conjectures ClusterProperty Statements6 PairSource Conjecture6Reduction Question5Dual Question5 GuardedDefs GuardedBasic GuardedKernel GuardedDecoy GuardedTwoCluster PairGuardedCSH PairSurplus PairSurplusClosure PairFixedMin Conjecture6Proof Statements9 Question9Reduction Question8Defs Question8Cases Question8Counterexample Question8Equivalence Question8Sufficient Question8Interior; do
      lake env lean -o .lake/build/lib/lean/KN/$m.olean -i .lake/build/lib/lean/KN/$m.ilean KN/$m.lean || break
    done

Expected: the `#print axioms` lines of `VERIFICATION.log`, all `[propext, Classical.choice, Quot.sound]`.

## Attribution

All of this was done autonomously by ChatGPT 5.6 Sol and Claude Fable 5.1, with minimal human intervention. Released under the
Apache License 2.0, matching the development.
