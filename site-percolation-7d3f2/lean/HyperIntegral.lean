import KN.HyperPartition

/-!
# The cluster factorization for functions

`clusterFactorization` (`KN/HyperImplC.lean`) says that the event that the cluster of `S` is exactly
`K` is independent of every event determined by the labels avoiding `K`, the second factor being
computed in the hypergraph with the labels meeting `K` closed.  The exploration arguments consume
the same statement for a function of the configuration rather than for an event.

* `integral_clusterFactorization` — if `F` depends only on the labels avoiding `K`, the integral of
  `F` over the event that the cluster of `S` is `K` is the probability of that event times the
  integral of `F` against the deleted hypergraph;
* `integral_clusterFactorization_indicator` — the case of an indicator, which is
  `clusterFactorization` itself and fixes the orientation of the statement above.

The proof partitions the configuration space by the trace `ω ∩ (labelsMeeting H K)ᶜ` of a
configuration on the labels avoiding `K`.  Over a finite label type there are finitely many traces;
each fibre is determined by the labels avoiding `K`, hence measurable, and `F` is constant on it.
So on any event `F` is a finite linear combination of indicators of the fibres, and
`clusterFactorization` applies to each term.
-/

noncomputable section

namespace KNAll.Site

open MeasureTheory Set Percolation.Literature Percolation.Literature.LatticeModels

variable {V E : Type*}

/-! ## The fibres of the trace on the labels avoiding `K` -/

/-- The configurations whose trace on the labels avoiding `K` is `τ`. -/
private def avoidFiber (H : Hypergraph V E) (K : Set V) (τ : Set E) : Set (Set E) :=
  {ω | ω ∩ (labelsMeeting H K)ᶜ = τ}

private theorem mem_avoidFiber (H : Hypergraph V E) (K : Set V) (τ ω : Set E) :
    ω ∈ avoidFiber H K τ ↔ ω ∩ (labelsMeeting H K)ᶜ = τ := Iff.rfl

/-- A fibre of the trace is determined by the labels avoiding `K`: whether a configuration lies in
it is read off its trace. -/
private theorem determinedBy_avoidFiber (H : Hypergraph V E) (K : Set V) (τ : Set E) :
    DeterminedBy (avoidFiber H K τ) (labelsMeeting H K)ᶜ := by
  rw [determinedBy_iff]
  intro ω ω' h
  simp only [mem_avoidFiber, h]

/-- Over a finite label type a fibre of the trace is measurable, being determined by the finitely
many labels. -/
private theorem measurableSet_avoidFiber [Fintype E] (H : Hypergraph V E) (K : Set V) (τ : Set E) :
    MeasurableSet (avoidFiber H K τ) := by
  have h : DeterminedBy (avoidFiber H K τ) (↑(Finset.univ : Finset E) : Set E) := by
    rw [Finset.coe_univ]
    exact (determinedBy_avoidFiber H K τ).mono (Set.subset_univ _)
  exact h.measurableSet_of_finset

/-! ## The finite decomposition of `F` -/

/-- **The decomposition.**  A function depending only on the labels avoiding `K` is constant on each
fibre of the trace, and the fibres partition the configuration space, so on any event `D` the
function is the finite sum over traces of the constant `F τ` carried by `D ∩ avoidFiber H K τ`. -/
private theorem indicator_eq_sum_avoidFiber [Fintype E] (H : Hypergraph V E) (K : Set V)
    {F : Set E → ℝ}
    (hF : ∀ ω ω' : Set E,
      ω ∩ (labelsMeeting H K)ᶜ = ω' ∩ (labelsMeeting H K)ᶜ → F ω = F ω')
    (D : Set (Set E)) (ω : Set E) :
    D.indicator F ω = ∑ τ : Set E, (D ∩ avoidFiber H K τ).indicator (fun _ => F τ) ω := by
  have hzero : ∀ τ : Set E, τ ≠ ω ∩ (labelsMeeting H K)ᶜ →
      (D ∩ avoidFiber H K τ).indicator (fun _ => F τ) ω = 0 := by
    intro τ hτ
    have hnot : ω ∉ D ∩ avoidFiber H K τ := by
      rintro ⟨-, h2⟩
      exact hτ (((mem_avoidFiber H K τ ω).1 h2).symm)
    exact Set.indicator_of_notMem hnot _
  have key : ∑ τ : Set E, (D ∩ avoidFiber H K τ).indicator (fun _ => F τ) ω
      = (D ∩ avoidFiber H K (ω ∩ (labelsMeeting H K)ᶜ)).indicator
          (fun _ => F (ω ∩ (labelsMeeting H K)ᶜ)) ω :=
    Finset.sum_eq_single (ω ∩ (labelsMeeting H K)ᶜ) (fun τ _ hτ => hzero τ hτ)
      (fun h => absurd (Finset.mem_univ _) h)
  rw [key]
  have hmemfib : ω ∈ avoidFiber H K (ω ∩ (labelsMeeting H K)ᶜ) :=
    (mem_avoidFiber H K _ ω).2 rfl
  by_cases hω : ω ∈ D
  · rw [Set.indicator_of_mem hω, Set.indicator_of_mem (Set.mem_inter hω hmemfib)]
    exact (hF (ω ∩ (labelsMeeting H K)ᶜ) ω (by rw [Set.inter_assoc, Set.inter_self])).symm
  · rw [Set.indicator_of_notMem hω, Set.indicator_of_notMem (fun h => hω h.1)]

/-- **The expansion of a set integral.**  Integrating a function of the labels avoiding `K` over an
event is summing, over the traces, the value of the function on the trace times the probability of
the part of the event lying in that fibre. -/
private theorem setIntegral_eq_sum_avoidFiber [Fintype E] (H : Hypergraph V E) (K : Set V)
    {F : Set E → ℝ}
    (hF : ∀ ω ω' : Set E,
      ω ∩ (labelsMeeting H K)ᶜ = ω' ∩ (labelsMeeting H K)ᶜ → F ω = F ω')
    (w : E → unitInterval) (D : Set (Set E)) (hD : MeasurableSet D) :
    (∫ ω in D, F ω ∂(prodBernoulli w))
      = ∑ τ : Set E, F τ * (prodBernoulli w).real (D ∩ avoidFiber H K τ) := by
  have hmeas : ∀ τ : Set E, MeasurableSet (D ∩ avoidFiber H K τ) := fun τ =>
    hD.inter (measurableSet_avoidFiber H K τ)
  calc (∫ ω in D, F ω ∂(prodBernoulli w))
      = ∫ ω, ∑ τ : Set E, (D ∩ avoidFiber H K τ).indicator (fun _ => F τ) ω
          ∂(prodBernoulli w) := by
        rw [← integral_indicator hD]
        exact integral_congr_ae
          (Filter.Eventually.of_forall (indicator_eq_sum_avoidFiber H K hF D))
    _ = ∑ τ : Set E, ∫ ω, (D ∩ avoidFiber H K τ).indicator (fun _ => F τ) ω ∂(prodBernoulli w) :=
        integral_finsetSum _ fun τ _ => (integrable_const (F τ)).indicator (hmeas τ)
    _ = ∑ τ : Set E, F τ * (prodBernoulli w).real (D ∩ avoidFiber H K τ) := by
        refine Finset.sum_congr rfl fun τ _ => ?_
        rw [integral_indicator_const _ (hmeas τ), smul_eq_mul, mul_comm]

/-! ## The target -/

/-- **The cluster factorization for functions.**  If `F` depends only on the labels avoiding `K`,
the integral of `F` over the event that the cluster of `S` is exactly `K` is the probability of that
event times the integral of `F` in the hypergraph with the labels meeting `K` closed.  Expand both
sides over the fibres of the trace on the labels avoiding `K` and apply `clusterFactorization` to
each fibre. -/
theorem integral_clusterFactorization [Fintype E] (H : Hypergraph V E) (S K : Set V)
    {F : Set E → ℝ}
    (hF : ∀ ω ω' : Set E,
      ω ∩ (labelsMeeting H K)ᶜ = ω' ∩ (labelsMeeting H K)ᶜ → F ω = F ω') :
    (∫ ω in clusterEvent H S K, F ω ∂(prodBernoulli H.prob))
      = (prodBernoulli H.prob).real (clusterEvent H S K) *
          ∫ ω, F ω ∂(prodBernoulli (deleteHyper H K).prob) := by
  have hL := setIntegral_eq_sum_avoidFiber H K hF H.prob (clusterEvent H S K)
    (measurableSet_clusterEvent H S K)
  have hR := setIntegral_eq_sum_avoidFiber H K hF (deleteHyper H K).prob Set.univ
    MeasurableSet.univ
  rw [Measure.restrict_univ] at hR
  rw [hL, hR, Finset.mul_sum]
  refine Finset.sum_congr rfl fun τ _ => ?_
  rw [Set.univ_inter,
    clusterFactorization H S K (determinedBy_avoidFiber H K τ) (measurableSet_avoidFiber H K τ)]
  ring

/-- **The orientation check.**  For `F` the indicator of an event `A` determined by the labels
avoiding `K`, `integral_clusterFactorization` is exactly `clusterFactorization`. -/
theorem integral_clusterFactorization_indicator [Fintype E] (H : Hypergraph V E) (S K : Set V)
    {A : Set (Set E)} (hA : DeterminedBy A (labelsMeeting H K)ᶜ) (hAm : MeasurableSet A) :
    (∫ ω in clusterEvent H S K, A.indicator (1 : Set E → ℝ) ω ∂(prodBernoulli H.prob))
      = (prodBernoulli H.prob).real (clusterEvent H S K) *
          (prodBernoulli (deleteHyper H K).prob).real A := by
  have hFind : ∀ ω ω' : Set E, ω ∩ (labelsMeeting H K)ᶜ = ω' ∩ (labelsMeeting H K)ᶜ →
      A.indicator (1 : Set E → ℝ) ω = A.indicator (1 : Set E → ℝ) ω' := by
    intro ω ω' h
    have hiff := (determinedBy_iff A ((labelsMeeting H K)ᶜ)).1 hA ω ω' h
    by_cases hω : ω ∈ A
    · rw [Set.indicator_of_mem hω, Set.indicator_of_mem (hiff.1 hω)]
      rfl
    · rw [Set.indicator_of_notMem hω, Set.indicator_of_notMem fun hc => hω (hiff.2 hc)]
  rw [integral_clusterFactorization H S K hFind, integral_indicator_one hAm]

end KNAll.Site

end
