import KN.RenormStable
import KN.SiteUniqueness

/-!
# The certificate interface as stated is unsatisfiable

`CertificateSoundness` quantifies over EVERY `RenormData`, and `RenormData.ValidAt` is a
conjunction over `Fin numBounds`.  A datum with `numBounds = 0` therefore satisfies `ValidAt q`
vacuously at every `q`, including `q = 0`, where every site is closed almost surely and no
infinite cluster exists.  So `CertificateSoundness` is false, and `CertificateExtraction` is
satisfied by that same empty datum, hence vacuous.

This is not a defect of the mathematics but of the interface: validity must be able to fail.
-/

namespace KNAll.Site

open Percolation.Literature.LatticeModels

/-- The certificate carrying no bounds at all. -/
def emptyRenorm (d : ℕ) : RenormData d where
  slabWidth := 0
  macroDensity := 0
  numBounds := 0
  bound := fun i => i.elim0
  threshold := fun i => i.elim0

theorem emptyRenorm_validAt (d : ℕ) (q : unitInterval) : (emptyRenorm d).ValidAt q :=
  fun i => i.elim0

/-- At parameter zero there is no infinite cluster, in any graph on a countable vertex set. -/
theorem thetaSiteOn_zero {V : Type*} [Countable V] [MeasurableSpace V] [MeasurableSingletonClass V]
    (G : SimpleGraph V) (x : V) {p : unitInterval} (hp : (p : ℝ) = 0) :
    thetaSiteOn G x p = 0 := by
  have hemp : (∅ : SiteConfig V) ∉ {ω | (siteCluster G ω x).Infinite} := by
    simp only [Set.mem_setOf_eq, not_not]
    have hx : siteCluster G (∅ : SiteConfig V) x = ∅ := by
      ext y
      simp only [siteCluster, Set.mem_setOf_eq, Set.mem_empty_iff_false, iff_false, not_and]
      intro hmem; exact absurd hmem (Set.notMem_empty x)
    rw [hx]; exact Set.not_infinite.2 Set.finite_empty
  rw [thetaSiteOn, MeasureTheory.measureReal_def,
    siteBernoulli_eq_zero_of_coe_eq_zero hp hemp]
  simp

/-- **The interface is unsatisfiable.** -/
theorem not_certificateSoundness (d : ℕ) [NeZero d] : ¬ CertificateSoundness d := by
  intro h
  have hz : ((0 : unitInterval) : ℝ) = 0 := rfl
  have hpos := h (emptyRenorm d) 0 (emptyRenorm_validAt d 0)
  rw [thetaSiteOn_zero _ _ hz] at hpos
  exact lt_irrefl 0 hpos

end KNAll.Site
