import KN.SiteIntrinsicInputs
import KN.ReachCoupling
import KN.SiteFiniteEnergy
import KN.SiteSlabGeometry

/-!
# Target extension without a gluing inequality

The gluing inequality `P(o ↔ b) ≥ P(o ↔ A) · min_{a ∈ A} P(a ↔ b)` of Kozma and Nitzan is used in
the target-extension argument of the manuscript to pass from "the source reaches some reliable
relay" to "the source reaches the target".  This module proves the argument with the gluing
inequality replaced by a statement that holds for every product measure and needs no monotonicity:
if the events `I u` are all determined by one set of coordinates and the events `E u` by a disjoint
set, then

  `μ(⋃ u, I u ∩ E u) ≥ μ(⋃ u, I u) · min_u μ(E u)`.

The point is that the connection from the source to a relay `u` in the shell is decided by the
coordinates outside the interior box once the shell is pinned, and the connection from `u` to the
target inside the box `O` is decided by the interior coordinates; the two are supported on disjoint
coordinate sets, so the statement above applies and no monotone-event argument is needed.
-/

noncomputable section

namespace KNAll.Site.TargetExt

open MeasureTheory Set Percolation.Literature Percolation.Literature.LatticeModels
open KNAll.Site

/-! ## The decisive lemma -/

section Decisive

variable {ι κ : Type*}

/-- **The decisive lemma, abstract form.**  Let `μ` be a finite measure on configurations and let
the events `I u` (`u ∈ s`) all be determined by the coordinates in `R`.  Suppose every `E u` is
independent of every measurable event determined by `R`.  Then

`μ(⋃ u ∈ s, I u) · m ≤ μ(⋃ u ∈ s, I u ∩ E u)` whenever `m ≤ μ(E u)` for all `u ∈ s`.

Proof: peel one index at a time.  With `J = ⋃_{u ∈ s} I u`, the set `I a \ J` is determined by `R`
and disjoint from `J`, so `(I a \ J) ∩ E a` is disjoint from `⋃_{u ∈ s} (I u ∩ E u)` and has
measure `μ(I a \ J) · μ(E a) ≥ μ(I a \ J) · m`. -/
theorem real_biUnion_inter_ge_of_indep (μ : Measure (Set ι)) [IsFiniteMeasure μ] (R : Set ι)
    (s : Finset κ) (I E : κ → Set (Set ι))
    (hI : ∀ u ∈ s, DeterminedBy (I u) R)
    (hIm : ∀ u ∈ s, MeasurableSet (I u)) (hEm : ∀ u ∈ s, MeasurableSet (E u))
    (hind : ∀ u ∈ s, ∀ A : Set (Set ι), DeterminedBy A R → MeasurableSet A →
      μ.real (A ∩ E u) = μ.real A * μ.real (E u))
    {m : ℝ} (hm : ∀ u ∈ s, m ≤ μ.real (E u)) :
    μ.real (⋃ u ∈ s, I u) * m ≤ μ.real (⋃ u ∈ s, I u ∩ E u) := by
  classical
  induction s using Finset.induction_on with
  | empty => simp
  | insert a s ha ih =>
    have hs : ∀ u ∈ s, u ∈ insert a s := fun u hu => Finset.mem_insert_of_mem hu
    have haa : a ∈ insert a s := Finset.mem_insert_self a s
    have ih' := ih (fun u hu => hI u (hs u hu)) (fun u hu => hIm u (hs u hu))
      (fun u hu => hEm u (hs u hu)) (fun u hu => hind u (hs u hu)) (fun u hu => hm u (hs u hu))
    set J : Set (Set ι) := ⋃ u ∈ s, I u with hJ
    have hJdet : DeterminedBy J R :=
      DeterminedBy.iUnion fun u => DeterminedBy.iUnion fun hu => hI u (hs u hu)
    have hJm : MeasurableSet J := Finset.measurableSet_biUnion _ fun u hu => hIm u (hs u hu)
    have hdiffdet : DeterminedBy (I a \ J) R := (hI a haa).inter hJdet.compl
    have hdiffm : MeasurableSet (I a \ J) := (hIm a haa).diff hJm
    -- the union of the `I u` over `insert a s` is `J` together with the fresh part of `I a`
    have h1 : μ.real (⋃ u ∈ insert a s, I u) = μ.real J + μ.real (I a \ J) := by
      rw [Finset.set_biUnion_insert, ← hJ, Set.union_comm, ← Set.union_sdiff_self]
      exact measureReal_union (Set.disjoint_sdiff_right) hdiffm (measure_ne_top _ _)
        (measure_ne_top _ _)
    -- the union of the `I u ∩ E u` over `insert a s` contains the disjoint union of the old one
    -- and `(I a \ J) ∩ E a`
    have h2 : μ.real (⋃ u ∈ s, I u ∩ E u) + μ.real ((I a \ J) ∩ E a)
        ≤ μ.real (⋃ u ∈ insert a s, I u ∩ E u) := by
      have hdisj : Disjoint (⋃ u ∈ s, I u ∩ E u) ((I a \ J) ∩ E a) := by
        rw [Set.disjoint_left]
        intro ω hω hω'
        obtain ⟨u, hu, hωu⟩ := Set.mem_iUnion₂.1 hω
        exact hω'.1.2 (Set.mem_iUnion₂.2 ⟨u, hu, hωu.1⟩)
      have hsub : (⋃ u ∈ s, I u ∩ E u) ∪ ((I a \ J) ∩ E a) ⊆ ⋃ u ∈ insert a s, I u ∩ E u := by
        rw [Finset.set_biUnion_insert]
        rintro ω (hω | hω)
        · exact Or.inr hω
        · exact Or.inl ⟨hω.1.1, hω.2⟩
      rw [← measureReal_union hdisj (hdiffm.inter (hEm a haa)) (measure_ne_top _ _)
        (measure_ne_top _ _)]
      exact measureReal_mono hsub (measure_ne_top _ _)
    have h3 : μ.real ((I a \ J) ∩ E a) = μ.real (I a \ J) * μ.real (E a) :=
      hind a haa _ hdiffdet hdiffm
    have h4 : μ.real (I a \ J) * m ≤ μ.real (I a \ J) * μ.real (E a) :=
      mul_le_mul_of_nonneg_left (hm a haa) measureReal_nonneg
    rw [h1, add_mul]
    linarith

/-- **The decisive lemma for a product measure**: the family `I u` is determined by the
complement of the finite set `F` of coordinates and the family `E u` by `F` itself. -/
theorem prodBernoulli_real_biUnion_inter_ge (p : ι → unitInterval) (F : Finset ι) (s : Finset κ)
    (I E : κ → Set (Set ι))
    (hI : ∀ u ∈ s, DeterminedBy (I u) (↑F : Set ι)ᶜ) (hE : ∀ u ∈ s, DeterminedBy (E u) (↑F : Set ι))
    (hIm : ∀ u ∈ s, MeasurableSet (I u)) (hEm : ∀ u ∈ s, MeasurableSet (E u))
    {m : ℝ} (hm : ∀ u ∈ s, m ≤ (prodBernoulli p).real (E u)) :
    (prodBernoulli p).real (⋃ u ∈ s, I u) * m ≤ (prodBernoulli p).real (⋃ u ∈ s, I u ∩ E u) :=
  real_biUnion_inter_ge_of_indep (prodBernoulli p) (↑F : Set ι)ᶜ s I E hI hIm hEm
    (fun u hu A hA hAm => by
      rw [Set.inter_comm, prodBernoulli_real_inter_of_determinedBy p F (hE u hu) hA (hEm u hu) hAm,
        mul_comm])
    hm

/-- The same with the roles of `F` and its complement exchanged. -/
theorem prodBernoulli_real_biUnion_inter_ge' (p : ι → unitInterval) (F : Finset ι) (s : Finset κ)
    (I E : κ → Set (Set ι))
    (hI : ∀ u ∈ s, DeterminedBy (I u) (↑F : Set ι)) (hE : ∀ u ∈ s, DeterminedBy (E u) (↑F : Set ι)ᶜ)
    (hIm : ∀ u ∈ s, MeasurableSet (I u)) (hEm : ∀ u ∈ s, MeasurableSet (E u))
    {m : ℝ} (hm : ∀ u ∈ s, m ≤ (prodBernoulli p).real (E u)) :
    (prodBernoulli p).real (⋃ u ∈ s, I u) * m ≤ (prodBernoulli p).real (⋃ u ∈ s, I u ∩ E u) :=
  real_biUnion_inter_ge_of_indep (prodBernoulli p) (↑F : Set ι) s I E hI hIm hEm
    (fun u hu _ hA hAm => prodBernoulli_real_inter_of_determinedBy p F hA (hE u hu) hAm (hEm u hu))
    hm

/-- The decisive lemma with two disjoint finite supports. -/
theorem prodBernoulli_real_biUnion_inter_ge_disjoint (p : ι → unitInterval) {F F' : Finset ι}
    (hFF' : Disjoint F F') (s : Finset κ) (I E : κ → Set (Set ι))
    (hI : ∀ u ∈ s, DeterminedBy (I u) (↑F : Set ι)) (hE : ∀ u ∈ s, DeterminedBy (E u) (↑F' : Set ι))
    (hIm : ∀ u ∈ s, MeasurableSet (I u)) (hEm : ∀ u ∈ s, MeasurableSet (E u))
    {m : ℝ} (hm : ∀ u ∈ s, m ≤ (prodBernoulli p).real (E u)) :
    (prodBernoulli p).real (⋃ u ∈ s, I u) * m ≤ (prodBernoulli p).real (⋃ u ∈ s, I u ∩ E u) :=
  prodBernoulli_real_biUnion_inter_ge' p F s I E hI
    (fun u hu => (hE u hu).mono fun _ hi hiF =>
      Finset.disjoint_left.1 hFF' (Finset.mem_coe.1 hiF) (Finset.mem_coe.1 hi))
    hIm hEm hm

end Decisive

/-! ## Pinning a finite set of coordinates: patterns, sums over patterns, Markov -/

section Pinning

variable {ι : Type*}

/-- Pinning to the pattern `ξ` is overwriting by `ξ`. -/
theorem substitute_eq_overwrite (S ξ : Set ι) :
    substitute S (fun i => i ∈ ξ) = overwrite S ξ := by
  funext ω
  ext i
  by_cases hi : i ∈ S
  · rw [mem_substitute_of_mem _ hi, mem_overwrite_iff_of_mem hi]
  · rw [mem_substitute_of_notMem _ hi, mem_overwrite_iff_of_not_mem hi]

/-- Two configurations agreeing on `K \ R` have substitutes agreeing on `K`. -/
theorem substitute_agree_of_agree {K R : Set ι} (val : ι → Prop) {ω ω' : Set ι}
    (h : ∀ i ∈ K \ R, (i ∈ ω ↔ i ∈ ω')) :
    ∀ i ∈ K, (i ∈ substitute R val ω ↔ i ∈ substitute R val ω') := by
  intro i hi
  by_cases hiR : i ∈ R
  · rw [mem_substitute_of_mem val hiR, mem_substitute_of_mem val hiR]
  · rw [mem_substitute_of_notMem val hiR, mem_substitute_of_notMem val hiR]
    exact h i ⟨hi, hiR⟩

/-- `ω ∩ K = ω' ∩ K` from pointwise agreement on `K`. -/
theorem inter_eq_of_forall_iff {K : Set ι} {ω ω' : Set ι} (h : ∀ i ∈ K, (i ∈ ω ↔ i ∈ ω')) :
    ω ∩ K = ω' ∩ K := by
  ext i
  simp only [Set.mem_inter_iff]
  exact ⟨fun hi => ⟨(h i hi.2).1 hi.1, hi.2⟩, fun hi => ⟨(h i hi.2).2 hi.1, hi.2⟩⟩

/-- Pointwise agreement on `K` from `ω ∩ K = ω' ∩ K`. -/
theorem forall_iff_of_inter_eq {K : Set ι} {ω ω' : Set ι} (h : ω ∩ K = ω' ∩ K) :
    ∀ i ∈ K, (i ∈ ω ↔ i ∈ ω') := by
  intro i hi
  have := Set.ext_iff.1 h i
  simp only [Set.mem_inter_iff, hi, and_true] at this
  exact this

/-- **Substitution shrinks the support**: if `A` is determined by `K`, then the pinned event
`substitute R val ⁻¹' A` is determined by `K \ R`. -/
theorem determinedBy_substitute_preimage_of_determinedBy {A : Set (Set ι)} {K : Set ι}
    (hA : DeterminedBy A K) (R : Set ι) (val : ι → Prop) :
    DeterminedBy (substitute R val ⁻¹' A) (K \ R) := by
  rw [determinedBy_iff] at hA ⊢
  intro ω ω' h
  simp only [Set.mem_preimage]
  exact hA _ _ (inter_eq_of_forall_iff (substitute_agree_of_agree val (forall_iff_of_inter_eq h)))

/-- **Conditioning on a pattern is pinning**: `P(A ∩ [ξ]_S) = P([ξ]_S) · P^ξ(A)`. -/
theorem real_inter_localCylinder_eq_mul_pinnedProb (w : ι → unitInterval) (S : Finset ι)
    (ξ : Set ι) {A : Set (Set ι)} (hA : MeasurableSet A) :
    (prodBernoulli w).real (A ∩ localCylinder (↑S : Set ι) ξ) =
      (prodBernoulli w).real (localCylinder (↑S : Set ι) ξ) *
        pinnedProb w (↑S : Set ι) (fun i => i ∈ ξ) A := by
  rw [pinnedProb, substitute_eq_overwrite, inter_localCylinder_eq_preimage_overwrite_inter,
    Set.inter_comm]
  exact prodBernoulli_real_inter_of_determinedBy w S (determinedBy_localCylinder _ _)
    (determinedBy_preimage_overwrite _ _ _) (measurableSet_localCylinder S.finite_toSet.countable _)
    (measurable_overwrite _ _ hA)

open Classical in
/-- **The patterns of `S` partition the space**: `P(A) = Σ_{T ⊆ S} P(A ∩ [T]_S)`. -/
theorem real_eq_sum_inter_localCylinder (w : ι → unitInterval) (S : Finset ι) {A : Set (Set ι)}
    (hA : MeasurableSet A) :
    (prodBernoulli w).real A =
      ∑ T ∈ S.powerset, (prodBernoulli w).real (A ∩ localCylinder (↑S : Set ι) (↑T : Set ι)) := by
  have hdec : A = ⋃ T ∈ S.powerset, A ∩ localCylinder (↑S : Set ι) (↑T : Set ι) := by
    ext ω
    constructor
    · intro hω
      exact Set.mem_iUnion₂.2 ⟨S.filter (· ∈ ω), Finset.mem_powerset.2 (Finset.filter_subset _ _),
        hω, mem_localCylinder_filter S ω⟩
    · intro hω
      obtain ⟨T, -, hωA, -⟩ := Set.mem_iUnion₂.1 hω
      exact hωA
  conv_lhs => rw [hdec]
  refine measureReal_biUnion_finset ?_ ?_ ?_
  · intro T hT T' hT' hne
    exact (localCylinder_disjoint (Finset.mem_powerset.1 (Finset.mem_coe.1 hT))
      (Finset.mem_powerset.1 (Finset.mem_coe.1 hT')) hne).mono Set.inter_subset_right
      Set.inter_subset_right
  · intro T _
    exact hA.inter (measurableSet_localCylinder S.finite_toSet.countable _)
  · intro T _
    exact measure_ne_top _ _

/-- The probabilities of the patterns of `S` sum to `1`. -/
theorem sum_real_localCylinder (w : ι → unitInterval) (S : Finset ι) :
    ∑ T ∈ S.powerset, (prodBernoulli w).real (localCylinder (↑S : Set ι) (↑T : Set ι)) = 1 := by
  have h := real_eq_sum_inter_localCylinder w S (A := Set.univ) MeasurableSet.univ
  simp only [Set.univ_inter, probReal_univ] at h
  exact h.symm

open Classical in
/-- On the cylinder `[T]_S`, an event determined by `S` is everything or nothing. -/
theorem inter_localCylinder_of_determinedBy {B : Set (Set ι)} {S : Finset ι}
    (hB : DeterminedBy B (↑S : Set ι)) {T : Finset ι} (hT : T ⊆ S) :
    B ∩ localCylinder (↑S : Set ι) (↑T : Set ι) =
      if (↑T : Set ι) ∈ B then localCylinder (↑S : Set ι) (↑T : Set ι) else ∅ := by
  ext ω
  by_cases hTB : (↑T : Set ι) ∈ B
  · rw [if_pos hTB]
    exact ⟨fun h => h.2, fun hω => ⟨(mem_iff_coe_mem_of_determinedBy hB hT hω).2 hTB, hω⟩⟩
  · rw [if_neg hTB]
    exact ⟨fun h => hTB ((mem_iff_coe_mem_of_determinedBy hB hT h.2).1 h.1), fun h => h.elim⟩

/-- The pinned probability only reads the pattern on the pinned set. -/
theorem pinnedProb_congr_pattern (w : ι → unitInterval) (S : Set ι) {ω ω' : Set ι}
    (h : ∀ i ∈ S, (i ∈ ω ↔ i ∈ ω')) (A : Set (Set ι)) :
    pinnedProb w S (fun i => i ∈ ω) A = pinnedProb w S (fun i => i ∈ ω') A :=
  pinnedProb_congr_val w S h A

/-- The event "the pinned probability of `A` given the pattern on `S` is at most `c`" is
determined by `S`. -/
theorem determinedBy_setOf_pinnedProb_le (w : ι → unitInterval) (S : Set ι) (A : Set (Set ι))
    (c : ℝ) : DeterminedBy {ω : Set ι | pinnedProb w S (fun i => i ∈ ω) A ≤ c} S := by
  rw [determinedBy_iff]
  intro ω ω' h
  simp only [Set.mem_setOf_eq, pinnedProb_congr_pattern w S (forall_iff_of_inter_eq h) A]

/-- The event "the pinned probability of `A` given the pattern on `S` exceeds `c`" is
determined by `S`. -/
theorem determinedBy_setOf_lt_pinnedProb (w : ι → unitInterval) (S : Set ι) (A : Set (Set ι))
    (c : ℝ) : DeterminedBy {ω : Set ι | c < pinnedProb w S (fun i => i ∈ ω) A} S := by
  rw [determinedBy_iff]
  intro ω ω' h
  simp only [Set.mem_setOf_eq, pinnedProb_congr_pattern w S (forall_iff_of_inter_eq h) A]

/-- **Markov's inequality over the patterns of `S`**: the patterns for which the pinned probability
of `A` is at most `1 - δ` have total mass at most `(1 - P(A)) / δ`. -/
theorem mul_real_setOf_pinnedProb_le_le (w : ι → unitInterval) (S : Finset ι) {A : Set (Set ι)}
    (hA : MeasurableSet A) (δ : ℝ) :
    δ * (prodBernoulli w).real {ω : Set ι | pinnedProb w (↑S : Set ι) (fun i => i ∈ ω) A ≤ 1 - δ}
      ≤ 1 - (prodBernoulli w).real A := by
  classical
  set Low : Set (Set ι) := {ω | pinnedProb w (↑S : Set ι) (fun i => i ∈ ω) A ≤ 1 - δ} with hLow
  have hLowdet : DeterminedBy Low (↑S : Set ι) := determinedBy_setOf_pinnedProb_le w _ A _
  have hLowm : MeasurableSet Low := hLowdet.measurableSet_of_finset
  rw [real_eq_sum_inter_localCylinder w S hLowm, real_eq_sum_inter_localCylinder w S hA,
    ← sum_real_localCylinder w S, Finset.mul_sum, ← Finset.sum_sub_distrib]
  refine Finset.sum_le_sum fun T hT => ?_
  have hTS : T ⊆ S := Finset.mem_powerset.1 hT
  rw [inter_localCylinder_of_determinedBy hLowdet hTS,
    real_inter_localCylinder_eq_mul_pinnedProb w S _ hA]
  have h0 : 0 ≤ (prodBernoulli w).real (localCylinder (↑S : Set ι) (↑T : Set ι)) :=
    measureReal_nonneg
  by_cases hTL : (↑T : Set ι) ∈ Low
  · rw [if_pos hTL]
    have hle : pinnedProb w (↑S : Set ι) (fun i => i ∈ (↑T : Set ι)) A ≤ 1 - δ := hTL
    nlinarith
  · rw [if_neg hTL, measureReal_empty, mul_zero]
    have hle : pinnedProb w (↑S : Set ι) (fun i => i ∈ (↑T : Set ι)) A ≤ 1 :=
      pinnedProb_le_one_coord w _ _ A
    nlinarith

end Pinning

/-! ## Contacts, gates and the blocking of entry into a box -/

section Contacts

variable {V : Type*} [DecidableEq V] (G : SimpleGraph V)

open scoped Classical

/-- The endpoint of a confined connection is open and inside the confining set. -/
theorem mem_of_connWithin {S : Set V} {x y : V} {ω : SiteConfig V}
    (h : ω ∈ connWithin G S x y) : y ∈ ω ∩ S :=
  mem_of_mem_siteCluster G (ω ∩ S) ⟨h.1, h.2⟩

/-- A confined connection prepended by an open edge inside the confining set. -/
theorem connWithin_of_adj_of_connWithin {S : Set V} {x y z : V} {ω : SiteConfig V}
    (hxy : G.Adj x y) (hx : x ∈ ω ∩ S) (hy : y ∈ ω ∩ S) (h : ω ∈ connWithin G S y z) :
    ω ∈ connWithin G S x z :=
  ⟨hx, ((openSiteGraph_adj_iff' G (ω ∩ S) x y).2 ⟨hxy, hx, hy⟩).reachable.trans h.2⟩

/-- Confined connections compose, in the union of the two confining sets. -/
theorem connWithin_trans {S S' : Set V} {x y z : V} {ω : SiteConfig V}
    (h : ω ∈ connWithin G S x y) (h' : ω ∈ connWithin G S' y z) :
    ω ∈ connWithin G (S ∪ S') x z :=
  ⟨⟨h.1.1, Or.inl h.1.2⟩,
    (connWithin_mono_set G Set.subset_union_left x y h).2.trans
      (connWithin_mono_set G Set.subset_union_right y z h').2⟩

/-- **A walk from outside a box to inside it crosses its boundary**: some open site `y` of `D`
is adjacent to a site `x` reached from the start by an open path avoiding `D`. -/
theorem exists_crossing_of_walk (Dom D : Finset V) {ω : SiteConfig V} :
    ∀ {a b : V} (_ : (openSiteGraph G (ω ∩ (↑Dom : Set V))).Walk a b),
      a ∈ ω → a ∈ Dom → a ∉ D → b ∈ D →
        ∃ x y, ω ∈ connWithin G (↑(Dom \ D) : Set V) a x ∧ y ∈ D ∧ G.Adj x y ∧ y ∈ ω := by
  classical
  intro a b p
  induction p with
  | nil =>
    intro _ _ ha hb
    exact absurd hb ha
  | @cons u v w huv _ ih =>
    intro hu hDom hD hw
    have hadj := (openSiteGraph_adj_iff' G _ u v).1 huv
    have huS : u ∈ ω ∩ (↑(Dom \ D) : Set V) := ⟨hu, Finset.mem_coe.2 (Finset.mem_sdiff.2 ⟨hDom, hD⟩)⟩
    by_cases hv : v ∈ D
    · exact ⟨u, v, ⟨huS, SimpleGraph.Reachable.refl u⟩, hv, hadj.1, hadj.2.2.1⟩
    · obtain ⟨x, y, hx, hy, hxy, hyω⟩ := ih hadj.2.2.1 hadj.2.2.2 hv hw
      refine ⟨x, y, ?_, hy, hxy, hyω⟩
      exact connWithin_of_adj_of_connWithin G hadj.1 huS
        ⟨hadj.2.2.1, Finset.mem_coe.2 (Finset.mem_sdiff.2 ⟨hadj.2.2.2, hv⟩)⟩ hx

open Classical in
/-- The sites of `Dom` outside `D` that are adjacent to `D`. -/
def outerBoundary (Dom D : Finset V) : Finset V :=
  (Dom \ D).filter fun x => ∃ y ∈ D, G.Adj x y

open Classical in
/-- **The contacts** of the source `o` on the box `D`: the sites of the outer boundary of `D`
joined to `o` by an open path inside `Dom` avoiding `D`.  A function of the configuration outside
`D` only. -/
def contacts (Dom D : Finset V) (o : V) (ω : SiteConfig V) : Finset V :=
  (outerBoundary G Dom D).filter fun x => ω ∈ connWithin G (↑(Dom \ D) : Set V) o x

open Classical in
/-- **The inward gate** of a set `K` of exterior sites: the sites of `D` adjacent to `K`. -/
def gate (D K : Finset V) : Finset V := D.filter fun y => ∃ x ∈ K, G.Adj x y

/-- The level is *poor*: fewer than `N` contacts. -/
def poor (Dom D : Finset V) (o : V) (N : ℕ) : Set (SiteConfig V) :=
  {ω | (contacts G Dom D o ω).card < N}

/-- The level is *killed*: it is poor and every site of the gate of its contacts is closed. -/
def killed (Dom D : Finset V) (o : V) (N : ℕ) : Set (SiteConfig V) :=
  {ω | (contacts G Dom D o ω).card < N ∧ ∀ y ∈ gate G D (contacts G Dom D o ω), y ∉ ω}

theorem killed_subset_poor (Dom D : Finset V) (o : V) (N : ℕ) :
    killed G Dom D o N ⊆ poor G Dom D o N := fun _ h => h.1

theorem contacts_subset (Dom D : Finset V) (o : V) (ω : SiteConfig V) :
    contacts G Dom D o ω ⊆ outerBoundary G Dom D := by
  classical
  exact Finset.filter_subset _ _

theorem outerBoundary_subset (Dom D : Finset V) : outerBoundary G Dom D ⊆ Dom \ D := by
  classical
  exact Finset.filter_subset _ _

/-- **A killed level blocks the source from the box**: if all gate sites of the contacts are
closed, no open path inside `Dom` joins `o` to a subset `B` of `D`. -/
theorem killed_subset_compl_connWithinSet (Dom D : Finset V) {o : V} (ho : o ∉ D) (N : ℕ)
    {B : Set V} (hB : B ⊆ ↑D) :
    killed G Dom D o N ⊆ (connWithinSet G (↑Dom : Set V) o B)ᶜ := by
  classical
  rintro ω ⟨-, hclosed⟩ hconn
  obtain ⟨b, hb, hob⟩ := (mem_connWithinSet_iff _ _ _ _ _).1 hconn
  obtain ⟨⟨hoω, hoDom⟩, ⟨p⟩⟩ := hob
  obtain ⟨x, y, hx, hy, hxy, hyω⟩ :=
    exists_crossing_of_walk G Dom D p hoω (Finset.mem_coe.1 hoDom) ho (Finset.mem_coe.1 (hB hb))
  have hxc : x ∈ contacts G Dom D o ω := by
    rw [contacts, Finset.mem_filter]
    refine ⟨?_, hx⟩
    rw [outerBoundary, Finset.mem_filter]
    exact ⟨Finset.mem_coe.1 (mem_of_connWithin G hx).2, y, hy, hxy⟩
  refine hclosed y ?_ hyω
  rw [gate, Finset.mem_filter]
  exact ⟨hy, x, hxc, hxy⟩

/-- The contacts read the configuration outside `D` only. -/
theorem contacts_congr {Dom D : Finset V} {o : V} {ω ω' : SiteConfig V}
    (h : ω ∩ (↑(Dom \ D) : Set V) = ω' ∩ (↑(Dom \ D) : Set V)) :
    contacts G Dom D o ω = contacts G Dom D o ω' := by
  classical
  simp only [contacts]
  refine Finset.filter_congr fun x _ => ?_
  exact (determinedBy_iff _ _).1 (determinedBy_connWithin G _ o x) ω ω' h

theorem determinedBy_contacts_eq (Dom D : Finset V) (o : V) (K : Finset V) :
    DeterminedBy {ω : SiteConfig V | contacts G Dom D o ω = K} (↑(Dom \ D) : Set V) := by
  rw [determinedBy_iff]
  intro ω ω' h
  simp only [Set.mem_setOf_eq, contacts_congr G h]

theorem determinedBy_poor (Dom D : Finset V) (o : V) (N : ℕ) :
    DeterminedBy (poor G Dom D o N) (↑(Dom \ D) : Set V) := by
  rw [determinedBy_iff]
  intro ω ω' h
  simp only [poor, Set.mem_setOf_eq, contacts_congr G h]

/-- The gate of exterior sites lies in the outermost layer of `D`, provided the next box `D'`
avoids that layer. -/
theorem gate_subset_sdiff {D D' K : Finset V}
    (hgate : ∀ x ∉ D, ∀ y ∈ D, G.Adj x y → y ∉ D') (hK : ∀ x ∈ K, x ∉ D) :
    gate G D K ⊆ D \ D' := by
  classical
  intro y hy
  rw [gate, Finset.mem_filter] at hy
  obtain ⟨hyD, x, hxK, hxy⟩ := hy
  exact Finset.mem_sdiff.2 ⟨hyD, hgate x (hK x hxK) y hyD hxy⟩

theorem determinedBy_killed {Dom D D' : Finset V} (o : V) (N : ℕ) (hDDom : D ⊆ Dom)
    (hD'D : D' ⊆ D) (hgate : ∀ x ∉ D, ∀ y ∈ D, G.Adj x y → y ∉ D') :
    DeterminedBy (killed G Dom D o N) (↑(Dom \ D') : Set V) := by
  classical
  rw [determinedBy_iff]
  intro ω ω' h
  have hagree := forall_iff_of_inter_eq h
  have hsub : (↑(Dom \ D) : Set V) ⊆ (↑(Dom \ D') : Set V) := by
    intro i hi
    rw [Finset.mem_coe, Finset.mem_sdiff] at hi ⊢
    exact ⟨hi.1, fun hi' => hi.2 (hD'D hi')⟩
  have hK : contacts G Dom D o ω = contacts G Dom D o ω' :=
    contacts_congr G (inter_eq_of_forall_iff fun i hi => hagree i (hsub hi))
  have hnotD : ∀ x ∈ contacts G Dom D o ω, x ∉ D := fun x hx =>
    (Finset.mem_sdiff.1 (outerBoundary_subset G Dom D (contacts_subset G Dom D o ω hx))).2
  simp only [killed, Set.mem_setOf_eq, ← hK]
  refine and_congr Iff.rfl (forall₂_congr fun y hy => ?_)
  have hyD : y ∈ D \ D' := gate_subset_sdiff G hgate hnotD hy
  have hy' : y ∈ (↑(Dom \ D') : Set V) := by
    rw [Finset.mem_coe, Finset.mem_sdiff]
    exact ⟨hDDom (Finset.mem_sdiff.1 hyD).1, (Finset.mem_sdiff.1 hyD).2⟩
  exact not_congr (hagree y hy')

end Contacts


/-! ## The per-level killing bound and the many-contacts theorem -/


end KNAll.Site.TargetExt
