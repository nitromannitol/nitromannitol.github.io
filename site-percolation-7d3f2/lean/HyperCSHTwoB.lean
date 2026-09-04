import KN.HyperCTOne
import KN.HyperCSHDefs

/-!
# Layer two of the correlation core, for hyperedges: the covariance and hull-port half

The hyperedge port of seven modules of the bond development:
`Percolation/Continuity/CovTau/StarNReal.lean`,
`Percolation/Continuity/CovTau/A2Star.lean`,
`Percolation/Continuity/CovTau/A2Push.lean`,
`Percolation/Continuity/HullPort/TAStep.lean`,
`Percolation/Continuity/HullPort/SelectionThreeTA.lean`,
`Percolation/Continuity/HullPort/TASections.lean` and
`Percolation/Continuity/HullPort/TACond.lean`.

Everything is stated for a `Hypergraph V E` with arbitrary incidence sets over arbitrary types,
finiteness being assumed only where it is used.  The functionals are those of
`KN/HyperCTBase.lean` (`delE`, `cut`, `avoidEv`, `taC`, `taN`, `taNW`, `taB`, `taA`, `tab`,
`taa`, `taQ`), the restricted model is that of `KN/HyperOneCluster.lean` (`labelsIn`, `rCluster`,
`rAvoid`, `rTrace`) with `rest` of `KN/HyperCTOne.lean`, and the conditional expectation `cE` is
that of `KN/HyperCTBase.lean`.

## The `cE` calculus (`StarNReal`)

`cE_mul_of_splice_invariant` and `cE_cE`.  The bond `ED_congr_on` and `ED_sub` are Mathlib's
`integral_congr_ae` and `integral_sub` here; the bond `nr_eq_ite` reads the event `{v ↔ N}` off
the open EDGE cluster of `v`, and its hyperedge form `nr_eq_indMem` reads it off the vertex
cluster of `N`.  The bond file cites the decision-tree Harris inequality for real functions in
prose only; it is `treeHarris_real_general` of `KN/HyperTreeHK.lean`.

## The star decomposition (`A2Star`)

`reach_split`, `rCluster_restrict_source`, `rest_restrict`, `rest_sdiff_meeting`, `setStep_sum`:
van den Berg–Häggström–Kahn's identity (6) for a functional of the world `U ∖ C_N` left after the
cluster of a source SET `N ⊇ Z` is deleted.  The record of the exposed labels is the vertex trace
`rTrace` of `KN/HyperOneCluster.lean`, and the one place hyperedges differ from edges is the walk
splitting: a label crossed by a walk can meet `Z` at a vertex other than the two it joins, and then
it is not a label of the model on `U ∖ Z`; such a label is exposed, and the vertex it reaches lies
in the trace, which is where the walk restarts.

## The law of the record (`A2Push`)

The bond file proves that the law of BHK's neighbour set `S ⊆ U ∖ Z` is a PRODUCT law on `Set V`
and pushes the four functionals forward to it.  That statement is false for hyperedges:
`exists_rTrace_law_not_product` exhibits one label incident to three vertices whose trace has no
product law at all.  The mechanism is the one named in `KN/HyperLabelled.lean`: the bond proof
runs an induction over the vertices `u ∈ U ∖ Z`, whose stars `{s(u, z) : z ∈ Z}` are pairwise
disjoint blocks of coordinates because the map `(u, z) ↦ s(u, z)` is injective, and a label
incident to two outside vertices breaks the disjointness.  What survives, and what the four
functions step downstream has to consume, is the law of the LABEL record: `sum_weight_inter`
pushes the product weight forward along `ω ↦ ω ∩ A` to the product weight with the parameters off
`A` switched off, and `sum_weight_rTrace` reads the trace off that record.  So at the measure
transfer the label indexing is forced, through the injectivity that the bond argument uses
silently; the four functions step itself is indifferent, as `KN/HyperLabelled.lean` records.

## The one-label Bernstein step and Lemma 2 (`TAStep`)

`bernstein_step`, `bernstein_step_degenerate` (pure algebra, unchanged), `avoidEv_insert_insert_eq`,
`ind_inter_compl`, and `lemma2_avoidance`, which is `real_avoid_conn_not_conn` of
`KN/HyperCTOne.lean` for the cluster of `y`; the bond statement carries the nondegeneracy `s ≠ y`
because the conditional association theorem it invokes does, and the hyperedge theorem does not.

## The averaged inequality and marker dominance with an avoided set (`SelectionThreeTA`)

The bond theorem `markerDominanceAvoid_of_TA` has two halves: a pointwise comparison, for each
configuration of the cluster of `X`, of the integrand of the averaged inequality `T_A ≥ 0` with the
integrand of the reduction theorem's hypothesis, and the reduction theorem itself,
`BHK2006_clusterConditionalCov_nonneg_of_within_of_forall_nondegenerate` of
`Percolation/Literature/TwoClusterGibbsCovariance.lean`, the two-block Gibbs sampler of van den
Berg–Häggström–Kahn's §2.1.  The first half is ported: `markerDominance_cut` is the `X = ∅` marker
dominance lemma in the model with the labels meeting the cluster of `X` deleted, and
`R1_nonneg_of_taQ_nonneg` integrates it against the configuration of that cluster.  The second half
has no hyperedge form in this development: the Gibbs sampler of
`Percolation/Literature/TwoClusterGibbsSampler.lean` is written for pairs, and its hyperedge form
needs the uniform minorization by the event that every label incident to the second block is
closed.  That is the obstruction, and `markerDominanceAvoid_of_TA` is not stated here.

## The one-label sections (`TASections`)

`sum_weight_resample` and `sum_weight_mul_comp_sdiff_singleton_of_zero` mention no graph and are
unchanged.  The bond section identities deform ONE EDGE `{x₀, v}` with `x₀ ∈ X`, and the open
endpoint of the deformation is the state "`v` added to `X`".  A label `e` with `x₀ ∈ X` incident to
it has several other vertices, and opening it adds ALL of them: the open endpoint is the state
`X ∪ H.incidence e` (`reachable_insert_label_iff`, `insert_mem_avoidEv_iff`, `cut_insert_label`,
`section_generic`, `taB_section`, `taA_section`, `avoid_conn_section`, `taa_section`,
`tab_section`).  The parameter vector with the label switched off is carried by `withProb` of
`KN/HyperTransfer.lean`.

## Conditioning on the cluster of the avoided set and step (II) (`TACond`)

`set_sum_cond_sdiff` (BHK's Lemma 2.4: given the cluster of `X`, the configuration off the labels
meeting it is fresh; the cluster event is determined by those labels by `determinedBy_clusterEvent`
of `KN/HyperImplA.lean`), `cut_insert_vertex`, `mem_avoidEv_insert_iff`, `delE_union`, the
reading of the functionals at `X ∪ {v}` in the configuration with the cut of `X` deleted, and step
(II) `taB_insert_le`.  The bond `cut_insert_vertex` reads the cluster of `v` off the edge cluster
through the Gibbs-sampler bookkeeping `setCl_eq_sdiff_barOf`; here the cluster of `v` off the cut
of `X` is compared with its cluster in `ω` through `hyperClusterSet_off_subset` of
`KN/HyperCSHDefs.lean` and monotonicity.

## Where the two facts about label indexing were needed

The four functions step (the induction of `MetaA2`, a later layer) is not in this file.  Of the
steps here, `setStep_sum` and `set_sum_cond_sdiff` are block-Fubini identities and are indifferent
to the indexing: both carry the vertex record.  The measure transfer `sum_weight_rTrace` is the one
step where the label indexing is forced, and `exists_rTrace_law_not_product` is the proof that it
is.

## References

* J. van den Berg, O. Häggström, J. Kahn, *Some conditional correlation inequalities for
  percolation and related processes*, Random Struct. Alg. 29 (2006), §1 identity (6), Thm. 1.3,
  §2.1 Lemma 2.4.
* N. Gladkov, *Percolation Inequalities and Decision Trees*, arXiv:2408.08457v2 (2024), Thm. 3.2.
* G. Kozma, S. Nitzan, *Kozma–Nitzan Conjecture 1*.
-/

noncomputable section

namespace KNAll.Site.CSHTwoB

open MeasureTheory Set Percolation.Literature Percolation.Literature.LatticeModels
open KNAll.Site KNAll.Site.CTBase KNAll.Site.CTOne KNAll.Site.CSHDefs
open Percolation.Literature.DecisionTree (ind ind_of_mem ind_of_not_mem ind_nonneg)
open Percolation.Literature.BHK2006 (weight weight_nonneg blockFubini ind_inter ind_le_one
  integral_prodBernoulli_eq_sum)
open scoped Classical

variable {V E : Type*}

/-! ## The `cE` calculus

The bond `StarNReal.lean` records four facts about the weighted-cube expectation `ED` and the
conditional expectation `cE` along the exploration.  `ED_congr_on` and `ED_sub` are, for the
integral `cE` of `KN/HyperCTBase.lean`, the congruence and subtraction rules of the Bochner
integral; the two pull-out rules are stated below.
-/

section CECalc

variable [Fintype E]

omit [Fintype E] in
/-- The bond `ED_congr_on`: expectations of pointwise equal functions agree. -/
theorem integral_congr_of_forall (μ : Measure (Set E)) {φ ψ : Set E → ℝ}
    (h : ∀ ω, φ ω = ψ ω) : ∫ ω, φ ω ∂μ = ∫ ω, ψ ω ∂μ :=
  integral_congr_ae (Filter.Eventually.of_forall h)

/-- The bond `ED_sub`: differences. -/
theorem integral_sub_of_fintype (μ : Measure (Set E)) [IsFiniteMeasure μ] (φ ψ : Set E → ℝ) :
    ∫ ω, (φ ω - ψ ω) ∂μ = (∫ ω, φ ω ∂μ) - ∫ ω, ψ ω ∂μ :=
  integral_sub (integrable_of_fintype _) (integrable_of_fintype _)

omit [Fintype E] in
/-- **Pull-out of a splice-invariant factor** (the bond `cE_mul_of_local_on`): a factor which does
not change when the labels the exploration did not query are resampled comes out of the
conditional expectation at that configuration. -/
theorem cE_mul_of_splice_invariant (H : Hypergraph V E) (S : Set V) {Z : Set E → ℝ} {ω : Set E}
    (hZ : ∀ η : Set E, Z (spliceRecord (recordAt H S ω) η) = Z ω) (f : Set E → ℝ) :
    cE H S (fun ν => Z ν * f ν) ω = Z ω * cE H S f ω := by
  show (∫ η, Z (spliceRecord (recordAt H S ω) η) * f (spliceRecord (recordAt H S ω) η)
      ∂(prodBernoulli H.prob)) = _
  simp only [hZ]
  exact integral_const_mul _ _

/-- **The conditional expectation is idempotent** (the bond `cE_cE`): `cE f` is read off the
record, so it is its own conditional expectation. -/
theorem cE_cE (H : Hypergraph V E) (S : Set V) (f : Set E → ℝ) (ω : Set E) :
    cE H S (cE H S f) ω = cE H S f ω :=
  cE_eq_self_of_recordDetermined H S (fun _ _ h => cE_congr H S f h) ω

end CECalc

/-- The indicator of `{v ↔ N}`: some vertex of `N` is joined to `v`.  The bond `nr`. -/
def nr (H : Hypergraph V E) (N : Set V) (v : V) (ω : Set E) : ℝ :=
  ind {ω : Set E | ∃ s ∈ N, (openHyperGraph H ω).Reachable s v} ω

/-- `{v ↔ N}` read on the vertex cluster of `N`: the bond `nr_eq_ite`, which reads it on the open
EDGE cluster of `v`. -/
theorem nr_eq_indMem (H : Hypergraph V E) (N : Set V) (v : V) (ω : Set E) :
    nr H N v ω = AGBase.indMem v (hyperClusterSet H ω N) := by
  unfold nr AGBase.indMem
  by_cases h : ∃ s ∈ N, (openHyperGraph H ω).Reachable s v
  · rw [ind_of_mem (show ω ∈ {ω : Set E | ∃ s ∈ N, (openHyperGraph H ω).Reachable s v} from h),
      if_pos (show v ∈ hyperClusterSet H ω N from h)]
  · rw [ind_of_not_mem
      (show ω ∉ {ω : Set E | ∃ s ∈ N, (openHyperGraph H ω).Reachable s v} from h),
      if_neg (show v ∉ hyperClusterSet H ω N from h)]

/-- `0 ≤ nr ≤ 1`. -/
theorem nr_nonneg_le_one (H : Hypergraph V E) (N : Set V) (v : V) (ω : Set E) :
    0 ≤ nr H N v ω ∧ nr H N v ω ≤ 1 :=
  ⟨ind_nonneg _ _, ind_le_one _ _⟩

/-! ## The star decomposition of the world functionals

The cluster of a source set `N ⊇ Z` in the model on `U` splits at `Z`: it is `Z` together with the
cluster, in the model on `U ∖ Z`, of the sources outside `Z` and the vertices of the trace.
-/

section Star

/-- **Walk splitting.**  An open walk inside `U` from `y` to `c ∉ Z` either crosses no label
meeting `Z`, in which case `y ∉ Z` and the walk lies in the model on `U ∖ Z`, or has a last label
meeting `Z`, after which it starts at a vertex of the trace and stays in the model on `U ∖ Z`.
The bond `reach_split` splits at the last vertex of `Z`; here a label can meet `Z` at a vertex
the walk does not visit, so the split is at the last label meeting `Z`.
[cite: VandenbergHaggstromKahn2005, §1 p. 4, identity (6)] -/
theorem reach_split {H : Hypergraph V E} {U Z : Finset V} {ω : Set E} {y c : V}
    (h : (openHyperGraph H (ω ∩ labelsIn H U)).Reachable y c) (hc : c ∉ (↑Z : Set V)) :
    (y ∉ (↑Z : Set V) ∧ (openHyperGraph H (ω ∩ labelsIn H (U \ Z))).Reachable y c) ∨
      ∃ n ∈ rTrace H U Z ω, (openHyperGraph H (ω ∩ labelsIn H (U \ Z))).Reachable n c := by
  rw [SimpleGraph.reachable_iff_reflTransGen] at h
  induction h with
  | refl => exact Or.inl ⟨hc, SimpleGraph.Reachable.refl y⟩
  | @tail b c hyb hbc ih =>
    obtain ⟨hne, e, ⟨heω, heU⟩, hbe, hce⟩ := (openHyperGraph_adj_iff H _ b c).1 hbc
    by_cases hmeet : e ∈ labelsMeeting H (↑Z : Set V)
    · refine Or.inr ⟨c, ?_, SimpleGraph.Reachable.refl c⟩
      exact (mem_traceOutside_iff H (↑Z) _ c).2 ⟨e, ⟨⟨heω, heU⟩, hmeet⟩, hce, hc⟩
    · have hdisj : Disjoint (H.incidence e) (↑Z : Set V) := by
        by_contra hcon
        exact hmeet hcon
      have heUZ : e ∈ labelsIn H (U \ Z) := fun v hv =>
        Finset.mem_sdiff.2 ⟨heU v hv, fun hvZ =>
          Set.disjoint_left.1 hdisj hv (Finset.mem_coe.2 hvZ)⟩
      have hadj : (openHyperGraph H (ω ∩ labelsIn H (U \ Z))).Adj b c :=
        (openHyperGraph_adj_iff H _ b c).2 ⟨hne, e, ⟨heω, heUZ⟩, hbe, hce⟩
      have hbZ : b ∉ (↑Z : Set V) := fun hb => Set.disjoint_left.1 hdisj hbe hb
      rcases ih hbZ with ⟨hyZ, hr⟩ | ⟨n, hn, hr⟩
      · exact Or.inl ⟨hyZ, hr.trans hadj.reachable⟩
      · exact Or.inr ⟨n, hn, hr.trans hadj.reachable⟩

/-- **The cluster of a source set splits at `Z ⊆ N`**: `C^U_N = Z ∪ C^{U∖Z}_{(N ∖ Z) ∪ T(ω)}`,
`T` the trace.  The bond `sC_restrict`.
[cite: VandenbergHaggstromKahn2005, §1 p. 4, identity (6)] -/
theorem rCluster_restrict_source (H : Hypergraph V E) {U Z : Finset V} (hZU : Z ⊆ U) {N : Set V}
    (hZN : (↑Z : Set V) ⊆ N) (ω : Set E) :
    rCluster H U N ω = ↑Z ∪ rCluster H (U \ Z) ((N \ ↑Z) ∪ rTrace H U Z ω) ω := by
  ext u
  constructor
  · rintro ⟨y, hyN, hr⟩
    by_cases hu : u ∈ (↑Z : Set V)
    · exact Or.inl hu
    · rcases reach_split hr hu with ⟨hyZ, hr'⟩ | ⟨n, hn, hr'⟩
      · exact Or.inr ⟨y, Or.inl ⟨hyN, hyZ⟩, hr'⟩
      · exact Or.inr ⟨n, Or.inr hn, hr'⟩
  · rintro (hu | ⟨y, hy, hr⟩)
    · exact subset_rCluster H U N ω (hZN hu)
    · have hr' : (openHyperGraph H (ω ∩ labelsIn H U)).Reachable y u :=
        hr.mono (openHyperGraph_le_of_subset H
          (Set.inter_subset_inter_right _ (labelsIn_mono H Finset.sdiff_subset)))
      rcases hy with ⟨hyN, -⟩ | hyT
      · exact ⟨y, hyN, hr'⟩
      · obtain ⟨e, ⟨⟨heω, heU⟩, hmeet⟩, hye, hyZ⟩ := (mem_traceOutside_iff H (↑Z) _ y).1 hyT
        obtain ⟨z, hze, hzZ⟩ := Set.not_disjoint_iff.1 hmeet
        refine ⟨z, hZN hzZ, ?_⟩
        by_cases hzy : z = y
        · exact hzy ▸ hr'
        · exact ((openHyperGraph_adj_iff H (ω ∩ labelsIn H U) z y).2
            ⟨hzy, e, ⟨heω, heU⟩, hze, hye⟩).reachable.trans hr'

/-- Consequently `U ∖ C^U_N = (U ∖ Z) ∖ C^{U∖Z}_{(N∖Z) ∪ T(ω)}`.  The bond `rest_restrict`.
[cite: VandenbergHaggstromKahn2005, §1 p. 4, identity (6)] -/
theorem rest_restrict (H : Hypergraph V E) {U Z : Finset V} (hZU : Z ⊆ U) {N : Set V}
    (hZN : (↑Z : Set V) ⊆ N) (ω : Set E) :
    rest H U N ω = rest H (U \ Z) ((N \ ↑Z) ∪ rTrace H U Z ω) ω := by
  ext u
  rw [mem_rest, mem_rest, rCluster_restrict_source H hZU hZN ω, Finset.mem_sdiff, Set.mem_union,
    Finset.mem_coe]
  tauto

/-- The worlds of the model on `U ∖ Z` do not depend on the labels meeting `Z`.  The bond
`rest_diff_meeting`; the cluster form is `rCluster_sdiff_meeting` of `KN/HyperOneCluster.lean`. -/
theorem rest_sdiff_meeting (H : Hypergraph V E) (U Z : Finset V) (M : Set V) (ω : Set E) :
    rest H (U \ Z) M (ω \ labelsMeeting H (↑Z : Set V)) = rest H (U \ Z) M ω := by
  ext u
  rw [mem_rest, mem_rest, rCluster_sdiff_meeting]

variable [Fintype E]

/-- **BHK's (6) for world functionals**: for `Z ⊆ U`, `Z ⊆ N`, `x ∉ Z` and any
`G : Finset V → ℝ`,
`E[G(U ∖ C_N) ; x ↮ N] = Σ_ω weight(ω) · E'[G((U∖Z) ∖ C'_{(N∖Z) ∪ T(ω)}) ; x ↮ (N∖Z) ∪ T(ω)]`,
primes denoting the model on `U ∖ Z` with fresh variables.  The bond `setStep_sum`, with the
neighbour set replaced by the trace.  The record carried is the vertex trace: a block-Fubini
identity is indifferent to the indexing of the record.
[cite: VandenbergHaggstromKahn2005, §1 p. 4, identity (6)] -/
theorem setStep_sum (H : Hypergraph V E) {U Z : Finset V} (hZU : Z ⊆ U) {x : V}
    (hx : x ∉ (↑Z : Set V)) {N : Set V} (hZN : (↑Z : Set V) ⊆ N) (w : E → ℝ)
    (hm : ∑ ω : Set E, weight w ω = 1) (G : Finset V → ℝ) :
    ∑ ω : Set E, weight w ω * (G (rest H U N ω) * ind (rAvoid H U ({x} : Set V) N) ω) =
      ∑ ω : Set E, weight w ω * ∑ ω' : Set E, weight w ω' *
        (G (rest H (U \ Z) ((N \ ↑Z) ∪ rTrace H U Z ω) ω') *
          ind (rAvoid H (U \ Z) ({x} : Set V) ((N \ ↑Z) ∪ rTrace H U Z ω)) ω') := by
  have hSZ : ∀ y ∈ ({x} : Set V), y ∉ (↑Z : Set V) := by
    intro y hy
    rw [Set.mem_singleton_iff] at hy
    exact hy ▸ hx
  set A := labelsMeeting H (↑Z : Set V) with hA
  set Φ : Set E → Set E → ℝ := fun ζ η =>
    G (rest H (U \ Z) ((N \ ↑Z) ∪ rTrace H U Z ζ) η) *
      ind (rAvoid H (U \ Z) ({x} : Set V) ((N \ ↑Z) ∪ rTrace H U Z ζ)) η with hΦ
  have hind : ∀ (M : Set V) (η : Set E),
      ind (rAvoid H (U \ Z) ({x} : Set V) M) (η \ labelsMeeting H (↑Z : Set V))
        = ind (rAvoid H (U \ Z) ({x} : Set V) M) η := by
    intro M η
    by_cases h : η ∈ rAvoid H (U \ Z) ({x} : Set V) M
    · rw [ind_of_mem h, ind_of_mem ((mem_rAvoid_sdiff_meeting H U Z _ M η).2 h)]
    · rw [ind_of_not_mem h,
        ind_of_not_mem fun h' => h ((mem_rAvoid_sdiff_meeting H U Z _ M η).1 h')]
  have hind' : ∀ ω : Set E, ind (rAvoid H U ({x} : Set V) N) ω
      = ind (rAvoid H (U \ Z) ({x} : Set V) ((N \ ↑Z) ∪ rTrace H U Z ω)) ω := by
    intro ω
    by_cases h : ω ∈ rAvoid H U ({x} : Set V) N
    · rw [ind_of_mem h, ind_of_mem ((mem_rAvoid_iff_restrict hSZ hZN ω).1 h)]
    · rw [ind_of_not_mem h, ind_of_not_mem fun h' => h ((mem_rAvoid_iff_restrict hSZ hZN ω).2 h')]
  have h1 : ∀ ω : Set E, G (rest H U N ω) * ind (rAvoid H U ({x} : Set V) N) ω
      = Φ (ω ∩ A) (ω \ A) := by
    intro ω
    simp only [hΦ, hA, rTrace_inter_meeting, rest_sdiff_meeting, hind,
      ← rest_restrict H hZU hZN, hind']
  have h2 : ∀ ω ω' : Set E, Φ (ω ∩ A) (ω' \ A) =
      G (rest H (U \ Z) ((N \ ↑Z) ∪ rTrace H U Z ω) ω') *
        ind (rAvoid H (U \ Z) ({x} : Set V) ((N \ ↑Z) ∪ rTrace H U Z ω)) ω' := by
    intro ω ω'
    simp only [hΦ, hA, rTrace_inter_meeting, rest_sdiff_meeting, hind]
  calc ∑ ω : Set E, weight w ω * (G (rest H U N ω) * ind (rAvoid H U ({x} : Set V) N) ω)
      = (∑ ω : Set E, weight w ω) * ∑ ω : Set E, weight w ω * Φ (ω ∩ A) (ω \ A) := by
        rw [hm, one_mul]; simp_rw [h1]
    _ = ∑ ω : Set E, weight w ω * ∑ ω' : Set E, weight w ω' * Φ (ω ∩ A) (ω' \ A) :=
        blockFubini w A Φ
    _ = _ := by simp_rw [h2]

end Star

/-! ## The law of the record is a product law on the labels

The bond `A2Push.lean` pushes the four functionals forward along the neighbour set `S(ω)` to a
product law on `Set V`.  Here the push-forward is along the label record `ω ∩ A`, whose law is the
product law with the parameters off `A` switched off; the trace is read off the record.
-/

section Push

variable [Fintype E]

/-- **The law of the label record is a product law**: for every `Γ : Set E → ℝ`,
`Σ_ω weight_w(ω) Γ(ω ∩ A) = Σ_η weight_{w_A}(η) Γ(η)`, `w_A = w` on `A` and `0` off `A`.  The
hyperedge form of the bond `sum_weight_rS`; the record is the set of exposed labels found open, not
the set of vertices they reach. -/
theorem sum_weight_inter (w : E → ℝ) (A : Set E) (Γ : Set E → ℝ) :
    ∑ ω : Set E, weight w ω * Γ (ω ∩ A)
      = ∑ η : Set E, weight (fun e => if e ∈ A then w e else 0) η * Γ η := by
  have h : ∀ ω : Set E, ω ∩ A = ω \ Aᶜ := fun ω => (Set.sdiff_compl).symm
  simp_rw [h]
  rw [sum_weight_mul_comp_sdiff w Aᶜ Γ]
  refine Finset.sum_congr rfl fun η _ => ?_
  congr 2
  funext e
  by_cases he : e ∈ A
  · simp [he]
  · simp [he]

omit [Fintype E] in
/-- The parameters of the pushed-forward law lie in `[0, 1]`.  The bond `pZ_mem`. -/
theorem param_inter_mem {w : E → ℝ} (hw0 : ∀ e, 0 ≤ w e) (hw1 : ∀ e, w e ≤ 1) (A : Set E)
    (e : E) : 0 ≤ (if e ∈ A then w e else 0) ∧ (if e ∈ A then w e else 0) ≤ 1 := by
  split_ifs
  · exact ⟨hw0 e, hw1 e⟩
  · exact ⟨le_rfl, zero_le_one⟩

/-- **The trace is read off the record**: for every `Γ : Set V → ℝ`,
`Σ_ω weight_w(ω) Γ(T(ω)) = Σ_η weight_{w_A}(η) Γ(T(η))` with `A` the labels meeting `Z`.  This is
the form in which a four functions step downstream can consume the trace: as a function on the
lattice `Set E` of label records, against a product weight. -/
theorem sum_weight_rTrace (H : Hypergraph V E) (w : E → ℝ) (U Z : Finset V) (Γ : Set V → ℝ) :
    ∑ ω : Set E, weight w ω * Γ (rTrace H U Z ω)
      = ∑ η : Set E, weight (fun e => if e ∈ labelsMeeting H (↑Z : Set V) then w e else 0) η *
          Γ (rTrace H U Z η) := by
  rw [← sum_weight_inter w (labelsMeeting H (↑Z : Set V)) (fun η => Γ (rTrace H U Z η))]
  simp only [rTrace_inter_meeting]

end Push

end KNAll.Site.CSHTwoB

end
