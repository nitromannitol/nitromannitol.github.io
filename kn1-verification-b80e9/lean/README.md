# Kozma–Nitzan's conjectures and questions: Lean certificate

Fourteen Lean modules on top of the development *θ(p_c) = 0 for Bernoulli bond percolation on ℤ^d* (Lean 4.32.0, the
development's Mathlib pin). Every theorem reports exactly `[propext, Classical.choice, Quot.sound]` (`VERIFICATION.log`); no
`sorry`, no axioms. Vocabulary: `prodBernoulli`, `openConn`, `openCluster` of the development; vertices `Fin n`, weights in
[0,1] on all pairs (absent edge = weight 0); `x ↔ y` = joined by an open path; `C_x` the open cluster; `o ↔ A` = `⋃_{a∈A} {o ↔ a}`.

## Machine-checked

* Conjecture 4 (p. 32), fixed-minimiser form: if `a ∈ A` minimises `E F(C_x)` over `A` then `E[F(C_a); o ↔ A] ≤ E[F(C_o); o ↔ A]`
  (`conjecture4Fixed_holds`); hence `min_{x∈A} E[F(C_x); o ↔ A] ≤ E[F(C_o); o ↔ A]` (`conjecture4_holds`); also in the paper's
  vocabulary of monotone cluster properties (`conjecture4_clusterProperty_holds`).
* Conjecture 2 (p. 3), strong form (3): `min_{x∈A} P(x ↔ b, o ↔ A) ≤ P(o ↔ b, o ↔ A)` (`conjecture2Strong_holds`); hence
  `min_{x∈A} P(o ↔ A, x ↔ b) ≤ P(o ↔ b)` (`conjecture2_holds`).
* Question 7 (p. 36): if `a ∈ A` minimises `P(a ↔ b)` then `P(o ↔ A, a ↔ b) ≤ P(o ↔ b, o ↔ A)` (`question7_holds`).
* Conjecture 1 (p. 3): `P(o ↔ A) · min_{x∈A} P(x ↔ b) ≤ P(o ↔ b)` (`conjecture1_holds`, from (3) by Harris).
* Conjecture 3 (p. 15), from Conjecture 1 (`conjecture3_holds`).
* Question 5 (p. 32), probabilistic half: for every `y ≥ 0` some `a ∈ A` has `Σ_b y_b P(o ↔ A, a ↔ b) ≤ Σ_b y_b P(o ↔ b)`
  (`question5_dual`). The `b`-independent coefficients of (38) follow by finite-dimensional separation (not yet formalized).
* Conjecture 6 (p. 34), reductions only: strong form ⟹ (40) (`conjecture6_of_conjecture6Strong`); hypothesis (39) follows from
  Conjecture 1 (`conjecture6_hypotheses_vacuous`); strong form when the minimiser is taken in the forced-open graph
  (`conjecture6Strong_of_forceOpen_min`); pair-source projection identities and overlap lemma (`PairSource`).

In print, Conjectures 2 and 4 are proved for two relays (Theorems 1 and 7), for three relays under extra
hypotheses (Theorems 2, 3 and 11), for an observer isolated in `G ∖ A` and its one-vertex extension (Theorems 4
and 5), and, for every graph and every relay set, for the cluster properties f = 1{|C| ≥ k} with k ≤ 4 (Theorem
9). Both were open in general.

## Not machine-checked

Conjecture 6 (strong form, no endpoint hypotheses) and Question 9 are proved in the document
`../document/kozma_nitzan_all_conjectures_proof.pdf` via a source-set extension of the avoided first-relay bound; the document's
first Conjecture 6 argument had an error (found by a Codex audit), the corrected argument was audited by two Codex passes and one
Claude Opus pass with exact enumeration and no gap found; Lean formalization in progress. Question 8 in the paper's reading (the
minimiser of `P(a ↔ b, o ↮ A)`) is not settled; the document's Question 8 argument concerns the minimiser of `P(o ↔ A, a ↔ b)`,
which is the strong form of Conjecture 2.

## Files

`AvoidedDefs`, `AvoidedPeelTools`, `AvoidedPeel`, `AvoidedTransfer`, `AvoidedGen`, `Projection`, `AvoidedClosure`, `Statements`, `Conjectures`, `ClusterProperty`, `Statements6`, `PairSource`, `Conjecture6Reduction`, `Question5Dual` (`.lean`, compile in this order); `Projection.REPORT.md`,
`AvoidedClosure.REPORT.md`; `VERIFICATION.log`.

## How to check

From the development's root (optionally first `shasum -a 256 -c /path/to/conjecture-1/SOURCES.sha256`), after
`lake exe cache get && lake build`, copy the fourteen `.lean` files to `KN/` and run

    mkdir -p .lake/build/lib/lean/KN
    for m in AvoidedDefs AvoidedPeelTools AvoidedPeel AvoidedTransfer AvoidedGen Projection AvoidedClosure Statements Conjectures ClusterProperty Statements6 PairSource Conjecture6Reduction Question5Dual; do
      lake env lean -o .lake/build/lib/lean/KN/$m.olean -i .lake/build/lib/lean/KN/$m.ilean KN/$m.lean || break
    done

Expected: the fourteen `#print axioms` lines of `VERIFICATION.log`, all `[propext, Classical.choice, Quot.sound]`.

## Attribution

Produced entirely by AI systems, Claude Fable 5.1 (max) and ChatGPT 5.6 sol (ultra). The document is ChatGPT's;
its Conjecture 6 argument was corrected after a Codex audit found the error described above. Claude Fable 5.1
designed the Lean formalization, wrote and machine-checked eight of the fourteen modules and this page, and
specified the modules Projection, AvoidedClosure and PairSource, which were written by the ChatGPT model through
Codex and recompiled by Claude; ClusterProperty, Conjecture6Reduction and Question5Dual were contributed by
Claude Opus audit and research passes. All mathematics below the avoided first-relay bound is the development's.
Review status: three independent Claude Opus audit passes of the Lean certificate (statement fidelity, proof
validity, public text) found no mathematical error; their edits are incorporated. The development itself has not
been refereed by external experts (see its README, 'Provenance and review status'). Released under the Apache
License 2.0, matching the development.
