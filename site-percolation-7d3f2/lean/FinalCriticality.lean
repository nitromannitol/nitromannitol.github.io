import KN.ExactCommonQAssembly
import KN.SiteEndgame
import KN.SiteThetaMono

/-!
# Critical site percolation in dimensions `d ≥ 3`

This module states the final result with explicit arguments `(d : ℕ)` and `hd : 3 ≤ d`. Its proof
uses `ExactCommonQAssembly.site_no_percolation_at_criticality`. The `[NeZero d]` instance required by
that theorem is constructed from `hd`, so the exported theorem has exactly the displayed arguments.

The module also gives four equivalent presentations of the conclusion:

   * `site_no_percolation_at_critical` — `thetaSite d (criticalProbSiteI d) = 0`;
   * `site_no_percolation_at_critical_real` — the same with the critical parameter written as the
     real number `criticalProbSite d` together with its membership proof.  Note that
     `thetaSite d (criticalProbSite d)` is **not** well typed: `thetaSite _ : unitInterval → ℝ`
     while `criticalProbSite _ : ℝ`, and there is no coercion `ℝ → unitInterval`.  The
     membership-paired form below is the corresponding well-typed expression because
     `criticalProbSiteI d` is by definition that pair;
   * `site_no_percolation_at_critical_expanded` — `thetaSite`/`thetaSiteOn` unfolded to the
     underlying measure and open cluster;
   * `site_no_percolation_at_critical_primitive` — every definition of this development unfolded,
     leaving only Mathlib's `SimpleGraph.hasse`, `SimpleGraph.fromRel`, `Measure.real`,
     `Set.Infinite` and `Percolation.Literature.LatticeModels.prodBernoulli`.

Companion statements show that `criticalProbSite d` lies in the open unit interval, give vanishing
throughout the closed subcritical interval, and instantiate the theorem at `d = 3`.

Every declaration below has only the displayed mathematical arguments.  The exported results are
followed by `#print axioms` commands.
-/

noncomputable section

namespace KNAll.Site

open MeasureTheory Set Percolation.Literature Percolation.Literature.LatticeModels

/-! ## Critical nonpercolation -/

/-- **No site percolation at the critical parameter, in every dimension at least three.**

For nearest-neighbour Bernoulli site percolation on `ℤ^d` with `d ≥ 3`, the probability that the
open cluster of the origin is infinite vanishes at the critical parameter.

The `[NeZero d]` instance required by the assembly theorem is derived from `hd`. -/
theorem site_no_percolation_at_critical (d : ℕ) (hd : 3 ≤ d) :
    thetaSite d (criticalProbSiteI d) = 0 := by
  haveI : NeZero d := ⟨by omega⟩
  exact ExactCommonQAssembly.site_no_percolation_at_criticality hd

/-- The same conclusion phrased with the *real-valued* critical parameter `criticalProbSite d`,
paired with the proof that it lies in the unit interval.

`thetaSite d (criticalProbSite d)` is ill typed, because `criticalProbSite d : ℝ` whereas
`thetaSite d` expects a `unitInterval`. The membership-paired expression is definitionally equal to
the first theorem's expression, since `criticalProbSiteI d` is the pair
`⟨criticalProbSite d, criticalProbSite_mem_Icc d⟩`. -/
theorem site_no_percolation_at_critical_real (d : ℕ) (hd : 3 ≤ d) :
    thetaSite d ⟨criticalProbSite d, criticalProbSite_mem_Icc d⟩ = 0 :=
  site_no_percolation_at_critical d hd

/-- The same theorem in the packaged form `SiteCriticality` used in `KN/SiteStatements.lean`. -/
theorem siteCriticality_of_three_le (d : ℕ) (hd : 3 ≤ d) : SiteCriticality d :=
  site_no_percolation_at_critical d hd

/-! ## Equivalent unfolded statements

Each result below is obtained from `site_no_percolation_at_critical` by definitional unfolding. -/

/-- `thetaSite` and `thetaSiteOn` unfolded: the product Bernoulli measure of the event that the
open cluster of the origin is infinite is zero at the critical parameter. -/
theorem site_no_percolation_at_critical_expanded (d : ℕ) (hd : 3 ≤ d) :
    (siteBernoulli (fun _ : Site d => criticalProbSiteI d)).real
        {ω : Set (Site d) | (siteCluster (zdGraph d) ω (0 : Site d)).Infinite} = 0 :=
  site_no_percolation_at_critical d hd

/-- Every definition of this development unfolded.  Only Mathlib notions and the product Bernoulli
measure of `Percolation.Literature` remain: `Site d` is `Fin d → ℤ`, the lattice is
`SimpleGraph.hasse`, the open graph is `SimpleGraph.fromRel`, and the cluster of the origin is the
set of vertices reachable from an open origin. -/
theorem site_no_percolation_at_critical_primitive (d : ℕ) (hd : 3 ≤ d) :
    (prodBernoulli (fun _ : Fin d → ℤ => criticalProbSiteI d)).real
        {ω : Set (Fin d → ℤ) |
          {y : Fin d → ℤ | (0 : Fin d → ℤ) ∈ ω ∧
              (SimpleGraph.fromRel fun x y : Fin d → ℤ =>
                (SimpleGraph.hasse (Fin d → ℤ)).Adj x y ∧ x ∈ ω ∧ y ∈ ω).Reachable 0 y}.Infinite} =
      0 :=
  site_no_percolation_at_critical d hd

/-- The critical parameter is the infimum of the set of parameters at which the origin percolates,
together with `1`. -/
theorem coe_criticalProbSiteI_eq_sInf (d : ℕ) :
    (criticalProbSiteI d : ℝ) =
      sInf ({p : ℝ | ∃ h : p ∈ unitInterval, 0 < thetaSite d ⟨p, h⟩} ∪ {1}) := rfl

/-! ## Critical parameter and phase transition

The following statements record that the critical parameter is interior and give concrete
instances of the dimension hypothesis. -/

/-- The critical parameter is strictly inside the unit interval. -/
theorem criticalProbSite_mem_Ioo_of_three_le (d : ℕ) (hd : 3 ≤ d) :
    criticalProbSite d ∈ Set.Ioo (0 : ℝ) 1 := by
  haveI : NeZero d := ⟨by omega⟩
  exact criticalProbSite_mem_Ioo d (by omega)

/-- The percolation probability vanishes on the whole closed subcritical interval `[0, p_c]`.
Strictly below `p_c` this follows from the definition of the infimum; equality uses the critical
nonpercolation theorem. -/
theorem thetaSite_eq_zero_of_le_criticalProbSite (d : ℕ) (hd : 3 ≤ d) (p : unitInterval)
    (hp : (p : ℝ) ≤ criticalProbSite d) : thetaSite d p = 0 := by
  rcases lt_or_eq_of_le hp with hlt | heq
  · exact thetaSite_eq_zero_of_lt_criticalProbSite d p hlt
  · have hpc : p = criticalProbSiteI d := Subtype.ext heq
    rw [hpc]
    exact site_no_percolation_at_critical d hd

/-- Percolation occurs at some parameter below one. -/
theorem exists_thetaSite_pos_of_three_le (d : ℕ) (hd : 3 ≤ d) :
    ∃ a : unitInterval, (a : ℝ) < 1 ∧ 0 < thetaSite d a := by
  haveI : NeZero d := ⟨by omega⟩
  exact exists_thetaSite_pos d (by omega)

/-- The critical parameter is an interior point of the unit interval; the percolation probability
vanishes on `[0, p_c]`; and it is positive at some parameter below one. -/
theorem site_phase_transition (d : ℕ) (hd : 3 ≤ d) :
    0 < criticalProbSite d ∧ criticalProbSite d < 1 ∧
      (∀ p : unitInterval, (p : ℝ) ≤ criticalProbSite d → thetaSite d p = 0) ∧
      ∃ a : unitInterval, (a : ℝ) < 1 ∧ 0 < thetaSite d a :=
  ⟨(criticalProbSite_mem_Ioo_of_three_le d hd).1,
    (criticalProbSite_mem_Ioo_of_three_le d hd).2,
    thetaSite_eq_zero_of_le_criticalProbSite d hd,
    exists_thetaSite_pos_of_three_le d hd⟩

/-- The hypothesis `3 ≤ d` is satisfiable and the theorem has content at a concrete dimension:
there is no infinite open site cluster of the origin at the critical parameter of `ℤ³`. -/
example : thetaSite 3 (criticalProbSiteI 3) = 0 :=
  site_no_percolation_at_critical 3 (by norm_num)

/-- The same at `d = 4`, and with the conclusion in its fully unfolded form. -/
example :
    (prodBernoulli (fun _ : Fin 4 → ℤ => criticalProbSiteI 4)).real
        {ω : Set (Fin 4 → ℤ) |
          {y : Fin 4 → ℤ | (0 : Fin 4 → ℤ) ∈ ω ∧
              (SimpleGraph.fromRel fun x y : Fin 4 → ℤ =>
                (SimpleGraph.hasse (Fin 4 → ℤ)).Adj x y ∧ x ∈ ω ∧ y ∈ ω).Reachable 0 y}.Infinite} =
      0 :=
  site_no_percolation_at_critical_primitive 4 (by norm_num)

#print axioms KNAll.Site.site_no_percolation_at_critical
#print axioms KNAll.Site.site_no_percolation_at_critical_real
#print axioms KNAll.Site.siteCriticality_of_three_le
#print axioms KNAll.Site.site_no_percolation_at_critical_expanded
#print axioms KNAll.Site.site_no_percolation_at_critical_primitive
#print axioms KNAll.Site.coe_criticalProbSiteI_eq_sInf
#print axioms KNAll.Site.criticalProbSite_mem_Ioo_of_three_le
#print axioms KNAll.Site.thetaSite_eq_zero_of_le_criticalProbSite
#print axioms KNAll.Site.exists_thetaSite_pos_of_three_le
#print axioms KNAll.Site.site_phase_transition

end KNAll.Site

end
