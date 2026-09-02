# Kozma–Nitzan's Conjectures 2 and 4 (and Question 7): Lean certificate

## What is certified

For Bernoulli bond percolation on a finite weighted graph (vertices `Fin n`, weights in [0,1] on all pairs, absent edge =
weight 0; `x ↔ y` = joined by an open path, `C_x` the open cluster, `o ↔ A` = `⋃_{a∈A} {o ↔ a}`), with `A` a nonempty finite
set of relays, `o, b` vertices and `F` an increasing real function of vertex sets:

* Conjecture 4 (p. 32), fixed-minimiser form: if `a ∈ A` minimises `E F(C_x)` over `A`, then `E[F(C_a); o ↔ A] ≤ E[F(C_o); o ↔ A]`
  (`conjecture4Fixed_holds`); hence `min_{x∈A} E[F(C_x); o ↔ A] ≤ E[F(C_o); o ↔ A]` (`conjecture4_holds`).
* Conjecture 2 (p. 3), strong (pre-FKG) form (3): `min_{x∈A} P(x ↔ b, o ↔ A) ≤ P(o ↔ b, o ↔ A)` (`conjecture2Strong_holds`);
  hence `min_{x∈A} P(o ↔ A, x ↔ b) ≤ P(o ↔ b)` (`conjecture2_holds`).
* Question 7 (p. 36), affirmative: if `a ∈ A` minimises `P(a ↔ b)` over `A` then `P(o ↔ A, a ↔ b) ≤ P(o ↔ b, o ↔ A)`, the
  paper's display (41) (`question7_holds`).
* Conjecture 1 (p. 3): `P(o ↔ A) · min_{x∈A} P(x ↔ b) ≤ P(o ↔ b)` (`conjecture1_holds`).
* Conjecture 3 (p. 15): the development's `kozmaNitzan_conjecture3_holds` (`conjecture3_holds`).

Conjectures 2 and 4 are new: they were known only for two relays and for an observer isolated in `G ∖ A`, and the
fixed-minimiser form settles Question 7. Conjecture 1 is essentially the development's own result (its first-relay bound gives
it in a few lines) and is exported in the same file for completeness.

Every theorem is accepted by Lean 4.32.0 with the pinned Mathlib and reports exactly `[propext, Classical.choice, Quot.sound]`
(`VERIFICATION.log`, a clean sequential recompile of all nine modules); no `sorry`, no axioms. The statements are
`Conjecture4Fixed`, `Conjecture4`, `Conjecture2Strong`, `Conjecture2`, `Question7`, `Conjecture1` in `Statements.lean`, in the vocabulary of
the development (`prodBernoulli`, `openConn`, `openCluster`).

## The idea

The development proves a first-relay bound: ordering the relays by `E F(C_x)`,
`Σ_{x∈A} P(x is the first relay of o) · E F(C_x) ≤ E[F(C_o); o ↔ A]`. The new ingredient is an *avoided* version of it, in
which the observer's cluster is required to avoid a set `Y` and the relay means are conditioned on `x ↮ Y`; the
development's hierarchy already carries an avoided set, so its peeling argument goes through with `Y` inserted into every
avoidance set. Apply it with `Y = {a}`, `a` the relay of least mean, and the projected functional
`φ_a(K) = F(K) − E[F(C_a) | C_o = K]`, which is increasing in `K` (a larger explored cluster leaves a smaller cluster for
`a`). Every conditional relay mean of `φ_a` equals `(E F(C_x) − E F(C_a)) / P(x ↮ a) ≥ 0`, so
`E[(F(C_o) − F(C_a)); o ↮ a, o ↔ A] ≥ 0`; on `{o ↔ a}` the two clusters coincide. That is Conjecture 4 with the fixed
minimiser; `F = 1{b ∈ ·}` gives (3), Harris gives Conjecture 1, and Conjecture 1 gives Conjecture 3. The route is the one
proposed in the ChatGPT document; the singleton-source case of its avoided first-relay bound is all that Conjectures 1–4 need.

## What it implies

* Conjectures 2 and 4 were known only for two relays and for an observer isolated in `G ∖ A` (the paper's Theorems 1, 4, 7
  and 8); they now hold for every finite weighted graph and every relay set. Together with Conjectures 1 and 3 this is the
  whole chain 4 ⟹ (3) ⟹ 2 ⟹ 1 ⟹ 3 ⟹ θ(p_c) = 0 of the paper, all of it now formal.
* The fixed-minimiser form says the relay minimising the unconditional mean is itself a valid relay in the pre-FKG
  comparison; with `F = 1{b ∈ ·}` this is exactly the paper's Question 7, answered affirmatively (`question7_holds`).
* The avoided first-relay bound itself (`genY_all`, `Conjectures.lean`) is a general conditioned gluing inequality with no
  loss in the number of relays, available for other uses.

Nothing is claimed about the paper's Conjecture 6 or its Questions 5, 8 and 9.

## Files

`AvoidedDefs`, `AvoidedPeelTools`, `AvoidedPeel`, `AvoidedTransfer`, `AvoidedGen`, `Projection`, `AvoidedClosure`,
`Statements`, `Conjectures` (`.lean`, compile in this order); `Projection.REPORT.md`, `AvoidedClosure.REPORT.md`;
`VERIFICATION.log`.

## How to check

From the development's root, after `lake exe cache get && lake build`, copy the nine `.lean` files to `KN/` and run

    mkdir -p .lake/build/lib/lean/KN
    for m in AvoidedDefs AvoidedPeelTools AvoidedPeel AvoidedTransfer AvoidedGen Projection AvoidedClosure Statements Conjectures; do
      lake env lean -o .lake/build/lib/lean/KN/$m.olean -i .lake/build/lib/lean/KN/$m.ilean KN/$m.lean || break
    done

The last module prints the six `#print axioms` lines of `VERIFICATION.log`.

## Attribution

Produced entirely by AI systems, Claude Fable 5.1 (max) and ChatGPT 5.6 sol (ultra). ChatGPT wrote the document
proposing the route (an avoided first-relay bound plus a projection lemma) and pointed out that Conjectures 2
and 4 follow from the development's methods; Claude Fable 5.1 designed the formalization, wrote and machine-
checked seven of the nine Lean modules and this page, and specified the two remaining modules (`Projection`,
`AvoidedClosure`), which were written by Codex (GPT-5.6 sol) and recompiled by Claude. All mathematics below the
avoided first-relay bound is the development's. The Lean files have not yet been through an independent review;
one is in progress. Released under the Apache License 2.0, matching the development.
